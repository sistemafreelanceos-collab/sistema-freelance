import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useWorkspace } from '../providers/WorkspaceProvider';
import { toast } from 'sonner';
import { TipoNota } from "../../types";

export function useCalendario() {
    const { currentWorkspace } = useWorkspace();
    const queryClient = useQueryClient();
    const [currentDate, setCurrentDate] = useState(new Date());

    const { data, isLoading } = useQuery({
        queryKey: ['calendario', currentWorkspace?.id, currentDate.getMonth(), currentDate.getFullYear()],
        enabled: !!currentWorkspace?.id,
        queryFn: async () => {
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

            // 1. Cargar TAREAS (¡ESTO FALTABA!)
            const { data: tareas } = await supabase
                .from('tareas')
                .select('*, proyectos(nombre)')
                .eq('workspace_id', currentWorkspace?.id); // Traemos todas o filtramos por fecha... mejor traer por fecha si son muchas
            // .gte('fecha', startOfMonth) ... las tareas pueden ser antiguas pero no completadas. Dejemos todas por ahora.

            // 2. Cargar Notas
            const { data: notas } = await supabase
                .from('notas_calendario')
                .select('*')
                .eq('workspace_id', currentWorkspace?.id)
                .gte('fecha', startOfMonth)
                .lte('fecha', endOfMonth);

            // 3. Cargar Proyectos (Entregas)
            const { data: proyectos } = await supabase
                .from('proyectos')
                .select('id, nombre, fecha_fin, cliente:clientes(nombre)')
                .eq('workspace_id', currentWorkspace?.id)
                .gte('fecha_fin', startOfMonth)
                .lte('fecha_fin', endOfMonth);

            // 4. Cargar Pagos Recibidos (Ingresos)
            const { data: pagos } = await supabase
                .from('pagos_cliente')
                .select('id, monto, moneda, fecha_pago, cliente:clientes(nombre)')
                .eq('workspace_id', currentWorkspace?.id)
                .gte('fecha_pago', startOfMonth)
                .lte('fecha_pago', endOfMonth);

            // 5. Cargar Gastos Recurrentes (Salidas)
            const { data: gastosFijos } = await supabase
                .from('gastos_fijos')
                .select('*')
                .eq('workspace_id', currentWorkspace?.id)
                .eq('activo', true);

            // --- PROCESAMIENTO ---

            const eventosMapeados: any[] = [];

            // A. Tareas
            (tareas || []).forEach((t: any) => {
                const start = new Date(t.fecha + "T" + (t.hora || "09:00"));
                const end = t.hora_fin ? new Date(t.fecha + "T" + t.hora_fin) : new Date(start.getTime() + 3600000);
                eventosMapeados.push({
                    id: t.id,
                    title: t.titulo,
                    start,
                    end,
                    allDay: !t.hora,
                    resource: { ...t, tipo_evento: 'tarea' }, // Para filtros
                    type: 'tarea' // Para CalendarBoard si lo usara
                });
            });

            // B. Notas (Como eventos)
            (notas || []).forEach((n: any) => {
                eventosMapeados.push({
                    id: n.id,
                    title: n.texto,
                    start: n.fecha, // CalendarBoard necesita 'start'
                    end: n.fecha,
                    type: 'nota',
                    color: n.color || 'blue',
                    rotacion: n.rotacion,
                    resource: { tipo_evento: 'nota' }
                });
            });

            // C. Entregas de Proyectos
            (proyectos || []).forEach((p: any) => {
                eventosMapeados.push({
                    id: p.id,
                    title: `Entrega: ${p.nombre}`,
                    start: p.fecha_fin,
                    end: p.fecha_fin,
                    type: 'entrega',
                    color: 'purple',
                    details: p.cliente?.nombre,
                    resource: { tipo_evento: 'proyecto' }
                });
            });

            // D. Pagos Recibidos
            (pagos || []).forEach((p: any) => {
                eventosMapeados.push({
                    id: p.id,
                    title: `Pago: $${p.monto}`,
                    start: p.fecha_pago,
                    end: p.fecha_pago,
                    type: 'cobro',
                    color: 'emerald',
                    details: p.cliente?.nombre,
                    resource: { tipo_evento: 'cobro' }
                });
            });

            // E. Proyección de Gastos Fijos
            (gastosFijos || []).forEach((g: any) => {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
                const diaPagoReal = Math.min(g.dia_pago, lastDayOfMonth);
                const fechaConstruida = new Date(year, month, diaPagoReal).toISOString().split('T')[0];

                eventosMapeados.push({
                    id: `gasto-${g.id}`,
                    title: `${g.nombre}`,
                    monto: g.monto,
                    moneda: g.moneda,
                    start: fechaConstruida,
                    end: fechaConstruida,
                    type: 'gasto_fijo', // Para CustomEvent en CalendarBoard
                    color: 'red',
                    details: g.categoria,
                    resource: { tipo_evento: 'gasto' } // Para filtros en page.tsx
                });
            });


            // F. PostIts Raw (Para el NotesBoard)
            const postItsRaw = (notas || []).map((n: any) => ({
                id: n.id,
                texto: n.texto,
                fecha: n.fecha,
                color: n.color || 'amarillo',
                rotacion: n.rotacion || 0
            }));

            // G. Proyectos Raw y List 
            const proyectosListData = (proyectos || []).map((p: any) => ({
                id: p.id,
                nombre: p.nombre,
                cliente: p.cliente
            }));

            return {
                calendarEvents: eventosMapeados,
                postIts: postItsRaw,
                proyectosRaw: proyectos || [], // Puede incluir otros campos vs 'proyectos' de arriba
                proyectosList: proyectosListData
            };
        }
    });

    const guardarTareaMutation = useMutation({
        mutationFn: async ({ formulario, recurrente }: { formulario: any, recurrente: boolean }) => {
            const insertData: any = {
                workspace_id: currentWorkspace?.id,
                titulo: formulario.titulo,
                descripcion: formulario.descripcion,
                fecha: formulario.fecha,
                hora: formulario.hora,
                hora_fin: formulario.horaFin,
                categoria: formulario.categoria,
                proyecto_id: formulario.proyectoId || null,
                completada: false
            };

            if (recurrente) {
                const promesas = [];
                for (let i = 0; i < 6; i++) {
                    const fOriginal = new Date(formulario.fecha);
                    const nuevaFecha = new Date(new Date(fOriginal).setMonth(fOriginal.getMonth() + i)).toISOString().split('T')[0];
                    promesas.push(supabase.from("tareas").insert({ ...insertData, fecha: nuevaFecha }));
                }
                await Promise.all(promesas);
            }
            else { await supabase.from("tareas").insert(insertData); }
        },
        onSuccess: () => {
            toast.success("Tarea agendada");
            queryClient.invalidateQueries({ queryKey: ['calendario'] });
        }
    });

    const saveNotaMutation = useMutation({
        mutationFn: async (nota: any) => {
            if (nota.id) await supabase.from('notas_calendario').update(nota).eq('id', nota.id);
            else await supabase.from('notas_calendario').insert({ ...nota, workspace_id: currentWorkspace?.id });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendario'] });
            toast.success("Nota guardada");
        }
    });

    const deleteNotaMutation = useMutation({
        mutationFn: async ({ id, tabla }: { id: string, tabla: string }) => {
            // Mapeo para asegurar que borramos en la tabla correcta
            let tableName = tabla;
            if (tabla === 'notas' || tabla === 'nota' || tabla === 'notas_calendario') tableName = 'notas_calendario';
            if (tabla === 'tarea' || tabla === 'tareas') tableName = 'tareas';

            const { error } = await supabase.from(tableName).delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendario'] });
            toast.success("Eliminado correctamente");
        }
    });

    // Mocks / Placeholders
    const dummyFunc = async (...args: any[]) => { };

    return {
        eventos: data?.calendarEvents || [],
        postIts: data?.postIts || [],
        proyectosRaw: data?.proyectosRaw || [],
        proyectosList: data?.proyectosList || [],

        isLoading,
        currentDate,
        setCurrentDate,

        cargarDatos: () => queryClient.invalidateQueries({ queryKey: ['calendario'] }),
        guardarTarea: (f: any, r: boolean) => guardarTareaMutation.mutateAsync({ formulario: f, recurrente: r }),
        borrarItem: (id: string, tabla: string) => deleteNotaMutation.mutateAsync({ id, tabla }),

        guardarNota: (t: string, c: TipoNota) => saveNotaMutation.mutateAsync({ texto: t, color: c }),
        editarNota: (id: string, t: string, c: any) => saveNotaMutation.mutateAsync({ id, texto: t, color: c }),

        // Alias legacy
        saveNota: saveNotaMutation.mutateAsync,
        deleteNota: (id: string) => deleteNotaMutation.mutateAsync({ id, tabla: 'notas_calendario' }),

        loading: isLoading,
        eventosDB: data?.calendarEvents || [],
        localEvents: data?.calendarEvents || [],
        completarTarea: dummyFunc,
        editarTarea: dummyFunc,
        updateTaskDate: dummyFunc,
        saveSession: dummyFunc,
        syncGoogle: dummyFunc
    };
}
