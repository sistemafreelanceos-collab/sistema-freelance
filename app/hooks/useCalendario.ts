import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { EventoCalendario, PostIt, TipoNota } from "../../types";
import { toast } from "sonner";
import moment from "moment";

export function useCalendario() {
    const [loading, setLoading] = useState(true);
    const [localEvents, setLocalEvents] = useState<EventoCalendario[]>([]);
    const [googleEvents, setGoogleEvents] = useState<EventoCalendario[]>([]);
    const [postIts, setPostIts] = useState<PostIt[]>([]);
    const [proyectosRaw, setProyectosRaw] = useState<any[]>([]);
    const [proyectosList, setProyectosList] = useState<any[]>([]);

    useEffect(() => {
        cargarDatos();
        syncGoogle(true);
    }, []);

    // Combinar eventos locales y de Google
    const eventosDB = [...localEvents, ...googleEvents];

    const cargarDatos = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const uid = session.user.id;

        try {
            const [tareas, gastos, proyectos, notas] = await Promise.all([
                supabase.from("tareas").select("*, proyectos(nombre)").eq("owner_id", uid),
                supabase.from("gastos_fijos").select("*").eq("owner_id", uid).eq("activo", true),
                supabase.from("proyectos").select("id, nombre, monto, moneda, fecha_inicio, fecha_fin, estado, cliente_id, clientes(nombre, proximo_pago, monto, moneda, frecuencia_pago), pagos_cliente(monto), tiempo_acumulado").eq("owner_id", uid),
                supabase.from("notas_calendario").select("*").eq("owner_id", uid)
            ]);

            setProyectosRaw(proyectos.data || []);
            setProyectosList(proyectos.data?.map((p: any) => ({
                id: p.id,
                nombre: p.clientes?.nombre ? `${p.nombre} - ${p.clientes.nombre}` : p.nombre,
                cliente: p.clientes // Pasamos info completa
            })) || []);

            const lista: EventoCalendario[] = [];

            // 1. Tareas
            tareas.data?.forEach((t: any) => {
                try {
                    const fechaBase = t.fecha;
                    let horaStr = t.hora || "09:00:00";
                    if (horaStr.length === 5) horaStr += ":00";
                    const start = new Date(`${fechaBase}T${horaStr}`);
                    const end = new Date(start.getTime() + (60 * 60 * 1000));
                    let titulo = t.titulo;
                    if (t.proyectos) titulo = `📂 ${t.proyectos.nombre}: ${t.titulo}`;

                    lista.push({
                        id: t.id, title: titulo, start, end, allDay: !t.hora,
                        resource: { ...t, descripcion: t.descripcion, tipo_evento: 'tarea', es_automatico: false, projectId: t.proyecto_id, completada: t.completada }
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

            setLocalEvents(lista);
            setPostIts(notas.data?.map((n: any) => ({ id: n.id, texto: n.texto, fecha: n.fecha, color: n.color || 'amarillo', rotacion: n.rotacion || (Math.random() * 6 - 3) })) || []);

        } catch (error) {
            console.error("Error loading calendar data:", error);
            toast.error("Error cargando calendario");
        } finally {
            setLoading(false);
        }
    };

    const syncGoogle = async (silent = false) => {
        const { data: { session } } = await supabase.auth.getSession();

        // @ts-ignore: provider_token exists in session but typing may vary
        let token = session?.provider_token;

        if (!token) {
            if (!silent) {
                toast.info("Redirigiendo a Google para dar permisos...");
                await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        scopes: 'https://www.googleapis.com/auth/calendar.events.readonly',
                        redirectTo: window.location.origin + '/dashboard/calendario'
                    }
                });
            }
            return;
        }

        const toastId = silent ? null : toast.loading("Sincronizando con Google Calendar...");

        try {
            const res = await fetch('/api/calendar', {
                method: 'POST',
                body: JSON.stringify({ provider_token: token })
            });

            if (!res.ok) throw new Error("Error en API Calendar");

            const gEvents = await res.json();
            setGoogleEvents(gEvents);
            if (toastId) toast.success("¡Eventos de Google importados!", { id: toastId });
        } catch (error) {
            console.error(error);
            if (toastId) toast.error("Error sincronizando. Intenta reconectar.", { id: toastId });
        }
    };

    const guardarTarea = async (formulario: any, recurrente: boolean) => {
        const { data: { session } } = await supabase.auth.getSession();
        const insertData: any = { owner_id: session?.user.id, titulo: formulario.titulo, descripcion: formulario.descripcion, fecha: formulario.fecha, hora: formulario.hora, categoria: formulario.categoria, proyecto_id: formulario.proyectoId || null, completada: false };

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
        toast.success("Tarea agendada");
        await cargarDatos();
    };

    const editarTarea = async (id: string, formulario: any) => {
        const updateData: any = {
            titulo: formulario.titulo,
            descripcion: formulario.descripcion,
            fecha: formulario.fecha,
            hora: formulario.hora,
            categoria: formulario.categoria,
            proyecto_id: formulario.proyectoId || null
        };

        const { error } = await supabase.from("tareas").update(updateData).eq("id", id);

        if (error) {
            console.error(error);
            toast.error("Error al actualizar");
            return;
        }

        toast.success("Tarea actualizada");
        await cargarDatos();
    };

    const guardarNota = async (texto: string, color: TipoNota) => {
        const { data: { session } } = await supabase.auth.getSession();
        await supabase.from("notas_calendario").insert({ owner_id: session?.user.id, fecha: new Date().toISOString(), texto, color });
        toast.success("Nota creada");
        await cargarDatos();
    };

    const editarNota = async (id: string, texto: string, color: TipoNota) => {
        const { error } = await supabase.from("notas_calendario").update({ texto, color }).eq("id", id);
        if (error) {
            toast.error("Error al actualizar nota");
            return;
        }
        toast.success("Nota actualizada");
        await cargarDatos();
    };

    const borrarItem = async (id: string, tabla: string) => {
        if (!confirm("¿Eliminar?")) return;
        await supabase.from(tabla).delete().eq("id", id);
        await cargarDatos();
        toast.success("Elemento eliminado");
    };

    const completarTarea = async (id: string, estadoActual: boolean | undefined) => {
        await supabase.from("tareas").update({ completada: !estadoActual }).eq("id", id);
        await cargarDatos();
    };

    const updateTaskDate = async (id: string, start: Date) => {
        const fechaStr = moment(start).format('YYYY-MM-DD');
        const horaStr = moment(start).format('HH:mm');
        await supabase.from("tareas").update({ fecha: fechaStr, hora: horaStr }).eq("id", id);
        cargarDatos();
    };

    const saveSession = async (seconds: number, completed: boolean, eventoSeleccionado: EventoCalendario) => {
        if (completed) await supabase.from("tareas").update({ completada: true }).eq("id", eventoSeleccionado.id);
        if (eventoSeleccionado.resource?.projectId) {
            const proyectoId = eventoSeleccionado.resource.projectId;
            const { data: proy } = await supabase.from("proyectos").select("tiempo_acumulado").eq("id", proyectoId).single();
            await supabase.from("proyectos").update({ tiempo_acumulado: Number(proy?.tiempo_acumulado || 0) + seconds }).eq("id", proyectoId);
        }
        await cargarDatos();
    };

    return {
        loading,
        eventosDB,
        postIts,
        proyectosRaw,
        proyectosList,
        cargarDatos,
        guardarTarea,
        editarTarea,
        guardarNota,
        editarNota,
        borrarItem,
        completarTarea,
        updateTaskDate,
        saveSession,
        syncGoogle
    };
}
