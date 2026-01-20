"use client";
import { useState, useEffect } from "react";

// --- TIPOS ---
type Tarea = {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:MM
  etiqueta: "Urgente" | "Diseño" | "Dev" | "Reunión" | "Admin";
  tiempoRegistrado: number;
  enProgreso: boolean;
};

export default function CalendarioPage() {
  const [vista, setVista] = useState<"mes" | "semana" | "dia" | "lista">("mes");
  const [fechaVisual, setFechaVisual] = useState(new Date(2026, 0, 12)); 

  // --- ESTADOS DE MODALES ---
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  const [formulario, setFormulario] = useState({
    titulo: "",
    descripcion: "",
    fecha: new Date().toISOString().split('T')[0],
    hora: "09:00",
    etiqueta: "Diseño" as const
  });

  // Base de Datos Tareas
  const [tareas, setTareas] = useState<Tarea[]>([
    { id: 1, titulo: "Diseñar Home App", descripcion: "Hacer wireframes en Figma", fecha: "2026-01-12", horaInicio: "09:00", etiqueta: "Diseño", tiempoRegistrado: 125, enProgreso: false },
    { id: 2, titulo: "Reunión Gabriela", descripcion: "Revisar avances", fecha: "2026-01-12", horaInicio: "14:00", etiqueta: "Reunión", tiempoRegistrado: 0, enProgreso: false },
    { id: 3, titulo: "Corregir Bugs", descripcion: "Error login", fecha: "2026-01-15", horaInicio: "10:30", etiqueta: "Dev", tiempoRegistrado: 45, enProgreso: true },
    { id: 4, titulo: "Factura Enero", descripcion: "", fecha: "2026-01-28", horaInicio: "16:00", etiqueta: "Admin", tiempoRegistrado: 10, enProgreso: false },
    { id: 5, titulo: "Lanzamiento V2", descripcion: "Deploy", fecha: "2026-02-05", horaInicio: "10:00", etiqueta: "Urgente", tiempoRegistrado: 0, enProgreso: false },
  ]);

  // --- LÓGICA CRUD (Igual que antes) ---
  const guardarNuevaTarea = (e: React.FormEvent) => {
    e.preventDefault();
    const nueva: Tarea = { id: Date.now(), titulo: formulario.titulo, descripcion: formulario.descripcion, fecha: formulario.fecha, horaInicio: formulario.hora, etiqueta: formulario.etiqueta, tiempoRegistrado: 0, enProgreso: false };
    setTareas([...tareas, nueva]); setModalNuevoAbierto(false); resetFormulario();
  };

  const actualizarTarea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tareaSeleccionada) return;
    const tareasActualizadas = tareas.map(t => t.id === tareaSeleccionada.id ? { ...t, ...formulario, horaInicio: formulario.hora } : t);
    setTareas(tareasActualizadas); setModalDetalleAbierto(false); setModoEdicion(false);
  };

  const eliminarTarea = () => {
    if (!tareaSeleccionada) return;
    if (confirm("¿Borrar tarea?")) { setTareas(tareas.filter(t => t.id !== tareaSeleccionada.id)); setModalDetalleAbierto(false); }
  };

  const abrirModalCrear = () => { resetFormulario(); setModalNuevoAbierto(true); };
  const abrirModalDetalle = (tarea: Tarea) => { setTareaSeleccionada(tarea); setFormulario({ titulo: tarea.titulo, descripcion: tarea.descripcion || "", fecha: tarea.fecha, hora: tarea.horaInicio, etiqueta: tarea.etiqueta }); setModoEdicion(false); setModalDetalleAbierto(true); };
  const resetFormulario = () => setFormulario({ titulo: "", descripcion: "", fecha: new Date().toISOString().split('T')[0], hora: "09:00", etiqueta: "Diseño" });

  const navegar = (dir: number) => {
    const nueva = new Date(fechaVisual);
    if (vista === 'mes' || vista === 'lista') nueva.setMonth(nueva.getMonth() + dir);
    else if (vista === 'semana') nueva.setDate(nueva.getDate() + (dir * 7));
    else if (vista === 'dia') nueva.setDate(nueva.getDate() + dir);
    setFechaVisual(nueva);
  };
  const irAHoy = () => setFechaVisual(new Date(2026, 0, 12));

  useEffect(() => { const i = setInterval(() => setTareas(c => c.map(t => t.enProgreso ? { ...t, tiempoRegistrado: t.tiempoRegistrado + 1 } : t)), 60000); return () => clearInterval(i); }, []);
  const toggleTimer = (id: number) => setTareas(tareas.map(t => t.id === id ? { ...t, enProgreso: !t.enProgreso } : t));

  const formatearTiempo = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;
  const obtenerTitulo = () => vista === 'dia' ? fechaVisual.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : fechaVisual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  
  const getColorEtiqueta = (tag: string) => {
    const c: any = { "Urgente": "bg-red-500/20 text-red-300 border-red-500/30", "Diseño": "bg-purple-500/20 text-purple-300 border-purple-500/30", "Dev": "bg-blue-500/20 text-blue-300 border-blue-500/30", "Reunión": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", "Admin": "bg-gray-500/20 text-gray-300 border-gray-500/30" };
    return c[tag] || "bg-gray-700 text-gray-300";
  };

  // --- VISTAS RESPONSIVE ---
  // El truco es usar 'overflow-x-auto' y 'min-w-[XXXpx]' para permitir scroll en móvil

  const VistaMes = () => {
    const year = fechaVisual.getFullYear();
    const month = fechaVisual.getMonth();
    const primerDia = new Date(year, month, 1).getDay();
    const offset = primerDia === 0 ? 6 : primerDia - 1; 
    const diasTotal = new Date(year, month + 1, 0).getDate();

    return (
      <div className="bg-[#161B22] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex-1 flex flex-col overflow-x-auto">
        {/* Contenedor ancho mínimo para forzar scroll en móvil */}
        <div className="min-w-[800px] h-full flex flex-col">
            <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-[#0F1115]">
            {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} className="border-r border-b border-white/5"></div>)}
            {Array.from({ length: diasTotal }, (_, i) => i + 1).map(dia => {
                const fStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
                const ts = tareas.filter(t => t.fecha === fStr);
                return (
                <div key={dia} className="min-h-[100px] border-r border-b border-white/5 p-1 hover:bg-white/[0.02] transition relative group">
                    <span className={`text-xs font-bold block mb-1 w-5 h-5 flex items-center justify-center rounded-full ${fStr === '2026-01-12' ? 'bg-red-500 text-white' : 'text-gray-500'}`}>{dia}</span>
                    <div className="space-y-1">
                    {ts.map(t => (
                        <div key={t.id} onClick={() => abrirModalDetalle(t)} className="bg-[#1C2128] border border-white/10 p-1 rounded hover:border-emerald-500/50 cursor-pointer overflow-hidden">
                        <div className="flex items-center gap-1 overflow-hidden">
                            <span className="text-[9px] font-mono text-emerald-400/80 shrink-0">{t.horaInicio}</span>
                            <span className={`text-[8px] px-1 rounded truncate ${getColorEtiqueta(t.etiqueta)}`}>{t.etiqueta}</span>
                        </div>
                        <p className="text-[10px] text-gray-200 truncate pl-0.5">{t.titulo}</p>
                        </div>
                    ))}
                    </div>
                </div>
                );
            })}
            </div>
        </div>
      </div>
    );
  };

  const VistaSemana = () => {
    const diaSemana = fechaVisual.getDay();
    const diff = fechaVisual.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1); 
    const lunes = new Date(fechaVisual); lunes.setDate(diff);
    const dias = Array.from({ length: 7 }, (_, i) => { const d = new Date(lunes); d.setDate(lunes.getDate() + i); return d; });

    return (
      <div className="bg-[#161B22] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex-1 flex flex-col overflow-x-auto">
        <div className="min-w-[800px] h-full flex flex-col">
            <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
            {dias.map((d, i) => (
                <div key={i} className={`py-2 text-center border-r border-white/5 last:border-0 ${d.getDate() === fechaVisual.getDate() ? 'bg-emerald-500/10' : ''}`}>
                <p className="text-[10px] uppercase text-gray-400 font-bold">{d.toLocaleDateString('es-ES', { weekday: 'short' })}</p>
                <p className={`text-sm font-bold ${d.getDate() === fechaVisual.getDate() ? 'text-emerald-400' : 'text-white'}`}>{d.getDate()}</p>
                </div>
            ))}
            </div>
            <div className="grid grid-cols-7 flex-1 bg-[#0F1115] divide-x divide-white/5">
            {dias.map((d, i) => {
                const fStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                const ts = tareas.filter(t => t.fecha === fStr);
                return (
                <div key={i} className="p-2 min-h-[400px] hover:bg-white/[0.02]">
                    {ts.map(t => (
                    <div key={t.id} onClick={() => abrirModalDetalle(t)} className="mb-2 bg-[#1C2128] border border-white/10 p-2 rounded cursor-pointer hover:border-emerald-500/50 border-l-2 border-l-emerald-500">
                        <p className="text-[10px] font-bold text-gray-400">{t.horaInicio}</p>
                        <p className="text-xs text-white font-medium truncate">{t.titulo}</p>
                    </div>
                    ))}
                </div>
                );
            })}
            </div>
        </div>
      </div>
    );
  };

  // Vista Día y Lista ya son "friendly" en móvil por naturaleza, pero ajustamos padding
  const VistaDia = () => {
    const fStr = `${fechaVisual.getFullYear()}-${(fechaVisual.getMonth() + 1).toString().padStart(2, '0')}-${fechaVisual.getDate().toString().padStart(2, '0')}`;
    const ts = tareas.filter(t => t.fecha === fStr).sort((a,b) => a.horaInicio > b.horaInicio ? 1 : -1);

    return (
      <div className="bg-[#161B22] border border-white/10 rounded-xl overflow-hidden p-4 md:p-6 max-w-3xl mx-auto w-full h-full overflow-y-auto">
        <div className="flex items-center gap-4 mb-6">
           <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-600 rounded-xl flex flex-col items-center justify-center border-2 border-[#0F1115] shadow-lg shrink-0">
              <span className="text-[10px] md:text-xs font-bold uppercase text-emerald-200">{fechaVisual.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
              <span className="text-xl md:text-2xl font-bold text-white">{fechaVisual.getDate()}</span>
           </div>
           <div>
             <h2 className="text-lg md:text-2xl font-bold text-white capitalize">{fechaVisual.toLocaleDateString('es-ES', { weekday: 'long' })}</h2>
             <p className="text-gray-400 text-xs md:text-sm">Agenda detallada</p>
           </div>
        </div>
        <div className="space-y-4 relative pl-4 border-l border-gray-800 ml-2 md:ml-8">
          {ts.length > 0 ? ts.map(t => (
            <div key={t.id} onClick={() => abrirModalDetalle(t)} className="relative group cursor-pointer">
              <div className="absolute -left-[21px] md:-left-[37px] top-4 w-3 h-3 bg-gray-700 border-2 border-[#161B22] rounded-full group-hover:bg-emerald-500 transition"></div>
              <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                 <span className="text-xs text-gray-500 font-mono pt-1 md:py-4 md:w-12">{t.horaInicio}</span>
                 <div className="flex-1 bg-[#232936] p-3 md:p-4 rounded-xl border border-white/5 hover:border-emerald-500/30 transition shadow-lg flex justify-between items-center">
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-sm md:text-base truncate">{t.titulo}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded mt-1 inline-block ${getColorEtiqueta(t.etiqueta)}`}>{t.etiqueta}</span>
                    </div>
                    <button onClick={(e) => {e.stopPropagation(); toggleTimer(t.id);}} className={`ml-2 px-3 py-1 rounded text-[10px] font-bold uppercase shrink-0 ${t.enProgreso ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 text-gray-300'}`}>
                      {t.enProgreso ? '● Rec' : '▶'}
                    </button>
                 </div>
              </div>
            </div>
          )) : <div className="text-center py-20 opacity-50"><p>Día libre. 🍃</p></div>}
        </div>
      </div>
    );
  };

  const VistaLista = () => {
    const ts = tareas.filter(t => { const ft = new Date(t.fecha + "T00:00:00"); return ft.getMonth() === fechaVisual.getMonth() && ft.getFullYear() === fechaVisual.getFullYear(); }).sort((a,b) => a.fecha.localeCompare(b.fecha));
    return (
      <div className="bg-[#161B22] border border-white/10 rounded-xl overflow-hidden h-full flex flex-col">
        <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1C2128] text-gray-400 font-medium sticky top-0 z-10">
                <tr><th className="p-4 pl-6">Tarea</th><th className="hidden md:table-cell p-4">Fecha</th><th className="p-4">Etiqueta</th><th className="p-4 text-right pr-6">Acción</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ts.map(t => (
                  <tr key={t.id} onClick={() => abrirModalDetalle(t)} className="hover:bg-white/5 transition cursor-pointer">
                    <td className="p-4 pl-6 font-medium text-white">
                      <div className="flex items-center gap-2">
                         {t.enProgreso && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>}
                         <span className="truncate max-w-[150px] md:max-w-none">{t.titulo}</span>
                      </div>
                      <div className="md:hidden text-xs text-gray-500 mt-1">{t.fecha} • {t.horaInicio}</div>
                    </td>
                    <td className="hidden md:table-cell p-4 text-gray-400 text-xs whitespace-nowrap">{t.fecha} • {t.horaInicio}</td>
                    <td className="p-4"><span className={`text-[10px] px-2 py-1 rounded border whitespace-nowrap ${getColorEtiqueta(t.etiqueta)}`}>{t.etiqueta}</span></td>
                    <td className="p-4 text-right pr-6">
                      <button onClick={(e) => {e.stopPropagation(); toggleTimer(t.id);}} className="text-gray-400 hover:text-white text-xs bg-white/5 px-2 py-1 rounded">{t.enProgreso ? '⏹' : '▶'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col relative">
      
      {/* --- MODAL CREAR --- */}
      {modalNuevoAbierto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-[#161B22] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setModalNuevoAbierto(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
            <h2 className="text-xl font-bold text-white mb-6">✨ Nueva Tarea</h2>
            <form onSubmit={guardarNuevaTarea} className="space-y-4">
              <input type="text" placeholder="Título" className="w-full bg-[#0F1115] border border-gray-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none" value={formulario.titulo} onChange={e => setFormulario({...formulario, titulo: e.target.value})} autoFocus required />
              <textarea placeholder="Descripción (Opcional)" className="w-full bg-[#0F1115] border border-gray-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none text-sm h-20" value={formulario.descripcion} onChange={e => setFormulario({...formulario, descripcion: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="w-full bg-[#0F1115] border border-gray-700 rounded-lg p-3 text-white" value={formulario.fecha} onChange={e => setFormulario({...formulario, fecha: e.target.value})} required />
                <input type="time" className="w-full bg-[#0F1115] border border-gray-700 rounded-lg p-3 text-white" value={formulario.hora} onChange={e => setFormulario({...formulario, hora: e.target.value})} required />
              </div>
              <div className="flex flex-wrap gap-2">
                {["Diseño", "Dev", "Reunión", "Urgente", "Admin"].map(tag => <button key={tag} type="button" onClick={() => setFormulario({...formulario, etiqueta: tag as any})} className={`px-3 py-1 text-xs rounded-lg border ${formulario.etiqueta === tag ? getColorEtiqueta(tag) + " ring-1 ring-white" : "border-gray-700 text-gray-500"}`}>{tag}</button>)}
              </div>
              <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
                <button type="submit" className="flex-1 py-3 rounded-lg text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DETALLE --- */}
      {modalDetalleAbierto && tareaSeleccionada && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-[#161B22] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#1C2128] p-4 flex justify-between items-center border-b border-white/5 shrink-0">
              <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${getColorEtiqueta(modoEdicion ? formulario.etiqueta : tareaSeleccionada.etiqueta)}`}>{modoEdicion ? formulario.etiqueta : tareaSeleccionada.etiqueta}</span>
              <div className="flex gap-2">
                {!modoEdicion && <button onClick={() => setModoEdicion(true)} className="text-xs text-gray-400 hover:text-white px-2 py-1 hover:bg-white/10 rounded transition">✏️ Editar</button>}
                <button onClick={() => setModalDetalleAbierto(false)} className="text-gray-400 hover:text-white px-2">✕</button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              {modoEdicion ? (
                <form onSubmit={actualizarTarea} className="space-y-4">
                  <input type="text" className="w-full bg-[#0F1115] border border-gray-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none font-bold" value={formulario.titulo} onChange={e => setFormulario({...formulario, titulo: e.target.value})} />
                  <textarea className="w-full bg-[#0F1115] border border-gray-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none text-sm h-24" value={formulario.descripcion} onChange={e => setFormulario({...formulario, descripcion: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" className="bg-[#0F1115] border border-gray-700 rounded-lg p-2 text-white text-sm" value={formulario.fecha} onChange={e => setFormulario({...formulario, fecha: e.target.value})} />
                    <input type="time" className="bg-[#0F1115] border border-gray-700 rounded-lg p-2 text-white text-sm" value={formulario.hora} onChange={e => setFormulario({...formulario, hora: e.target.value})} />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {["Diseño", "Dev", "Reunión", "Urgente", "Admin"].map(tag => <button key={tag} type="button" onClick={() => setFormulario({...formulario, etiqueta: tag as any})} className={`px-2 py-1 text-[10px] rounded border ${formulario.etiqueta === tag ? getColorEtiqueta(tag) + " ring-1 ring-white" : "border-gray-700 text-gray-500"}`}>{tag}</button>)}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={() => setModoEdicion(false)} className="flex-1 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5">Cancelar</button>
                    <button type="submit" className="flex-1 py-2 rounded-lg text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Guardar</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div><h2 className="text-xl md:text-2xl font-bold text-white mb-2 break-words">{tareaSeleccionada.titulo}</h2><p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{tareaSeleccionada.descripcion || "Sin descripción."}</p></div>
                  <div className="flex items-center gap-6 py-4 border-t border-b border-white/5">
                    <div><p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Horario</p><p className="text-white text-sm">📅 {tareaSeleccionada.fecha} <br className="md:hidden"/>⏰ {tareaSeleccionada.horaInicio}</p></div>
                    <div><p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Trackeado</p><p className="text-emerald-400 text-sm font-mono font-bold">{formatearTiempo(tareaSeleccionada.tiempoRegistrado)}</p></div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3 pt-2">
                    <button onClick={() => toggleTimer(tareaSeleccionada.id)} className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${tareaSeleccionada.enProgreso ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-white/5 text-white hover:bg-white/10'}`}>{tareaSeleccionada.enProgreso ? '⏹ Detener' : '▶ Iniciar Timer'}</button>
                    <button onClick={eliminarTarea} className="py-3 px-4 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition flex justify-center">🗑 Eliminar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HEADER DE LA PÁGINA (Botones apilados en móvil) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center bg-[#161B22] rounded-lg border border-white/10 p-1">
            <button onClick={() => navegar(-1)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-gray-400 hover:text-white">‹</button>
            <button onClick={irAHoy} className="px-3 text-xs font-bold text-gray-300 hover:text-white">Hoy</button>
            <button onClick={() => navegar(1)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-gray-400 hover:text-white">›</button>
          </div>
          <h1 className="text-lg md:text-2xl font-bold text-white capitalize truncate">{obtenerTitulo()}</h1>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end overflow-x-auto pb-1 md:pb-0">
          <div className="bg-[#202020] p-1 rounded-lg border border-white/10 flex gap-1 shrink-0">
            {[{ id: 'mes', label: 'Mes' }, { id: 'semana', label: 'Sem' }, { id: 'dia', label: 'Día' }, { id: 'lista', label: 'Lista' }].map(op => (
              <button key={op.id} onClick={() => setVista(op.id as any)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${vista === op.id ? 'bg-[#37352F] text-white shadow' : 'text-gray-400 hover:text-white'}`}>{op.label}</button>
            ))}
          </div>
          <button onClick={abrirModalCrear} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-lg transition flex items-center gap-2 whitespace-nowrap shrink-0">+ Tarea</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {vista === 'mes' && <VistaMes />}
        {vista === 'semana' && <VistaSemana />}
        {vista === 'dia' && <VistaDia />}
        {vista === 'lista' && <VistaLista />}
      </div>
    </div>
  );
}