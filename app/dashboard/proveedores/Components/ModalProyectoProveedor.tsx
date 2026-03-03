"use client";
import { useState, useEffect } from "react";
import { ProyectoProveedor } from "../../../../types/proveedores";
import { XMarkIcon } from "@heroicons/react/24/solid";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onGuardar: (data: Partial<ProyectoProveedor>) => Promise<void>;
    proyectoEditar?: ProyectoProveedor | null;
}

const MONEDAS = ["USD", "COP", "EUR", "MXN", "ARS", "PEN", "BRL"];
const ESTADOS = [
    { value: "pendiente", label: "⏸️ Pendiente", color: "bg-gray-600 border-gray-500" },
    { value: "en_progreso", label: "🔄 En Progreso", color: "bg-blue-600 border-blue-500" },
    { value: "completado", label: "✅ Completado", color: "bg-emerald-600 border-emerald-500" },
] as const;

export default function ModalProyectoProveedor({ isOpen, onClose, onGuardar, proyectoEditar }: Props) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        nombre: "",
        descripcion: "",
        monto: "",
        moneda: "USD",
        estado: "en_progreso" as ProyectoProveedor["estado"],
        fecha_pago: "",
    });

    useEffect(() => {
        if (isOpen) {
            setForm({
                nombre: proyectoEditar?.nombre || "",
                descripcion: proyectoEditar?.descripcion || "",
                monto: proyectoEditar?.monto?.toString() || "",
                moneda: proyectoEditar?.moneda || "USD",
                estado: proyectoEditar?.estado || "en_progreso",
                fecha_pago: proyectoEditar?.fecha_pago || "",
            });
        }
    }, [isOpen, proyectoEditar]);

    const handleSubmit = async () => {
        if (!form.nombre.trim() || !form.monto) return;
        setLoading(true);
        try {
            await onGuardar({
                nombre: form.nombre,
                descripcion: form.descripcion || null,
                monto: Number(form.monto),
                moneda: form.moneda,
                estado: form.estado,
                fecha_pago: form.fecha_pago || null,
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#0D1117] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">
                        {proyectoEditar ? "Editar Proyecto" : "Nuevo Proyecto"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
                        <XMarkIcon className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Nombre del Proyecto *</label>
                        <input
                            value={form.nombre}
                            onChange={e => setForm({ ...form, nombre: e.target.value })}
                            placeholder="Ej: Diseño de logo, Banner web..."
                            className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Descripción</label>
                        <textarea
                            value={form.descripcion}
                            onChange={e => setForm({ ...form, descripcion: e.target.value })}
                            placeholder="Detalles del trabajo..."
                            rows={2}
                            className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-indigo-500 resize-none"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">💰 Valor del Proyecto *</label>
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

                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Estado</label>
                        <div className="flex gap-2">
                            {ESTADOS.map(est => (
                                <button
                                    key={est.value}
                                    onClick={() => setForm({ ...form, estado: est.value })}
                                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${form.estado === est.value ? est.color + ' text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    {est.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">📅 Fecha de Pago</label>
                        <input
                            type="date"
                            value={form.fecha_pago}
                            onChange={e => setForm({ ...form, fecha_pago: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-white/10 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-gray-400 hover:text-white transition">Cancelar</button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !form.nombre.trim() || !form.monto}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
                    >
                        {loading ? "Guardando..." : proyectoEditar ? "Actualizar" : "Crear Proyecto"}
                    </button>
                </div>
            </div>
        </div>
    );
}
