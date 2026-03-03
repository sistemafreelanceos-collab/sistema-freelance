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

// ── Custom Toolbar ──────────────────────────────────────────────────────────
const CustomToolbar = (toolbar: any) => {
    const label = toolbar.label;
    return (
        <div className="flex justify-between items-center px-4 py-3 bg-[#0D1117] border-b border-white/5">
            <div className="flex items-center gap-2">
                <button onClick={() => toolbar.onNavigate('PREV')} className="p-1.5 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white">
                    <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <button onClick={() => toolbar.onNavigate('TODAY')} className="text-xs font-bold px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 rounded-lg transition">
                    Hoy
                </button>
                <button onClick={() => toolbar.onNavigate('NEXT')} className="p-1.5 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white">
                    <ChevronRightIcon className="w-4 h-4" />
                </button>
                <h2 className="text-white font-bold text-sm capitalize ml-1">{label}</h2>
            </div>
            <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                {[
                    { key: Views.MONTH, label: 'Mes' },
                    { key: Views.WEEK, label: 'Semana' },
                    { key: Views.DAY, label: 'Día' },
                ].map(v => (
                    <button
                        key={v.key}
                        onClick={() => toolbar.onView(v.key)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${toolbar.view === v.key
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {v.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

// ── Custom Event Renderer ───────────────────────────────────────────────────
const CustomEvent = ({ event }: any) => {
    if (event.type === 'gasto_fijo') {
        return (
            <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-2 py-1 rounded text-xs flex justify-between items-center h-full shadow-sm">
                <span className="truncate font-bold text-[11px]">{event.title}</span>
                <span className="text-[10px] opacity-70 flex items-center gap-1 ml-1 flex-shrink-0">
                    <BanknotesIcon className="w-3 h-3" />
                    ${Number(event.monto).toLocaleString('en-US', { notation: 'compact' })}
                </span>
            </div>
        );
    }

    if (event.type === 'pago_proveedor') {
        const esVencido = event.color === 'red';
        return (
            <div className={`border px-2 py-1 rounded text-[11px] flex justify-between items-center h-full shadow-sm ${esVencido ? 'bg-red-900/30 border-red-500/40 text-red-300' : 'bg-orange-900/20 border-orange-500/30 text-orange-300'
                }`}>
                <span className="truncate font-bold">💸 {event.title.replace('💸 ', '')}</span>
                {event.resource?.monto > 0 && (
                    <span className="text-[10px] opacity-80 ml-1 flex-shrink-0">
                        ${Number(event.resource.monto).toLocaleString('es-CO', { notation: 'compact' })}
                    </span>
                )}
            </div>
        );
    }

    if (event.type === 'proximo_cobro') {
        return (
            <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-2 py-1 rounded text-[11px] flex justify-between items-center h-full shadow-[0_0_8px_rgba(16,185,129,0.1)]">
                <span className="truncate font-bold">💰 {event.title}</span>
                {event.monto > 0 && (
                    <span className="text-[10px] ml-1 flex-shrink-0">
                        ${Number(event.monto).toLocaleString('en-US', { notation: 'compact' })}
                    </span>
                )}
            </div>
        );
    }

    if (event.type === 'cobro') {
        return (
            <div className="bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 px-2 py-1 rounded text-[11px] truncate h-full flex items-center">
                ✅ {event.title.replace('Pago: ', '')}
            </div>
        );
    }

    if (event.type === 'entrega') {
        return (
            <div className="bg-purple-900/30 border border-purple-500/30 text-purple-300 px-2 py-1 rounded text-[11px] truncate h-full flex items-center font-bold">
                🏁 {event.title}
            </div>
        );
    }

    // Tareas, notas, default
    const colorClass =
        event.color === 'purple' ? 'bg-purple-500/20 text-purple-200 border-purple-500/30' :
            event.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' :
                event.color === 'red' ? 'bg-red-500/20 text-red-200 border-red-500/30' :
                    'bg-indigo-500/15 text-indigo-200 border-indigo-500/25';

    const isCompleted = event.resource?.completada;

    return (
        <div className={`${colorClass} border px-2 py-1 rounded text-[11px] truncate h-full flex items-center gap-1 ${isCompleted ? 'opacity-50' : ''}`}>
            {isCompleted && <span>✓</span>}
            {event.title}
        </div>
    );
};

// ── Main Component ──────────────────────────────────────────────────────────
export default function CalendarBoard({ eventos, view, setView, date, onNavigate, onEventDrop, onSelectSlot, onSelectEvent }: Props) {

    const eventStyleGetter = (event: EventoCalendario) => {
        const e = event as any;

        if (e.type === 'pago_proveedor') {
            return {
                style: {
                    backgroundColor: e.color === 'red' ? '#7f1d1d' : '#431407',
                    borderRadius: '6px',
                    border: 'none',
                    borderLeft: `3px solid ${e.color === 'red' ? '#ef4444' : '#f97316'}`,
                    padding: '0',
                }
            };
        }

        if (e.type === 'gasto_fijo') {
            return { style: { backgroundColor: '#450a0a', borderRadius: '6px', border: 'none', borderLeft: '3px solid #dc2626', padding: '0' } };
        }
        if (e.type === 'proximo_cobro' || e.type === 'cobro') {
            return { style: { backgroundColor: '#052e16', borderRadius: '6px', border: 'none', borderLeft: '3px solid #16a34a', padding: '0' } };
        }
        if (e.type === 'entrega') {
            return { style: { backgroundColor: '#3b0764', borderRadius: '6px', border: 'none', borderLeft: '3px solid #9333ea', padding: '0' } };
        }

        const isCompleted = event.resource?.completada;
        const colorBase = event.resource?.colorOverride || CATEGORIAS_COLORS[event.resource?.categoria as string] || '#4f46e5';
        return {
            style: {
                backgroundColor: isCompleted ? '#27272A' : colorBase + '33',
                borderRadius: '6px',
                border: 'none',
                borderLeft: `3px solid ${isCompleted ? '#52525B' : colorBase}`,
                opacity: isCompleted ? 0.6 : 1,
                padding: '0',
            },
            className: event.resource?.className,
        };
    };

    return (
        <div className="flex-1 bg-[#0D1117] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden min-h-0">
            <DnDCalendar
                localizer={localizer}
                events={eventos}
                startAccessor={(event: any) => new Date(event.start)}
                endAccessor={(event: any) => new Date(event.end)}
                style={{ height: '100%' }}
                views={[Views.MONTH, Views.WEEK, Views.DAY]}
                view={view}
                onView={setView}
                date={date}
                onNavigate={onNavigate}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={onSelectEvent}
                onSelectSlot={onSelectSlot}
                selectable
                onEventDrop={onEventDrop}
                draggableAccessor={(event: any) => !event.resource?.es_automatico}
                step={30}
                timeslots={2}
                scrollToTime={new Date(1970, 1, 1, 8, 0, 0)}
                components={{ toolbar: CustomToolbar, event: CustomEvent }}
                messages={{ next: "›", previous: "‹", today: "Hoy", month: "Mes", week: "Semana", day: "Día", date: "Fecha", time: "Hora", event: "Evento" }}
            />
            <style jsx global>{`
                .rbc-calendar { font-family: 'Inter', sans-serif; color: #9CA3AF; background: transparent; }
                .rbc-toolbar { display: none; }
                .rbc-header { padding: 10px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6B7280; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
                .rbc-time-view, .rbc-month-view { border: none !important; background: transparent; }
                .rbc-timeslot-group { border-bottom: 1px solid rgba(255,255,255,0.03) !important; }
                .rbc-day-slot .rbc-time-slot { border-top: none; }
                .rbc-time-header-content { border-left: 1px solid rgba(255,255,255,0.05) !important; }
                .rbc-day-bg { border-left: 1px solid rgba(255,255,255,0.05) !important; transition: background 0.15s; }
                .rbc-day-bg:hover { background-color: rgba(255,255,255,0.015); }
                .rbc-current-time-indicator { background-color: #EF4444 !important; height: 2px !important; box-shadow: 0 0 8px rgba(239,68,68,0.6); }
                .rbc-month-row { border-bottom: 1px solid rgba(255,255,255,0.05); min-height: 80px; }
                .rbc-today { background-color: rgba(79,70,229,0.06) !important; }
                .rbc-date-cell { padding: 4px 6px; font-size: 11px; font-weight: 600; color: #9CA3AF; }
                .rbc-date-cell.rbc-now { color: #818cf8; }
                .rbc-off-range-bg { background-color: rgba(0,0,0,0.2); }

                /* ── Eventos: altura máxima en vista mes para que quepan varios ── */
                .rbc-event { background: transparent !important; padding: 1px 0 !important; border: none !important; box-shadow: none !important; max-height: 22px !important; overflow: hidden; }
                .rbc-month-view .rbc-event { max-height: 20px !important; margin-bottom: 1px; }
                .rbc-month-view .rbc-event-content { line-height: 1; }
                .rbc-month-view .rbc-event > div { padding: 1px 4px !important; font-size: 10px !important; }

                .rbc-event:focus { outline: none; }
                .rbc-event.rbc-selected { outline: none; }
                .rbc-show-more { font-size: 10px; color: #6366f1; font-weight: 700; background: rgba(99,102,241,0.1); padding: 1px 6px; border-radius: 4px; margin-top: 1px; display: block; }
                .rbc-time-gutter .rbc-timeslot-group { border: none; }
                .rbc-time-content { border-top: 1px solid rgba(255,255,255,0.05) !important; }
                .rbc-label { font-size: 10px; color: #4B5563; font-weight: 600; }
                .rbc-allday-cell { background: rgba(0,0,0,0.1); }
                .rbc-row-segment { padding: 0 1px 1px; }
                @keyframes pulse-yellow { 0%,100% { border-color: #EAB308; } 50% { border-color: transparent; } }
            `}</style>
        </div>
    );
}