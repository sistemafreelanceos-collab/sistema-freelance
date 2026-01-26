"use client";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { PostIt, POSTIT_STYLES } from '../types';

interface Props {
    postIts: PostIt[];
    onAddClick: () => void;
    onDeleteNote: (id: string) => void;
}

export default function NotesBoard({ postIts, onAddClick, onDeleteNote }: Props) {
    return (
        <div className="w-full lg:w-[340px] bg-[#121212] border-l border-white/5 flex flex-col relative shadow-2xl h-full z-20">
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
                        <PlusIcon className="w-5 h-5"/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 px-2 pb-10">
                    {postIts.length === 0 ? (
                        <div className="text-center py-20 flex flex-col items-center opacity-40">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <span className="text-3xl">📌</span>
                            </div>
                            <p className="text-sm font-medium text-gray-300">Tu muro está vacío</p>
                            <p className="text-xs text-gray-500 mt-1">Agrega una nota rápida</p>
                        </div>
                    ) : (
                        postIts.map((nota) => (
                            <div 
                                key={nota.id} 
                                className={`relative p-5 w-full min-h-[120px] shadow-xl transition-transform duration-300 hover:scale-[1.02] group cursor-default ${POSTIT_STYLES[nota.color]}`} 
                                style={{ 
                                    transform: `rotate(${nota.rotacion}deg)`,
                                    fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif', // Fuente manual fallback
                                }}
                            >
                                {/* CINTA ADHESIVA (Tape Effect) */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/20 blur-[1px] rotate-[-2deg] shadow-sm pointer-events-none"></div>

                                <p className="text-lg leading-snug text-gray-800 break-words w-full font-medium">
                                    {nota.texto}
                                </p>
                                
                                <div className="absolute bottom-2 right-2 text-[10px] opacity-50 font-bold uppercase tracking-widest text-black/40">
                                    {new Date(nota.fecha).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                </div>

                                <button onClick={() => onDeleteNote(nota.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}