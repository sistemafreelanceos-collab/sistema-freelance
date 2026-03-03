"use client";
import { useState, useEffect } from "react";
import { Proveedor, PagoProveedor } from "../../../../types/proveedores";
import { XMarkIcon, ArrowDownTrayIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { descargarReciboPago, ProveedorReciboData } from "./ProveedorReciboPDF";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    proveedor: Proveedor | null;
    montoProyecto?: number;
    cuentas: any[];
    onRegistrar: (pago: Partial<PagoProveedor> & { cuenta_id: string }) => Promise<void>;
}

const MONEDAS = ["USD", "COP", "EUR", "MXN", "ARS", "PEN", "BRL"];

export default function ModalPagoProveedor({ isOpen, onClose, proveedor, montoProyecto = 0, cuentas, onRegistrar }: Props) {
    const [loading, setLoading] = useState(false);
    const [generandoPDF, setGenerandoPDF] = useState(false);
    const [pagoExitoso, setPagoExitoso] = useState<ProveedorReciboData | null>(null);
    const [archivo, setArchivo] = useState<File | null>(null);
    const [form, setForm] = useState({
        monto: "",
        moneda: "USD",
        fecha_pago: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
        descripcion: "",
        cuenta_id: "",
        estado: "pagado" as "pagado" | "pendiente",
    });

    useEffect(() => {
        if (proveedor && isOpen) {
            const principal = cuentas.find(c => c.is_principal)?.id || cuentas[0]?.id || "";
            setForm(prev => ({
                ...prev,
                moneda: proveedor.moneda || "USD",
                cuenta_id: principal,
            }));
            setArchivo(null);
            setPagoExitoso(null);
        }
    }, [proveedor, cuentas, isOpen]);

    const handleSubmit = async () => {
        if (!proveedor || !form.monto || Number(form.monto) <= 0) return;
        if (!form.cuenta_id) return;
        setLoading(true);
        try {
            await onRegistrar({
                proveedor_id: proveedor.id,
                monto: Number(form.monto),
                moneda: form.moneda,
                fecha_pago: form.fecha_pago,
                descripcion: form.descripcion,
                cuenta_id: form.cuenta_id,
                estado: form.estado,
            });

            // Build receipt data for PDF
            const cuentaNombre = cuentas.find(c => c.id === form.cuenta_id)?.nombre || "";
            const num = `PGO-${Date.now().toString().slice(-6)}`;
            setPagoExitoso({
                numero: num,
                fecha: form.fecha_pago,
                proveedor: {
                    nombre: proveedor.nombre,
                    empresa: proveedor.empresa,
                    especialidad: proveedor.especialidad,
                },
                monto: Number(form.monto),
                moneda: form.moneda,
                descripcion: form.descripcion,
                cuenta: cuentaNombre,
                estado: form.estado,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDescargarPDF = async () => {
        if (!pagoExitoso) return;
        setGenerandoPDF(true);
        try {
            await descargarReciboPago(pagoExitoso);
        } finally {
            setGenerandoPDF(false);
        }
    };

    if (!isOpen || !proveedor) return null;

    // ── Success screen ────────────────────────────────────────────────
    if (pagoExitoso) {
        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-[#0D1117] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center">
                    <CheckCircleIcon className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-1">¡Pago Registrado!</h2>
                    <p className="text-gray-400 text-sm mb-2">
                        {new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2 }).format(pagoExitoso.monto)} {pagoExitoso.moneda}
                    </p>
                    <p className="text-xs text-gray-600 mb-6">{pagoExitoso.numero}</p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleDescargarPDF}
                            disabled={generandoPDF}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            {generandoPDF ? "Generando PDF..." : "Descargar Comprobante PDF"}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 text-gray-400 hover:text-white transition text-sm"
                        >
                            Cerrar sin descargar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const pagosAnteriores = (proveedor.pagos_proveedor || [])
        .filter(p => p.estado === "pagado")
        .reduce((s, p) => s + p.monto, 0);
    const pendiente = (proveedor.pagos_proveedor || [])
        .filter(p => p.estado === "pendiente")
        .reduce((s, p) => s + p.monto, 0);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#0D1117] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-bold text-white">Registrar Pago</h2>
                        <p className="text-xs text-gray-400 mt-0.5">→ {proveedor.nombre}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
                        <XMarkIcon className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Resumen del trabajo con barra de progreso */}
                {(() => {
                    const montoAcordado = montoProyecto || 0;
                    const esteAbono = Number(form.monto) || 0;
                    const totalPagadoConEste = pagosAnteriores + esteAbono;
                    const esPagoCompleto = montoAcordado > 0 && totalPagadoConEste >= montoAcordado;
                    const esAbono = montoAcordado > 0 && esteAbono > 0 && !esPagoCompleto;
                    const pct = montoAcordado > 0 ? Math.min(100, Math.round((totalPagadoConEste / montoAcordado) * 100)) : 0;

                    return (
                        <div className={`mx-6 mt-4 rounded-xl border p-3 space-y-2 ${esPagoCompleto ? 'bg-emerald-500/10 border-emerald-500/30' : esAbono ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/10'}`}>
                            {montoAcordado > 0 && (
                                <>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className={`font-bold text-xs uppercase ${esPagoCompleto ? 'text-emerald-400' : esAbono ? 'text-yellow-400' : 'text-gray-400'}`}>
                                            {esPagoCompleto ? '✅ Pago Completo' : esAbono ? '⚡ Abono Parcial' : '💼 Valor del Trabajo'}
                                        </span>
                                        <span className="text-white font-bold font-mono">{pct}%</span>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${esPagoCompleto ? 'bg-emerald-500' : 'bg-yellow-500'}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-500">
                                        <span>Pagado: <span className="text-white font-bold">{totalPagadoConEste.toLocaleString()} {proveedor.moneda}</span></span>
                                        <span>Total acordado: <span className="text-white font-bold">{montoAcordado.toLocaleString()} {proveedor.moneda}</span></span>
                                    </div>
                                    {!esPagoCompleto && montoAcordado > 0 && (
                                        <p className="text-[10px] text-gray-500">
                                            Falta por pagar: <span className="text-red-400 font-bold">{(montoAcordado - totalPagadoConEste).toLocaleString()} {proveedor.moneda}</span>
                                        </p>
                                    )}
                                </>
                            )}
                            {montoAcordado === 0 && (pagosAnteriores > 0 || pendiente > 0) && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Total pagado: <span className="text-emerald-400 font-bold">{pagosAnteriores.toLocaleString()} {proveedor.moneda}</span></span>
                                    {pendiente > 0 && <span className="text-gray-400">Pendiente: <span className="text-red-400 font-bold">{pendiente.toLocaleString()}</span></span>}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* Form */}
                <div className="p-6 space-y-4">
                    {/* Monto + moneda */}
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase mb-1.5 block">💵 Monto a Pagar</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="0.00"
                                value={form.monto}
                                onChange={e => setForm({ ...form, monto: e.target.value })}
                                className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-white font-bold text-lg outline-none focus:border-indigo-500"
                            />
                            <select
                                value={form.moneda}
                                onChange={e => setForm({ ...form, moneda: e.target.value })}
                                className="bg-black/40 border border-white/10 p-3 rounded-xl text-white font-bold outline-none focus:border-indigo-500"
                            >
                                {MONEDAS.map(m => <option key={m} value={m} className="bg-[#1C2128]">{m}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Fecha + Cuenta */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase mb-1.5 block">📅 Fecha del Pago</label>
                            <input
                                type="date"
                                value={form.fecha_pago}
                                onChange={e => setForm({ ...form, fecha_pago: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase mb-1.5 block">🏦 Cuenta de Salida</label>
                            <select
                                value={form.cuenta_id}
                                onChange={e => setForm({ ...form, cuenta_id: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-indigo-500"
                            >
                                <option value="">Seleccionar...</option>
                                {cuentas.map(c => <option key={c.id} value={c.id} className="bg-[#1C2128]">{c.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase mb-1.5 block">📝 Concepto / Descripción</label>
                        <input
                            placeholder="Ej: Anticipo 50% diseño de logo"
                            value={form.descripcion}
                            onChange={e => setForm({ ...form, descripcion: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-indigo-500"
                        />
                    </div>


                    {/* Comprobante */}
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase mb-1.5 block">🧾 Comprobante (opcional)</label>
                        <input
                            type="file"
                            onChange={e => setArchivo(e.target.files?.[0] || null)}
                            className="w-full text-xs text-gray-400"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-gray-400 hover:text-white transition">Cancelar</button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !form.monto || !form.cuenta_id}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
                    >
                        {loading ? "Registrando..." : "Confirmar Pago"}
                    </button>
                </div>
            </div>
        </div>
    );
}
