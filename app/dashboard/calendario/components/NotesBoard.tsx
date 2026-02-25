import { useState, useEffect } from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { PostIt, POSTIT_STYLES } from '../../../../types';

interface Props {
    postIts: PostIt[];
    onAddClick: () => void;
    onDeleteNote: (id: string) => void;
    onEdit: (nota: PostIt) => void; // Nuevo
}

export default function NotesBoard({ postIts, onAddClick, onDeleteNote, onEdit }: Props) {
    // Estado local para DnD visual (ordenamiento temporal)
    const [notes, setNotes] = useState<PostIt[]>(postIts);
    const [draggedItem, setDraggedItem] = useState<number | null>(null);

    // Sincronizar props con estado local
    useEffect(() => { setNotes(postIts); }, [postIts]);

    // Función para calcular "Envejecimiento"
    const getAgingStyle = (fechaStr: string) => {
        const dias = Math.floor((new Date().getTime() - new Date(fechaStr).getTime()) / (1000 * 3600 * 24));
        let style = "animate-breeze "; // All notes swing softly

        if (dias > 15) {
            // Muy antiguo: Se despega más y proyecta más sombra
            style += " shadow-[10px_10px_20px_rgba(0,0,0,0.4)] opacity-90";
        } else if (dias > 7) {
            // Medio antiguo: Un poco transparente
            style += " opacity-95";
        }
        return style;
    };

    // Handlers DnD
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedItem === null || draggedItem === index) return;

        // Reordenar localmente
        const newNotes = [...notes];
        const item = newNotes[draggedItem];
        newNotes.splice(draggedItem, 1);
        newNotes.splice(index, 0, item);

        setNotes(newNotes);
        setDraggedItem(index);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        // Aquí podríamos guardar el orden si hubiera campo 'orden' en BD
    };

    return (
        <div className="w-full bg-[#121212] border-l border-white/5 flex flex-col relative shadow-2xl h-full z-20">
            {/* Fondo Corcho Oscuro */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}>
            </div>

            <div className="p-6 relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-wide">Muro de Ideas</h2>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Recordatorios</p>
                    </div>
                    <button onClick={onAddClick} className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-900/20 transition-all hover:scale-105 active:scale-95">
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 px-2 pb-10">
                    {notes.length === 0 ? (
                        <div className="text-center py-20 flex flex-col items-center opacity-40">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <span className="text-3xl">📌</span>
                            </div>
                            <p className="text-sm font-medium text-gray-300">Tu muro está vacío</p>
                            <p className="text-xs text-gray-500 mt-1">Agrega una nota rápida</p>
                        </div>
                    ) : (
                        notes.map((nota, index) => (
                            <div
                                key={nota.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                onClick={() => onEdit(nota)}
                                style={{
                                    transform: `rotate(${nota.rotacion}deg)`,
                                    transformOrigin: 'top center', // Anclado al pin superior
                                    animationDelay: `${Math.random() * 2}s`, // Para que no todas se muevan al mismo tiempo
                                    fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif',
                                }}
                                className={`relative p-5 w-full min-h-[120px] shadow-xl transition-all duration-300 hover:scale-[1.02] hover:z-20 cursor-grab active:cursor-grabbing group ${POSTIT_STYLES[nota.color]} ${getAgingStyle(nota.fecha)}`}
                            >
                                {/* PIN (Metallic Custom SVG) */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 pointer-events-none z-10 drop-shadow-md flex justify-center items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-full h-full drop-shadow-sm">
                                        {/* Sombra base del pin */}
                                        <ellipse cx="12" cy="20" rx="3" ry="1" fill="rgba(0,0,0,0.2)" />
                                        {/* Aguja Metálica */}
                                        <path d="M12 10 L12 20" stroke="#718096" strokeWidth="1.5" strokeLinecap="round" />
                                        {/* Cabeza del Pin (Color dinámico para variar) */}
                                        <path d="M8 4 Q12 1 16 4 L14 10 L10 10 Z" className="fill-red-500" />
                                        {/* Brillo Superior */}
                                        <path d="M10 3.5 Q12 2 14 3.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1" fill="none" />
                                        {/* Anillo Base (Tope plástico) */}
                                        <rect x="9" y="10" width="6" height="2" rx="1" className="fill-red-700" />
                                    </svg>
                                </div>

                                {/* MANCHA (Si es viejo +15d) */}
                                {new Date().getTime() - new Date(nota.fecha).getTime() > 1296000000 && (
                                    <div className="absolute bottom-0 right-0 w-16 h-16 bg-yellow-900/10 rounded-full blur-xl pointer-events-none"></div>
                                )}

                                <p className="text-lg leading-snug text-gray-800 break-words w-full font-medium select-none">
                                    {nota.texto}
                                </p>

                                <div className="absolute bottom-2 right-2 text-[10px] opacity-50 font-bold uppercase tracking-widest text-black/40">
                                    {new Date(nota.fecha).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>

                                {/* Botón Cerrar Mejorado */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteNote(nota.id); }}
                                    className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:bg-red-500 z-30"
                                    title="Eliminar Nota"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <style jsx global>{`
                @keyframes breeze {
                    0% { transform: rotate(-1deg); }
                    50% { transform: rotate(1deg); }
                    100% { transform: rotate(-1deg); }
                }
                .animate-breeze {
                    animation: breeze 4s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}