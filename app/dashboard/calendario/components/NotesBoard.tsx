"use client";
import { PlusIcon, MapPinIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { PostIt, POSTIT_STYLES } from '../types';

interface Props {
    postIts: PostIt[];
    onAddClick: () => void;
    onDeleteNote: (id: string) => void;
}

export default function NotesBoard({ postIts, onAddClick, onDeleteNote }: Props) {
    return (
        <div className="w-full lg:w-[320px] bg-[#0F1115] border-l border-white/5 flex flex-col relative shadow-xl h-full">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            
            <div className="p-6 relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-lg font-bold text-white">Tablero de Ideas</h2>
                        <p className="text-xs text-gray-500">Notas rápidas</p>
                    </div>
                    <button onClick={onAddClick} className="p-2 bg-indigo-500/20 text-indigo-400 hover:text-white rounded-full hover:bg-indigo-500 transition border border-indigo-500/30">
                        <PlusIcon className="w-5 h-5"/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 px-1 pb-10">
                    {postIts.length === 0 ? (
                        <div className="text-center py-20 opacity-20">
                            <p className="text-5xl mb-3">📌</p>
                            <p className="text-sm font-bold">Vacío</p>
                        </div>
                    ) : (
                        postIts.map((nota) => (
                            <div 
                                key={nota.id} 
                                className={`relative p-5 w-full min-h-[140px] flex flex-col justify-center items-center text-center transition hover:scale-105 group cursor-default font-handwriting ${POSTIT_STYLES[nota.color]}`} 
                                style={{ 
                                    transform: `rotate(${nota.rotacion}deg)`,
                                    clipPath: "polygon(2% 0%, 100% 0%, 100% 98%, 98% 100%, 0% 100%, 0% 2%)" 
                                }}
                            >
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 drop-shadow-md">
                                    <MapPinIcon className="w-5 h-5 text-red-700 drop-shadow-sm opacity-90" />
                                </div>
                                <p className="text-lg leading-snug font-bold text-gray-800 break-words w-full px-2">
                                    {nota.texto}
                                </p>
                                <button onClick={() => onDeleteNote(nota.id)} className="absolute top-1 right-1 p-1 text-gray-500/30 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');
                .font-handwriting { font-family: 'Patrick Hand', cursive; }
            `}</style>
        </div>
    );
}