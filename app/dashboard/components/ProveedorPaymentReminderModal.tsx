"use client";
import { useRouter } from "next/navigation";

interface PagoVencido {
    id: string;
    proveedor: string;
    proyecto: string;
    monto: number;
    moneda: string;
    fecha_pago: string;
    tipo: "hoy" | "vencido";
    diasVencido?: number;
}

interface Props {
    isOpen: boolean;
    pagos: PagoVencido[];
    onClose: () => void;
}

export default function ProveedorPaymentReminderModal({ isOpen, pagos, onClose }: Props) {
    const router = useRouter();
    if (!isOpen || pagos.length === 0) return null;

    const hoy = pagos.filter(p => p.tipo === "hoy");
    const vencidos = pagos.filter(p => p.tipo === "vencido");

    const fmt = (n: number, mon: string) =>
        new Intl.NumberFormat("es-CO", { style: "currency", currency: mon, maximumFractionDigits: 0 }).format(n);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-[#0D1117] border border-red-500/40 rounded-2xl w-full max-w-md shadow-[0_0_60px_rgba(239,68,68,0.2)] animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="p-6 border-b border-white/5 text-center">
                    <div className="relative inline-block mb-4">
                        <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl animate-pulse" />
                        <div className="relative bg-red-500/20 border border-red-500/40 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                            <span className="text-3xl">🔔</span>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-white">
                        {vencidos.length > 0 && hoy.length === 0 && "¡Pagos vencidos!"}
                        {hoy.length > 0 && vencidos.length === 0 && "¡Pagos para hoy!"}
                        {hoy.length > 0 && vencidos.length > 0 && "⚠️ Pagos pendientes urgentes"}
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Tienes obligaciones con proveedores sin pagar</p>
                </div>

                {/* Lista */}
                <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
                    {hoy.length > 0 && (
                        <>
                            <p className="text-[10px] text-yellow-400 uppercase font-bold px-1 mb-1">📅 Para hoy</p>
                            {hoy.map(p => (
                                <div key={p.id} className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold text-white">{p.proyecto}</p>
                                        <p className="text-[11px] text-yellow-300">{p.proveedor}</p>
                                    </div>
                                    <span className="text-sm font-bold text-yellow-400 font-mono">{fmt(p.monto, p.moneda)}</span>
                                </div>
                            ))}
                        </>
                    )}

                    {vencidos.length > 0 && (
                        <>
                            <p className="text-[10px] text-red-400 uppercase font-bold px-1 mt-2 mb-1">🚨 Vencidos</p>
                            {vencidos.map(p => (
                                <div key={p.id} className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold text-white">{p.proyecto}</p>
                                        <p className="text-[11px] text-red-300">{p.proveedor} · hace {p.diasVencido}d</p>
                                    </div>
                                    <span className="text-sm font-bold text-red-400 font-mono">{fmt(p.monto, p.moneda)}</span>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Acciones */}
                <div className="p-4 border-t border-white/5 flex flex-col gap-2">
                    <button
                        onClick={() => { onClose(); router.push("/dashboard/proveedores"); }}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition hover:scale-[1.02] active:scale-95"
                    >
                        💸 Ir a Proveedores a pagar
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition border border-white/10"
                    >
                        Recordarme más tarde
                    </button>
                </div>
            </div>
        </div>
    );
}
