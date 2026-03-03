"use client";
import { useMemo } from "react";
import {
    PencilIcon,
    TrashIcon,
    BanknotesIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    WalletIcon,
    ScaleIcon,
    SparklesIcon,
} from "@heroicons/react/24/solid";
import { Movimiento, GastoFijo, ConfigFinanzas, Presupuesto } from "../../../../types";
import CFOVirtual from "./CFOVirtual";

interface Props {
    movimientos: Movimiento[];
    gastosFijos: GastoFijo[];
    config: ConfigFinanzas;
    saldoActual: number;
    cuentas: any[];
    presupuestos: Presupuesto[];
    onUpdateConfig: (key: string, val: number) => void;
    onOpenModal: () => void;
    onEdit: (mov: Movimiento) => void;
    onDelete: (id: string) => void;
}

// Colores para cuentas en orden rotativo
const CUENTA_COLORS = [
    "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    "bg-pink-500/20 text-pink-300 border-pink-500/30",
    "bg-purple-500/20 text-purple-300 border-purple-500/30",
    "bg-blue-500/20 text-blue-300 border-blue-500/30",
];

const CUENTA_DOT = [
    "bg-indigo-400", "bg-emerald-400", "bg-yellow-400",
    "bg-pink-400", "bg-purple-400", "bg-blue-400",
];

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export default function TableroTab({ movimientos, gastosFijos, saldoActual, onOpenModal, onEdit, onDelete, config, cuentas, presupuestos }: Props & { config: ConfigFinanzas & { meta_moneda?: string; meta_ingresos_mensuales?: number } }) {

    const formatDate = (fechaString: string) => {
        if (!fechaString) return "—";
        const [anio, mes, dia] = fechaString.split('-');
        return `${dia}/${mes}/${anio}`;
    };

    const { resumen, movimientosRecientes, topGastos, mesAnteriorResumen } = useMemo(() => {
        const hoy = new Date();
        const mesActual = hoy.getMonth();
        const anioActual = hoy.getFullYear();
        const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
        const anioMesAnterior = mesActual === 0 ? anioActual - 1 : anioActual;

        // Movimientos de este mes
        const movsMes = movimientos.filter(m => {
            const [y, mn] = m.fecha.split('-').map(Number);
            return (mn - 1) === mesActual && y === anioActual;
        });

        // Movimientos del mes anterior (para comparativa)
        const movsAnterior = movimientos.filter(m => {
            const [y, mn] = m.fecha.split('-').map(Number);
            return (mn - 1) === mesAnterior && y === anioMesAnterior;
        });

        const sumar = (movs: Movimiento[], tipo: string) =>
            movs.filter(m => m.tipo === tipo || (tipo === 'gasto' && m.tipo === 'egreso'))
                .reduce((s, m) => s + m.monto, 0);

        const ingresosActual = sumar(movsMes, 'ingreso');
        const gastosActual = sumar(movsMes, 'gasto');
        const ingresosAnterior = sumar(movsAnterior, 'ingreso');
        const gastosAnterior = sumar(movsAnterior, 'gasto');

        // Neto
        const netoActual = ingresosActual - gastosActual;

        // Por moneda (para mostrar desagregado)
        const ingresosPorMoneda: Record<string, number> = {};
        const gastosPorMoneda: Record<string, number> = {};
        movsMes.forEach(m => {
            const mon = m.moneda || 'USD';
            if (m.tipo === 'ingreso') ingresosPorMoneda[mon] = (ingresosPorMoneda[mon] || 0) + m.monto;
            else if (m.tipo === 'gasto' || m.tipo === 'egreso') gastosPorMoneda[mon] = (gastosPorMoneda[mon] || 0) + m.monto;
        });

        // Top 3 categorías de gasto
        const porCategoria: Record<string, number> = {};
        movsMes.filter(m => m.tipo === 'gasto' || m.tipo === 'egreso').forEach(m => {
            const cat = m.categoria || 'Otros';
            porCategoria[cat] = (porCategoria[cat] || 0) + m.monto;
        });
        const topGastos = Object.entries(porCategoria)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

        // Comparativas %
        const pctIngresos = ingresosAnterior > 0 ? ((ingresosActual - ingresosAnterior) / ingresosAnterior * 100) : null;
        const pctGastos = gastosAnterior > 0 ? ((gastosActual - gastosAnterior) / gastosAnterior * 100) : null;

        return {
            resumen: { ingresosActual, gastosActual, netoActual, ingresosPorMoneda, gastosPorMoneda },
            movimientosRecientes: movimientos.slice(0, 10),
            topGastos,
            mesAnteriorResumen: { pctIngresos, pctGastos, mesNombre: MESES[mesAnterior] },
        };
    }, [movimientos, gastosFijos, saldoActual]);

    const moneda = config?.meta_moneda || 'USD';
    const metaIngresos = (config as any)?.meta_ingresos_mensuales || 0;
    const pctMeta = metaIngresos > 0 ? Math.min(100, Math.round((resumen.ingresosActual / metaIngresos) * 100)) : 0;
    const mesNow = MESES[new Date().getMonth()];

    const fmt = (n: number, mon = moneda) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: mon, maximumFractionDigits: 0 }).format(n);

    const Tendencia = ({ pct, positiveIsGood = true }: { pct: number | null; positiveIsGood?: boolean }) => {
        if (pct === null) return null;
        const isGood = positiveIsGood ? pct >= 0 : pct <= 0;
        const color = isGood ? 'text-emerald-400' : 'text-red-400';
        const arrow = pct >= 0 ? '↑' : '↓';
        return (
            <span className={`text-[11px] font-bold ${color}`}>
                {arrow} {Math.abs(pct).toFixed(0)}% vs {mesAnteriorResumen.mesNombre}
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">

            {/* 0. CFO VIRTUAL */}
            <CFOVirtual />

            {/* 1. KPI CARDS — 4 columnas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                {/* Ingresos */}
                <div className="bg-[#161B22] border border-emerald-500/30 p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/50 transition">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <ArrowTrendingUpIcon className="w-14 h-14 text-emerald-500" />
                    </div>
                    <p className="text-[10px] text-emerald-400 uppercase font-bold mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Ingresos · {mesNow}
                    </p>
                    {resumen.ingresosActual === 0 ? (
                        <>
                            <p className="text-2xl font-mono text-gray-600 font-bold">$ 0</p>
                            <p className="text-[11px] text-gray-600 mt-1">Sin ingresos este mes</p>
                            <button onClick={onOpenModal} className="mt-2 text-[10px] text-emerald-500 hover:text-emerald-400 font-bold">+ Registrar ingreso →</button>
                        </>
                    ) : (
                        <>
                            {Object.entries(resumen.ingresosPorMoneda).map(([mon, val]) => (
                                <p key={mon} className="text-2xl font-mono text-white font-bold tracking-tight">
                                    {fmt(val, mon)} <span className="text-xs text-gray-500">{mon}</span>
                                </p>
                            ))}
                            <div className="mt-2">
                                <Tendencia pct={mesAnteriorResumen.pctIngresos} positiveIsGood={true} />
                            </div>
                        </>
                    )}
                    {/* Meta barra */}
                    {metaIngresos > 0 && (
                        <div className="mt-3">
                            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                <span>Meta mensual</span>
                                <span>{pctMeta}%</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${pctMeta >= 100 ? 'bg-emerald-400' : 'bg-emerald-600'}`}
                                    style={{ width: `${pctMeta}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-gray-600 mt-1">{fmt(resumen.ingresosActual)} / {fmt(metaIngresos)}</p>
                        </div>
                    )}
                </div>

                {/* Gastos */}
                <div className="bg-[#161B22] border border-red-500/30 p-5 rounded-2xl relative overflow-hidden group hover:border-red-500/50 transition">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <ArrowTrendingDownIcon className="w-14 h-14 text-red-500" />
                    </div>
                    <p className="text-[10px] text-red-400 uppercase font-bold mb-1">Gastos · {mesNow}</p>
                    {resumen.gastosActual === 0 ? (
                        <>
                            <p className="text-2xl font-mono text-gray-600 font-bold">$ 0</p>
                            <p className="text-[11px] text-gray-600 mt-1">Sin gastos registrados</p>
                        </>
                    ) : (
                        <>
                            {Object.entries(resumen.gastosPorMoneda).map(([mon, val]) => (
                                <p key={mon} className="text-2xl font-mono text-red-400 font-bold tracking-tight">
                                    {fmt(val, mon)} <span className="text-xs text-gray-500/50">{mon}</span>
                                </p>
                            ))}
                            <div className="mt-2">
                                <Tendencia pct={mesAnteriorResumen.pctGastos} positiveIsGood={false} />
                            </div>
                        </>
                    )}
                    {/* Top 3 categorías */}
                    {topGastos.length > 0 && (
                        <div className="mt-3 space-y-1">
                            {topGastos.map(([cat, monto]) => (
                                <div key={cat} className="flex justify-between text-[10px]">
                                    <span className="text-gray-500 truncate">{cat}</span>
                                    <span className="text-gray-400 font-bold font-mono">{fmt(monto)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Neto del Mes */}
                <div className={`p-5 rounded-2xl relative overflow-hidden border transition ${resumen.netoActual >= 0
                    ? 'bg-emerald-900/10 border-emerald-500/20 hover:border-emerald-500/40'
                    : 'bg-red-900/10 border-red-500/20 hover:border-red-500/40'}`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ScaleIcon className="w-14 h-14 text-white" />
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Neto · {mesNow}</p>
                    <p className={`text-2xl font-mono font-bold tracking-tight ${resumen.netoActual >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {resumen.netoActual >= 0 ? '+' : ''}{fmt(resumen.netoActual)} <span className="text-xs text-gray-500">{moneda}</span>
                    </p>
                    <p className="text-[11px] mt-2 text-gray-500">
                        {resumen.netoActual > 0
                            ? '✅ Mes positivo — vas bien'
                            : resumen.netoActual === 0
                                ? '⚖️ En equilibrio'
                                : '⚠️ Gastas más de lo que ingresas'}
                    </p>
                </div>

                {/* Saldo en cuentas */}
                <div className="bg-gradient-to-br from-indigo-900/40 to-black border border-indigo-500/30 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <WalletIcon className="w-14 h-14 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-[10px] text-indigo-300 uppercase font-bold mb-3">Saldo en Cuentas</p>
                        {!cuentas || cuentas.length === 0 ? (
                            <p className="text-2xl font-mono text-gray-600 font-bold">$ 0</p>
                        ) : (
                            <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
                                {cuentas.map((c, i) => (
                                    <div key={c.id} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${CUENTA_DOT[i % CUENTA_DOT.length]}`} />
                                            <span className="text-xs text-gray-300 truncate">{c.nombre}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <span className="text-sm font-mono font-bold text-white">{fmt(c.saldo_calculado || 0, c.moneda)}</span>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${CUENTA_COLORS[i % CUENTA_COLORS.length]}`}>{c.moneda}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {cuentas && cuentas.length > 0 && (() => {
                        const porMoneda: Record<string, number> = {};
                        cuentas.forEach(c => {
                            const mon = c.moneda || 'USD';
                            porMoneda[mon] = (porMoneda[mon] || 0) + (c.saldo_calculado || 0);
                        });
                        return (
                            <div className="mt-3 pt-3 border-t border-indigo-500/10 flex flex-col gap-0.5">
                                {Object.entries(porMoneda).map(([mon, total]) => (
                                    <span key={mon} className="text-xl font-bold text-white font-mono text-right tracking-tight">
                                        {fmt(total, mon)} <span className="text-xs text-indigo-400">{mon}</span>
                                    </span>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* 2. TABLA MOVIMIENTOS */}
            <div className="bg-[#161B22] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0D1117]">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <BanknotesIcon className="w-5 h-5 text-gray-400" /> Movimientos Recientes
                    </h3>
                    <button onClick={onOpenModal} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition hover:scale-105 active:scale-95 shadow-lg">
                        + Nuevo
                    </button>
                </div>

                {movimientosRecientes.length === 0 ? (
                    <div className="py-16 text-center">
                        <p className="text-4xl mb-3">💸</p>
                        <p className="text-gray-400 font-bold">Sin movimientos aún</p>
                        <p className="text-gray-600 text-sm mt-1">Registra tu primer ingreso o gasto</p>
                        <button onClick={onOpenModal} className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition">
                            + Registrar movimiento
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#0D1117] text-gray-400 text-xs uppercase border-b border-white/5">
                                <tr>
                                    <th className="p-4 font-semibold">Fecha</th>
                                    <th className="p-4 font-semibold">Concepto</th>
                                    <th className="p-4 font-semibold">Cuenta</th>
                                    <th className="p-4 text-right font-semibold">Monto</th>
                                    <th className="p-4" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {movimientosRecientes.map((m: any) => (
                                    <tr key={m.id} className="hover:bg-white/5 transition group">
                                        <td className="p-4 text-gray-400 whitespace-nowrap text-xs font-mono">{formatDate(m.fecha)}</td>

                                        <td className="p-4">
                                            <p className="font-bold text-white">{m.descripcion || m.referencia || "Sin detalle"}</p>
                                            {m.categoria && (
                                                <span className="inline-block text-[10px] text-gray-500 uppercase tracking-wide mt-0.5 bg-white/5 px-1.5 py-0.5 rounded">
                                                    {m.categoria}
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-4">
                                            {m.cuenta_nombre ? (
                                                <span className="text-xs text-gray-300 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                                    {m.cuenta_nombre}
                                                </span>
                                            ) : (
                                                <span className="text-gray-600 text-xs">---</span>
                                            )}
                                        </td>

                                        <td className="p-4 text-right">
                                            <span className={`font-mono font-bold text-base ${m.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {m.tipo === 'ingreso' ? '+' : '-'} {fmt(m.monto, m.moneda)}
                                            </span>
                                            <span className="ml-1.5 text-[10px] text-gray-500 bg-white/5 px-1 py-0.5 rounded uppercase">{m.moneda || 'USD'}</span>
                                        </td>

                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => onEdit(m)} className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition">
                                                    <PencilIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => onDelete(m.id)} className="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition">
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}