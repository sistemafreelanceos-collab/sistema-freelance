"use client";
import { useState, useMemo } from "react";
import { PlusIcon, TrashIcon, XMarkIcon, DocumentArrowDownIcon } from "@heroicons/react/24/solid";
import { PDFDownloadLink } from "@react-pdf/renderer";
import InvoicePDF from "./InvoicePDF";
import type { InvoiceData, InvoiceItem } from "./invoiceTypes";
import { Proyecto, Cliente } from "../../../../types";

// ── Helpers ──────────────────────────────────────────────────
const TIPO_PREFIX: Record<string, string> = {
    cotizacion: "COT",
    factura: "FAC",
    recibo: "REC",
};

const buildNumero = (tipo: string) => {
    const key = `invoiceCounter_${tipo}`;
    const last = parseInt(localStorage.getItem(key) || "0", 10);
    const next = last + 1;
    localStorage.setItem(key, String(next));
    return `${TIPO_PREFIX[tipo]}-${String(next).padStart(4, "0")}`;
};

// ── Props ─────────────────────────────────────────────────────
interface Props {
    isOpen: boolean;
    onClose: () => void;
    proyecto: Proyecto;
    cliente: Cliente;
    perfil: any;
}

// ── Component ─────────────────────────────────────────────────
export default function PDFBuilderPanel({ isOpen, onClose, proyecto, cliente, perfil }: Props) {
    const accentColor = perfil?.color_tema || "#10B981";

    const [tipoDocumento, setTipoDocumento] = useState<InvoiceData["tipoDocumento"]>("cotizacion");
    const [numeroDocumento] = useState(() => buildNumero("cotizacion"));
    const [numeroCustom, setNumeroCustom] = useState(numeroDocumento);
    const [emisorNit, setEmisorNit] = useState(perfil?.nit || "");
    const [receptorNit, setReceptorNit] = useState((cliente as any)?.nit || "");
    const [notas, setNotas] = useState("");
    const [items, setItems] = useState<InvoiceItem[]>([
        {
            descripcion: proyecto.nombre,
            cantidad: 1,
            precioUnit: proyecto.monto,
            moneda: proyecto.moneda || "USD",
        },
    ]);

    const addItem = () =>
        setItems((prev) => [
            ...prev,
            { descripcion: "", cantidad: 1, precioUnit: 0, moneda: proyecto.moneda || "USD" },
        ]);

    const removeItem = (idx: number) =>
        setItems((prev) => prev.filter((_, i) => i !== idx));

    const updateItem = (idx: number, field: keyof InvoiceItem, value: string | number) =>
        setItems((prev) =>
            prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
        );

    const moneda = items[0]?.moneda || proyecto.moneda || "USD";
    const subtotal = items.reduce((s, i) => s + i.cantidad * i.precioUnit, 0);
    const fmt = (n: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: moneda, maximumFractionDigits: 2 }).format(n);

    const invoiceData: InvoiceData = useMemo(
        () => ({
            tipoDocumento,
            numeroDocumento: numeroCustom,
            accentColor,
            items,
            notas,
            emisorNit: emisorNit || undefined,
            receptorNit: receptorNit || undefined,
        }),
        [tipoDocumento, numeroCustom, accentColor, items, notas, emisorNit, receptorNit]
    );

    if (!isOpen) return null;

    const fileName = `${TIPO_PREFIX[tipoDocumento]}_${cliente.nombre.replace(/ /g, "_")}_${numeroCustom}.pdf`;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-end p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#0F1115] border border-white/10 rounded-2xl w-full max-w-xl h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-right-8 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <div>
                        <h3 className="text-lg font-bold text-white">Constructor de Documento</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Personaliza y descarga tu PDF</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">

                    {/* Tipo de Documento */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Tipo de documento</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["cotizacion", "factura", "recibo"] as const).map((tipo) => (
                                <button
                                    key={tipo}
                                    onClick={() => setTipoDocumento(tipo)}
                                    className={`py-2.5 rounded-xl text-sm font-bold capitalize transition border ${tipoDocumento === tipo
                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                                        : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
                                        }`}
                                >
                                    {tipo === "cotizacion" ? "Cotización" : tipo === "factura" ? "Factura" : "Recibo"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Número de documento */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Número de documento</label>
                        <input
                            value={numeroCustom}
                            onChange={(e) => setNumeroCustom(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono font-bold text-sm outline-none focus:border-emerald-500 transition"
                        />
                    </div>

                    {/* Ítems */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Servicios / Ítems</label>
                            <button
                                onClick={addItem}
                                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition font-bold"
                            >
                                <PlusIcon className="w-3.5 h-3.5" /> Agregar ítem
                            </button>
                        </div>
                        <div className="space-y-2">
                            {items.map((item, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                                    <div className="flex gap-2 items-start">
                                        <input
                                            placeholder="Descripción del servicio"
                                            value={item.descripcion}
                                            onChange={(e) => updateItem(idx, "descripcion", e.target.value)}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 transition"
                                        />
                                        {items.length > 1 && (
                                            <button onClick={() => removeItem(idx)} className="p-2 text-red-400/60 hover:text-red-400 transition">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Cantidad</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={item.cantidad}
                                                onChange={(e) => updateItem(idx, "cantidad", Number(e.target.value))}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono outline-none focus:border-emerald-500 transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Precio unitario</label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={item.precioUnit}
                                                onChange={(e) => updateItem(idx, "precioUnit", Number(e.target.value))}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono outline-none focus:border-emerald-500 transition"
                                            />
                                        </div>
                                    </div>
                                    <div className="text-right text-xs text-emerald-400 font-bold">
                                        Subtotal: {fmt(item.cantidad * item.precioUnit)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Datos Fiscales */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Datos fiscales (opcional)</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Tu NIT / RUC</label>
                                <input
                                    placeholder="Ej: 900123456-7"
                                    value={emisorNit}
                                    onChange={(e) => setEmisorNit(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-emerald-500 transition"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">NIT del cliente</label>
                                <input
                                    placeholder="Ej: 800987654-1"
                                    value={receptorNit}
                                    onChange={(e) => setReceptorNit(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-emerald-500 transition"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Notas al pie</label>
                        <textarea
                            placeholder="Ej: Pago vía transferencia a la cuenta Bancolombia 123-456789-00. Válido por 15 días."
                            value={notas}
                            onChange={(e) => setNotas(e.target.value)}
                            rows={3}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-emerald-500 transition resize-none"
                        />
                    </div>
                </div>

                {/* Footer: total + download */}
                <div className="p-5 border-t border-white/10 bg-white/[0.02] space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Total del documento</span>
                        <span className="text-xl font-bold text-white font-mono">{fmt(subtotal)}</span>
                    </div>
                    <PDFDownloadLink
                        document={<InvoicePDF proyecto={proyecto} cliente={cliente} perfil={perfil} invoiceData={invoiceData} />}
                        fileName={fileName}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all transform hover:scale-[1.01] shadow-lg shadow-emerald-900/30"
                    >
                        {({ loading }) =>
                            loading
                                ? "Generando PDF..."
                                : (<><DocumentArrowDownIcon className="w-5 h-5" /> Descargar {tipoDocumento === "cotizacion" ? "Cotización" : tipoDocumento === "factura" ? "Factura" : "Recibo"}</>)
                        }
                    </PDFDownloadLink>
                </div>
            </div>
        </div>
    );
}
