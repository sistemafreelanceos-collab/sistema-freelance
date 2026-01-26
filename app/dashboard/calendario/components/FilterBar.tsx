"use client";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

interface Props {
    filtros: { tareas: boolean; cobros: boolean };
    toggleFiltro: (key: 'tareas' | 'cobros') => void;
}

export default function FilterBar({ filtros, toggleFiltro }: Props) {
    const btnClass = (activo: boolean, color: string) => 
        `px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-2 ${
            activo ? `bg-${color}-500/20 text-${color}-300 border-${color}-500/50` : 'bg-transparent text-gray-500 border-white/10 hover:bg-white/5'
        }`;

    return (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => toggleFiltro('tareas')} className={btnClass(filtros.tareas, 'indigo')}>
                {filtros.tareas ? <EyeIcon className="w-3 h-3"/> : <EyeSlashIcon className="w-3 h-3"/>} Trabajo & Entregas
            </button>
            <button onClick={() => toggleFiltro('cobros')} className={btnClass(filtros.cobros, 'emerald')}>
                {filtros.cobros ? <EyeIcon className="w-3 h-3"/> : <EyeSlashIcon className="w-3 h-3"/>} Flujo de Caja
            </button>
        </div>
    );
}