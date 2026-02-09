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

            // 1. Tareas
            tareas.data?.forEach((t: any) => {
                const start = new Date(t.fecha + "T" + (t.hora || "09:00"));
                const end = t.hora_fin ? new Date(t.fecha + "T" + t.hora_fin) : new Date(start.getTime() + 3600000);
                lista.push({ id: t.id, title: t.titulo, start, end, allDay: !t.hora, resource: { ...t, tipo_evento: 'tarea' } });
            });

            // 2. Gastos Fijos (Recurrentes)
            gastos.data?.forEach((g: any) => {
                if (!g.dia_pago) return;
                const dia = g.dia_pago;
                const hoy = new Date();
                // Generar evento para este mes y el siguiente
                for (let i = 0; i < 3; i++) {
                    const year = hoy.getFullYear();
                    const month = hoy.getMonth() + i - 1; // Mes pasado, actual, siguiente
                    const fecha = new Date(year, month, dia);

                    // Solo agregar si la fecha es válida (ej: 30 de febrero no existe)
                    if (fecha.getDate() === dia) {
                        lista.push({
                            id: `gasto-${g.id}-${i}`,
                            title: `Pagar: ${g.nombre}`,
                            start: fecha,
                            end: fecha,
                            allDay: true,
                            resource: { ...g, tipo_evento: 'gasto', categoria: 'Pagos', colorOverride: '#EF4444' }
                        });
                    }
                }
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

    const guardarTareaMutation = useMutation({
        mutationFn: async ({ formulario, recurrente }: { formulario: any, recurrente: boolean }) => {
            // 🟢 CORRECCIÓN: Sin owner_id
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

    const editarTareaMutation = useMutation({
        mutationFn: async ({ id, formulario }: { id: string, formulario: any }) => {
            const updateData: any = {
                titulo: formulario.titulo,
                descripcion: formulario.descripcion,
                fecha: formulario.fecha,
                hora: formulario.hora,
                hora_fin: formulario.horaFin,
                categoria: formulario.categoria,
                proyecto_id: formulario.proyectoId || null,
            };

            const { error } = await supabase.from("tareas").update(updateData).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Tarea actualizada");
            queryClient.invalidateQueries({ queryKey: ['calendario'] });
        }
    });

    const guardarNotaMutation = useMutation({
        mutationFn: async ({ texto, color }: { texto: string, color: TipoNota }) => {
            // 🟢 CORRECCIÓN: Sin owner_id
            await supabase.from("notas_calendario").insert({
                workspace_id: currentWorkspace?.id,
                fecha: new Date().toISOString(),
                texto,
                color
            });
        },
        onSuccess: () => { toast.success("Nota creada"); queryClient.invalidateQueries({ queryKey: ['calendario'] }); }
    });

    const editarNotaMutation = useMutation({
        mutationFn: async ({ id, texto, color }: { id: string, texto: string, color: TipoNota }) => {
            const { error } = await supabase.from("notas_calendario").update({ texto, color }).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Nota actualizada");
            queryClient.invalidateQueries({ queryKey: ['calendario'] });
        }
    });

    return {
        loading: isLoading,
        eventosDB,
        postIts: data?.postIts || [],
        proyectosRaw: data?.proyectosRaw || [],
        proyectosList: data?.proyectosList || [],
        cargarDatos: () => queryClient.invalidateQueries({ queryKey: ['calendario'] }),
        guardarTarea: (f: any, r: boolean) => guardarTareaMutation.mutateAsync({ formulario: f, recurrente: r }),
        editarTarea: (evento: any, f: any) => editarTareaMutation.mutateAsync({ id: evento.id, formulario: f }),
        guardarNota: (t: string, c: TipoNota) => guardarNotaMutation.mutateAsync({ texto: t, color: c }),
        editarNota: (nota: any, t: string, c: TipoNota) => editarNotaMutation.mutateAsync({ id: nota.id, texto: t, color: c }),
        borrarItem: () => { },
        completarTarea: async () => { },
        updateTaskDate: async () => { },
        saveSession: async () => { },
        syncGoogle: async () => { }
    };
}
