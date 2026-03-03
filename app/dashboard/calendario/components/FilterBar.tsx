"use client";

export type FiltrosCalendario = {
    tareas: boolean;
    cobros: boolean;
    proveedores: boolean;
    soloUrgentes: boolean;
    solohoy: boolean;
};

interface Props {
    filtros: FiltrosCalendario;
    toggleFiltro: (key: keyof FiltrosCalendario) => void;
}

const PILL = (activo: boolean, color: string) =>
    `px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 whitespace-nowrap ${activo
        ? `bg-${color}-500/20 text-${color}-300 border-${color}-500/40`
        : "bg-transparent text-gray-600 border-white/10 hover:text-gray-300 hover:bg-white/5"
    }`;

export default function FilterBar({ filtros, toggleFiltro }: Props) {
    return (
        <div className="flex flex-wrap gap-2 mb-4">
            {/* Tipo de evento */}
            <button onClick={() => toggleFiltro("tareas")} className={PILL(filtros.tareas, "indigo")}>
                <span>📋</span> Tareas & Entregas
            </button>
            <button onClick={() => toggleFiltro("cobros")} className={PILL(filtros.cobros, "emerald")}>
                <span>💰</span> Cobros
            </button>
            <button onClick={() => toggleFiltro("proveedores")} className={PILL(filtros.proveedores, "orange")}>
                <span>💸</span> Pagos Proveedores
            </button>

            {/* Separador */}
            <div className="w-px bg-white/10 self-stretch mx-1" />

            {/* Filtros rápidos */}
            <button onClick={() => toggleFiltro("solohoy")} className={PILL(filtros.solohoy, "yellow")}>
                <span>☀️</span> Hoy
            </button>
            <button onClick={() => toggleFiltro("soloUrgentes")} className={PILL(filtros.soloUrgentes, "red")}>
                <span>🚨</span> Urgentes ≤7d
            </button>
        </div>
    );
}