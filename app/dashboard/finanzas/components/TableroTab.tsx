"use client";
import { useMemo } from "react";
import { ArrowTrendingUpIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Movimiento, GastoFijo, ConfigFinanzas } from "../types";

interface Props {
  movimientos: Movimiento[];
  gastosFijos: GastoFijo[];
  config: ConfigFinanzas;
  saldoActual: number;
  onUpdateConfig: (key: string, val: number) => void;
  onOpenModal: () => void;
}

export default function TableroTab({ movimientos, gastosFijos, config, saldoActual, onUpdateConfig, onOpenModal }: Props) {
  
  // --- FIX: Formatear fecha sin cambiar zona horaria ---
  const formatDate = (fechaString: string) => {
      if (!fechaString) return "—";
      // Cortamos el string manualmente (YYYY-MM-DD) para evitar que JS reste horas
      const [anio, mes, dia] = fechaString.split('-'); 
      return `${dia}/${mes}/${anio}`;
  };

  const { dataGrafica, alertaQuiebra, resumen, movimientosRecientes } = useMemo(() => {
    // 1. CÁLCULOS BANCARIOS (Mes Actual)
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    const movsMes = movimientos.filter(m => {
        // Usamos split para comparar fechas sin líos de horario
        const [y, mn] = m.fecha.split('-').map(Number);
        return (mn - 1) === mesActual && y === anioActual;
    });

    const ingresosMes = movsMes.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
    const gastosMes = movsMes.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);
    
    const flujoMes = ingresosMes - gastosMes;
    const saldoInicialMes = saldoActual - flujoMes;
    const disponibleTotal = saldoInicialMes + ingresosMes; 
    const saldoFinal = disponibleTotal - gastosMes; 

    // 2. PROYECCIÓN
    let saldoSimulado = saldoActual; 
    let alerta = null;
    const puntos = [];

    for (let i = 0; i <= 30; i++) {
        const fecha = new Date();
        fecha.setDate(hoy.getDate() + i);
        const dia = fecha.getDate();
        
        let gastoDia = 0;
        gastosFijos.forEach(gf => { if (gf.dia_pago === dia && gf.activo) gastoDia += gf.monto; });
        saldoSimulado -= gastoDia;
        if (saldoSimulado < 0 && !alerta) alerta = { fecha, saldo: saldoSimulado };
        puntos.push({ dia: i, saldo: saldoSimulado });
    }

    return { 
        dataGrafica: puntos, 
        alertaQuiebra: alerta,
        resumen: { disponible: disponibleTotal, gastos: gastosMes, final: saldoFinal },
        movimientosRecientes: movimientos.slice(0, 10)
    };
  }, [movimientos, gastosFijos, config, saldoActual]);

  // Render Gráfica (Simplificado para el ejemplo)
  const renderGrafica = () => {
    if(dataGrafica.length === 0) return null;
    const max = Math.max(...dataGrafica.map(d => d.saldo), 100);
    const min = Math.min(...dataGrafica.map(d => d.saldo), 0);
    const range = max - min || 1;
    const points = dataGrafica.map((d, i) => `${(i / 30) * 100},${100 - ((d.saldo - min) / range) * 100}`).join(" ");

    return (
        <div className="relative h-32 w-full mt-4 bg-black/20 rounded-xl p-2 border border-white/5 overflow-hidden">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs><linearGradient id="grad" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity="0.5" /><stop offset="100%" stopColor="#10B981" stopOpacity="0" /></linearGradient></defs>
                <polygon points={`0,100 ${points} 100,100`} fill="url(#grad)" />
                <polyline points={points} fill="none" stroke={alertaQuiebra ? "#EF4444" : "#10B981"} strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
            {alertaQuiebra && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 font-bold text-xs bg-black/80 px-2 py-1 rounded">⚠️ QUIEBRA</div>}
        </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#161B22] border border-emerald-500/30 p-6 rounded-2xl">
                <p className="text-xs text-emerald-400 uppercase font-bold mb-1">Disponible (Saldo + Ingresos)</p>
                <p className="text-3xl font-mono text-white font-bold tracking-tight">$ {resumen.disponible.toLocaleString()}</p>
            </div>
            <div className="bg-[#161B22] border border-red-500/30 p-6 rounded-2xl relative">
                <p className="text-xs text-red-400 uppercase font-bold mb-1">Menos: Gastos del Mes</p>
                <p className="text-3xl font-mono text-red-400 font-bold tracking-tight">- $ {resumen.gastos.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-900/40 to-black border border-indigo-500/30 p-6 rounded-2xl">
                <p className="text-xs text-indigo-300 uppercase font-bold mb-1">Igual: Saldo Final</p>
                <p className="text-3xl font-mono text-white font-bold tracking-tight">$ {resumen.final.toLocaleString()}</p>
            </div>
        </div>

        <div className="bg-[#161B22] border border-white/10 p-6 rounded-2xl">
            <h3 className="text-white font-bold mb-2">Proyección de Flujo (30 días)</h3>
            {alertaQuiebra ? (
                <div className="text-red-400 text-sm flex items-center gap-2 mb-2"><ExclamationTriangleIcon className="w-5 h-5" /> Cuidado: Te quedarás sin saldo el {formatDate(alertaQuiebra.fecha.toISOString().split('T')[0])}</div>
            ) : (
                <p className="text-emerald-400 text-sm flex items-center gap-2 mb-2"><ArrowTrendingUpIcon className="w-5 h-5" /> Flujo saludable.</p>
            )}
            {renderGrafica()}
        </div>

        <div className="bg-[#161B22] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-bold text-white">Últimos Movimientos</h3>
                <button onClick={onOpenModal} className="bg-white text-black text-xs font-bold px-4 py-2 rounded-lg hover:scale-105 transition shadow-lg">+ Nuevo Movimiento</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#0F1115] text-gray-400 text-xs uppercase">
                        <tr><th className="p-4">Fecha</th><th className="p-4">Concepto</th><th className="p-4">Cuenta</th><th className="p-4 text-right">Monto</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {movimientosRecientes.length === 0 ? (
                             <tr><td colSpan={4} className="p-8 text-center text-gray-500">No hay movimientos.</td></tr>
                        ) : (
                            movimientosRecientes.map(m => (
                                <tr key={m.id} className="hover:bg-white/5 transition">
                                    {/* USAMOS LA FUNCIÓN CORREGIDA AQUÍ 👇 */}
                                    <td className="p-4 text-gray-400 whitespace-nowrap text-xs">{formatDate(m.fecha)}</td>
                                    <td className="p-4 font-bold text-white">{m.referencia || "Sin detalle"}<span className="block text-xs text-gray-500 font-normal capitalize">{m.categoria}</span></td>
                                    <td className="p-4 text-gray-300 text-xs">{m.cuenta_nombre || '---'}</td>
                                    <td className={`p-4 text-right font-mono font-bold ${m.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>{m.tipo === 'ingreso' ? '+' : '-'} ${m.monto.toLocaleString()} <span className="text-[10px] text-gray-500">{m.moneda}</span></td>
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