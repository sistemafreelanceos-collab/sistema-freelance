"use client";
import { useMemo } from "react";
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    PencilIcon,
    TrashIcon,
    CalendarDaysIcon,
    BanknotesIcon
} from "@heroicons/react/24/solid";
import { Movimiento, GastoFijo, ConfigFinanzas } from "../../../../types";

interface Props {
    movimientos: Movimiento[];
    gastosFijos: GastoFijo[];
    config: ConfigFinanzas;
    saldoActual: number;
    onUpdateConfig: (key: string, val: number) => void;
    onOpenModal: () => void;
    onEdit: (mov: Movimiento) => void;
    onDelete: (id: string) => void;
}

import CFOVirtual from "./CFOVirtual"; // Importar componente

export default function TableroTab({ movimientos, gastosFijos, saldoActual, onOpenModal, onEdit, onDelete, config, presupuestos }: Props & { config: ConfigFinanzas & { meta_moneda?: string }, presupuestos: any[] }) {

    const formatDate = (fechaString: string) => {
        if (!fechaString) return "—";
        const [anio, mes, dia] = fechaString.split('-');
        return `${dia}/${mes}/${anio}`;
    };

    const { resumen, cobertura, proximosPagos, movimientosRecientes } = useMemo(() => {
        // 1. CÁLCULOS KPI
        const hoy = new Date();
        const mesActual = hoy.getMonth();
        const anioActual = hoy.getFullYear();
        const diaHoy = hoy.getDate();

        const movsMes = movimientos.filter(m => {
            const [y, mn] = m.fecha.split('-').map(Number);
            return (mn - 1) === mesActual && y === anioActual;
        });

        // Cálculos básicos
        const ingresosMes = movsMes.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
        const gastosMes = movsMes.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);

        // Ecuación: Ingreso (Total que hubo) - Gasto (Total que salió) = Disponible (Lo que queda hoy)
        const saldoFinal = saldoActual;
        const disponibleTotal = saldoActual + gastosMes;

        // 2. CÁLCULO DE COBERTURA (SEMÁFORO)
        const costoVidaMensual = gastosFijos.filter(gf => gf.activo).reduce((sum, gf) => sum + gf.monto, 0);
        const esCubierto = saldoActual >= costoVidaMensual;
        const faltante = costoVidaMensual - saldoActual;

        // 3. PRÓXIMOS PAGOS
        const proximos = gastosFijos
            .filter(gf => gf.activo)
            .map(gf => {
                let diasParaPago = gf.dia_pago - diaHoy;
                if (diasParaPago < 0) diasParaPago += 30;
                return { ...gf, diasParaPago };
            })
            .sort((a, b) => a.diasParaPago - b.diasParaPago)
            .slice(0, 4);

        return {
            resumen: { disponible: disponibleTotal, gastos: gastosMes, final: saldoFinal },
            cobertura: { esCubierto, faltante, costoVidaMensual },
            proximosPagos: proximos,
            movimientosRecientes: movimientos.slice(0, 10)
        };
    }, [movimientos, gastosFijos, saldoActual]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">

            {/* 0. CFO VIRTUAL (AI) */}
            <CFOVirtual movimientos={movimientos} presupuestos={presupuestos} gastosFijos={gastosFijos} config={config} />

            {/* 1. TARJETAS KPI (Nombres Simplificados) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Tarjeta 1: CAMBIADO A "Ingreso" */}
                <div className="bg-[#161B22] border border-emerald-500/30 p-6 rounded-2xl">
                    <p className="text-xs text-emerald-400 uppercase font-bold mb-1">Ingreso</p>
                    <p className="text-3xl font-mono text-white font-bold tracking-tight flex items-end gap-2">
                        $ {resumen.disponible.toLocaleString()} <span className="text-sm text-gray-500 mb-1">{config.meta_moneda || "USD"}</span>
                    </p>
                </div>

                {/* Tarjeta 2: Mantenemos Gastos */}
                <div className="bg-[#161B22] border border-red-500/30 p-6 rounded-2xl">
                    <p className="text-xs text-red-400 uppercase font-bold mb-1">Gastado este Mes</p>
                    <p className="text-3xl font-mono text-red-400 font-bold tracking-tight flex items-end gap-2">
                        - $ {resumen.gastos.toLocaleString()} <span className="text-sm text-gray-500/50 mb-1">{config.meta_moneda || "USD"}</span>
                    </p>
                </div>

                {/* Tarjeta 3: CAMBIADO A "Disponible" */}
                <div className="bg-gradient-to-br from-indigo-900/40 to-black border border-indigo-500/30 p-6 rounded-2xl shadow-lg shadow-indigo-900/10">
                    <p className="text-xs text-indigo-300 uppercase font-bold mb-1">Disponible</p>
                    <p className="text-3xl font-mono text-white font-bold tracking-tight flex items-end gap-2">
                        $ {resumen.final.toLocaleString()} <span className="text-sm text-indigo-300/50 mb-1">{config.meta_moneda || "USD"}</span>
                    </p>
                </div>
            </div>

            {/* 2. SEMÁFORO Y PRÓXIMOS PAGOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* A. Semáforo */}
                <div className={`p-6 rounded-2xl border flex flex-col justify-center items-center text-center relative overflow-hidden ${cobertura.esCubierto ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-red-900/10 border-red-500/30'}`}>
                    {cobertura.esCubierto ? (
                        <>
                            <div className="bg-emerald-500/20 p-4 rounded-full mb-4 animate-pulse">
                                <CheckCircleIcon className="w-12 h-12 text-emerald-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Salud Financiera OK</h3>
                            <p className="text-emerald-200/70 text-sm max-w-xs">
                                Tu <strong>Disponible</strong> cubre todos los gastos fijos del mes. ¡Bien hecho!
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="bg-red-500/20 p-4 rounded-full mb-4 animate-pulse">
                                <ExclamationCircleIcon className="w-12 h-12 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Riesgo de Liquidez</h3>
                            <p className="text-red-200/70 text-sm max-w-xs">
                                Te faltan <strong className="text-white">${cobertura.faltante.toLocaleString()}</strong> para cubrir tus obligaciones fijas.
                            </p>
                        </>
                    )}
                </div>

                {/* B. Próximos Pagos */}
                <div className="bg-[#161B22] border border-white/10 p-6 rounded-2xl">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <CalendarDaysIcon className="w-5 h-5 text-indigo-400" /> Próximos a Pagar
                    </h3>
                    <div className="space-y-3">
                        {proximosPagos.length === 0 ? (
                            <p className="text-gray-500 text-sm">Todo pagado por ahora.</p>
                        ) : (
                            proximosPagos.map((gf) => (
                                <div key={gf.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg font-bold text-xs text-center w-12 ${gf.diasParaPago <= 3 ? 'bg-red-500/20 text-red-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                                            {gf.diasParaPago === 0 ? "HOY" : `${gf.diasParaPago}d`}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">{gf.nombre}</p>
                                            <p className="text-gray-500 text-[10px] uppercase">{gf.categoria}</p>
                                        </div>
                                    </div>
                                    <p className="text-white font-mono font-bold">
                                        ${gf.monto.toLocaleString()} <span className="text-[10px] text-gray-500">{gf.moneda || 'USD'}</span>
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 3. TABLA MOVIMIENTOS */}
            <div className="bg-[#161B22] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0D1117]">
                    <h3 className="font-bold text-white flex items-center gap-2"><BanknotesIcon className="w-5 h-5 text-gray-400" /> Movimientos Recientes</h3>
                    <button onClick={onOpenModal} className="bg-white text-black text-xs font-bold px-4 py-2 rounded-lg hover:scale-105 transition shadow-lg">+ Nuevo</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0D1117] text-gray-400 text-xs uppercase border-b border-white/5">
                            <tr><th className="p-4 font-semibold">Fecha</th><th className="p-4 font-semibold">Concepto</th><th className="p-4 font-semibold">Cuenta</th><th className="p-4 text-right font-semibold">Monto</th><th className="p-4 text-right font-semibold"></th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {movimientosRecientes.length === 0 ? (
                                <tr><td colSpan={5} className="p-10 text-center text-gray-500 text-sm">No hay movimientos.</td></tr>
                            ) : (
                                movimientosRecientes.map(m => (
                                    <tr key={m.id} className="hover:bg-white/5 transition group">
                                        <td className="p-4 text-gray-400 whitespace-nowrap text-xs font-mono">{formatDate(m.fecha)}</td>

                                        <td className="p-4 font-bold text-white">
                                            {m.referencia || "Sin detalle"}
                                            <span className="block text-[10px] text-gray-500 font-normal uppercase tracking-wide mt-0.5">{m.categoria}</span>
                                        </td>

                                        <td className="p-4 text-gray-400 text-xs">{m.cuenta_nombre || '---'}</td>

                                        <td className={`p-4 text-right font-mono font-bold ${m.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {m.tipo === 'ingreso' ? '+' : '-'} ${m.monto.toLocaleString()}
                                            <span className="ml-1 text-[10px] text-gray-500 bg-white/5 px-1 py-0.5 rounded uppercase">
                                                {m.moneda || 'USD'}
                                            </span>
                                        </td>

                                        <td className="p-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onEdit(m)} title="Editar" className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition"><PencilIcon className="w-3 h-3" /></button>
                                            <button onClick={() => onDelete(m.id)} title="Eliminar" className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition"><TrashIcon className="w-3 h-3" /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}