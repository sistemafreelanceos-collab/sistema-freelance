"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { Views } from 'react-big-calendar';
import moment from 'moment';
import { PlusIcon, ArrowDownTrayIcon } from "@heroicons/react/24/solid";

// Imports
import CalendarBoard from "./components/CalendarBoard";
import NotesBoard from "./components/NotesBoard";
import IncomingPayments from "./components/IncomingPayments";
import DailyCapacity from "./components/DailyCapacity"; 
import FilterBar from "./components/FilterBar"; 
import { ModalCrear, ModalDetalle } from "./components/ModalesCalendario";
import { EventoCalendario, PostIt, TipoNota } from './types';

export default function CalendarioPage() {
  const router = useRouter();
  const [eventosDB, setEventosDB] = useState<EventoCalendario[]>([]);
  const [postIts, setPostIts] = useState<PostIt[]>([]);
  const [proyectosRaw, setProyectosRaw] = useState<any[]>([]);
  const [proyectosList, setProyectosList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados UI
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [filtros, setFiltros] = useState({ tareas: true, cobros: true }); 

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalTipo, setModalTipo] = useState<'tarea' | 'postit'>('tarea');
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoCalendario | null>(null);

  const [formulario, setFormulario] = useState({
    titulo: "", descripcion: "", fecha: "", hora: "09:00", categoria: "Diseño" as string, colorPostit: "amarillo" as TipoNota, proyectoId: "", recurrente: false 
  });

  const onNavigate = useCallback((newDate: Date) => setDate(newDate), [setDate]);

  // Filtros
  const eventosVisibles = useMemo(() => {
      let lista = [...eventosDB];
      if (!filtros.tareas) lista = lista.filter(e => e.resource?.tipo_evento !== 'tarea' && e.resource?.tipo_evento !== 'proyecto');
      if (!filtros.cobros) lista = lista.filter(e => e.resource?.tipo_evento !== 'cobro' && e.resource?.tipo_evento !== 'gasto');
      return lista;
  }, [eventosDB, filtros]);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const uid = session.user.id;

    // AQUI: Agregamos 'tiempo_acumulado' a la consulta de proyectos
    const [tareas, gastos, proyectos, notas] = await Promise.all([
        supabase.from("tareas").select("*, proyectos(nombre)").eq("owner_id", uid),
        supabase.from("gastos_fijos").select("*").eq("owner_id", uid).eq("activo", true),
        supabase.from("proyectos").select("id, nombre, monto, moneda, fecha_inicio, fecha_fin, estado, cliente_id, clientes(nombre), tiempo_acumulado").eq("owner_id", uid),
        supabase.from("notas_calendario").select("*").eq("owner_id", uid)
    ]);

    setProyectosRaw(proyectos.data || []);
    setProyectosList(proyectos.data?.map((p: any) => ({ id: p.id, nombre: p.clientes?.nombre ? `${p.nombre} - ${p.clientes.nombre}` : p.nombre })) || []);

    const lista: EventoCalendario[] = [];
    
    // Tareas
    tareas.data?.forEach((t: any) => {
        try {
            const fechaBase = t.fecha; let horaStr = t.hora || "09:00:00"; if (horaStr.length === 5) horaStr += ":00";
            const start = new Date(`${fechaBase}T${horaStr}`);
            const end = new Date(start.getTime() + (60 * 60 * 1000));
            let titulo = t.titulo;
            if (t.proyectos) titulo = `📂 ${t.proyectos.nombre}: ${t.titulo}`;
            
            lista.push({ 
                id: t.id, title: titulo, start, end, allDay: !t.hora, 
                resource: { ...t, descripcion: t.descripcion, tipo_evento: 'tarea', es_automatico: false, projectId: t.proyecto_id, completada: t.completada } 
            });
        } catch (e) {}
    });

    // Gastos
    gastos.data?.forEach((g: any) => {
         const hoy = new Date(); const mesActual = hoy.getMonth(); const anio = hoy.getFullYear();
         [-1, 0, 1, 2, 3].forEach(offset => {
             const fPago = new Date(anio, mesActual + offset, g.dia_pago);
             let pagadoEsteMes = false;
             if (offset === 0 && g.ultimo_pago) {
                 const fUltimo = new Date(g.ultimo_pago);
                 if (fUltimo.getMonth() === mesActual && fUltimo.getFullYear() === anio) pagadoEsteMes = true;
             }
             const color = pagadoEsteMes ? "#10B981" : "#EF4444";
             const titulo = pagadoEsteMes ? `✅ ${g.nombre}` : `💸 -$${g.monto} ${g.nombre}`;
             lista.push({ id: `auto-${g.id}-${offset}`, title: titulo, start: fPago, end: fPago, allDay: true, resource: { descripcion: "Gasto Recurrente", categoria: "Pagos", tipo_evento: 'gasto', es_automatico: true, colorOverride: color, completada: pagadoEsteMes } });
         });
    });

    // Proyectos (Cobros)
    proyectos.data?.forEach((p: any) => {
        if (p.fecha_inicio) {
            const fi = new Date(`${p.fecha_inicio}T09:00:00`);
            const fc = p.fecha_fin ? new Date(`${p.fecha_fin}T09:00:00`) : new Date(fi.getTime() + (30 * 24 * 60 * 60 * 1000));
            if(p.estado !== 'cancelado') {
                lista.push({ id: `cobro-${p.id}`, title: `💰 $${p.monto} - ${p.clientes?.nombre || 'Cliente'}`, start: fc, end: fc, allDay: true, resource: { categoria: "Cobro", tipo_evento: 'cobro', es_automatico: true, colorOverride: "#10B981" } });
            }
        }
    });

    setEventosDB(lista);
    setPostIts(notas.data?.map((n: any) => ({ id: n.id, texto: n.texto, fecha: n.fecha, color: n.color || 'amarillo', rotacion: n.rotacion || (Math.random() * 6 - 3) })) || []);
    setLoading(false);
  };

  // --- LÓGICA DE GUARDADO DE TIEMPO ---
  const handleSaveSession = async (seconds: number, completed: boolean) => {
      if (!eventoSeleccionado) return;

      // 1. Marcar tarea completada si el usuario lo indicó
      if (completed) {
          await supabase.from("tareas").update({ completada: true }).eq("id", eventoSeleccionado.id);
      }

      // 2. Si la tarea tiene proyecto, sumar tiempo
      if (eventoSeleccionado.resource?.projectId) {
          const proyectoId = eventoSeleccionado.resource.projectId;
          
          // Leer tiempo actual
          const { data: proy } = await supabase.from("proyectos").select("tiempo_acumulado").eq("id", proyectoId).single();
          const tiempoActual = Number(proy?.tiempo_acumulado || 0);
          
          // Actualizar con nuevos segundos
          await supabase.from("proyectos").update({ 
              tiempo_acumulado: tiempoActual + seconds 
          }).eq("id", proyectoId);
          
          const minutos = Math.floor(seconds / 60);
          if (minutos > 0) alert(`✅ Se agregaron ${minutos} minutos al proyecto.`);
      }

      setEventoSeleccionado(null);
      cargarDatos();
  };

  const guardarItem = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!formulario.titulo) return alert("Falta información");
      if (modalTipo === 'tarea') {
          const insertData: any = { owner_id: session?.user.id, titulo: formulario.titulo, descripcion: formulario.descripcion, fecha: formulario.fecha, hora: formulario.hora, categoria: formulario.categoria, proyecto_id: formulario.proyectoId || null, completada: false };
          if (formulario.recurrente) {
              const promesas = [];
              for (let i = 0; i < 6; i++) {
                  const fOriginal = new Date(formulario.fecha);
                  const nuevaFecha = new Date(new Date(fOriginal).setMonth(fOriginal.getMonth() + i)).toISOString().split('T')[0];
                  promesas.push(supabase.from("tareas").insert({ ...insertData, fecha: nuevaFecha }));
              }
              await Promise.all(promesas);
          } else { await supabase.from("tareas").insert(insertData); }
      } else {
          await supabase.from("notas_calendario").insert({ owner_id: session?.user.id, fecha: new Date().toISOString(), texto: formulario.titulo, color: formulario.colorPostit });
      }
      setModalAbierto(false); cargarDatos();
  };

  const borrarItem = async (id: string, tabla: string) => { if(!confirm("¿Eliminar?")) return; await supabase.from(tabla).delete().eq("id", id); if(tabla === 'tareas') setEventoSeleccionado(null); cargarDatos(); };
  const completarTarea = async () => { if (!eventoSeleccionado) return; await supabase.from("tareas").update({ completada: !eventoSeleccionado.resource?.completada }).eq("id", eventoSeleccionado.id); setEventoSeleccionado(null); cargarDatos(); };
  const descargarICS = () => { /* ... */ };
  const onEventDrop = useCallback(async ({ event, start, end }: any) => { if (event.resource.es_automatico) return; const fechaStr = moment(start).format('YYYY-MM-DD'); const horaStr = moment(start).format('HH:mm'); await supabase.from("tareas").update({ fecha: fechaStr, hora: horaStr }).eq("id", event.id); cargarDatos(); }, []);

  if (loading) return <div className="text-white text-center py-20 animate-pulse">Cargando...</div>;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col lg:flex-row overflow-hidden bg-[#0D1117]">
      <div className="flex-1 p-6 flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-end mb-4">
              <div><h1 className="text-3xl font-bold text-white">Agenda Operativa</h1><p className="text-gray-400 text-sm">Finanzas, Proyectos y Tiempo.</p></div>
              <div className="flex gap-2">
                  <button onClick={descargarICS} className="bg-white/5 text-gray-400 px-3 py-2 rounded-lg hover:text-white transition" title="Exportar iCal"><ArrowDownTrayIcon className="w-5 h-5"/></button>
                  <button onClick={() => { setFormulario({ titulo: "", descripcion: "", fecha: new Date().toISOString().split('T')[0], hora: "09:00", categoria: "Diseño", colorPostit: "amarillo" as TipoNota, proyectoId: "", recurrente: false }); setModalTipo('tarea'); setModalAbierto(true); }} className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm hover:scale-105 transition shadow-lg flex items-center gap-2"><PlusIcon className="w-4 h-4"/> Agendar</button>
              </div>
          </div>
          
          <FilterBar filtros={filtros} toggleFiltro={(k) => setFiltros(prev => ({ ...prev, [k]: !prev[k] }))} />

          <CalendarBoard 
            eventos={eventosVisibles} view={view} setView={setView} date={date} onNavigate={onNavigate} onEventDrop={onEventDrop} onSelectEvent={setEventoSeleccionado}
            onSelectSlot={(slot) => { const dateStr = moment(slot.start).format('YYYY-MM-DD'); setFormulario(prev => ({ ...prev, fecha: dateStr, hora: "09:00", titulo: "", proyectoId: "", recurrente: false })); setModalTipo('tarea'); setModalAbierto(true); }}
          />
      </div>

      <div className="w-full lg:w-[350px] bg-[#121418] border-l border-white/10 flex flex-col h-full overflow-y-auto custom-scrollbar">
          <div className="px-6 pt-6">
              <DailyCapacity eventos={eventosVisibles} fechaSeleccionada={eventoSeleccionado ? eventoSeleccionado.start : date} />
          </div>
          <NotesBoard postIts={postIts} onAddClick={() => { setFormulario({ titulo: "", descripcion: "", fecha: "", hora: "", categoria: "", colorPostit: "amarillo" as TipoNota, proyectoId: "", recurrente: false }); setModalTipo('postit'); setModalAbierto(true); }} onDeleteNote={(id) => borrarItem(id, 'notas_calendario')} />
          <div className="px-6 pb-6"><IncomingPayments proyectos={proyectosRaw} /></div>
      </div>

      <ModalCrear isOpen={modalAbierto} onClose={() => setModalAbierto(false)} onSave={guardarItem} modalTipo={modalTipo} setModalTipo={setModalTipo} formulario={formulario} setFormulario={setFormulario} proyectos={proyectosList} />
      
      {/* Pasamos la función nueva */}
      <ModalDetalle 
        evento={eventoSeleccionado} 
        onClose={() => setEventoSeleccionado(null)} 
        onDelete={borrarItem} 
        onComplete={completarTarea} 
        onSaveSession={handleSaveSession} // <--- AQUI
      />
    </div>
  );
}