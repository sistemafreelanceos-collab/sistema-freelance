"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { Proyecto } from "../../../../types";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  proyecto: Proyecto | null;
  onProyectoActualizado: (p: Proyecto) => void;
  onEliminar: (id: string, clienteId: string) => void;
}

type FrecuenciaProyecto = "unidad" | "semanal" | "quincenal" | "mensual";

export default function ModalEditarProyecto({ isOpen, onClose, proyecto, onProyectoActualizado, onEliminar }: Props) {
  // ... existing code ...


  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    monto: 0,
    moneda: "USD",
    fecha_inicio: "",
    fecha_fin: "",
    frecuencia: "unidad" as FrecuenciaProyecto,
    entregables_totales: 0
  });

  // Cargar datos del proyecto al abrir
  useEffect(() => {
    if (proyecto) {
      setForm({
        nombre: proyecto.nombre,
        monto: proyecto.monto,
        moneda: proyecto.moneda,
        fecha_inicio: proyecto.fecha_inicio || "",
        fecha_fin: proyecto.fecha_fin || "",
        // Recuperamos la frecuencia_pago
        frecuencia: (proyecto.frecuencia_pago as FrecuenciaProyecto) || "unidad",
        entregables_totales: proyecto.entregables_totales || 0
      });
    }
  }, [proyecto]);

  const handleSubmit = async () => {
    if (!proyecto) return;
    if (!form.nombre) return toast.error("El nombre es obligatorio");
    setLoading(true);

    const { data, error } = await supabase.from("proyectos").update({
      nombre: form.nombre,
      monto: form.monto,
      moneda: form.moneda,
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin: form.fecha_fin || null,
      frecuencia_pago: form.frecuencia,
      entregables_totales: form.entregables_totales
    })
      .eq("id", proyecto.id)
      .select("*, movimientos(monto)")
      .single();

    setLoading(false);

    if (!error && data) {
      onProyectoActualizado(data);
      onClose();
    } else {
      toast.error("Error al actualizar: " + error?.message);
    }
  };

  if (!isOpen || !proyecto) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in zoom-in duration-200">
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl w-full max-w-lg shadow-2xl">

        <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Editar Proyecto</h3>
            <p className="text-sm text-gray-400">Editando: <span className="text-emerald-400 font-bold">{proyecto.nombre}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">✕</button>
        </div>

        <div className="space-y-5">
          {/* Nombre */}
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Nombre del Proyecto</label>
            <input
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-emerald-500 transition"
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
                  onChange={e => setForm({ ...form, monto: Number(e.target.value) })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-7 text-white font-mono font-bold outline-none focus:border-emerald-500 transition"
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
              <label className="text-xs text-emerald-400 font-bold uppercase mb-1 block">📅 Fecha Inicio</label>
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={e => setForm({ ...form, fecha_inicio: e.target.value })}
                className="w-full bg-black/40 border border-emerald-500/30 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Frecuencia</label>
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

          {/* Fin y Entregables */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">🏁 Finalización</label>
              <input
                type="date"
                value={form.fecha_fin}
                onChange={e => setForm({ ...form, fecha_fin: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-gray-400 outline-none focus:border-emerald-500 focus:text-white transition"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Meta Entregables</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={form.entregables_totales}
                  onChange={e => setForm({ ...form, entregables_totales: Number(e.target.value) })}
                  className="w-20 bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none"
                />
                <span className="text-xs text-gray-400">items</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 border-t border-white/10 mt-6">
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 text-gray-400 hover:text-white font-medium transition hover:bg-white/5 rounded-xl">Cancelar</button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition transform hover:scale-[1.02]">
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>

          {proyecto && (
            <div className="border-t border-white/5 pt-4 mt-2">
              {(() => {
                const pagado = proyecto.pagos_cliente?.reduce((sum, p) => sum + p.monto, 0) || 0;
                // Permitimos eliminar solo si NO está totalmente pagado.
                // OJO: Si pagado >= monto, bloqueamos.
                const yaPagoTodo = pagado >= proyecto.monto && proyecto.monto > 0;

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
                    className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${!yaPagoTodo
                      ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                      }`}
                  >
                    {!yaPagoTodo ? "🗑️ Eliminar Proyecto" : "🔒 No se puede eliminar (Pagado)"}
                  </button>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}