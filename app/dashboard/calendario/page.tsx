"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

// --- TIPOS CORREGIDOS ---
// Aquí estaba el error: definimos explícitamente qué textos son válidos
type Categoria = "Urgente" | "Diseño" | "Dev" | "Reunión" | "Admin";

type Tarea = {
  id: string;
  titulo: string;
  fecha: string; // ISO String
  categoria: Categoria | string; // Permitimos string para evitar bloqueos
  descripcion?: string;
  completada: boolean;
};

// Configuración de colores por categoría
const CATEGORIAS: Record<string, string> = {
  Urgente: "bg-red-500",
  Diseño: "bg-purple-500",
  Dev: "bg-blue-500",
  Reunión: "bg-yellow-500",
  Admin: "bg-gray-500",
};

export default function CalendarioPage() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"Todas" | Categoria>("Todas");

  // Estados para Modales
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);

  // Estado del Formulario
  const [formulario, setFormulario] = useState({
    titulo: "",
    descripcion: "",
    fecha: "",
    categoria: "Diseño" as string, // Forzamos a string genérico para evitar error
  });

  // Cargar Tareas al inicio
  useEffect(() => {
    cargarTareas();
  }, []);

  const cargarTareas = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("tareas")
      .select("*")
      .eq("owner_id", session.user.id)
      .order("fecha", { ascending: true });

    if (!error && data) {
      setTareas(data as Tarea[]);
    }
    setLoading(false);
  };

  // Crear Nueva Tarea
  const guardarTarea = async () => {
    if (!formulario.titulo || !formulario.fecha) return alert("Faltan datos");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const nuevaTarea = {
      owner_id: session.user.id,
      titulo: formulario.titulo,
      descripcion: formulario.descripcion,
      fecha: formulario.fecha,
      categoria: formulario.categoria,
      completada: false
    };

    const { error } = await supabase.from("tareas").insert(nuevaTarea);

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      setModalNuevoAbierto(false);
      resetFormulario();
      cargarTareas();
    }
  };

  // Borrar Tarea
  const borrarTarea = async (id: string) => {
    const confirmar = confirm("¿Seguro de borrar esta tarea?");
    if (!confirmar) return;

    const { error } = await supabase.from("tareas").delete().eq("id", id);
    if (!error) {
      setTareaSeleccionada(null);
      cargarTareas();
    }
  };

  // Completar Tarea
  const toggleCompletada = async (tarea: Tarea) => {
    const { error } = await supabase
      .from("tareas")
      .update({ completada: !tarea.completada })
      .eq("id", tarea.id);

    if (!error) cargarTareas();
  };

  // Helpers de UI
  const resetFormulario = () => setFormulario({ titulo: "", descripcion: "", fecha: new Date().toISOString().split('T')[0], categoria: "Diseño" });
  
  const abrirModalCrear = () => { 
    resetFormulario(); 
    setModalNuevoAbierto(true); 
  };

  const abrirModalDetalle = (tarea: Tarea) => { 
    setTareaSeleccionada(tarea); 
    // Al abrir detalle, no necesitamos llenar el formulario de creación, solo mostrar datos.
  };

  // Filtrado visual
  const tareasFiltradas = filtro === "Todas" 
    ? tareas 
    : tareas.filter(t => t.categoria === filtro);

  if (loading) return <div className="text-white text-center py-20">Cargando calendario...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Agenda & Tareas</h1>
          <p className="text-gray-400">Organiza tus entregas y reuniones.</p>
        </div>
        <button 
          onClick={abrirModalCrear}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-emerald-900/20 transition flex items-center gap-2"
        >
          <span>+</span> Nueva Tarea
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["Todas", "Urgente", "Diseño", "Dev", "Reunión", "Admin"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFiltro(cat as any)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition whitespace-nowrap ${
              filtro === cat 
                ? "bg-white text-black border-white" 
                : "bg-transparent text-gray-400 border-gray-700 hover:border-gray-500"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de Tareas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tareasFiltradas.length === 0 ? (
          <p className="text-gray-500 col-span-full text-center py-10">No hay tareas en esta vista.</p>
        ) : (
          tareasFiltradas.map((tarea) => (
            <div 
              key={tarea.id}
              onClick={() => abrirModalDetalle(tarea)}
              className={`group p-4 rounded-xl border border-white/5 bg-[#161B22] hover:border-white/20 transition cursor-pointer relative overflow-hidden ${tarea.completada ? 'opacity-50 grayscale' : ''}`}
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${CATEGORIAS[tarea.categoria as string] || 'bg-gray-500'}`}></div>
              
              <div className="pl-3">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white/90 ${CATEGORIAS[tarea.categoria as string] || 'bg-gray-500'}`}>
                    {tarea.categoria}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {tarea.fecha}
                  </span>
                </div>
                
                <h3 className={`font-bold text-white mb-1 group-hover:text-emerald-400 transition ${tarea.completada ? 'line-through' : ''}`}>
                  {tarea.titulo}
                </h3>
                
                {tarea.descripcion && (
                  <p className="text-sm text-gray-400 line-clamp-2">{tarea.descripcion}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL NUEVA TAREA */}
      {modalNuevoAbierto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161B22] border border-white/10 p-6 rounded-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-white mb-4">Nueva Tarea</h2>
            
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Título de la tarea..." 
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                value={formulario.titulo}
                onChange={e => setFormulario({...formulario, titulo: e.target.value})}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="date" 
                  className="bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                  value={formulario.fecha}
                  onChange={e => setFormulario({...formulario, fecha: e.target.value})}
                />
                <select 
                  className="bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                  value={formulario.categoria}
                  onChange={e => setFormulario({...formulario, categoria: e.target.value})}
                >
                  {Object.keys(CATEGORIAS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <textarea 
                placeholder="Descripción (opcional)..." 
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-emerald-500 outline-none h-24 resize-none"
                value={formulario.descripcion}
                onChange={e => setFormulario({...formulario, descripcion: e.target.value})}
              />

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalNuevoAbierto(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition">Cancelar</button>
                <button onClick={guardarTarea} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-emerald-900/20">Guardar Tarea</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE TAREA */}
      {tareaSeleccionada && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161B22] border border-white/10 p-6 rounded-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
                <span className={`text-xs font-bold uppercase px-2 py-1 rounded text-white ${CATEGORIAS[tareaSeleccionada.categoria as string] || 'bg-gray-500'}`}>
                    {tareaSeleccionada.categoria}
                </span>
                <button onClick={() => setTareaSeleccionada(null)} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <h2 className={`text-2xl font-bold text-white mb-2 ${tareaSeleccionada.completada ? 'line-through opacity-50' : ''}`}>
                {tareaSeleccionada.titulo}
            </h2>
            <p className="text-gray-400 mb-6">{tareaSeleccionada.descripcion || "Sin descripción"}</p>
            
            <div className="flex flex-col gap-3">
                <button 
                    onClick={() => toggleCompletada(tareaSeleccionada)}
                    className={`w-full py-3 rounded-xl font-bold border transition ${
                        tareaSeleccionada.completada 
                        ? "border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10" 
                        : "border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
                    }`}
                >
                    {tareaSeleccionada.completada ? "Marcar como Pendiente ↺" : "Marcar Completada ✓"}
                </button>
                
                <button 
                    onClick={() => borrarTarea(tareaSeleccionada.id)}
                    className="w-full py-3 rounded-xl font-bold text-red-400 hover:bg-red-500/10 transition"
                >
                    Eliminar Tarea
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}