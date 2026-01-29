"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { PlantillaServicio } from "../../../../types";

interface Props {
  userId: string;
  monedas: string[];
}

export default function ServicesTab({ userId, monedas }: Props) {
  const [servicios, setServicios] = useState<PlantillaServicio[]>([]);
  const [form, setForm] = useState<Partial<PlantillaServicio>>({ nombre: "", descripcion: "", precio_base: 0, moneda: "USD" });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Cargar al inicio
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("plantillas_proyectos").select("*").eq("owner_id", userId);
      if (data) setServicios(data);
    };
    if (userId) load();
  }, [userId]);

  const guardar = async () => {
    if (!form.nombre || !userId) return;
    setLoading(true);

    if (editId) {
      // Editar
      await supabase.from("plantillas_proyectos").update(form).eq("id", editId);
      setServicios(prev => prev.map(s => s.id === editId ? { ...s, ...form } as PlantillaServicio : s));
    } else {
      // Crear
      const { data } = await supabase.from("plantillas_proyectos").insert({ owner_id: userId, ...form }).select().single();
      if (data) setServicios([...servicios, data]);
    }

    // Reset
    setLoading(false);
    setEditId(null);
    setForm({ nombre: "", descripcion: "", precio_base: 0, moneda: "USD" });
  };

  const borrar = async (id: string) => {
    if (!confirm("¿Eliminar servicio?")) return;
    await supabase.from("plantillas_proyectos").delete().eq("id", id);
    setServicios(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn pb-10">

      {/* COLUMNA 1: LISTA (Izquierda) */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        <button
          onClick={() => { setEditId(null); setForm({ nombre: "", descripcion: "", precio_base: 0, moneda: "USD" }); }}
          className="w-full py-3 border border-dashed border-emerald-500/30 text-emerald-400 rounded-xl font-bold text-sm hover:bg-emerald-500/10 transition"
        >
          + Nuevo Servicio
        </button>

        {servicios.map(s => (
          <div
            key={s.id}
            onClick={() => { setEditId(s.id); setForm(s); }}
            // AQUÍ CAMBIAMOS EL FONDO NEGRO POR TRANSPARENTE 👇
            className={`p-4 rounded-xl cursor-pointer border transition ${editId === s.id
                ? "bg-white/10 border-emerald-500 shadow-lg shadow-emerald-500/10"
                : "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10"
              }`}
          >
            <div className="flex justify-between items-center">
              <h4 className="text-white font-bold text-sm">{s.nombre}</h4>
              <span className="text-emerald-400 text-xs font-mono font-bold bg-emerald-500/10 px-2 py-1 rounded">
                {s.precio_base} {s.moneda}
              </span>
            </div>
            {s.descripcion && <p className="text-xs text-gray-400 mt-1 truncate">{s.descripcion}</p>}
          </div>
        ))}

        {servicios.length === 0 && (
          <p className="text-center text-xs text-gray-500 py-4 italic">No tienes servicios guardados.</p>
        )}
      </div>

      {/* COLUMNA 2: FORMULARIO (Derecha) */}
      {/* AQUÍ CAMBIAMOS EL FONDO NEGRO POR TRANSPARENTE 👇 */}
      <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl h-fit">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          {editId ? "✏️ Editar Servicio" : "📦 Crear Nuevo Pack"}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1 font-bold uppercase">Nombre del Pack</label>
            <input
              className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-emerald-500 outline-none transition"
              placeholder="Ej: Pack Redes Básico (Mensual)"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1 font-bold uppercase">Descripción</label>
            <textarea
              className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white h-24 focus:border-emerald-500 outline-none transition resize-none"
              placeholder="Ej: Incluye 12 posts, 4 historias y reporte mensual..."
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-bold uppercase">Precio Base</label>
              <input
                type="number"
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-emerald-500 outline-none transition"
                placeholder="0.00"
                value={form.precio_base}
                onChange={e => setForm({ ...form, precio_base: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-bold uppercase">Moneda</label>
              <select
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-emerald-500 outline-none transition cursor-pointer"
                value={form.moneda}
                onChange={e => setForm({ ...form, moneda: e.target.value })}
              >
                {monedas.map(m => <option key={m} value={m} className="bg-[#161B22]">{m}</option>)}
                {monedas.length === 0 && <option value="USD" className="bg-[#161B22]">USD</option>}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
            {editId && (
              <button
                onClick={() => borrar(editId)}
                className="text-red-400 text-sm px-4 hover:text-red-300 hover:underline transition"
              >
                Eliminar
              </button>
            )}
            <button
              onClick={guardar}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg hover:shadow-emerald-900/20 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? "Guardando..." : "💾 Guardar Servicio"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}