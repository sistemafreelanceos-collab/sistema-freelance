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
    const cobrosPendientes = proyectos
        .filter(p => {
            // 1. Si está finalizado, bye.
            if (p.estado === 'finalizado') return false;

            // 2. Si ya está pagado totalmente, bye.
            const totalPagado = p.pagos_cliente?.reduce((sum: number, pago: any) => sum + pago.monto, 0) || 0;
            if (totalPagado >= p.monto && p.monto > 0) return false;

            return true;
        })
        .map(p => {
            // Prioridad 1: Fecha específica del proyecto (Deadline / Pago Único)
            // Prioridad 2: Fecha recurrente del cliente
            // Prioridad 3: Estimación (Inicio + 30 días)

            let fechaCobro: Date;
            let esRecurrente = false;

            if (p.fecha_fin) {
                fechaCobro = new Date(p.fecha_fin);
                // Ajuste simple por zona horaria si viene solo YYYY-MM-DD
                if (p.fecha_fin.length === 10) fechaCobro.setHours(23, 59, 59);
            } else if (p.clientes?.proximo_pago) {
                fechaCobro = new Date(p.clientes.proximo_pago);
                esRecurrente = true;
            } else {
                // Si es pago único y no tiene fecha fin explícita, asumimos que la fecha de inicio es la fecha de cobro/entrega
                // (Alineado con TarjetaCliente que usa fecha_inicio para calcular "Por Vencer")
                fechaCobro = new Date(p.fecha_inicio);
                // Ajuste para final del día
                if (p.fecha_inicio.length === 10) fechaCobro.setHours(23, 59, 59);
            }

            if (isNaN(fechaCobro.getTime())) fechaCobro = new Date();

            return {
                ...p,
                fechaCobroEstimada: fechaCobro,
                diasRestantes: Math.ceil((fechaCobro.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
                esRecurrente,
                // Si tiene fecha fin específica, usamos el monto del proyecto, no el del cliente
                montoFinal: (esRecurrente && !p.fecha_fin && p.clientes.monto) ? p.clientes.monto : p.monto,
                monedaFinal: (esRecurrente && !p.fecha_fin && p.clientes.moneda) ? p.clientes.moneda : p.moneda
            };
        })
        .filter(p => p.diasRestantes < 60) // Solo mostrar próximos 2 meses
        .sort((a, b) => a.diasRestantes - b.diasRestantes);

    return (
        <div className="w-full bg-[#161B22] border border-white/10 rounded-2xl p-5 shadow-lg mt-6">
            <h3 className="text-white font-bold flex items-center gap-2 mb-4">
                <CurrencyDollarIcon className="w-5 h-5 text-emerald-400" /> Próximos Pagos
            </h3>

            <div className="space-y-3">
                {cobrosPendientes.length === 0 ? (
                    <p className="text-gray-500 text-xs text-center py-4">No hay cobros pendientes próximos.</p>
                ) : (
                    cobrosPendientes.map((p) => (
                        <div key={p.id} className="bg-[#0D1117] border border-white/5 p-3 rounded-xl flex justify-between items-center group hover:border-emerald-500/30 transition">
                            <div>
                                <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                                    {p.nombre}
                                </p>
                                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                    👤 {p.clientes?.nombre || "Cliente"} {p.esRecurrente && !p.fecha_fin && <span className="text-xs bg-emerald-900/40 text-emerald-400 px-1 rounded">Recurrente</span>}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-mono font-bold text-emerald-400">
                                    ${Number(p.montoFinal).toLocaleString()} {p.monedaFinal}
                                </p>
                                <p className={`text-[10px] font-bold ${p.diasRestantes < 0 ? 'text-red-400' : p.diasRestantes < 3 ? 'text-red-400 animate-pulse' : p.diasRestantes < 7 ? 'text-yellow-400' : 'text-blue-400'}`}>
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