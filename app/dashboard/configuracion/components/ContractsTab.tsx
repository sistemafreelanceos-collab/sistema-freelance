"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { PlantillaContrato, Clausula } from "../../../../types";
import { toast } from "sonner";

interface Props {
  userId: string;
}

export default function ContractsTab({ userId }: Props) {
  // Estados para Plantillas Maestras
  const [plantillas, setPlantillas] = useState<PlantillaContrato[]>([]);
  const [editP, setEditP] = useState<string | null>(null);
  const [formP, setFormP] = useState({ titulo: "", contenido: "" });

  // Estados para Cláusulas Modulares
  const [clausulas, setClausulas] = useState<Clausula[]>([]);
  const [editC, setEditC] = useState<string | null>(null);
  const [formC, setFormC] = useState({ titulo: "", contenido: "" });

  useEffect(() => {
    if (userId) cargarDatos();
  }, [userId]);

  const cargarDatos = async () => {
    const resP = await supabase.from("plantillas_contratos").select("*").eq("owner_id", userId);
    if (resP.data) setPlantillas(resP.data);

    const resC = await supabase.from("clausulas_contractuales").select("*").eq("owner_id", userId);
    if (resC.data) setClausulas(resC.data);
  };

  // --- HANDLERS PLANTILLAS ---
  const guardarPlantilla = async () => {
    if (!formP.titulo) return;
    if (editP) {
      await supabase.from("plantillas_contratos").update(formP).eq("id", editP);
    } else {
      await supabase.from("plantillas_contratos").insert({ owner_id: userId, ...formP });
    }
    setEditP(null); setFormP({ titulo: "", contenido: "" }); cargarDatos();
  };

  const borrarPlantilla = (id: string) => {
    toast.error("¿Borrar plantilla?", {
      action: {
        label: "Borrar",
        onClick: async () => {
          await supabase.from("plantillas_contratos").delete().eq("id", id);
          cargarDatos();
          toast.success("Plantilla eliminada");
        }
      },
      cancel: { label: "Cancelar", onClick: () => { } }
    });
  };

  // --- HANDLERS CLÁUSULAS ---
  const guardarClausula = async () => {
    if (!formC.titulo) return;
    if (editC) {
      await supabase.from("clausulas_contractuales").update(formC).eq("id", editC);
    } else {
      await supabase.from("clausulas_contractuales").insert({ owner_id: userId, ...formC });
    }
    setEditC(null); setFormC({ titulo: "", contenido: "" }); cargarDatos();
    toast.success("Cláusula guardada");
  };

  const borrarClausula = (id: string) => {
    toast.error("¿Borrar cláusula?", {
      action: {
        label: "Borrar",
        onClick: async () => {
          await supabase.from("clausulas_contractuales").delete().eq("id", id);
          cargarDatos();
          toast.success("Cláusula eliminada");
        }
      },
      cancel: { label: "Cancelar", onClick: () => { } }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">

      {/* --- ZONA 1: PLANTILLAS MAESTRAS --- */}
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b border-white/10 pb-2">
          <h3 className="text-xl font-bold text-white">1. Plantillas Maestras</h3>
          <button onClick={() => { setEditP(null); setFormP({ titulo: "", contenido: "" }); }} className="text-emerald-400 text-xs font-bold">+ Nueva</button>
        </div>

        {/* Editor Plantilla */}
        <div className="bg-[#161B22] border border-white/10 p-4 rounded-xl">
          <input className="w-full bg-black/20 border border-white/10 rounded p-2 text-white mb-2 text-sm font-bold" placeholder="Título (Ej: Contrato Web)" value={formP.titulo} onChange={e => setFormP({ ...formP, titulo: e.target.value })} />
          <div className="flex flex-wrap gap-1 mb-2">
            {["{{CLIENTE}}", "{{PRECIO}}", "{{FECHA}}", "{{MI_NOMBRE}}"].map(v => (
              <button key={v} onClick={() => setFormP(prev => ({ ...prev, contenido: prev.contenido + " " + v }))} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] rounded border border-emerald-500/20 hover:bg-emerald-500/20 transition">{v}</button>
            ))}
          </div>
          <textarea className="w-full bg-black/20 border border-white/10 rounded p-2 text-gray-300 font-mono text-xs h-40 resize-none" placeholder="Escribe el contrato base..." value={formP.contenido} onChange={e => setFormP({ ...formP, contenido: e.target.value })} />
          <button onClick={guardarPlantilla} className="mt-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 rounded text-sm transition">{editP ? "Actualizar" : "Guardar Plantilla"}</button>
        </div>

        {/* Lista Plantillas */}
        <div className="space-y-2">
          {plantillas.map(p => (
            <div key={p.id} onClick={() => { setEditP(p.id); setFormP(p); }} className={`p-2 rounded cursor-pointer flex justify-between items-center border ${editP === p.id ? "bg-white/10 border-emerald-500" : "bg-transparent border-white/5 hover:bg-white/5"}`}>
              <span className="text-white text-xs">{p.titulo}</span>
              {editP === p.id && <button onClick={(e) => { e.stopPropagation(); borrarPlantilla(p.id); }} className="text-red-400 text-[10px]">✕</button>}
            </div>
          ))}
        </div>
      </div>

      {/* --- ZONA 2: CLÁUSULAS MODULARES --- */}
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b border-white/10 pb-2">
          <h3 className="text-xl font-bold text-white">2. Cláusulas Opcionales</h3>
          <button onClick={() => { setEditC(null); setFormC({ titulo: "", contenido: "" }); }} className="text-blue-400 text-xs font-bold">+ Nueva</button>
        </div>

        {/* Editor Cláusula */}
        <div className="bg-[#161B22] border border-white/10 p-4 rounded-xl">
          <input className="w-full bg-black/20 border border-white/10 rounded p-2 text-white mb-2 text-sm font-bold" placeholder="Título (Ej: Pagos Extra)" value={formC.titulo} onChange={e => setFormC({ ...formC, titulo: e.target.value })} />
          <textarea className="w-full bg-black/20 border border-white/10 rounded p-2 text-gray-300 font-mono text-xs h-40 resize-none" placeholder="Texto legal del bloque..." value={formC.contenido} onChange={e => setFormC({ ...formC, contenido: e.target.value })} />
          <button onClick={guardarClausula} className="mt-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 rounded text-sm transition">{editC ? "Actualizar" : "Guardar Cláusula"}</button>
        </div>

        {/* Lista Cláusulas */}
        <div className="space-y-2">
          {clausulas.map(c => (
            <div key={c.id} onClick={() => { setEditC(c.id); setFormC(c); }} className={`p-2 rounded cursor-pointer flex justify-between items-center border ${editC === c.id ? "bg-white/10 border-blue-500" : "bg-transparent border-white/5 hover:bg-white/5"}`}>
              <span className="text-white text-xs">{c.titulo}</span>
              {editC === c.id && <button onClick={(e) => { e.stopPropagation(); borrarClausula(c.id); }} className="text-red-400 text-[10px]">✕</button>}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}