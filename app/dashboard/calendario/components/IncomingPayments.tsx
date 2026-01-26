"use client";
import { CurrencyDollarIcon, CalendarIcon } from "@heroicons/react/24/solid";

interface Proyecto {
    id: string;
    nombre: string;
    monto: number;
    moneda: string;
    fecha_inicio: string;
    cliente_nombre?: string;
}

interface Props {
    proyectos: any[];
}

export default function IncomingPayments({ proyectos }: Props) {
    // Filtramos proyectos que podrían generar pago pronto (activos o pendientes)
    // Simulamos fecha de cobro = Fecha Inicio + 30 días (o fin de mes si prefieres)
    const cobrosPendientes = proyectos.map(p => {
        const fechaBase = new Date(p.fecha_inicio);
        const fechaCobro = new Date(fechaBase.setDate(fechaBase.getDate() + 30)); // Estimado +30 días
        
        return {
            ...p,
            fechaCobroEstimada: fechaCobro,
            diasRestantes: Math.ceil((fechaCobro.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        };
    }).sort((a, b) => a.fechaCobroEstimada.getTime() - b.fechaCobroEstimada.getTime());

    return (
        <div className="w-full bg-[#161B22] border border-white/10 rounded-2xl p-5 shadow-lg mt-6">
            <h3 className="text-white font-bold flex items-center gap-2 mb-4">
                <CurrencyDollarIcon className="w-5 h-5 text-emerald-400"/> Próximos Pagos
            </h3>

            <div className="space-y-3">
                {cobrosPendientes.length === 0 ? (
                    <p className="text-gray-500 text-xs text-center py-4">No hay proyectos activos con cobros pendientes.</p>
                ) : (
                    cobrosPendientes.map((p) => (
                        <div key={p.id} className="bg-[#0D1117] border border-white/5 p-3 rounded-xl flex justify-between items-center group hover:border-emerald-500/30 transition">
                            <div>
                                <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                                    {p.nombre}
                                </p>
                                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                    👤 {p.clientes?.nombre || "Cliente"}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-mono font-bold text-emerald-400">
                                    ${Number(p.monto).toLocaleString()} {p.moneda}
                                </p>
                                <p className={`text-[10px] font-bold ${p.diasRestantes < 0 ? 'text-red-400' : p.diasRestantes < 7 ? 'text-yellow-400' : 'text-blue-400'}`}>
                                    {p.diasRestantes < 0 ? `Venció hace ${Math.abs(p.diasRestantes)} días` : 
                                     p.diasRestantes === 0 ? "¡Cobrar Hoy!" : 
                                     `En ${p.diasRestantes} días`}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}