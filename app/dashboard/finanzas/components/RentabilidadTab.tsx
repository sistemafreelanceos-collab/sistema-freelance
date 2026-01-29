"use client";
import { useMemo } from "react";
import { Movimiento, ProyectoStats } from "../../../../types";

interface Props {
    movimientos: Movimiento[];
    proyectos: any[];
}

export default function RentabilidadTab({ movimientos, proyectos }: Props) {

    // Lógica de cálculo de rentabilidad
    const rentabilidad = useMemo(() => {
        const stats: Record<string, ProyectoStats> = {};

        // Inicializar estructura
        proyectos.forEach(p => {
            stats[p.id] = { id: p.id, nombre: p.nombre, ingresos: 0, gastos: 0, rentabilidad: 0, margen: 0 };
        });

        // Sumar movimientos
        movimientos.forEach(m => {
            if (m.proyecto_id && stats[m.proyecto_id]) {
                if (m.tipo === 'ingreso') stats[m.proyecto_id].ingresos += m.monto;
                else stats[m.proyecto_id].gastos += m.monto;
            }
        });

        // Calcular totales
        return Object.values(stats).map(p => {
            const neto = p.ingresos - p.gastos;
            const margen = p.ingresos > 0 ? (neto / p.ingresos) * 100 : 0;
            return { ...p, rentabilidad: neto, margen };
        }).sort((a, b) => b.rentabilidad - a.rentabilidad);
    }, [movimientos, proyectos]);

    return (
        <div className="bg-[#161B22] border border-white/10 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <table className="w-full text-left text-sm">
                <thead className="bg-[#0F1115] text-gray-400 text-xs uppercase font-bold">
                    <tr>
                        <th className="p-4">Proyecto</th>
                        <th className="p-4 text-right">Ingresos</th>
                        <th className="p-4 text-right">Gastos</th>
                        <th className="p-4 text-right">Ganancia</th>
                        <th className="p-4 text-right">Margen</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {rentabilidad.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay datos de proyectos aún.</td></tr>
                    ) : (
                        rentabilidad.map(p => (
                            <tr key={p.id} className="hover:bg-white/5 transition">
                                <td className="p-4 text-white font-bold">{p.nombre}</td>
                                <td className="p-4 text-right text-emerald-400 font-mono">+ ${p.ingresos.toLocaleString()}</td>
                                <td className="p-4 text-right text-red-400 font-mono">- ${p.gastos.toLocaleString()}</td>
                                <td className={`p-4 text-right font-mono font-bold ${p.rentabilidad >= 0 ? 'text-white' : 'text-red-500'}`}>
                                    $ {p.rentabilidad.toLocaleString()}
                                </td>
                                <td className="p-4 text-right">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${p.margen > 40 ? 'bg-emerald-500/20 text-emerald-400' :
                                            p.margen > 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                        }`}>
                                        {p.margen.toFixed(1)}%
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}