
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useWorkspace } from "../providers/WorkspaceProvider";
import moment from "moment";

export type Notificacion = {
    id: string;
    titulo: string;
    mensaje: string;
    fecha: Date;
    tipo: 'tarea' | 'cobro' | 'sistema';
    leida: boolean; // Virtual, siempre false al recargar por ahora
};

export function useNotificaciones() {
    const { currentWorkspace } = useWorkspace();

    const { data: notificaciones = [] } = useQuery({
        queryKey: ['notificaciones-virtuales', currentWorkspace?.id],
        queryFn: async () => {
            if (!currentWorkspace?.id) return [];

            const hoy = moment().startOf('day');
            const manana = moment().add(1, 'days').endOf('day');

            // 1. Buscar Tareas Pendientes (Vencidas o para Hoy/Mañana)
            const { data: tareas } = await supabase
                .from("tareas")
                .select("*")
                .eq("workspace_id", currentWorkspace.id)
                .eq("completada", false)
                .lte("fecha", manana.format('YYYY-MM-DD'));

            // 2. Buscar Proyectos por cobrar (Próximo Pago)
            // Asumimos que los proyectos tienen 'proximo_pago' (fecha) y 'estado' != 'cancelado'
            const { data: proyectos } = await supabase
                .from("proyectos")
                .select("id, nombre, proximo_pago, clientes(nombre)")
                .eq("workspace_id", currentWorkspace.id)
                .neq("estado", "cancelado")
                .not("proximo_pago", "is", null);

            const lista: Notificacion[] = [];

            // Procesar Tareas
            tareas?.forEach((t: any) => {
                const fTarea = moment(t.fecha);
                const esVencida = fTarea.isBefore(hoy);

                lista.push({
                    id: `tarea-${t.id}`,
                    titulo: esVencida ? "Tarea Vencida" : "Tarea para hoy",
                    mensaje: `${t.titulo} - ${fTarea.format('HH:mm')}`,
                    fecha: new Date(t.fecha),
                    tipo: 'tarea',
                    leida: false
                });
            });

            // Procesar Proyectos
            proyectos?.forEach((p: any) => {
                const fPago = moment(p.proximo_pago);
                // Avisar 3 días antes
                if (fPago.diff(hoy, 'days') <= 3 && fPago.diff(hoy, 'days') >= -30) {
                    lista.push({
                        id: `proy-${p.id}`,
                        titulo: "Pago Cercano",
                        mensaje: `Cobro de ${p.clientes?.nombre || 'Cliente'} en proyecto ${p.nombre}`,
                        fecha: new Date(p.proximo_pago),
                        tipo: 'cobro',
                        leida: false
                    });
                }
            });

            // Ordenar por fecha
            return lista.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
        },
        enabled: !!currentWorkspace?.id,
        refetchInterval: 1000 * 60 * 5 // Refrescar cada 5 mins
    });

    return {
        notificaciones,
        unreadCount: notificaciones.length
    };
}
