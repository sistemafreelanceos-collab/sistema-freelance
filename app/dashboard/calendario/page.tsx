"use client";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useCalendario } from "../../hooks/useCalendario";
import { Views } from 'react-big-calendar';
import moment from 'moment';
import { PlusIcon, ArrowDownTrayIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";
import { TipoNota, EventoCalendario } from "../../../types";

import CalendarBoard from "./components/CalendarBoard";
import NotesBoard from "./components/NotesBoard";
import IncomingPayments from "./components/IncomingPayments";
import DailyCapacity from "./components/DailyCapacity";
import FilterBar from "./components/FilterBar";
import { ModalCrear, ModalDetalle } from "./components/ModalesCalendario";
import EventNotifier from "./components/EventNotifier"; // Nuevo
import { BellAlertIcon } from "@heroicons/react/24/solid";
import SkeletonDashboard from "../components/SkeletonDashboard";

export default function CalendarioPage() {
    const {
        loading, eventosDB, postIts, proyectosRaw, proyectosList,
        guardarTarea, editarTarea, guardarNota, editarNota, borrarItem, completarTarea, updateTaskDate, saveSession, syncGoogle
    } = useCalendario();

    // Estados UI Local
    const [view, setView] = useState(Views.MONTH);
    const [date, setDate] = useState(new Date());
    const [filtros, setFiltros] = useState({ tareas: true, cobros: true });

    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalTipo, setModalTipo] = useState<'tarea' | 'postit'>('tarea');
    const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoCalendario | null>(null);
    const [eventoAEditar, setEventoAEditar] = useState<string | null>(null); // ID del evento a editar
    const [alarmEvent, setAlarmEvent] = useState<EventoCalendario | null>(null); // Evento sonando

    // Listener para Alarma
    useEffect(() => {
        const handleAlarm = (e: any) => {
            setAlarmEvent(e.detail);
            const audio = new Audio('/alarm.mp3'); // Opcional: si existe
            audio.play().catch(() => { }); // Ignorar error si no hay audio
        };
        window.addEventListener('calendar-alarm', handleAlarm);
        return () => window.removeEventListener('calendar-alarm', handleAlarm);
    }, []);

    const [formulario, setFormulario] = useState({
        titulo: "", descripcion: "", fecha: "", hora: "09:00", categoria: "Diseño" as string, colorPostit: "amarillo" as TipoNota, proyectoId: "", recurrente: false
    });

    const onNavigate = useCallback((newDate: Date) => setDate(newDate), [setDate]);

    // Filtros UI
    const eventosVisibles = useMemo(() => {
        let lista = [...eventosDB];
        if (!filtros.tareas) lista = lista.filter(e => e.resource?.tipo_evento !== 'tarea' && e.resource?.tipo_evento !== 'proyecto');
        if (!filtros.cobros) lista = lista.filter(e => e.resource?.tipo_evento !== 'cobro' && e.resource?.tipo_evento !== 'gasto');
        return lista;
    }, [eventosDB, filtros]);

    // Handlers
    const handleGuardar = async () => {
        if (!formulario.titulo && modalTipo === 'tarea') return toast.warning("Falta título");

        if (modalTipo === 'tarea') {
            if (eventoAEditar) {
                await editarTarea(eventoAEditar, formulario);
            } else {
                await guardarTarea(formulario, formulario.recurrente);
            }
        } else {
            if (!formulario.titulo) return toast.warning("Nota vacía");
            if (eventoAEditar) {
                await editarNota(eventoAEditar, formulario.titulo, formulario.colorPostit);
            } else {
                await guardarNota(formulario.titulo, formulario.colorPostit);
            }
        }
        setModalAbierto(false);
        setEventoAEditar(null); // Reset
    };

    const handleEditar = (evento: EventoCalendario) => {
        setEventoAEditar(evento.id);
        const fecha = moment(evento.start).format('YYYY-MM-DD');
        const hora = moment(evento.start).format('HH:mm');

        setFormulario({
            titulo: evento.title.replace(/FOLDER|📂 /g, '').split(': ')[1] || evento.title, // Limpieza básica
            descripcion: evento.resource?.descripcion || "",
            fecha,
            hora,
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
            titulo: nota.texto, // En notas usamos 'titulo' del form como texto
            descripcion: "",
            fecha: new Date().toISOString().split('T')[0],
            hora: "",
            categoria: "",
            colorPostit: nota.color,
            proyectoId: "",
            recurrente: false
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
        if (event.resource.es_automatico) {
            toast.warning("Los eventos automáticos no se pueden mover");
            return;
        }
        toast.promise(updateTaskDate(event.id, start), {
            loading: 'Actualizando hora...',
            success: 'Evento reprogramado',
            error: 'Error al mover evento'
        });
    }, [updateTaskDate]);

    const descargarICS = () => { toast.info("Exportación iCal - Próximamente"); };

    if (loading) return <SkeletonDashboard />;

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col lg:flex-row overflow-hidden bg-[#0D1117]">
            <div className="flex-1 p-6 flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-end mb-4">
                    <div><h1 className="text-3xl font-bold text-white">Agenda Operativa</h1><p className="text-gray-400 text-sm">Finanzas, Proyectos y Tiempo.</p></div>
                    <div className="flex gap-2">
                        <button onClick={() => syncGoogle(false)} className="bg-white/5 text-gray-400 px-3 py-2 rounded-lg hover:text-white hover:bg-[#DB4437]/20 transition flex items-center gap-2" title="Sincronizar Google Calendar">
                            <ArrowPathIcon className="w-5 h-5 text-[#DB4437]" />
                            <span className="text-xs font-medium text-[#DB4437] hidden sm:inline">Sync Google</span>
                        </button>
                        <button onClick={descargarICS} className="bg-white/5 text-gray-400 px-3 py-2 rounded-lg hover:text-white transition" title="Exportar iCal"><ArrowDownTrayIcon className="w-5 h-5" /></button>
                        <button onClick={() => { setFormulario({ titulo: "", descripcion: "", fecha: new Date().toISOString().split('T')[0], hora: "09:00", categoria: "Diseño", colorPostit: "amarillo" as TipoNota, proyectoId: "", recurrente: false }); setModalTipo('tarea'); setEventoAEditar(null); setModalAbierto(true); }} className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm hover:scale-105 transition shadow-lg flex items-center gap-2"><PlusIcon className="w-4 h-4" /> Agendar</button>
                    </div>
                </div>

                <FilterBar filtros={filtros} toggleFiltro={(k) => setFiltros(prev => ({ ...prev, [k]: !prev[k] }))} />

                <CalendarBoard
                    eventos={eventosVisibles} view={view} setView={setView} date={date} onNavigate={onNavigate} onEventDrop={onEventDrop} onSelectEvent={setEventoSeleccionado}
                    onSelectSlot={(slot) => { const dateStr = moment(slot.start).format('YYYY-MM-DD'); setFormulario(prev => ({ ...prev, fecha: dateStr, hora: "09:00", titulo: "", proyectoId: "", recurrente: false })); setModalTipo('tarea'); setModalAbierto(true); }}
                />
            </div>

            <div className="w-full lg:w-[350px] bg-[#121418] border-l border-white/10 flex flex-col h-full overflow-y-auto custom-scrollbar">
                <div id="tour-calendar-capacity" className="px-6 pt-6"><DailyCapacity eventos={eventosVisibles} fechaSeleccionada={eventoSeleccionado ? eventoSeleccionado.start : date} /></div>
                <NotesBoard postIts={postIts} onAddClick={() => { setFormulario({ titulo: "", descripcion: "", fecha: "", hora: "", categoria: "", colorPostit: "amarillo" as TipoNota, proyectoId: "", recurrente: false }); setModalTipo('postit'); setEventoAEditar(null); setModalAbierto(true); }} onDeleteNote={(id) => handleBorrar(id, 'notas_calendario')} onEdit={handleEditarNota} />
                <div className="px-6 pb-6"><IncomingPayments proyectos={proyectosRaw} /></div>
            </div>

            <ModalCrear isOpen={modalAbierto} onClose={() => { setModalAbierto(false); setEventoAEditar(null); }} onSave={handleGuardar} modalTipo={modalTipo} setModalTipo={setModalTipo} formulario={formulario} setFormulario={setFormulario} proyectos={proyectosList} esEdicion={!!eventoAEditar} />
            <ModalDetalle evento={eventoSeleccionado} onClose={() => setEventoSeleccionado(null)} onDelete={handleBorrar} onComplete={handleCompletar} onSaveSession={handleSaveSession} onEdit={handleEditar} />

            <EventNotifier eventos={eventosDB} />

            {/* Modal Alarma */}
            {alarmEvent && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] animate-in zoom-in">
                    <div className="bg-[#1C2128] border border-red-500/50 p-8 rounded-2xl max-w-md w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                        <BellAlertIcon className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
                        <h2 className="text-3xl font-bold text-white mb-2">{alarmEvent.title}</h2>
                        <p className="text-xl text-gray-400 mb-6">¡Es hora de comenzar!</p>
                        <button onClick={() => setAlarmEvent(null)} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl text-lg transition shadow-lg">Entendido</button>
                    </div>
                </div>
            )}
        </div>
    );
}