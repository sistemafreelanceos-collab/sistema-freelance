"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { Cliente, Cuenta, Moneda, Proyecto } from "../../../../types";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { useWorkspace } from "@/app/providers/WorkspaceProvider";
import { useQueryClient } from "@tanstack/react-query"; // 🟢 IMPORTANTE: Agregar esto

interface Props {
    isOpen: boolean;
    onClose: () => void;
    cliente: Cliente | null;
    proyecto?: Proyecto | null;
    cuentas: Cuenta[];
    userId: string;
    perfilUsuario: any;
    onPagoRegistrado: (nuevoPago: any, clienteActualizado: Cliente) => void;
}

export default function ModalPago({ isOpen, onClose, cliente, proyecto, cuentas, userId, perfilUsuario, onPagoRegistrado }: Props) {
    const { currentWorkspace } = useWorkspace();
    const queryClient = useQueryClient(); // 🟢 Inicializar el cliente de React Query
    const [loading, setLoading] = useState(false);
    const [archivo, setArchivo] = useState<File | null>(null);

    const [form, setForm] = useState({
        fecha_pago: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
        monto: "",
        moneda: "USD" as Moneda,
        referencia: "",
        cuenta_id: "",
        nota: "",
        tipo: "parcial",
        tasa_cambio: "",  // opcional, solo si moneda del pago ≠ moneda del proyecto
    });

    const [deudaTotal, setDeudaTotal] = useState(0);
    const [pagadoAnteriormente, setPagadoAnteriormente] = useState(0);

    useEffect(() => {
        if (cliente) {
            const principal = cuentas.find(c => c.is_principal)?.id || cuentas[0]?.id || "";

            let montoSugerido = "";
            let deudaCalc = 0;
            let pagadoCalc = 0;

            if (proyecto) {
                deudaCalc = proyecto.monto;
                pagadoCalc = proyecto.pagos_cliente?.reduce((sum, p) => sum + p.monto, 0) || 0;
                const restante = Math.max(0, deudaCalc - pagadoCalc);
                montoSugerido = restante.toString();
            }

            setDeudaTotal(deudaCalc);
            setPagadoAnteriormente(pagadoCalc);

            setForm(prev => ({
                ...prev,
                moneda: proyecto ? (proyecto.moneda as Moneda) : cliente.moneda,
                cuenta_id: principal,
                monto: montoSugerido,
                tipo: "completo"
            }));
            setArchivo(null);
        }
    }, [cliente, proyecto, cuentas, isOpen]);

    const montoIngresado = Number(form.monto) || 0;
    const saldoRestante = proyecto ? Math.max(0, deudaTotal - pagadoAnteriormente - montoIngresado) : 0;
    const esPagoTotal = proyecto ? (pagadoAnteriormente + montoIngresado) >= deudaTotal : false;

    useEffect(() => {
        if (proyecto) {
            setForm(prev => ({ ...prev, tipo: esPagoTotal ? "completo" : "parcial" }));
        }
    }, [montoIngresado, esPagoTotal, proyecto]);

    const calcularProximaFecha = (fechaActual: string, frecuencia: string) => {
        const date = new Date(fechaActual);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() + userTimezoneOffset);

        if (frecuencia === "mensual") localDate.setMonth(localDate.getMonth() + 1);
        else if (frecuencia === "quincenal") localDate.setDate(localDate.getDate() + 15);
        else if (frecuencia === "semanal") localDate.setDate(localDate.getDate() + 7);

        return new Date(localDate.getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    };

    const subirComprobante = async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage.from('comprobantes').upload(fileName, file);
        if (error) throw error;
        const { data: publicUrl } = supabase.storage.from('comprobantes').getPublicUrl(fileName);
        return publicUrl.publicUrl;
    };

    const generarReciboPDF = (pago: any) => {
        if (!cliente) return;
        const doc = new jsPDF();
        doc.text("RECIBO DE PAGO", 14, 22);
        doc.text(`Cliente: ${cliente.nombre}`, 14, 32);
        doc.text(`Monto: $${Number(form.monto).toLocaleString()} ${form.moneda}`, 14, 42);
        if (proyecto) doc.text(`Saldo Restante: $${saldoRestante.toLocaleString()}`, 14, 52);
        doc.save("recibo.pdf");
    };

    const handleSubmit = async () => {
        if (!cliente || !form.cuenta_id) return toast.error("Falta cuenta");
        if (!form.monto || Number(form.monto) <= 0) return toast.error("Ingresa un monto válido");
        if (!form.referencia) return toast.error("La referencia es obligatoria");

        setLoading(true);

        try {
            let comprobanteUrl = null;
            if (archivo) comprobanteUrl = await subirComprobante(archivo);

            // 1. Registrar Pago en tabla PAGOS_CLIENTE
            const { data: pagoRow, error } = await supabase.from("pagos_cliente").insert({
                workspace_id: currentWorkspace?.id,
                cliente_id: cliente.id,
                proyecto_id: proyecto?.id || null,
                cuenta_id: form.cuenta_id,
                fecha_pago: form.fecha_pago,
                monto: Number(form.monto),
                moneda: form.moneda,
                referencia: form.referencia,
                comprobante_url: comprobanteUrl
            }).select().single();

            if (error) throw error;

            // 1.5. CREAR MOVIMIENTO EN FINANZAS (CORREGIDO)
            const { error: errorMov } = await supabase.from("movimientos").insert({
                workspace_id: currentWorkspace?.id,
                cuenta_id: form.cuenta_id,
                proyecto_id: proyecto?.id || null,
                cliente_id: cliente.id,           // <--- Nuevo campo
                pago_cliente_id: pagoRow.id,      // <--- Vinculamos con el ID del pago recien creado
                tipo: 'ingreso',
                monto: Number(form.monto),
                moneda: form.moneda,
                fecha: form.fecha_pago,
                categoria: 'Cobro Cliente',
                descripcion: `${form.referencia} - ${cliente.nombre}` // <--- Usamos descripción en vez de referencia/fuente
                // Eliminamos: owner_id, fuente, referencia (porque no existen en tu tabla)
            });

            if (errorMov) {
                console.error("Error creando movimiento:", errorMov);
                toast.error("El pago se guardó, pero falló al impactar finanzas.");
            }

            // 2. ACTUALIZACIÓN INTELIGENTE DE FECHA
            if (proyecto && esPagoTotal && proyecto.frecuencia_pago && proyecto.frecuencia_pago !== "unidad") {
                const nuevaFecha = calcularProximaFecha(proyecto.fecha_inicio || form.fecha_pago, proyecto.frecuencia_pago);
                await supabase.from("proyectos").update({ fecha_inicio: nuevaFecha }).eq("id", proyecto.id);
                toast.success(`📅 Próximo cobro actualizado a: ${nuevaFecha}`);
            }

            const nuevosPagos = [...(cliente.pagos_cliente || []), { monto: Number(form.monto) }];
            const clienteActualizado = { ...cliente, pagos_cliente: nuevosPagos };

            // 🟢 IMPORTANTE: Actualizar cachés para que se vea reflejado en el Dashboard
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['finanzas'] }), // Actualiza tabla movimientos y gráficos
                queryClient.invalidateQueries({ queryKey: ['cuentas'] }),  // Actualiza saldo de cuentas
                queryClient.invalidateQueries({ queryKey: ['clientes'] })  // Actualiza deuda del cliente
            ]);

            onPagoRegistrado(pagoRow, clienteActualizado);

            toast("Pago registrado correctamente", {
                description: "¿Quieres descargar el recibo?",
                action: {
                    label: "Descargar PDF",
                    onClick: () => generarReciboPDF(pagoRow)
                }
            });
            onClose();

        } catch (error: any) {
            toast.error("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !cliente) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in zoom-in duration-200">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Registrar Pago</h3>

                {proyecto && (
                    <div className={`p-3 rounded-xl border mb-4 flex justify-between items-center ${esPagoTotal ? "bg-emerald-500/10 border-emerald-500/30" : "bg-yellow-500/10 border-yellow-500/30"}`}>
                        <div>
                            <p className={`text-xs font-bold uppercase ${esPagoTotal ? "text-emerald-400" : "text-yellow-400"}`}>
                                {esPagoTotal ? "Pago Completo" : "Abono Parcial"}
                            </p>
                            <p className="text-[10px] text-gray-400">Total Proyecto: ${deudaTotal.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400">Abonado: ${(pagadoAnteriormente + montoIngresado).toLocaleString()}</p>
                            {!esPagoTotal && <p className="text-xs text-white font-bold">Resta: ${saldoRestante.toLocaleString()}</p>}
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input type="date" value={form.fecha_pago} onChange={e => setForm({ ...form, fecha_pago: e.target.value })} className="bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none" />
                        <select value={form.cuenta_id} onChange={e => setForm({ ...form, cuenta_id: e.target.value })} className="bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none">
                            <option value="">Cuenta...</option>
                            {cuentas.map(c => <option key={c.id} value={c.id} className="bg-[#1C2128]">{c.nombre}</option>)}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <input type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} placeholder="0.00" className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-white font-bold text-lg outline-none" />
                        <select
                            value={form.moneda}
                            onChange={e => setForm({ ...form, moneda: e.target.value as Moneda, tasa_cambio: "" })}
                            className="bg-black/40 border border-white/10 p-3 rounded-xl text-white font-bold outline-none focus:border-emerald-500 transition"
                        >
                            {(["USD", "COP", "EUR", "MXN", "ARS", "PEN", "BRL"] as Moneda[]).map(m => (
                                <option key={m} value={m} className="bg-[#1C2128]">{m}</option>
                            ))}
                        </select>
                    </div>

                    {/* Tasa de cambio — aparece solo si la moneda del pago difiere del proyecto */}
                    {proyecto && form.moneda !== proyecto.moneda && (
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                            <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider mb-2">
                                💱 Pago en {form.moneda} — Proyecto en {proyecto.moneda}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 whitespace-nowrap">1 {proyecto.moneda} =</span>
                                <input
                                    type="number"
                                    placeholder={`Tasa en ${form.moneda} (opcional)`}
                                    value={form.tasa_cambio}
                                    onChange={e => setForm({ ...form, tasa_cambio: e.target.value })}
                                    className="flex-1 bg-black/40 border border-white/10 p-2 rounded-lg text-white text-sm outline-none focus:border-blue-500 transition"
                                />
                                <span className="text-xs text-gray-400">{form.moneda}</span>
                            </div>
                            {form.tasa_cambio && Number(form.tasa_cambio) > 0 && Number(form.monto) > 0 && (
                                <p className="text-[10px] text-blue-200/70 mt-1.5">
                                    ≈ {(Number(form.monto) / Number(form.tasa_cambio)).toLocaleString('en-US', { maximumFractionDigits: 2 })} {proyecto.moneda} al cambio ingresado
                                </p>
                            )}
                        </div>
                    )}

                    <input value={form.referencia} onChange={e => setForm({ ...form, referencia: e.target.value })} placeholder="Referencia / Comprobante *" className="w-full bg-black/40 border border-emerald-500/30 p-3 rounded-xl text-white outline-none" />
                    <input type="file" onChange={e => setArchivo(e.target.files?.[0] || null)} className="w-full text-xs text-gray-400" />

                    <div className="flex gap-2 pt-2">
                        <button onClick={onClose} className="flex-1 py-3 text-gray-500">Cancelar</button>
                        <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg">
                            {loading ? "..." : "Confirmar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}