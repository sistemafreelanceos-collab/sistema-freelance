"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useWorkspace } from "../../providers/WorkspaceProvider";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

    const loadEvents = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !currentWorkspace) return;

        const { data } = await supabase
            .from("timeline")
            .select("*")
            .eq("workspace_id", currentWorkspace.id) // Filtrado por Workspace Estricto
            .order("created_at", { ascending: false })
            .limit(50);

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

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex justify-between items-end mb-8">
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
                <div className="space-y-12">
                    {Object.entries(groupedEvents).map(([date, dayEvents]) => (
                        <div key={date} className="relative">
                            {/* Fecha Sticky */}
                            <div className="sticky top-0 z-10 bg-[#0D1117]/95 backdrop-blur py-4 mb-4 border-b border-white/5 flex items-center gap-4">
                                <h2 className="text-xl font-bold text-white capitalize">
                                    {format(new Date(dayEvents[0].created_at), "EEEE, d 'de' MMMM", { locale: es })}
                                </h2>
                                <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">{date}</span>
                            </div>

                            <div className="relative border-l-2 border-white/10 ml-4 space-y-8 pb-8">
                                {dayEvents.map((event) => (
                                    <div key={event.id} className="relative pl-8 group">
                                        {/* Icono en la línea de tiempo */}
                                        <div className="absolute -left-[14px] top-0 bg-[#0D1117] border border-white/10 p-1.5 rounded-full text-xl group-hover:scale-110 group-hover:border-emerald-500/50 transition">
                                            {event.icono || '●'}
                                        </div>

                                        {/* Contenido */}
                                        <div className="bg-[#161B22] border border-white/5 p-4 rounded-xl hover:bg-white/5 transition flex justify-between items-start gap-4">
                                            <div>
                                                <p className="text-white text-base leading-relaxed">{event.mensaje}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-[10px] uppercase font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded">{event.tipo}</span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
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
