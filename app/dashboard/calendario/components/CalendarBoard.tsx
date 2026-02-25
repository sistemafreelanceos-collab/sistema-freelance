"use client";
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { EventoCalendario, CATEGORIAS_COLORS, Proyecto } from '../../../../types';
import { ChevronLeftIcon, ChevronRightIcon, BanknotesIcon, BriefcaseIcon } from "@heroicons/react/24/solid";
import { DndContext, useDraggable, DragEndEvent, DragStartEvent, useDroppable, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useClientes } from '../../../hooks/useClientes';
import { useState } from 'react';

moment.locale('es');
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

interface Props {
    eventos: EventoCalendario[];
    view: any;
    setView: (v: any) => void;
    date: Date;
    onNavigate: (date: Date) => void;
    onEventDrop: (args: any) => void;
    onSelectSlot: (slotInfo: any) => void;
    onSelectEvent: (event: EventoCalendario) => void;
    onProjectDrop?: (projectId: string, date: Date) => void;
}

// 1. Componente Arrastrable UI (Reutilizable para el origen y el overlay)
function ProjectCardUI({ proyecto, isDragging = false }: { proyecto: Proyecto, isDragging?: boolean }) {
    return (
        <div className={`bg-[#161B22] border ${isDragging ? 'border-indigo-500 shadow-indigo-500/50 scale-105' : 'border-white/10'} p-3 rounded-xl mb-3 shadow-sm transition-all z-50 relative w-full`}>
            <div className="flex items-center gap-2 mb-1">
                <BriefcaseIcon className="w-4 h-4 text-indigo-400" />
                <h4 className="text-white font-bold text-sm truncate">{proyecto.nombre}</h4>
            </div>
            <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                    {proyecto.estado.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-gray-500 cursor-grab">⋮⋮</span>
            </div>
        </div>
    );
}

// 2. Componente Arrastrable Lógico
function DraggableProject({ proyecto }: { proyecto: Proyecto }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `project-${proyecto.id}`,
        data: {
            type: 'proyecto',
            proyecto
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
            <ProjectCardUI proyecto={proyecto} isDragging={isDragging} />
        </div>
    );
}


const CustomToolbar = (toolbar: any) => {
    const goToBack = () => toolbar.onNavigate('PREV');
    const goToNext = () => toolbar.onNavigate('NEXT');
    const goToToday = () => toolbar.onNavigate('TODAY');

    return (
        <div className="flex justify-between items-center mb-4 px-4 py-3 bg-[#161B22] border-b border-white/5">
            <div className="flex items-center gap-4">
                <div className="flex items-center bg-[#0D1117] rounded-lg border border-white/10 p-1">
                    <button onClick={goToBack} className="p-1.5 hover:bg-white/10 rounded-md transition text-gray-400 hover:text-white"><ChevronLeftIcon className="w-4 h-4" /></button>
                    <button onClick={goToToday} className="px-3 text-xs font-bold text-gray-300 hover:text-white border-x border-white/10 mx-1">Hoy</button>
                    <button onClick={goToNext} className="p-1.5 hover:bg-white/10 rounded-md transition text-gray-400 hover:text-white"><ChevronRightIcon className="w-4 h-4" /></button>
                </div>
                <span className="text-xl font-bold text-white capitalize tracking-tight font-sans">{moment(toolbar.date).format('MMMM YYYY')}</span>
            </div>
            <div className="flex bg-[#0D1117] p-1 rounded-lg border border-white/10">
                {['month', 'week', 'day'].map(v => (
                    <button
                        key={v}
                        onClick={() => toolbar.onView(v)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition capitalize ${toolbar.view === v ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                    >
                        {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
                    </button>
                ))}
            </div>
        </div>
    );
};

const CustomEvent = ({ event }: any) => {
    // DISEÑO PARA GASTOS FIJOS
    if (event.type === 'gasto_fijo') {
        return (
            <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-2 py-1 rounded text-xs mb-1 flex justify-between items-center group cursor-pointer hover:bg-red-900/30 transition h-full shadow-sm">
                <span className="truncate font-bold text-[10px]">{event.title}</span>
                <span className="text-[10px] opacity-70 group-hover:opacity-100 flex items-center gap-1 transition">
                    <BanknotesIcon className="w-3 h-3" />
                    ${Number(event.monto).toLocaleString('en-US', { notation: "compact" })}
                </span>
            </div>
        );
    }

    if (event.type === 'proximo_cobro') {
        return (
            <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-2 py-1 rounded text-xs mb-1 flex justify-between items-center group cursor-pointer hover:bg-emerald-500/20 hover:scale-[1.02] transition-transform duration-300 h-full shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <span className="truncate font-bold text-[10px] drop-shadow">{event.title}</span>
                <span className="text-[10px] opacity-80 group-hover:opacity-100 transition">
                    ${Number(event.monto).toLocaleString('en-US', { notation: "compact" })}
                </span>
            </div>
        );
    }

    // ... (Mantenemos los diseños anteriores: nota, cobro, entrega)
    if (event.type === 'cobro') {
        return (
            <div className="bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 px-2 py-1 rounded text-xs mb-1 truncate h-full flex items-center hover:bg-emerald-800/40 transition">
                ✔️ Pago recibido: {event.title.replace('Pago: ', '')}
            </div>
        );
    }

    // Diseño Default (Notas / Entregas)
    const colorClass = event.color === 'purple' ? 'bg-purple-500/20 text-purple-200 border-purple-500/30'
        : event.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' // Fallback for cobro if simplified
            : event.color === 'red' ? 'bg-red-500/20 text-red-200 border-red-500/30' // Fallback for gasto
                : 'bg-blue-500/20 text-blue-200 border-blue-500/30'; // Default note

    return (
        <div className={`${colorClass} border px-2 py-1 rounded text-[11px] mb-1 truncate cursor-grab active:cursor-grabbing h-full flex items-center hover:brightness-125 transition-all duration-300 shadow-sm`}>
            {event.title}
        </div>
    );
};

export default function CalendarBoard({ eventos, view, setView, date, onNavigate, onEventDrop, onSelectSlot, onSelectEvent, onProjectDrop }: Props) {

    // Obtener los proyectos activos a través del hook
    const { todosLosProyectos, loading } = useClientes();
    const [activeProjectItem, setActiveProjectItem] = useState<Proyecto | null>(null);

    // Sensores para evitar que DndKit bloquee los clics normales de React Big Calendar
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Requiere mover el mouse 5px para iniciar el drag
            },
        })
    );

    // Filtrar proyectos que no estén finalizados ni cancelados
    const proyectosActivos = todosLosProyectos.filter(p => !['finalizado', 'cancelado'].includes(p.estado));

    const eventStyleGetter = (event: EventoCalendario) => {
        const isProject = event.resource?.tipo_evento === 'proyecto';
        const isCompleted = event.resource?.completada;
        const colorBase = event.resource?.colorOverride || CATEGORIAS_COLORS[event.resource?.categoria as string] || "#6B7280";

        let style: any = {
            backgroundColor: isCompleted ? "#27272A" : colorBase,
            opacity: isCompleted ? 0.6 : 1,
            borderRadius: "4px",
            border: "none",
            borderLeft: `4px solid ${isCompleted ? '#52525B' : 'rgba(0,0,0,0.2)'}`,
            color: "white",
            fontSize: "12px",
            fontWeight: "500",
            padding: "2px 6px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            zIndex: 10
        };

        if (event.resource?.className?.includes('titilar')) {
            style.animation = "pulse-yellow 2s infinite";
            style.border = "2px solid #EAB308";
        }

        return { style, className: event.resource?.className };
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        if (active.data.current?.type === 'proyecto') {
            setActiveProjectItem(active.data.current.proyecto);
        }
    };

    // Manejar el final del arrastre desde el DndContext (fuera del calendario)
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveProjectItem(null);

        // Verificaremos dónde se soltó. Por ahora logeamos.
        // `@dnd-kit` no interactúa nativamente con las celdas de `react-big-calendar`.
        // Implementaremos un puente o un enfoque híbrido en el siguiente paso.
        console.log("DragEnd:", { active, over });

        // Si logramos soltarlo sobre una celda del calendario que hemos marcado como droppable...
        if (over && over.data.current?.type === 'calendar_cell') {
            const dateStr = over.id as string; // ej: "2023-10-25"
            const proyecto = active.data.current?.proyecto as Proyecto;

            if (proyecto && dateStr && onProjectDrop) {
                // Convertir a fecha local al mediodía para evitar problemas de timezone
                const [y, m, d] = dateStr.split('-');
                const dropDate = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
                onProjectDrop(proyecto.id, dropDate);
            }
        }
    };

    // Customizamos el 'dateCellWrapper' de react-big-calendar para que sea un Droppable
    const CustomDateCellWrapper = (props: any) => {
        const dateStr = moment(props.value).format('YYYY-MM-DD');
        const { isOver, setNodeRef } = useDroppable({
            id: dateStr,
            data: { type: 'calendar_cell', date: props.value }
        });

        // Este es el contenedor de la celda de fecha en `react-big-calendar`
        return (
            <div
                ref={setNodeRef}
                className={`flex-1 ${isOver ? 'bg-indigo-500/30' : ''}`}
                style={{
                    minWidth: '1px',
                    height: '100%',
                    boxShadow: isOver ? 'inset 0 0 0 2px rgba(99, 102, 241, 0.8)' : 'none',
                    transition: 'all 0.2s',
                    position: 'relative',
                    zIndex: isOver ? 50 : 1
                }}
            >
                {props.children}
            </div>
        );
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 w-full h-full">

                {/* CALENDARIO (75%) */}
                <div className="flex-1 bg-[#161B22] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative z-0 min-h-0">
                    <DnDCalendar
                        localizer={localizer}
                        events={eventos}
                        startAccessor={(event: any) => new Date(event.start)}
                        endAccessor={(event: any) => new Date(event.end)}
                        style={{ height: '100%' }}
                        views={[Views.MONTH, Views.WEEK, Views.DAY]}
                        defaultView={Views.MONTH}
                        view={view}
                        onView={setView}
                        date={date}
                        onNavigate={onNavigate}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={onSelectEvent}
                        onSelectSlot={onSelectSlot}
                        selectable
                        onEventDrop={onEventDrop}

                        draggableAccessor={(event: any) => !event.resource?.es_automatico} // Visualmente no arrastrable si es auto
                        step={30}
                        timeslots={2}
                        scrollToTime={new Date(1970, 1, 1, 8, 0, 0)}
                        components={{ toolbar: CustomToolbar, event: CustomEvent, dateCellWrapper: CustomDateCellWrapper }}
                        messages={{ next: "Sig", previous: "Ant", today: "Hoy", month: "Mes", week: "Semana", day: "Día", date: "Fecha", time: "Hora", event: "Evento" }}
                    />

                    <style jsx global>{`
                .rbc-calendar { font-family: 'Inter', sans-serif; color: #9CA3AF; }
                .rbc-header { padding: 12px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9CA3AF; border-bottom: 1px solid rgba(255,255,255,0.05) !important; transition: background 0.2s; }
                .rbc-header:hover { background-color: rgba(255,255,255,0.02); }
                .rbc-time-view { border: none; }
                .rbc-timeslot-group { border-bottom: 1px solid rgba(255,255,255,0.03) !important; }
                .rbc-day-slot .rbc-time-slot { border-top: none; transition: background 0.2s; }
                .rbc-day-slot .rbc-time-slot:hover { background-color: rgba(255,255,255,0.02); }
                .rbc-time-header-content { border-left: 1px solid rgba(255,255,255,0.05) !important; }
                .rbc-day-bg { border-left: 1px solid rgba(255,255,255,0.05) !important; transition: background 0.2s; }
                .rbc-day-bg:hover { background-color: rgba(255,255,255,0.02); }
                .rbc-current-time-indicator { background-color: #EF4444 !important; height: 2px !important; box-shadow: 0 0 8px rgba(239, 68, 68, 0.8); }
                .rbc-month-view { border: none; }
                .rbc-day-bg + .rbc-day-bg { border-left: 1px solid rgba(255,255,255,0.05); }
                .rbc-month-row { border-bottom: 1px solid rgba(255,255,255,0.05); }
                .rbc-today { background-color: rgba(79, 70, 229, 0.05) !important; }
                .rbc-date-cell { padding: 8px; font-size: 13px; font-weight: 600; opacity: 0.8; transition: opacity 0.2s; }
                .rbc-date-cell:hover { opacity: 1; }
                .rbc-event { background: transparent !important; padding: 0 !important; transition: transform 0.2s ease, filter 0.2s ease; }
                .rbc-event:focus { outline: none; }
                @keyframes pulse-yellow { 0% { opacity: 1; border-color: #EAB308; } 50% { opacity: 0.7; border-color: transparent; } 100% { opacity: 1; border-color: #EAB308; } }
            `}</style>
                </div>

                {/* SIDEBAR DE PROYECTOS (25%) */}
                <div className="w-full lg:w-80 bg-[#0A0D14] border border-white/10 rounded-2xl shadow-xl flex flex-col overflow-hidden flex-shrink-0 min-h-0">
                    <div className="p-4 border-b border-white/10 bg-[#161B22]/50">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <BriefcaseIcon className="w-5 h-5 text-indigo-500" />
                            Time-Blocking
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Arrastra un proyecto al calendario para bloquear tiempo.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        {loading ? (
                            <div className="animate-pulse flex flex-col gap-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl"></div>)}
                            </div>
                        ) : proyectosActivos.length > 0 ? (
                            proyectosActivos.map(proyecto => (
                                <DraggableProject key={`dnd-${proyecto.id}`} proyecto={proyecto} />
                            ))
                        ) : (
                            <div className="text-center py-10 opacity-50">
                                <p className="text-sm text-gray-400">No hay proyectos activos.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <DragOverlay>
                {activeProjectItem ? (
                    <div className="w-80 shadow-2xl opacity-90 cursor-grabbing rotate-2">
                        <ProjectCardUI proyecto={activeProjectItem} isDragging={true} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}