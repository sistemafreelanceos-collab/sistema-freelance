"use client";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useCalendario } from "../../hooks/useCalendario";
import { Views } from 'react-big-calendar';
import moment from 'moment';
import { PlusIcon, ArrowDownTrayIcon, BellAlertIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";
import { TipoNota, EventoCalendario } from "../../../types";

import CalendarBoard from "./components/CalendarBoard";
import NotesBoard from "./components/NotesBoard";
import TodayPanel from "./components/TodayPanel";
import FilterBar, { FiltrosCalendario } from "./components/FilterBar";
import { ModalCrear, ModalDetalle } from "./components/ModalesCalendario";
import EventNotifier from "./components/EventNotifier";
import SkeletonDashboard from "../components/SkeletonDashboard";

export default function CalendarioPage() {
    // ── Vista y navegación ────────────────────────────────────────────
    const [view, setView] = useState(Views.WEEK); // Semana como default
    const [date, setDate] = useState(new Date());

    const {
        loading, eventosDB, postIts, proyectosRaw,
        guardarTarea, editarTarea, guardarNota, editarNota, borrarItem, completarTarea, updateTaskDate, saveSession
    } = useCalendario(date) as any;

    // ── Filtros ────────────────────────────────────────────────────────
    const [filtros, setFiltros] = useState<FiltrosCalendario>({
        tareas: true,
        cobros: true,
        proveedores: true,
        soloUrgentes: false,
        solohoy: false,
    });

    const toggleFiltro = (key: keyof FiltrosCalendario) =>
        setFiltros(prev => ({ ...prev, [key]: !prev[key] }));

    // ── Modales ────────────────────────────────────────────────────────
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalTipo, setModalTipo] = useState<'tarea' | 'postit'>('tarea');
    const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoCalendario | null>(null);
    const [eventoAEditar, setEventoAEditar] = useState<string | null>(null);
    const [alarmEvent, setAlarmEvent] = useState<EventoCalendario | null>(null);

    const [formulario, setFormulario] = useState({
        titulo: "", descripcion: "", fecha: "", hora: "09:00",
        categoria: "Diseño" as string, colorPostit: "amarillo" as TipoNota,
        proyectoId: "", recurrente: false
    });

    // ── Alarma ────────────────────────────────────────────────────────
    useEffect(() => {
        const handleAlarm = (e: any) => {
            setAlarmEvent(e.detail);
            new Audio('/alarm.mp3').play().catch(() => { });
        };
        window.addEventListener('calendar-alarm', handleAlarm);
        return () => window.removeEventListener('calendar-alarm', handleAlarm);
    }, []);

    const onNavigate = useCallback((newDate: Date) => setDate(newDate), []);

    // ── Filtrado de eventos ───────────────────────────────────────────
    const HOY_STR = useMemo(() => moment().format('YYYY-MM-DD'), []);

    const eventosVisibles = useMemo(() => {
        let lista = [...eventosDB];

        // Filtros de tipo
        if (!filtros.tareas) {
            lista = lista.filter(e => {
                const tipo = (e as any).type;
                return !['tarea', 'entrega'].includes(tipo) && e.resource?.tipo_evento !== 'tarea' && e.resource?.tipo_evento !== 'proyecto';
            });
        }
        if (!filtros.cobros) {
            lista = lista.filter(e => {
                const tipo = (e as any).type;
                return !['cobro', 'proximo_cobro', 'gasto_fijo'].includes(tipo);
            });
        }
        if (!filtros.proveedores) {
            lista = lista.filter(e => (e as any).type !== 'pago_proveedor');
        }

        // Filtros rápidos
        if (filtros.solohoy) {
            lista = lista.filter(e => {
                try { return moment(e.start).format('YYYY-MM-DD') === HOY_STR; }
                catch { return false; }
            });
        }
        if (filtros.soloUrgentes) {
            lista = lista.filter(e => {
                // Solo eventos de pago/cobro dentro de 7 días
                const tipo = (e as any).type;
                const isPago = ['pago_proveedor', 'gasto_fijo', 'proximo_cobro', 'cobro'].includes(tipo);
                if (!isPago) return true; // mantener tareas siempre
                try {
                    const diff = moment(e.start).diff(moment(), 'days');
                    return diff >= -1 && diff <= 7;
                } catch { return false; }
            });
        }

        return lista;
    }, [eventosDB, filtros, HOY_STR]);

    // Proyectos de proveedor filtrados del calendario (para TodayPanel)
    const pagosProveedores = useMemo(() =>
        eventosDB
            .filter((e: any) => e.type === 'pago_proveedor')
            .map((e: any) => ({
                id: e.id,
                nombre: e.title.replace('💸 ', ''),
                monto: e.resource?.monto || 0,
                moneda: e.resource?.moneda || 'USD',
                fecha_pago: moment(e.start).format('YYYY-MM-DD'),
            })),
        [eventosDB]
    );

    // ── Handlers ──────────────────────────────────────────────────────
    const handleGuardar = async () => {
        if (!formulario.titulo && modalTipo === 'tarea') return toast.warning("Falta título");
        if (modalTipo === 'tarea') {
            if (eventoAEditar) await editarTarea(eventoAEditar, formulario);
            else await guardarTarea(formulario, formulario.recurrente);
        } else {
            if (!formulario.titulo) return toast.warning("Nota vacía");
            if (eventoAEditar) await editarNota(eventoAEditar, formulario.titulo, formulario.colorPostit);
            else await guardarNota(formulario.titulo, formulario.colorPostit);
        }
        setModalAbierto(false);
        setEventoAEditar(null);
    };

    const handleEditar = (evento: EventoCalendario) => {
        setEventoAEditar(evento.id);
        setFormulario({
            titulo: evento.title.replace(/FOLDER|📂 /g, '').split(': ')[1] || evento.title,
            descripcion: evento.resource?.descripcion || "",
            fecha: moment(evento.start).format('YYYY-MM-DD'),
            hora: moment(evento.start).format('HH:mm'),
            categoria: evento.resource?.categoria || "General",
            colorPostit: "amarillo",
            proyectoId: evento.resource?.projectId || "",
            recurrente: false
        });
        setModalTipo('tarea');
        setEventoSeleccionado(null);
        setModalAbierto(true);
    };

    const handleEditarNota = (nota: any) => {
        setEventoAEditar(nota.id);
        setFormulario({
            titulo: nota.texto, descripcion: "", fecha: moment().format('YYYY-MM-DD'),
            hora: "", categoria: "", colorPostit: nota.color, proyectoId: "", recurrente: false
        });
        setModalTipo('postit');
        setModalAbierto(true);
    };

    const handleBorrar = async (id: string, tabla: string) => {
        await borrarItem(id, tabla);
        if (tabla === 'tareas') setEventoSeleccionado(null);
    };

    const handleCompletar = async () => {
        if (!eventoSeleccionado) return;
        await completarTarea(eventoSeleccionado.id, eventoSeleccionado.resource?.completada);
        setEventoSeleccionado(null);
    };

    const handleSaveSession = async (seconds: number, completed: boolean) => {
        if (!eventoSeleccionado) return;
        await saveSession(seconds, completed, eventoSeleccionado);
        setEventoSeleccionado(null);
    };

    const onEventDrop = useCallback(async ({ event, start }: any) => {
        if (event.resource?.es_automatico) {
            toast.warning("Los eventos automáticos no se pueden mover");
            return;
        }
        toast.promise(updateTaskDate(event.id, start), {
            loading: 'Actualizando...', success: 'Evento movido', error: 'Error al mover'
        });
    }, [updateTaskDate]);

    const abrirNuevaTarea = (fecha?: string) => {
        setFormulario({
            titulo: "", descripcion: "", fecha: fecha || moment().format('YYYY-MM-DD'),
            hora: "09:00", categoria: "Diseño", colorPostit: "amarillo" as TipoNota, proyectoId: "", recurrente: false
        });
        setModalTipo('tarea');
        setEventoAEditar(null);
        setModalAbierto(true);
    };

    if (loading) return <SkeletonDashboard />;

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col lg:flex-row overflow-hidden bg-[#0D1117]">
            {/* ── Calendario principal ─────────────────────────────── */}
            <div className="flex-1 p-4 flex flex-col h-full overflow-hidden gap-3">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Agenda</h1>
                        <p className="text-gray-500 text-xs">{moment().format('dddd, D [de] MMMM [de] YYYY')}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => toast.info("Exportación iCal — Próximamente")}
                            className="p-2 bg-white/5 text-gray-400 rounded-lg hover:text-white hover:bg-white/10 transition"
                            title="Exportar iCal"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => abrirNuevaTarea()}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold text-sm hover:scale-105 transition shadow-lg shadow-indigo-900/30 flex items-center gap-2"
                        >
                            <PlusIcon className="w-4 h-4" /> Agendar
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <FilterBar filtros={filtros} toggleFiltro={toggleFiltro} />

                {/* Calendario */}
                <CalendarBoard
                    eventos={eventosVisibles}
                    view={view}
                    setView={setView}
                    date={date}
                    onNavigate={onNavigate}
                    onEventDrop={onEventDrop}
                    onSelectEvent={setEventoSeleccionado}
                    onSelectSlot={(slot: any) => {
                        abrirNuevaTarea(moment(slot.start).format('YYYY-MM-DD'));
                    }}
                />
            </div>

            {/* ── Sidebar derecho ──────────────────────────────────── */}
            <div className="w-full lg:w-[300px] border-l border-white/10 flex flex-col h-full overflow-y-auto">
                {/* Today Panel */}
                <TodayPanel
                    eventos={eventosDB}
                    proyectosRaw={proyectosRaw}
                    pagosProveedores={pagosProveedores}
                />

                {/* Post-its */}
                <div className="border-t border-white/10">
                    <NotesBoard
                        postIts={postIts}
                        onAddClick={() => {
                            setFormulario({ titulo: "", descripcion: "", fecha: "", hora: "", categoria: "", colorPostit: "amarillo" as TipoNota, proyectoId: "", recurrente: false });
                            setModalTipo('postit');
                            setEventoAEditar(null);
                            setModalAbierto(true);
                        }}
                        onDeleteNote={(id) => handleBorrar(id, 'notas_calendario')}
                        onEdit={handleEditarNota}
                    />
                </div>
            </div>

            {/* ── Modales ──────────────────────────────────────────── */}
            <ModalCrear
                isOpen={modalAbierto}
                onClose={() => { setModalAbierto(false); setEventoAEditar(null); }}
                onSave={handleGuardar}
                modalTipo={modalTipo}
                setModalTipo={setModalTipo}
                formulario={formulario}
                setFormulario={setFormulario}
                proyectos={[]}
                esEdicion={!!eventoAEditar}
            />
            <ModalDetalle
                evento={eventoSeleccionado}
                onClose={() => setEventoSeleccionado(null)}
                onDelete={handleBorrar}
                onComplete={handleCompletar}
                onSaveSession={handleSaveSession}
                onEdit={handleEditar}
            />
            <EventNotifier eventos={eventosDB} />

            {/* Alarma */}
            {alarmEvent && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] animate-in zoom-in">
                    <div className="bg-[#1C2128] border border-red-500/50 p-8 rounded-2xl max-w-md w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                        <BellAlertIcon className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
                        <h2 className="text-3xl font-bold text-white mb-2">{alarmEvent.title}</h2>
                        <p className="text-xl text-gray-400 mb-6">¡Es hora de comenzar!</p>
                        <button onClick={() => setAlarmEvent(null)} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl text-lg transition shadow-lg">
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}