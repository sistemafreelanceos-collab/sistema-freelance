"use client";
import { useState, useEffect } from "react";
import { CheckCircleIcon, PlayIcon, TrashIcon, StopIcon, ClockIcon, PencilIcon } from "@heroicons/react/24/solid";
import { EventoCalendario, CATEGORIAS_COLORS, POSTIT_STYLES, TipoNota } from '../../../../types';
import { CalendarPicker } from "../../../components/ui/CalendarPicker";
import { TimePicker } from "../../../components/ui/TimePicker";
import moment from "moment";

// --- MODAL CREAR ---
interface PropsCrear {
    isOpen: boolean; onClose: () => void; onSave: () => void;
    modalTipo: 'tarea' | 'postit'; setModalTipo: (t: 'tarea' | 'postit') => void;
    formulario: any; setFormulario: (f: any) => void;
    proyectos?: any[];
    esEdicion?: boolean; // Nuevo
}

export function ModalCrear({ isOpen, onClose, onSave, modalTipo, setModalTipo, formulario, setFormulario, proyectos = [], esEdicion = false }: PropsCrear) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-[#1C2128] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                <h3 className="text-white font-bold mb-4">{modalTipo === 'tarea' ? (esEdicion ? 'Editar Tarea' : 'Agendar Trabajo') : 'Pegar Nota'}</h3>
                <div className="flex bg-black/40 rounded-lg p-1 mb-4">
                    <button onClick={() => setModalTipo('tarea')} className={`flex-1 py-1 text-xs font-bold rounded ${modalTipo === 'tarea' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>Calendario</button>
                    <button onClick={() => setModalTipo('postit')} className={`flex-1 py-1 text-xs font-bold rounded ${modalTipo === 'postit' ? 'bg-yellow-500 text-black' : 'text-gray-400'}`}>Cartelera</button>
                </div>
                <input autoFocus placeholder={modalTipo === 'tarea' ? "Título..." : "Idea..."} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white mb-4 outline-none focus:border-indigo-500" value={formulario.titulo} onChange={e => setFormulario({ ...formulario, titulo: e.target.value })} />

                {modalTipo === 'tarea' ? (
                    <>
                        {/* FECHA */}
                        <div className="mb-4">
                            <CalendarPicker
                                date={formulario.fecha ? new Date(formulario.fecha + 'T00:00:00') : undefined}
                                setDate={(d) => setFormulario({ ...formulario, fecha: d ? moment(d).format("YYYY-MM-DD") : "" })}
                            />
                        </div>

                        {/* SELECTORES DE HORA */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <TimePicker
                                label="Hora Inicio"
                                value={formulario.hora || "09:00"}
                                onChange={(val) => setFormulario({ ...formulario, hora: val })}
                            />
                            <TimePicker
                                label="Hora Fin"
                                value={formulario.horaFin || "10:00"}
                                onChange={(val) => setFormulario({ ...formulario, horaFin: val })}
                            />
                        </div>

                        <div className="space-y-3 mb-6 mt-4">
                            <select className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm outline-none" value={formulario.proyectoId} onChange={e => setFormulario({ ...formulario, proyectoId: e.target.value })}>
                                <option value="" className="text-gray-500">-- Sin Proyecto (Opcional) --</option>
                                {proyectos.map((p: any) => <option key={p.id} value={p.id}>📂 {p.nombre}</option>)}
                            </select>
                            <select className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm outline-none" value={formulario.categoria} onChange={e => setFormulario({ ...formulario, categoria: e.target.value })}>
                                {Object.keys(CATEGORIAS_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </>
                ) : (
                    <div className="flex gap-2 justify-center mb-6">
                        {(['amarillo', 'rojo', 'azul', 'verde'] as TipoNota[]).map(c => <button key={c} onClick={() => setFormulario({ ...formulario, colorPostit: c })} className={`w-8 h-8 rounded-full border-2 transition ${POSTIT_STYLES[c].split(' ')[0]} ${formulario.colorPostit === c ? 'border-white scale-110' : 'border-transparent opacity-70'}`} />)}
                    </div>
                )}
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2 text-gray-500 hover:text-white">Cancelar</button>
                    <button onClick={onSave} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl font-bold">{esEdicion ? 'Actualizar' : 'Guardar'}</button>
                </div>
            </div>
        </div>
    );
}

// --- MODAL DETALLE CON CRONÓMETRO (ACTUALIZADO) ---
interface PropsDetalle {
    evento: EventoCalendario | null;
    onClose: () => void;
    onDelete: (id: string, tabla: string) => void;
    onComplete: () => void;
    onSaveSession: (seconds: number, completed: boolean) => void;
    onEdit: (evento: EventoCalendario) => void; // Nuevo
}

export function ModalDetalle({ evento, onClose, onDelete, onComplete, onSaveSession, onEdit }: PropsDetalle) {
    const [isTiming, setIsTiming] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [showSummary, setShowSummary] = useState(false);

    // Lógica del Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTiming) {
            interval = setInterval(() => setSeconds(s => s + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isTiming]);

    // Resetear al abrir nuevo evento
    const [prevEventoId, setPrevEventoId] = useState<string | undefined>(evento?.id);
    if (evento?.id !== prevEventoId) {
        setPrevEventoId(evento?.id);
        setIsTiming(false);
        setSeconds(0);
        setShowSummary(false);
    }
    if (!evento) return null;

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const handleStop = () => {
        setIsTiming(false);
        setShowSummary(true); // Mostrar resumen al detener
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in zoom-in-95">
            <div className="bg-[#1C2128] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>

                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold uppercase text-gray-400 bg-white/5 px-2 py-1 rounded">{evento.resource?.categoria}</span>
                    {evento.resource?.es_automatico && <span className="text-[10px] bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded">Automático</span>}
                </div>

                <h2 className={`text-2xl font-bold text-white mb-2 ${evento.resource?.completada ? 'line-through text-gray-500' : ''}`}>
                    {evento.title.replace('💸 ', '').replace('🚀 ', '').replace('✅ ', '')}
                </h2>

                <p className="text-gray-400 text-sm mb-6">{evento.resource?.descripcion || "Sin descripción"}</p>

                <div className="space-y-3">

                    {/* --- VISTA DE RESUMEN (AL DETENER) --- */}
                    {showSummary ? (
                        <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl text-center animate-in fade-in">
                            <p className="text-indigo-300 text-xs font-bold uppercase mb-1">Sesión Finalizada</p>
                            <div className="text-4xl font-mono font-bold text-white mb-4 tracking-wider">{formatTime(seconds)}</div>
                            <p className="text-white text-sm mb-3">¿Terminaste la tarea?</p>
                            <div className="flex gap-2">
                                <button onClick={() => { onSaveSession(seconds, false); onClose(); }} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-bold">No, guardar progreso</button>
                                <button onClick={() => { onSaveSession(seconds, true); onClose(); }} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold">Sí, completada</button>
                            </div>
                        </div>
                    ) : isTiming ? (
                        // --- VISTA CRONÓMETRO CORRIENDO ---
                        <div className="bg-indigo-600/10 border border-indigo-500/50 p-4 rounded-xl text-center animate-pulse">
                            <p className="text-indigo-300 text-xs mb-2 flex justify-center items-center gap-1"><ClockIcon className="w-3 h-3" /> Grabando tiempo...</p>
                            <div className="text-4xl font-mono font-bold text-white mb-4 tracking-wider">{formatTime(seconds)}</div>
                            <button
                                onClick={handleStop}
                                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-red-900/20"
                            >
                                <StopIcon className="w-5 h-5" /> Detener Sesión
                            </button>
                        </div>
                    ) : (
                        // --- VISTA NORMAL ---
                        <>
                            {!evento.resource?.completada && evento.resource?.tipo_evento !== 'gasto' && (
                                <button
                                    onClick={() => setIsTiming(true)}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-900/20"
                                >
                                    <PlayIcon className="w-5 h-5" /> Iniciar Cronómetro
                                </button>
                            )}

                            {evento.resource?.tipo_evento === 'tarea' && (
                                <div className="flex gap-2">
                                    <button onClick={onComplete} className={`flex-1 py-2 rounded-xl font-bold text-sm border transition ${evento.resource?.completada ? 'border-gray-600 text-gray-400' : 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10'}`}>
                                        {evento.resource?.completada ? "Reabrir Tarea" : "Marcar lista"}
                                    </button>
                                    <button onClick={() => onEdit(evento)} className="px-3 py-2 rounded-xl text-blue-400 border border-blue-500/20 hover:bg-blue-500/10" title="Editar"><PencilIcon className="w-5 h-5" /></button>
                                    <button onClick={() => onDelete(evento.id, 'tareas')} className="px-3 py-2 rounded-xl text-red-400 border border-red-500/20 hover:bg-red-500/10" title="Eliminar"><TrashIcon className="w-5 h-5" /></button>
                                </div>
                            )}
                        </>
                    )}

                    {evento.resource?.tipo_evento === 'gasto' && (
                        <div className="text-center text-xs text-gray-500 bg-black/30 p-3 rounded-lg">Gestionar en <strong className="text-gray-300">Finanzas</strong>.</div>
                    )}
                </div>
            </div>
        </div>
    );
}