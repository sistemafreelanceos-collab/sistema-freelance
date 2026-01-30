"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { Cliente, PackServicio, Proyecto } from "../../../../types";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
  packs: PackServicio[];
  userId: string;
  onProyectoCreado: (p: any) => Promise<any>;
}

// Tipo local para manejar la frecuencia dentro del proyecto
type FrecuenciaProyecto = "unidad" | "semanal" | "quincenal" | "mensual";

export default function ModalNuevoProyecto({ isOpen, onClose, cliente, packs, userId, onProyectoCreado }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    monto: "" as number | string, // Permitir string vacío para UX
    moneda: "USD",
    fecha_inicio: "",
    fecha_fin: "",
    frecuencia: "unidad" as FrecuenciaProyecto,
    usar_pack_id: "",
    entregables_totales: 0
  });

  // Resetear formulario al abrir con un cliente
  useEffect(() => {
    if (cliente) {
      setForm(prev => ({
        ...prev,
        moneda: cliente.moneda,
        // Por defecto inicia hoy
        fecha_inicio: new Date().toISOString().split('T')[0]
      }));
    }
  }, [cliente]);

  const aplicarPack = (packId: string) => {
    const pack = packs.find(p => p.id === packId);
    if (pack) {
      setForm({
        ...form,
        nombre: pack.nombre,
        monto: pack.precio_base,
        moneda: pack.moneda,
        usar_pack_id: packId
      });
    } else {
      setForm({ ...form, usar_pack_id: "" });
    }
  };

  const handleSubmit = async () => {
    if (!cliente || !form.nombre) return toast.error("El nombre es obligatorio");
    if (Number(form.monto) <= 0) return toast.error("El monto debe ser mayor a 0");

    // Validar monto
    const montoFinal = Number(form.monto);
    if (isNaN(montoFinal) || montoFinal <= 0) return toast.error("El monto debe ser válido y mayor a 0");

    setLoading(true);

    try {
      // Delegamos la creación al hook (useClientes -> crearProyectoMutation)
      // El hook se encarga de agregar workspace_id y manejar el insert
      await onProyectoCreado({
        cliente_id: cliente.id,
        nombre: form.nombre,
        monto: montoFinal,
        moneda: form.moneda,
        fecha_inicio: form.fecha_inicio || null,
        fecha_fin: form.fecha_fin || null,
        frecuencia_pago: form.frecuencia,
        estado: "pendiente",
        entregables_totales: form.entregables_totales,
        owner_id: userId // Fallback, el hook puede sobreescribirlo o usarlo
      } as any);

      onClose();
      // Reset
      setForm({
        nombre: "",
        monto: "",
        moneda: "USD",
        fecha_inicio: "",
        fecha_fin: "",
        frecuencia: "unidad",
        usar_pack_id: "",
        entregables_totales: 0
      });
    } catch (error: any) {
      console.error(error);
      toast.error("Error al crear: " + (error.message || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !cliente) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in zoom-in duration-200">
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl w-full max-w-lg shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Nuevo Proyecto / Contrato</h3>
            <p className="text-sm text-gray-400">Cliente: <span className="text-emerald-400 font-bold">{cliente.nombre}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">✕</button>
        </div>

        {/* Packs Rápidos */}
        {packs.length > 0 && (
          <div className="mb-6 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
            <label className="text-xs text-emerald-400 block mb-2 font-bold uppercase">⚡ Packs Guardados</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {packs.map(pack => (
                <button
                  key={pack.id}
                  onClick={() => aplicarPack(pack.id)}
                  className={`whitespace-nowrap px-3 py-2 rounded-lg border text-xs font-bold transition ${form.usar_pack_id === pack.id ? "bg-emerald-500 text-black border-emerald-500 shadow-lg" : "bg-black/40 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"}`}
                >
                  {pack.nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-5">

          {/* Nombre */}
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Nombre del Proyecto</label>
            <input
              autoFocus
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-emerald-500 transition"
              placeholder="Ej: Mantenimiento Web 2024"
            />
          </div>

          {/* Monto y Moneda */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Monto</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                <input
                  type="number"
                  value={form.monto}
                  onChange={e => {
                    const val = e.target.value;
                    setForm({ ...form, monto: val === "" ? "" : Number(val) })
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-7 text-white font-mono font-bold outline-none focus:border-emerald-500 transition"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Moneda</label>
              <select
                value={form.moneda}
                onChange={e => setForm({ ...form, moneda: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none font-bold cursor-pointer hover:bg-white/5 transition"
              >
                <option value="USD" className="bg-[#1C2128] text-white">USD</option>
                <option value="COP" className="bg-[#1C2128] text-white">COP</option>
                <option value="EUR" className="bg-[#1C2128] text-white">EUR</option>
                <option value="MXN" className="bg-[#1C2128] text-white">MXN</option>
              </select>
            </div>
          </div>

          {/* Fechas y Frecuencia */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-emerald-400 font-bold uppercase mb-1 block">📅 Fecha de Inicio</label>
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={e => setForm({ ...form, fecha_inicio: e.target.value })}
                className="w-full bg-black/40 border border-emerald-500/30 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Frecuencia de Pago</label>
              <select
                value={form.frecuencia}
                onChange={e => setForm({ ...form, frecuencia: e.target.value as FrecuenciaProyecto })}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none cursor-pointer hover:bg-white/5"
              >
                <option value="unidad" className="bg-[#1C2128] text-white">Único (Una vez)</option>
                <option value="mensual" className="bg-[#1C2128] text-white">Mensual</option>
                <option value="quincenal" className="bg-[#1C2128] text-white">Quincenal</option>
                <option value="semanal" className="bg-[#1C2128] text-white">Semanal</option>
              </select>
            </div>
          </div>

          {/* Fin del Contrato y Entregables */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">🏁 Fin del Proyecto</label>
              <input
                type="date"
                value={form.fecha_fin}
                onChange={e => setForm({ ...form, fecha_fin: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-gray-400 outline-none focus:border-emerald-500 focus:text-white transition"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Entregables (Opcional)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={form.entregables_totales}
                  onChange={e => setForm({ ...form, entregables_totales: Number(e.target.value) })}
                  className="w-20 bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none"
                  placeholder="0"
                />
                <span className="text-xs text-gray-400">items</span>
              </div>
            </div>
          </div>

        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-6 border-t border-white/10 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-gray-400 hover:text-white font-medium transition hover:bg-white/5 rounded-xl"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition transform hover:scale-[1.02]"
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  );
}