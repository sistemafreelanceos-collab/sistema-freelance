"use client";
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { EventoCalendario, CATEGORIAS_COLORS } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

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
                <button onClick={goToBack} className="p-1.5 hover:bg-white/10 rounded-md transition text-gray-400 hover:text-white"><ChevronLeftIcon className="w-4 h-4"/></button>
                <button onClick={goToToday} className="px-3 text-xs font-bold text-gray-300 hover:text-white border-x border-white/10 mx-1">Hoy</button>
                <button onClick={goToNext} className="p-1.5 hover:bg-white/10 rounded-md transition text-gray-400 hover:text-white"><ChevronRightIcon className="w-4 h-4"/></button>
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
                resizable
                step={30} 
                timeslots={2} 
                scrollToTime={new Date(1970, 1, 1, 8, 0, 0)}
                components={{ toolbar: CustomToolbar }}
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