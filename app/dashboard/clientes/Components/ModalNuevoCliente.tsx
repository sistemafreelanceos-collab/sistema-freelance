"use client";
import { useState } from "react";
// import { supabase } from "../../../../lib/supabaseClient"; 
// import { Cliente } from "../../../../types"; 
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onClienteCreado: (c: any) => Promise<any>;
  userId: string;
}

export default function ModalNuevoCliente({ isOpen, onClose, onClienteCreado, userId }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    notas: "" // 🟢 CORREGIDO: Plural (antes era 'nota')
  });

  const handleSubmit = async () => {
    if (!form.nombre) return toast.error("El nombre es obligatorio");
    setLoading(true);

    try {
      // Delegamos la creación al hook (que maneja workspace_id y RLS)
      await onClienteCreado({
        // owner_id: userId, // Ya no se envía
        nombre: form.nombre,
        empresa: form.empresa,
        email: form.email,
        telefono: form.telefono,
        notas: form.notas, // 🟢 CORREGIDO: Plural
        estado: 'activo',
        moneda: 'USD',
        frecuencia_pago: 'unico'
      });

      onClose();
      // Limpiamos el formulario
      setForm({ nombre: "", empresa: "", email: "", telefono: "", notas: "" });
    } catch (error: any) {
      console.error(error);
      toast.error("Error al crear: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">

        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h3 className="text-white font-bold text-xl">Nuevo Cliente</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-emerald-400 font-bold uppercase mb-1 block">Nombre del Cliente *</label>
            <input
              autoFocus
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Juan Pérez"
              className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Empresa / Negocio (Opcional)</label>
            <input
              value={form.empresa}
              onChange={e => setForm({ ...form, empresa: e.target.value })}
              placeholder="Ej: Tech Solutions Inc."
              className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Email</label>
              <input
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="contacto@email.com"
                className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white text-sm outline-none focus:border-emerald-500 transition"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Teléfono</label>
              <input
                value={form.telefono}
                onChange={e => setForm({ ...form, telefono: e.target.value })}
                placeholder="+57 300..."
                className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white text-sm outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Notas Internas</label>
            <textarea
              value={form.notas} // 🟢 CORREGIDO: Plural
              onChange={e => setForm({ ...form, notas: e.target.value })} // 🟢 CORREGIDO: Plural
              placeholder="Detalles importantes..."
              className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white text-sm outline-none focus:border-emerald-500 transition h-20 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10 mt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-gray-400 hover:text-white font-medium transition hover:bg-white/5 rounded-xl"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 disabled:opacity-50 transition transform hover:scale-[1.02]"
            >
              {loading ? "Guardando..." : "Crear Cliente"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}