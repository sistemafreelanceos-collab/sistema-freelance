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

            // 2. Si ya está pagado totalmente Y ES PAGO ÚNICO, bye.
            const totalPagado = p.pagos_cliente?.reduce((sum: number, pago: any) => sum + pago.monto, 0) || 0;
            const f = p.frecuencia_pago || "unidad";

            if (totalPagado >= p.monto && p.monto > 0 && f === "unidad") return false;

            return true;
        })
        .map(p => {
            const f = p.frecuencia_pago || "unidad";
            let fechaCobro = new Date();
            let esRecurrente = f !== "unidad";
            let montoFinal = p.monto;
            let monedaFinal = p.moneda;

            const totalPagado = p.pagos_cliente?.reduce((sum: number, pago: any) => sum + pago.monto, 0) || 0;
            const estaPagado = totalPagado >= p.monto && p.monto > 0;

            // Lógica Cíclica para que no se quede anclado a fechas antiguas
            if (p.fecha_inicio && f !== "unidad") {
                const [y, m, d] = p.fecha_inicio.split('-').map(Number);

                // Empezamos desde el primer pago teórico original
                let currentCycle = new Date(y, m - 1, d);

                const hoyReal = new Date();
                hoyReal.setHours(0, 0, 0, 0);

                // Avanzamos el ciclo hasta que esté en el futuro o presente respecto a hoy
                // (O hasta el próximo pago si está pagado actualmente)
                while (currentCycle < hoyReal || (estaPagado && Math.abs(currentCycle.getTime() - hoyReal.getTime()) < 3 * 24 * 60 * 60 * 1000)) {
                    if (f === "quincenal") {
                        if (currentCycle.getDate() < 15) {
                            currentCycle.setDate(15);
                        } else {
                            currentCycle = new Date(currentCycle.getFullYear(), currentCycle.getMonth() + 1, 0); // Ultimo dia del mes
                        }
                        // Forzar salto seguro si se quedó atascado en un ciclo infinito en mismo mes corto
                        if (currentCycle < hoyReal) {
                            const temp = new Date(currentCycle);
                            temp.setDate(temp.getDate() + 15);
                            if (temp.getDate() < 15) temp.setDate(15);
                            else temp.setDate(0);
                            if (temp > currentCycle) currentCycle = temp;
                            else currentCycle.setMonth(currentCycle.getMonth() + 1);
                        }
                    } else if (f === "mensual") {
                        currentCycle.setMonth(currentCycle.getMonth() + 1);
                        // Mantener el día si es posible o usar el max del mes
                        const expectedDay = Math.min(d, new Date(currentCycle.getFullYear(), currentCycle.getMonth() + 1, 0).getDate());
                        currentCycle.setDate(expectedDay);
                    } else if (f === "semanal") {
                        currentCycle.setDate(currentCycle.getDate() + 7);
                    }
                }

                fechaCobro = currentCycle;

                // Set fallback monto
                if (p.monto === 0 && p.clientes?.monto) {
                    montoFinal = p.clientes.monto;
                    monedaFinal = p.clientes.moneda || p.moneda;
                }
            }
            // Prioridad 1 (Legacy): Fecha fin definida explícitamente y es unidad
            else if (p.fecha_fin && (!p.clientes?.proximo_pago)) {
                fechaCobro = new Date(p.fecha_fin);
            }
            // Prioridad 2 (Legacy): Próximo pago en cliente (Fallback)
            else if (p.clientes?.proximo_pago) {
                fechaCobro = new Date(p.clientes.proximo_pago);
                esRecurrente = true;
                if (p.monto === 0 && p.clientes.monto) {
                    montoFinal = p.clientes.monto;
                    monedaFinal = p.clientes.moneda || p.moneda;
                }
            }
            // Prioridad 3: Fecha inicio estimación
            else if (p.fecha_inicio) {
                fechaCobro = new Date(p.fecha_inicio);
                fechaCobro.setDate(fechaCobro.getDate() + 30);
            }

            fechaCobro.setHours(23, 59, 59, 999);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            const diffTime = fechaCobro.getTime() - hoy.getTime();
            const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
                ...p,
                fechaCobroEstimada: fechaCobro,
                diasRestantes,
                esRecurrente,
                montoFinal,
                monedaFinal
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
                                    👤 {p.cliente?.nombre || p.clientes?.nombre || "Proyecto Independiente"} {p.esRecurrente && !p.fecha_fin && <span className="text-xs bg-emerald-900/40 text-emerald-400 px-1 rounded">Recurrente</span>}
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