import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useWorkspace } from '../providers/WorkspaceProvider';
import { toast } from 'sonner';
import { TipoNota } from "../../types";

export function useCalendario(viewDate: Date = new Date()) {
    const { currentWorkspace } = useWorkspace();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['calendario', currentWorkspace?.id, viewDate.getMonth(), viewDate.getFullYear()],
        enabled: !!currentWorkspace?.id,
        queryFn: async () => {
            const formatLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const startOfMonth = formatLocal(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1));
            const endOfMonth = formatLocal(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0));

            const safeDateStr = (dateStr: string) => dateStr && !dateStr.includes('T') ? `${dateStr}T12:00:00` : dateStr;

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
                .eq('workspace_id', currentWorkspace?.id);

            // 3. Cargar Proyectos Activos (Entregas y Cobros)
            const { data: proyectos } = await supabase
                .from('proyectos')
                .select('*, pagos_cliente(*), cliente:clientes(nombre, proximo_pago, monto, moneda)')
                .eq('workspace_id', currentWorkspace?.id)
                .neq('estado', 'finalizado');

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

            // 6. Cargar fechas de pago de proyectos de proveedor
            const { data: proyectosProveedor } = await supabase
                .from('proyectos_proveedor')
                .select('id, nombre, monto, moneda, fecha_pago, estado, proveedor_id')
                .eq('workspace_id', currentWorkspace?.id)
                .neq('estado', 'completado')
                .not('fecha_pago', 'is', null);

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
                    start: safeDateStr(n.fecha),
                    end: safeDateStr(n.fecha),
                    type: 'nota',
                    color: n.color || 'blue',
                    rotacion: n.rotacion,
                    resource: { tipo_evento: 'nota' }
                });
            });

            // C. Entregas de Proyectos (Solo los que caen en este mes)
            (proyectos || [])
                .filter((p: any) => p.fecha_fin && p.fecha_fin >= startOfMonth && p.fecha_fin <= endOfMonth)
                .forEach((p: any) => {
                    eventosMapeados.push({
                        id: p.id,
                        title: `Entrega: ${p.nombre}`,
                        start: safeDateStr(p.fecha_fin),
                        end: safeDateStr(p.fecha_fin),
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
                    start: safeDateStr(p.fecha_pago),
                    end: safeDateStr(p.fecha_pago),
                    type: 'cobro',
                    color: 'emerald',
                    details: p.cliente?.nombre,
                    resource: { tipo_evento: 'cobro' }
                });
            });

            // E. Proyección de Gastos Fijos
            (gastosFijos || []).forEach((g: any) => {
                const year = viewDate.getFullYear();
                const month = viewDate.getMonth();

                // Asegurar que el gasto ya existía antes o durante este mes
                if (g.created_at) {
                    const cd = new Date(g.created_at);
                    if (year < cd.getFullYear() || (year === cd.getFullYear() && month < cd.getMonth())) {
                        return; // Ocultar en el pasado
                    }
                }

                // Obtener el día de pago limitado al último día del mes
                const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
                const diaPagoReal = Math.min(g.dia_pago || 1, lastDayOfMonth);
                const fechaConstruida = `${year}-${String(month + 1).padStart(2, '0')}-${String(diaPagoReal).padStart(2, '0')}`;

                eventosMapeados.push({
                    id: `gasto-${g.id}`,
                    title: `${g.nombre}`,
                    monto: g.monto,
                    moneda: g.moneda,
                    start: safeDateStr(fechaConstruida),
                    end: safeDateStr(fechaConstruida),
                    type: 'gasto_fijo', // Para CustomEvent en CalendarBoard
                    color: 'red',
                    details: g.categoria,
                    resource: { tipo_evento: 'gasto' } // Para filtros en page.tsx
                });
            });

            // F'. Pagos de Proyectos de Proveedor
            (proyectosProveedor || []).forEach((proy: any) => {
                if (!proy.fecha_pago) return;

                const hoyD = new Date();
                const fechaPago = new Date(proy.fecha_pago + 'T12:00:00');
                const esVencido = fechaPago < hoyD;

                eventosMapeados.push({
                    id: `proveedor-${proy.id}`,
                    title: `💸 ${proy.nombre}`,
                    start: safeDateStr(proy.fecha_pago),
                    end: safeDateStr(proy.fecha_pago),
                    type: 'pago_proveedor',
                    color: esVencido ? 'red' : 'orange',
                    resource: { tipo_evento: 'gasto', es_automatico: true, monto: proy.monto, moneda: proy.moneda }
                });
            });

            // F. Proyección de Próximos Pagos de Clientes
            (proyectos || []).forEach((p: any) => {
                if (p.estado === 'finalizado') return;
                const f = p.frecuencia_pago || "unidad";
                const totalPagado = p.pagos_cliente?.reduce((sum: number, pago: any) => sum + pago.monto, 0) || 0;

                if (totalPagado >= p.monto && p.monto > 0 && f === "unidad") return;

                const limitStartStr = startOfMonth;
                const limitEndStr = endOfMonth;
                const [ly, lm, ld] = limitStartStr.split('-').map(Number);
                const limitStart = new Date(ly, lm - 1, ld);

                const [ey, em, ed] = limitEndStr.split('-').map(Number);
                const limitEnd = new Date(ey, em - 1, ed, 23, 59, 59);

                let montoFinal = p.monto;
                if (p.monto === 0 && p.clientes?.monto) montoFinal = p.clientes.monto;

                // Fechas a renderizar
                const fechasParaRenderizar: Date[] = [];

                if (f === "unidad") {
                    // Solo una fecha
                    let fCobro: Date | null = null;
                    if (p.fecha_fin && !p.clientes?.proximo_pago) fCobro = new Date(p.fecha_fin);
                    else if (p.clientes?.proximo_pago) fCobro = new Date(p.clientes.proximo_pago);
                    else if (p.fecha_inicio) {
                        fCobro = new Date(p.fecha_inicio);
                        fCobro.setDate(fCobro.getDate() + 30);
                    }
                    if (fCobro) fechasParaRenderizar.push(fCobro);
                } else if (p.fecha_inicio) {
                    // Bucle para recolectar TODAS las fechas de este mes visible
                    const [y, m, d] = p.fecha_inicio.split('-').map(Number);
                    let currentCycle = new Date(y, m - 1, d);

                    // Asegurarnos de que el loop no se vuelva infinito si hay error de datos
                    let guard = 0;

                    // Avanzar hasta llegar al principio del mes visible o más allá
                    while (currentCycle <= limitEnd && guard < 1000) {
                        guard++;

                        // Si el ciclo cae dentro del mes visible, lo agregamos
                        if (currentCycle >= limitStart && currentCycle <= limitEnd) {
                            fechasParaRenderizar.push(new Date(currentCycle));
                        }

                        // Siguiente ciclo
                        if (f === "quincenal") {
                            if (currentCycle.getDate() < 15) currentCycle.setDate(15);
                            else currentCycle = new Date(currentCycle.getFullYear(), currentCycle.getMonth() + 1, 0);

                            // Ajuste para saltar a la próxima quincena real
                            const temp = new Date(currentCycle);
                            temp.setDate(temp.getDate() + 15);
                            if (temp.getDate() < 15) temp.setDate(15); else temp.setDate(0);
                            if (temp > currentCycle) currentCycle = temp; else currentCycle.setMonth(currentCycle.getMonth() + 1);
                        } else if (f === "mensual") {
                            currentCycle.setMonth(currentCycle.getMonth() + 1);
                            currentCycle.setDate(Math.min(d, new Date(currentCycle.getFullYear(), currentCycle.getMonth() + 1, 0).getDate()));
                        } else if (f === "semanal") {
                            currentCycle.setDate(currentCycle.getDate() + 7);
                        } else {
                            break; // Por seguridad
                        }
                    }
                }

                // Inyectamos las fechas recolectadas
                fechasParaRenderizar.forEach((fechaCobro) => {
                    fechaCobro.setHours(12, 0, 0, 0);
                    const isoDate = formatLocal(fechaCobro);
                    const safeIsoDate = safeDateStr(isoDate);

                    if (isoDate >= limitStartStr && isoDate <= limitEndStr) {
                        eventosMapeados.push({
                            id: `proxcobro-${p.id}-${isoDate}`, // ID único por fecha
                            title: `⌚ Cobrar: ${p.clientes?.nombre || p.nombre}`,
                            monto: montoFinal,
                            moneda: p.clientes?.moneda || p.moneda || 'USD',
                            start: safeIsoDate,
                            end: safeIsoDate,
                            type: 'proximo_cobro',
                            color: 'emerald',
                            details: p.nombre,
                            resource: { tipo_evento: 'cobro' }
                        });
                    }
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
            const payload = {
                workspace_id: currentWorkspace?.id,
                texto: nota.texto,
                color: nota.color || 'amarillo',
                fecha: nota.fecha || new Date().toISOString().split('T')[0],
                rotacion: nota.rotacion || 0
            };

            if (nota.id) {
                const { error } = await supabase.from('notas_calendario').update(payload).eq('id', nota.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('notas_calendario').insert(payload);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendario'] });
            toast.success("Nota guardada");
        },
        onError: (err: any) => {
            toast.error("Error al guardar: " + err.message);
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

        cargarDatos: () => queryClient.invalidateQueries({ queryKey: ['calendario'] }),
        guardarTarea: (f: any, r: boolean) => guardarTareaMutation.mutateAsync({ formulario: f, recurrente: r }),
        borrarItem: (id: string, tabla: string) => deleteNotaMutation.mutateAsync({ id, tabla }),

        guardarNota: (t: any) => saveNotaMutation.mutateAsync(typeof t === 'string' ? { texto: t, color: arguments[1] || 'amarillo' } : t),
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
