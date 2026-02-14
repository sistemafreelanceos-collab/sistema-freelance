"use client";
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { EventoCalendario, CATEGORIAS_COLORS } from '../../../../types';
import { ChevronLeftIcon, ChevronRightIcon, BanknotesIcon } from "@heroicons/react/24/solid";

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
            <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-2 py-1 rounded text-xs mb-1 flex justify-between items-center group cursor-pointer hover:bg-red-900/30 transition h-full">
                <span className="truncate font-bold text-[10px]">{event.title}</span>
                <span className="text-[10px] opacity-70 group-hover:opacity-100 flex items-center gap-1">
                    <BanknotesIcon className="w-3 h-3" />
                    {/* Formato compacto de dinero */}
                    ${Number(event.monto).toLocaleString('en-US', { notation: "compact" })}
                </span>
            </div>
        );
    }

    // ... (Mantenemos los diseños anteriores: nota, cobro, entrega)
    if (event.type === 'cobro') {
        return (
            <div className="bg-emerald-900/20 border border-emerald-500/30 text-emerald-300 px-2 py-1 rounded text-xs mb-1 truncate h-full flex items-center">
                💰 {event.title}
            </div>
        );
    }

    // Diseño Default (Notas / Entregas)
    const colorClass = event.color === 'purple' ? 'bg-purple-500/20 text-purple-200 border-purple-500/30'
        : event.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' // Fallback for cobro if simplified
            : event.color === 'red' ? 'bg-red-500/20 text-red-200 border-red-500/30' // Fallback for gasto
                : 'bg-blue-500/20 text-blue-200 border-blue-500/30'; // Default note

    return (
        <div className={`${colorClass} border px-2 py-1 rounded text-xs mb-1 truncate cursor-grab active:cursor-grabbing h-full flex items-center`}>
            {event.title}
        </div>
    );
};

export default function CalendarBoard({ eventos, view, setView, date, onNavigate, onEventDrop, onSelectSlot, onSelectEvent }: Props) {

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
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        };

        if (event.resource?.className?.includes('titilar')) {
            style.animation = "pulse-yellow 2s infinite";
            style.border = "2px solid #EAB308";
        }

        return { style, className: event.resource?.className };
    };

    return (
        <div className="flex-1 bg-[#161B22] border border-white/10 rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden">
            <DnDCalendar
                localizer={localizer}
                events={eventos}
                // CORRECCIÓN AQUÍ: Usamos funciones en lugar de strings
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
                components={{ toolbar: CustomToolbar, event: CustomEvent }}
                messages={{ next: "Sig", previous: "Ant", today: "Hoy", month: "Mes", week: "Semana", day: "Día", date: "Fecha", time: "Hora", event: "Evento" }}
            />

            <style jsx global>{`
                .rbc-calendar { font-family: 'Inter', sans-serif; color: #9CA3AF; }
                .rbc-header { padding: 12px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9CA3AF; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
                .rbc-time-view { border: none; }
                .rbc-timeslot-group { border-bottom: 1px solid rgba(255,255,255,0.03) !important; }
                .rbc-day-slot .rbc-time-slot { border-top: none; }
                .rbc-time-header-content { border-left: 1px solid rgba(255,255,255,0.05) !important; }
                .rbc-day-bg { border-left: 1px solid rgba(255,255,255,0.05) !important; }
                .rbc-current-time-indicator { background-color: #EF4444 !important; height: 2px !important; }
                .rbc-month-view { border: none; }
                .rbc-day-bg + .rbc-day-bg { border-left: 1px solid rgba(255,255,255,0.05); }
                .rbc-month-row { border-bottom: 1px solid rgba(255,255,255,0.05); }
                .rbc-today { background-color: rgba(79, 70, 229, 0.05) !important; }
                .rbc-date-cell { padding: 8px; font-size: 13px; font-weight: 600; opacity: 0.8; }
                @keyframes pulse-yellow { 0% { opacity: 1; border-color: #EAB308; } 50% { opacity: 0.7; border-color: transparent; } 100% { opacity: 1; border-color: #EAB308; } }
            `}</style>
        </div>
    );
}