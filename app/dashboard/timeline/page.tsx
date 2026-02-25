"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useWorkspace } from "../../providers/WorkspaceProvider";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SparklesIcon, BookOpenIcon, QueueListIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface TimelineEvent {
    id: string;
    tipo: string;
    mensaje: string;
    icono: string;
    created_at: string;
    metadata: any;
}

export default function TimelinePage() {
    const { currentWorkspace } = useWorkspace();
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // AI Story State
    const [stories, setStories] = useState<Record<string, string>>({});
    const [generatingDate, setGeneratingDate] = useState<string | null>(null);

    const loadEvents = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !currentWorkspace) return;

        const { data } = await supabase
            .from("timeline")
            .select("*")
            .eq("workspace_id", currentWorkspace.id) // Filtrado por Workspace Estricto
            .order("created_at", { ascending: false })
            .limit(100);

        if (data) setEvents(data);
        setLoading(false);
    };

    useEffect(() => {
        loadEvents();

        // Subscription for real-time updates
        const channel = supabase
            .channel('timeline_updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'timeline' }, (payload) => {
                const newEvent = payload.new as TimelineEvent;
                // Filtrar eventos en tiempo real para que coincidan con workspace actual
                if (currentWorkspace?.id && (payload.new as any).workspace_id === currentWorkspace.id) {
                    setEvents(prev => [newEvent, ...prev]);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentWorkspace]);

    // Agrupar por fecha
    const groupedEvents = events.reduce((acc, event) => {
        const date = new Date(event.created_at).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(event);
        return acc;
    }, {} as Record<string, TimelineEvent[]>);

    const generateStory = async (dateKey: string, dayEvents: TimelineEvent[]) => {
        if (stories[dateKey]) return; // Ya generado
        setGeneratingDate(dateKey);

        try {
            const userName = localStorage.getItem('userName') || "el líder del negocio";

            // Preparar el payload condensado para la IA
            const payloadEvents = dayEvents.map(e => ({
                tipo: e.tipo,
                mensaje: e.mensaje,
                hora: format(new Date(e.created_at), "h:mm a")
            })).reverse(); // Orden cronológico de lectura

            const res = await fetch("/api/generate-timeline-story", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventos: payloadEvents,
                    nombreUsuario: userName
                })
            });

            if (!res.ok) throw new Error("Error contactando a Onyx AI");

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Efecto Escribir en Vivo (Opcional pero recomendado)
            const newText = data.text;
            let tempText = "";
            const chunks = newText.split(" ");

            for (let i = 0; i < chunks.length; i++) {
                tempText += chunks[i] + " ";
                setStories(prev => ({ ...prev, [dateKey]: tempText }));
                await new Promise(r => setTimeout(r, 20)); // typing delay
            }

            toast.success("Capítulo completado.");

        } catch (error: any) {
            toast.error(error.message || "No pudimos relatar el día.");
            setStories(prev => {
                const copy = { ...prev };
                delete copy[dateKey];
                return copy;
            });
        } finally {
            setGeneratingDate(null);
        }
    };

    // Efecto Auto-Generador Secuencial
    useEffect(() => {
        // Ejecutar solo si hay eventos y no hay ninguna generación en curso
        if (Object.keys(groupedEvents).length > 0 && !generatingDate) {
            // Encontrar la primera fecha que no tenga historia generada (de arriba hacia abajo)
            const dates = Object.keys(groupedEvents);
            const nextDate = dates.find(d => !stories[d]);

            if (nextDate) {
                generateStory(nextDate, groupedEvents[nextDate]);
            }
        }
    }, [groupedEvents, stories, generatingDate]);


    return (
        <div className="max-w-4xl mx-auto pb-20 p-6 md:p-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Bitácora Automática 📝</h1>
                    <p className="text-gray-400">Tu historia productiva, escrita por sí sola.</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-500 animate-pulse">Cargando tu historia...</div>
            ) : events.length === 0 ? (
                <div className="text-center py-20 bg-[#161B22] border border-white/5 rounded-2xl">
                    <p className="text-gray-500 text-lg">Aún no hay historia que contar hoy.</p>
                    <p className="text-gray-600 text-sm mt-2">Realiza acciones en el sistema y aparecerán aquí.</p>
                </div>
            ) : (
                <div className="space-y-16">
                    {Object.entries(groupedEvents).map(([date, dayEvents]) => (
                        <div key={date} className="relative">

                            {/* Fecha Sticky Header */}
                            <div className="sticky top-16 z-10 bg-[#0D1117]/95 backdrop-blur-md py-4 mb-6 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl font-bold text-white capitalize">
                                        {format(new Date(dayEvents[0].created_at), "EEEE, d 'de' MMMM", { locale: es })}
                                    </h2>
                                    <span className="hidden md:inline-block text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">
                                        {dayEvents.length} eventos
                                    </span>
                                </div>

                                {/* Etiqueta de Estado de la IA */}
                                <div
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all border ${generatingDate === date
                                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                            : stories[date]
                                                ? 'bg-white/5 text-gray-300 border-white/5'
                                                : 'bg-transparent text-gray-500 border-transparent'
                                        }`}
                                >
                                    {generatingDate === date ? (
                                        <SparklesIcon className="w-4 h-4 animate-spin text-indigo-400" />
                                    ) : stories[date] ? (
                                        <BookOpenIcon className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <QueueListIcon className="w-4 h-4 text-gray-500" />
                                    )}

                                    <span>
                                        {generatingDate === date ? "Onyx escribiendo capítulo..." :
                                            stories[date] ? "Capítulo Guardado" :
                                                "Esperando turno..."}
                                    </span>
                                </div>
                            </div>

                            {/* Mostrar el Relato si existe (IA Book Mode) */}
                            {stories[date] && (
                                <div className="mb-8 p-6 lg:p-8 bg-[#161B22] border border-indigo-500/20 rounded-2xl shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4">
                                    {/* Decoración de fondo */}
                                    <div className="absolute top-0 right-0 p-8 opacity-5 cursor-default">
                                        <BookOpenIcon className="w-32 h-32" />
                                    </div>

                                    <div className="relative z-10 prose prose-invert prose-indigo max-w-none">
                                        <h3 className="text-indigo-300 flex items-center gap-2 font-serif text-xl border-b border-indigo-500/20 pb-2 mb-4">
                                            <SparklesIcon className="w-5 h-5" /> Capítulo de Hoy
                                        </h3>
                                        <div className="text-gray-300 text-base md:text-lg leading-relaxed font-serif whitespace-pre-line">
                                            {stories[date]}
                                        </div>
                                    </div>

                                    {generatingDate === date && (
                                        <div className="absolute bottom-0 left-0 h-1 bg-indigo-500/30 w-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 w-1/3 animate-[slide_1s_ease-in-out_infinite]"></div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Línea de tiempo clásica (Eventos técnicos) */}
                            <div className="relative border-l-2 border-white/5 ml-4 space-y-8 pb-4">
                                {dayEvents.map((event) => (
                                    <div key={event.id} className="relative pl-8 group">
                                        {/* Icono en la línea de tiempo */}
                                        <div className="absolute -left-[14px] top-0 bg-[#0D1117] border border-white/10 p-1.5 rounded-full text-xl group-hover:scale-110 group-hover:border-emerald-500/50 transition">
                                            {event.icono || '●'}
                                        </div>

                                        {/* Contenido */}
                                        <div className="bg-[#161B22] border border-white/5 hover:border-white/10 p-4 rounded-xl transition flex flex-col md:flex-row md:justify-between items-start md:items-center gap-2 md:gap-4 group-hover:bg-white/5">
                                            <div>
                                                <p className="text-gray-200 text-sm md:text-base leading-relaxed">{event.mensaje}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-[10px] uppercase font-bold text-gray-500 bg-[#0D1117] px-2 py-0.5 rounded border border-white/5">{event.tipo}</span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-500 font-mono whitespace-nowrap shrink-0">
                                                {format(new Date(event.created_at), "h:mm a")}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

