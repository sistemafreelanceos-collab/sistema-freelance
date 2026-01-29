"use client";
import { Cliente, Proyecto } from "../../../../types";
import { toast } from "sonner";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    cliente: Cliente | null;
    proyecto: Proyecto | null;
    onEditar: (p: Proyecto) => void;
    onRegistrarPago: () => void;
    onEliminar: (id: string, clienteId: string) => void;
}

export default function ModalDetalleProyecto({ isOpen, onClose, cliente, proyecto, onEditar, onRegistrarPago, onEliminar }: Props) {
    // ... existing code ...


    if (!isOpen || !cliente || !proyecto) return null;

    const formatDate = (f?: string) => {
        if (!f) return "—";
        const datePart = f.split('T')[0];
        const [year, month, day] = datePart.split('-');
        return `${day}-${month}-${year}`;
    };

    const pagado = proyecto.pagos_cliente?.reduce((sum, p) => sum + p.monto, 0) || 0;
    const restante = Math.max(0, proyecto.monto - pagado);
    const porcentaje = Math.min((pagado / (proyecto.monto || 1)) * 100, 100);

    const statusLabels = {
        pendiente: { label: "🔴 Pendiente", class: "text-red-400 bg-red-400/10 border-red-400/20" },
        en_progreso: { label: "🟡 En Progreso", class: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
        revision: { label: "🔵 En Revisión", class: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
        finalizado: { label: "🟢 Finalizado", class: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" }
    };

    let estado = statusLabels[proyecto.estado];

    // OVERRIDE: Si está pagado (y era pendiente), mostrar como finalizado visualmente
    if (restante === 0 && proyecto.estado === 'pendiente') {
        estado = statusLabels['finalizado'];
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in zoom-in duration-200">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-y-auto max-h-[90vh]">

                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition z-10">✕</button>

                <h3 className="text-xl font-bold text-white mb-6 pl-1">Detalles del Proyecto</h3>

                <div className="flex flex-col gap-4">

                    {/* 1. FICHA CLIENTE */}
                    <div className="bg-black/40 rounded-2xl p-5 border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-black border border-white/10 flex items-center justify-center font-bold text-white text-xl">
                                {cliente.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-lg">{cliente.nombre}</h2>
                                <p className="text-sm text-gray-400">{cliente.email || cliente.telefono || "Sin contacto"}</p>
                            </div>
                        </div>
                    </div>

                    {/* 2. FICHA PROYECTO */}
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                        <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                            <div>
                                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mb-2 ${estado.class}`}>{estado.label}</div>
                                <h2 className="text-2xl font-bold text-white">{proyecto.nombre}</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase font-bold">Total</p>
                                <p className="text-emerald-400 font-mono text-2xl font-bold">${proyecto.monto.toLocaleString()} {proyecto.moneda}</p>
                            </div>
                        </div>

                        {/* BARRA DE PAGO Y SALDO */}
                        <div className="mb-6 bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex justify-between text-sm mb-2 font-bold">
                                <span className="text-white">Estado de Pago</span>
                                <span className={restante === 0 ? "text-emerald-400" : "text-yellow-400"}>
                                    {restante === 0 ? "¡COMPLETO! 🎉" : `Resta: $${restante.toLocaleString()}`}
                                </span>
                            </div>
                            <div className="h-4 bg-gray-700 rounded-full overflow-hidden border border-white/5 mb-2">
                                <div className={`h-full transition-all duration-500 ${restante === 0 ? "bg-emerald-500" : "bg-yellow-500"}`} style={{ width: `${porcentaje}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Abonado: ${pagado.toLocaleString()}</span>
                                <span>Total: ${proyecto.monto.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* HISTORIAL DE PAGOS */}
                        <h4 className="text-xs text-gray-400 font-bold uppercase mb-3">Historial de Pagos</h4>
                        {proyecto.pagos_cliente && proyecto.pagos_cliente.length > 0 ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 mb-6 scrollbar-thin scrollbar-thumb-gray-600">
                                {proyecto.pagos_cliente.map(p => (
                                    <div key={p.id} className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5 text-sm">
                                        <div>
                                            <p className="text-white font-bold">${p.monto.toLocaleString()}</p>
                                            <p className="text-[10px] text-gray-400">{formatDate(p.fecha_pago)} • {p.referencia || "Sin ref"}</p>
                                        </div>
                                        <span className="text-emerald-500 text-xs">Ingreso ✅</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic mb-6">No hay pagos registrados aún.</p>
                        )}

                        {/* FECHAS */}
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Próximo Cobro</p>
                                <p className={restante === 0 ? "text-emerald-400 font-bold" : "text-white font-medium"}>
                                    {restante === 0 ? "— Pagado —" : formatDate((proyecto as any).fecha_inicio)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Finalización</p>
                                <p className="text-white font-medium">{formatDate(proyecto.fecha_fin)}</p>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                    <div className="flex gap-3">
                        <button
                            onClick={onRegistrarPago}
                            disabled={restante === 0}
                            className={`flex-1 font-bold py-3 rounded-xl shadow-lg transition flex justify-center items-center gap-2 ${restante === 0
                                ? "bg-gray-700 text-gray-400 cursor-not-allowed border border-white/5"
                                : "bg-emerald-600 hover:bg-emerald-500 text-white"
                                }`}
                        >
                            {restante === 0 ? "✅ Proyecto Pagado" : "💵 Registrar Pago"}
                        </button>
                        <button onClick={() => onEditar(proyecto)} className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 rounded-xl transition">✏️</button>
                    </div>

                    {/* Botón Eliminar con Restricción */}
                    {(() => {
                        const totalPagado = proyecto.pagos_cliente?.reduce((sum, p) => sum + p.monto, 0) || 0;
                        const yaPagoTodo = totalPagado >= proyecto.monto && proyecto.monto > 0;

                        return (
                            <button
                                onClick={() => {
                                    toast.error("¿Eliminar este proyecto permanentemente?", {
                                        action: {
                                            label: "Eliminar",
                                            onClick: () => {
                                                onEliminar(proyecto.id, proyecto.cliente_id);
                                                onClose();
                                            }
                                        },
                                        cancel: {
                                            label: "Cancelar",
                                            onClick: () => { }
                                        },
                                        duration: 5000,
                                    });
                                }}
                                disabled={yaPagoTodo}
                                className={`w-full py-2 rounded-xl text-xs font-bold transition uppercase tracking-wider ${!yaPagoTodo
                                    ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                    : "text-gray-600 cursor-not-allowed"
                                    }`}
                            >
                                {!yaPagoTodo ? "🗑️ Eliminar Proyecto" : "🔒 Proyecto protegido (Pagado)"}
                            </button>
                        );
                    })()}
                </div>

            </div>
        </div>
    );
}