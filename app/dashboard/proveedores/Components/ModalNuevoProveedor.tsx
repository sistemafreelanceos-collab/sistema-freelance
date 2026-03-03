"use client";
import { useState, useEffect } from "react";
import { Proveedor } from "../../../../types/proveedores";
import { XMarkIcon } from "@heroicons/react/24/solid";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onGuardar: (data: Partial<Proveedor>) => Promise<void>;
    proveedorEditar?: Proveedor | null;
}

const MONEDAS = ["USD", "COP", "EUR", "MXN", "ARS", "PEN", "BRL"];

export default function ModalNuevoProveedor({ isOpen, onClose, onGuardar, proveedorEditar }: Props) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        nombre: "",
        empresa: "",
        email: "",
        telefono: "",
        nit: "",
        notas: "",
    });

    useEffect(() => {
        if (proveedorEditar) {
            setForm({
                nombre: proveedorEditar.nombre || "",
                empresa: proveedorEditar.empresa || "",
                email: proveedorEditar.email || "",
                telefono: proveedorEditar.telefono || "",
                nit: proveedorEditar.nit || "",
                notas: proveedorEditar.notas || "",
            });
        } else {
            setForm({ nombre: "", empresa: "", email: "", telefono: "", nit: "", notas: "" });
        }
    }, [proveedorEditar, isOpen]);

    const handleSubmit = async () => {
        if (!form.nombre.trim()) return;
        setLoading(true);
        try {
            await onGuardar({ ...form, activo: true });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#0D1117] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">
                        {proveedorEditar ? "Editar Proveedor" : "Nuevo Proveedor"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
                        <XMarkIcon className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Nombre *</label>
                            <input
                                value={form.nombre}
                                onChange={e => setForm({ ...form, nombre: e.target.value })}
                                placeholder="Ej: Juan Pérez"
                                className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Empresa</label>
                            <input
                                value={form.empresa}
                                onChange={e => setForm({ ...form, empresa: e.target.value })}
                                placeholder="Empresa S.A.S"
                                className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">NIT / RUT</label>
                            <input
                                value={form.nit}
                                onChange={e => setForm({ ...form, nit: e.target.value })}
                                placeholder="900.123.456-7"
                                className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                placeholder="proveedor@email.com"
                                className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Teléfono</label>
                            <input
                                value={form.telefono}
                                onChange={e => setForm({ ...form, telefono: e.target.value })}
                                placeholder="+57 300 123 4567"
                                className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Notas</label>
                            <textarea
                                value={form.notas}
                                onChange={e => setForm({ ...form, notas: e.target.value })}
                                placeholder="Condiciones de pago, banco, etc."
                                rows={3}
                                className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-indigo-500 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-gray-400 hover:text-white transition">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !form.nombre.trim()}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
                    >
                        {loading ? "Guardando..." : proveedorEditar ? "Actualizar" : "Crear Proveedor"}
                    </button>
                </div>
            </div>
        </div>
    );
}
