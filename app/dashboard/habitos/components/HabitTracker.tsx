"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { FireIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/solid";

interface Props {
  userId: string;
  onUpdateXP: (puntos: number) => void;
}

// Generador de fechas seguro (YYYY-MM-DD)
const getFechaLocal = (d = new Date()) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

// Generar últimos 7 días para las columnas
const getUltimos7Dias = () => {
    const dias = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dias.push({
            fecha: getFechaLocal(d),
            diaSemana: d.toLocaleDateString('es-ES', { weekday: 'narrow' }).toUpperCase(), // L, M, X
            numero: d.getDate(),
            esHoy: i === 0
        });
    }
    return dias;
};

export default function HabitTracker({ userId, onUpdateXP }: Props) {
  const [habitos, setHabitos] = useState<any[]>([]);
  const [diasSemana, setDiasSemana] = useState<any[]>([]);
  const [nuevoHabito, setNuevoHabito] = useState("");
  const [creando, setCreando] = useState(false);

  const cargarDatos = async () => {
    if (!userId) return;
    
    // 1. Preparar columnas de días
    const ultimosDias = getUltimos7Dias();
    setDiasSemana(ultimosDias);

    // 2. Traer hábitos activos
    const { data: defs } = await supabase
        .from("habitos")
        .select("*")
        .eq("owner_id", userId)
        .eq("activo", true)
        .order("created_at", { ascending: true });
    
    if (!defs) return;

    // 3. Traer registros de la última semana
    const fechaInicio = ultimosDias[0].fecha;
    const { data: registros } = await supabase
        .from("registros_habitos")
        .select("habito_id, fecha")
        .gte("fecha", fechaInicio);

    // 4. Mapear datos: Cada hábito tendrá un set de fechas completadas
    const procesados = defs.map(h => {
        const completados = new Set(
            registros?.filter(r => r.habito_id === h.id).map(r => r.fecha)
        );
        
        // Calcular racha simple (días seguidos desde hoy hacia atrás)
        // (Esta lógica se podría refinar más, pero sirve visualmente)
        return {
            ...h,
            fechasCompletadas: completados
        };
    });

    setHabitos(procesados);
  };

  useEffect(() => {
    cargarDatos();
  }, [userId]);

  // --- ACCIÓN: MARCAR/DESMARCAR CUALQUIER DÍA ---
  const toggleDia = async (habitoId: string, fecha: string, estadoActual: boolean) => {
      // 1. Optimistic UI (Actualizar visualmente ya)
      setHabitos(prev => prev.map(h => {
          if (h.id === habitoId) {
              const nuevasFechas = new Set(h.fechasCompletadas);
              if (estadoActual) nuevasFechas.delete(fecha);
              else nuevasFechas.add(fecha);
              return { ...h, fechasCompletadas: nuevasFechas };
          }
          return h;
      }));

      // 2. Base de Datos
      if (estadoActual) {
          // Si estaba marcado, borrar
          await supabase.from("registros_habitos").delete().match({ habito_id: habitoId, fecha });
          // Si era hoy, quitamos XP (opcional)
          if(fecha === getFechaLocal()) onUpdateXP(-10);
      } else {
          // Si no estaba, insertar
          await supabase.from("registros_habitos").insert({ habito_id: habitoId, fecha });
          // Si es hoy, damos XP
          if(fecha === getFechaLocal()) onUpdateXP(10);
      }
  };

  const crearHabito = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nuevoHabito.trim()) return;
      await supabase.from("habitos").insert({ owner_id: userId, nombre: nuevoHabito, icono: "✨" });
      setNuevoHabito("");
      setCreando(false);
      cargarDatos();
  };

  const borrarHabito = async (id: string) => {
      if(!confirm("¿Eliminar este hábito?")) return;
      await supabase.from("habitos").update({ activo: false }).eq("id", id);
      cargarDatos();
  };

  return (
    <div className="bg-[#161B22] border border-white/10 rounded-2xl p-6 h-full flex flex-col shadow-xl">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400">🛡️</span> Matriz de Hábitos
          </h3>
          <button onClick={() => setCreando(!creando)} className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg">
            <PlusIcon className="w-5 h-5" />
          </button>
      </div>

      {creando && (
          <form onSubmit={crearHabito} className="mb-6 flex gap-2 animate-in fade-in">
              <input 
                autoFocus
                value={nuevoHabito}
                onChange={e => setNuevoHabito(e.target.value)}
                placeholder="Nuevo hábito (Ej: Leer 20 min)"
                className="flex-1 bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500"
              />
              <button type="submit" className="bg-emerald-600 text-white px-4 rounded-xl font-bold">Guardar</button>
              <button type="button" onClick={() => setCreando(false)} className="px-3 text-gray-400 hover:text-white"><XMarkIcon className="w-6 h-6"/></button>
          </form>
      )}

      {/* --- MATRIZ SEMANAL --- */}
      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr>
                    <th className="p-2 text-gray-500 font-bold text-xs uppercase w-40">Hábito</th>
                    {diasSemana.map((d, i) => (
                        <th key={i} className="p-2 text-center">
                            <div className={`flex flex-col items-center justify-center ${d.esHoy ? 'text-emerald-400' : 'text-gray-500'}`}>
                                <span className="text-[10px] font-bold">{d.diaSemana}</span>
                                <span className={`text-sm font-bold ${d.esHoy ? 'bg-emerald-500/20 px-2 rounded' : ''}`}>{d.numero}</span>
                            </div>
                        </th>
                    ))}
                    <th className="w-10"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {habitos.map(h => (
                    <tr key={h.id} className="group hover:bg-white/[0.02] transition">
                        {/* Nombre e Icono */}
                        <td className="p-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{h.icono}</span>
                                <span className="text-sm font-bold text-gray-200">{h.nombre}</span>
                            </div>
                        </td>

                        {/* Celdas de Días */}
                        {diasSemana.map((d, i) => {
                            const completado = h.fechasCompletadas.has(d.fecha);
                            return (
                                <td key={i} className="p-1 text-center">
                                    <button 
                                        onClick={() => toggleDia(h.id, d.fecha, completado)}
                                        className={`w-8 h-8 rounded-lg border transition-all duration-300 flex items-center justify-center mx-auto ${
                                            completado 
                                            ? "bg-emerald-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] scale-100" 
                                            : "bg-white/5 border-white/10 hover:border-white/30 scale-90 hover:scale-100"
                                        }`}
                                    >
                                        {completado && <FireIcon className="w-5 h-5 text-white" />}
                                    </button>
                                </td>
                            );
                        })}

                        {/* Botón Borrar */}
                        <td className="p-2 text-center">
                            <button 
                                onClick={() => borrarHabito(h.id)}
                                className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        
        {habitos.length === 0 && !creando && (
            <div className="text-center py-10 text-gray-500">
                <p>No tienes hábitos configurados.</p>
                <p className="text-xs mt-2">Crea uno nuevo para empezar tu racha.</p>
            </div>
        )}
      </div>
    </div>
  );
}