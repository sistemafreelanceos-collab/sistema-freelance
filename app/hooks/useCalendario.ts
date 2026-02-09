import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { EventoCalendario, PostIt, TipoNota } from "../../types";
import { toast } from "sonner";
import moment from "moment";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { useLogger } from "./useLogger";

export function useCalendario() {
    const queryClient = useQueryClient();
    const { currentWorkspace } = useWorkspace();
    const { logEvent } = useLogger();

    // 1. CARGA DE DATOS
    const { data, isLoading } = useQuery({
        queryKey: ['calendario', currentWorkspace?.id],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !currentWorkspace) return { localEvents: [], postIts: [], proyectosRaw: [], proyectosList: [] };

            const [tareas, gastos, proyectos, notas] = await Promise.all([
                supabase.from("tareas").select("*, proyectos(nombre)").eq("workspace_id", currentWorkspace.id),
                supabase.from("gastos_fijos").select("*").eq("workspace_id", currentWorkspace.id).eq("activo", true),
                supabase.from("proyectos").select("id, nombre, monto, fecha_inicio, fecha_fin, estado, clientes(nombre)").eq("workspace_id", currentWorkspace.id),
                supabase.from("notas_calendario").select("*").eq("workspace_id", currentWorkspace.id)
            ]);

            const lista: EventoCalendario[] = [];
            // Procesar Tareas
            tareas.data?.forEach((t: any) => {
                const start = new Date(t.fecha + "T" + (t.hora || "09:00"));
                const end = t.hora_fin ? new Date(t.fecha + "T" + t.hora_fin) : new Date(start.getTime() + 3600000);
                lista.push({ id: t.id, title: t.titulo, start, end, allDay: !t.hora, resource: { ...t, tipo_evento: 'tarea' } });
            });

            return {
                localEvents: lista,
                postIts: notas.data?.map((n: any) => ({ id: n.id, texto: n.texto, fecha: n.fecha, color: n.color || 'amarillo', rotacion: n.rotacion || 0 })) || [],
                proyectosRaw: proyectos.data || [],
                proyectosList: proyectos.data?.map((p: any) => ({ id: p.id, nombre: p.nombre, cliente: p.clientes })) || [],
            };
        }
    });

    const eventosDB = data?.localEvents || [];

    // 2. MUTACIONES (ACCIONES)

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

    const guardarNotaMutation = useMutation({
        mutationFn: async ({ texto, color }: { texto: string, color: TipoNota }) => {
            await supabase.from("notas_calendario").insert({
                workspace_id: currentWorkspace?.id,
                fecha: new Date().toISOString(),
                texto,
                color
            });
        },
        onSuccess: () => { toast.success("Nota creada"); queryClient.invalidateQueries({ queryKey: ['calendario'] }); }
    });

    // 🟢 ESTA ES LA FUNCIÓN QUE FALTABA
    const borrarItemMutation = useMutation({
        mutationFn: async ({ id, tabla }: { id: string, tabla: string }) => {
            // Mapeo para asegurar que borramos en la tabla correcta
            let tableName = tabla;
            if (tabla === 'notas' || tabla === 'nota') tableName = 'notas_calendario';
            if (tabla === 'tarea') tableName = 'tareas';

            const { error } = await supabase.from(tableName).delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Eliminado correctamente");
            queryClient.invalidateQueries({ queryKey: ['calendario'] });
        }
    });

    // También arreglamos Editar Nota por si acaso
    const editarNotaMutation = useMutation({
        mutationFn: async ({ id, texto, color }: { id: string, texto: string, color: string }) => {
            await supabase.from("notas_calendario").update({ texto, color }).eq("id", id);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendario'] })
    });

    return {
        loading: isLoading,
        eventosDB,
        postIts: data?.postIts || [],
        proyectosRaw: data?.proyectosRaw || [],
        proyectosList: data?.proyectosList || [],

        cargarDatos: () => queryClient.invalidateQueries({ queryKey: ['calendario'] }),

        guardarTarea: (f: any, r: boolean) => guardarTareaMutation.mutateAsync({ formulario: f, recurrente: r }),

        // 🟢 AHORA SÍ ESTÁ DEFINIDA CORRECTAMENTE
        borrarItem: (id: string, tabla: string) => borrarItemMutation.mutateAsync({ id, tabla }),

        guardarNota: (t: string, c: TipoNota) => guardarNotaMutation.mutateAsync({ texto: t, color: c }),
        editarNota: (id: string, t: string, c: any) => editarNotaMutation.mutateAsync({ id, texto: t, color: c }),

        // Placeholders para funciones futuras
        editarTarea: async (id: any, formulario: any) => { },
        completarTarea: async (id: any, completada: any) => { },
        updateTaskDate: async (id: any, start: any) => { },
        saveSession: async (seconds: any, completed: any, evento: any) => { },
        syncGoogle: async (force: any) => { }
    };
}
