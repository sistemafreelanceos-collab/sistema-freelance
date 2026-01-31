import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { EventoCalendario, PostIt, TipoNota } from "../../types";
import { toast } from "sonner";
import moment from "moment";

import { useWorkspace } from "../providers/WorkspaceProvider";

export function useCalendario() {
    const queryClient = useQueryClient();
    const { currentWorkspace } = useWorkspace();

    // 1. QUERY: Eventos Local + DB
    const { data, isLoading } = useQuery({
        queryKey: ['calendario', currentWorkspace?.id],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");
            const uid = session.user.id;

            if (!currentWorkspace) return { localEvents: [], postIts: [], proyectosRaw: [], proyectosList: [] };

            const [tareas, gastos, proyectos, notas] = await Promise.all([
                supabase.from("tareas").select("*, proyectos(nombre)").eq("workspace_id", currentWorkspace.id),
                supabase.from("gastos_fijos").select("*").eq("workspace_id", currentWorkspace.id).eq("activo", true),
                supabase.from("proyectos").select("id, nombre, monto, moneda, fecha_inicio, fecha_fin, estado, cliente_id, clientes(nombre, proximo_pago, monto, moneda, frecuencia_pago), pagos_cliente(monto), tiempo_acumulado").eq("workspace_id", currentWorkspace.id),
                supabase.from("notas_calendario").select("*").eq("workspace_id", currentWorkspace.id)
            ]);

            const lista: EventoCalendario[] = [];

            // 1. Tareas
            tareas.data?.forEach((t: any) => {
                try {
                    const fechaBase = t.fecha;

                    // HORA INICIO
                    let horaStr = t.hora || "09:00:00";
                    if (horaStr.length === 5) horaStr += ":00";
                    const start = new Date(`${fechaBase}T${horaStr}`);

                    // HORA FIN (Lógica Nueva)
                    let end;
                    if (t.hora_fin) {
                        let finStr = t.hora_fin;
                        if (finStr.length === 5) finStr += ":00";
                        end = new Date(`${fechaBase}T${finStr}`);
                    } else {
                        // Fallback: Si no tiene hora fin, sumamos 1 hora como antes
                        end = new Date(start.getTime() + (60 * 60 * 1000));
                    }

                    let titulo = t.titulo;
                    if (t.proyectos) titulo = `📂 ${t.proyectos.nombre}: ${t.titulo}`;

                    lista.push({
                        id: t.id,
                        title: titulo,
                        start,
                        end,
                        allDay: !t.hora,
                        // Agregamos hora_fin al resource para poder editarlo luego
                        resource: { ...t, hora_fin: t.hora_fin, descripcion: t.descripcion, tipo_evento: 'tarea', es_automatico: false, projectId: t.proyecto_id, completada: t.completada }
                    });
                } catch (e) { }
            });

            // 2. Gastos Recurrentes
            gastos.data?.forEach((g: any) => {
                const hoy = new Date(); const mesActual = hoy.getMonth(); const anio = hoy.getFullYear();
                const fechaCreacion = g.created_at ? new Date(g.created_at) : new Date(0);
                fechaCreacion.setHours(0, 0, 0, 0);

                [-1, 0, 1, 2, 3].forEach(offset => {
                    const fPago = new Date(anio, mesActual + offset, g.dia_pago);
                    if (fPago < fechaCreacion) return;

                    let pagadoEsteMes = false;
                    if (offset === 0 && g.ultimo_pago) {
                        const fUltimo = new Date(g.ultimo_pago);
                        if (fUltimo.getMonth() === mesActual && fUltimo.getFullYear() === anio) pagadoEsteMes = true;
                    }

                    const color = pagadoEsteMes ? "#10B981" : "#EF4444";
                    const titulo = pagadoEsteMes ? `✅ ${g.nombre}` : `💸 -$${g.monto} ${g.nombre}`;

                    lista.push({
                        id: `auto-${g.id}-${offset}`,
                        title: titulo,
                        start: fPago,
                        end: fPago,
                        allDay: true,
                        resource: {
                            descripcion: "Gasto Recurrente",
                            categoria: "Pagos",
                            tipo_evento: 'gasto',
                            es_automatico: true,
                            colorOverride: color,
                            completada: pagadoEsteMes
                        }
                    });
                });
            });

            // 3. Proyectos (Cobros)
            proyectos.data?.forEach((p: any) => {
                if (p.fecha_inicio) {
                    const fi = new Date(`${p.fecha_inicio}T09:00:00`);
                    const fc = p.fecha_fin ? new Date(`${p.fecha_fin}T09:00:00`) : new Date(fi.getTime() + (30 * 24 * 60 * 60 * 1000));
                    if (p.estado !== 'cancelado') {
                        lista.push({ id: `cobro-${p.id}`, title: `💰 $${p.monto} - ${p.clientes?.nombre || 'Cliente'}`, start: fc, end: fc, allDay: true, resource: { categoria: "Cobro", tipo_evento: 'cobro', es_automatico: true, colorOverride: "#10B981" } });
                    }
                }
            });

            const postIts = notas.data?.map((n: any) => ({
                id: n.id, texto: n.texto, fecha: n.fecha, color: n.color || 'amarillo', rotacion: n.rotacion || (Math.random() * 6 - 3)
            })) || [];

            const proyectosList = proyectos.data?.map((p: any) => ({
                id: p.id,
                nombre: p.clientes?.nombre ? `${p.nombre} - ${p.clientes.nombre}` : p.nombre,
                cliente: p.clientes
            })) || [];

            return {
                localEvents: lista,
                postIts,
                proyectosRaw: proyectos.data || [],
                proyectosList,
            };
        }
    });

    // 2. QUERY GOOGLE (Separada para no bloquear la carga local)
    // 2. QUERY GOOGLE MEJORADA
    const { data: googleData, error: googleError } = useQuery({
        queryKey: ['calendario-google'],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            // @ts-ignore
            const token = session?.provider_token;

            // Si no hay token (no se logueó con Google), retornamos vacío sin error
            if (!token) return [];

            try {
                // Calculamos un rango amplio para asegurar que se vean los eventos
                // (Opcional: Podrías recibir 'viewStart' y 'viewEnd' como props en el hook si quieres optimizar más)
                const start = moment().subtract(1, 'month').format();
                const end = moment().add(6, 'months').format();

                const res = await fetch('/api/calendar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        provider_token: token,
                        start,
                        end
                    })
                });

                if (res.status === 401) {
                    // Token expirado: Lanzamos error específico para manejarlo en la UI
                    throw new Error("EXPIRED_TOKEN");
                }

                if (!res.ok) throw new Error("Error en API Google");

                return await res.json();
            } catch (e: any) {
                if (e.message === "EXPIRED_TOKEN") {
                    // Opcional: Mostrar toast solo una vez para no spamear
                    console.warn("Token de Google expirado. Se requiere re-login.");
                }
                return []; // Retornamos vacío para no romper el calendario visualmente
            }
        },
        // Cachear por 5 minutos, reintentar 1 vez si falla
        staleTime: 1000 * 60 * 5,
        retry: 1
    });

    // Efecto para avisar al usuario si el token caducó (Opcional)
    // Puedes poner esto dentro del componente si prefieres
    if (googleError && (googleError as Error).message === "EXPIRED_TOKEN") {
        // toast.error("Tu sesión de Google expiró. Cierra sesión y vuelve a entrar para ver tus eventos.");
    }

    const eventosDB = [...(data?.localEvents || []), ...(googleData || [])];

    // 3. MUTACIONES
    const guardarTareaMutation = useMutation({
        mutationFn: async ({ formulario, recurrente }: { formulario: any, recurrente: boolean }) => {
            const { data: { session } } = await supabase.auth.getSession();
            const insertData: any = {
                owner_id: session?.user.id,
                workspace_id: currentWorkspace?.id,
                titulo: formulario.titulo,
                descripcion: formulario.descripcion,
                fecha: formulario.fecha,
                hora: formulario.hora,
                hora_fin: formulario.horaFin, // <--- NUEVO CAMPO
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
            } else {
                await supabase.from("tareas").insert(insertData);
            }
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
                hora_fin: formulario.horaFin, // <--- NUEVO CAMPO
                categoria: formulario.categoria,
                proyecto_id: formulario.proyectoId || null
            };
            await supabase.from("tareas").update(updateData).eq("id", id);
        },
        onSuccess: () => {
            toast.success("Tarea actualizada");
            queryClient.invalidateQueries({ queryKey: ['calendario'] });
        },
        onError: () => toast.error("Error al actualizar")
    });

    const guardarNotaMutation = useMutation({
        mutationFn: async ({ texto, color }: { texto: string, color: TipoNota }) => {
            const { data: { session } } = await supabase.auth.getSession();
            await supabase.from("notas_calendario").insert({
                owner_id: session?.user.id,
                workspace_id: currentWorkspace?.id,
                fecha: new Date().toISOString(),
                texto,
                color
            });
        },
        onSuccess: () => {
            toast.success("Nota creada");
            queryClient.invalidateQueries({ queryKey: ['calendario'] });
        }
    });

    const editarNotaMutation = useMutation({
        mutationFn: async ({ id, texto, color }: { id: string, texto: string, color: TipoNota }) => {
            await supabase.from("notas_calendario").update({ texto, color }).eq("id", id);
        },
        onSuccess: () => {
            toast.success("Nota actualizada");
            queryClient.invalidateQueries({ queryKey: ['calendario'] });
        }
    });

    const borrarItem = (id: string, tabla: string) => {
        toast.error("¿Eliminar este elemento?", {
            action: {
                label: "Eliminar",
                onClick: async () => {
                    await supabase.from(tabla).delete().eq("id", id);
                    queryClient.invalidateQueries({ queryKey: ['calendario'] });
                    toast.success("Elemento eliminado");
                }
            },
            cancel: { label: "Cancelar", onClick: () => { } },
        });
    };

    const completarTareaMutation = useMutation({
        mutationFn: async ({ id, estadoActual }: { id: string, estadoActual: boolean }) => {
            await supabase.from("tareas").update({ completada: !estadoActual }).eq("id", id);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendario'] })
    });

    const updateTaskDateMutation = useMutation({
        mutationFn: async ({ id, start }: { id: string, start: Date }) => {
            const fechaStr = moment(start).format('YYYY-MM-DD');
            const horaStr = moment(start).format('HH:mm');
            await supabase.from("tareas").update({ fecha: fechaStr, hora: horaStr }).eq("id", id);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendario'] })
    });

    const saveSessionMutation = useMutation({
        mutationFn: async ({ seconds, completed, eventoSeleccionado }: { seconds: number, completed: boolean, eventoSeleccionado: EventoCalendario }) => {
            if (completed) await supabase.from("tareas").update({ completada: true }).eq("id", eventoSeleccionado.id);
            if (eventoSeleccionado.resource?.projectId) {
                const proyectoId = eventoSeleccionado.resource.projectId;
                // Fetch first, simplistic approach, could be better with RPC but okay for now
                const { data: proy } = await supabase.from("proyectos").select("tiempo_acumulado").eq("id", proyectoId).single();
                await supabase.from("proyectos").update({ tiempo_acumulado: Number(proy?.tiempo_acumulado || 0) + seconds }).eq("id", proyectoId);
            }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendario'] })
    });

    // Sync explícito (botón)
    const syncGoogle = async (silent = false) => {
        // Simplemente invalidamos para que useQuery vuelva a fetchear, 
        // pero como useQuery depende del token y fetcher, aquí podemos forzar refetch
        queryClient.invalidateQueries({ queryKey: ['calendario-google'] });
        if (!silent) toast.success("Sincronizando...");
    };

    return {
        loading: isLoading,
        eventosDB,
        postIts: data?.postIts || [],
        proyectosRaw: data?.proyectosRaw || [],
        proyectosList: data?.proyectosList || [],
        cargarDatos: () => queryClient.invalidateQueries({ queryKey: ['calendario'] }),
        guardarTarea: (formulario: any, recurrente: boolean) => guardarTareaMutation.mutateAsync({ formulario, recurrente }),
        editarTarea: (id: string, formulario: any) => editarTareaMutation.mutateAsync({ id, formulario }),
        guardarNota: (texto: string, color: TipoNota) => guardarNotaMutation.mutateAsync({ texto, color }),
        editarNota: (id: string, texto: string, color: TipoNota) => editarNotaMutation.mutateAsync({ id, texto, color }),
        borrarItem,
        completarTarea: (id: string, estadoActual: boolean | undefined) => completarTareaMutation.mutateAsync({ id, estadoActual: !!estadoActual }),
        updateTaskDate: (id: string, start: Date) => updateTaskDateMutation.mutateAsync({ id, start }),
        saveSession: (seconds: number, completed: boolean, eventoSeleccionado: EventoCalendario) => saveSessionMutation.mutateAsync({ seconds, completed, eventoSeleccionado }),
        syncGoogle
    };
}
