"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { BoltIcon, MoonIcon, StarIcon } from "@heroicons/react/24/solid";

interface Props {
  userId: string;
}

export default function BodyBattery({ userId }: Props) {
  const [loading, setLoading] = useState(true);
  const [registrado, setRegistrado] = useState(false);
  const [horas, setHoras] = useState(7);
  const [calidad, setCalidad] = useState(3); // 1-5
  const [bateria, setBateria] = useState(0);

  const getFechaLocal = () => {
      const d = new Date();
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };

  useEffect(() => {
    cargarDatos();
  }, [userId]);

  const cargarDatos = async () => {
      const hoy = getFechaLocal();
      const { data } = await supabase.from("registros_sueno").select("*").eq("owner_id", userId).eq("fecha", hoy).single();
      
      if (data) {
          setRegistrado(true);
          setBateria(data.bateria_calculada);
          setHoras(data.horas_sueno);
          setCalidad(data.calidad);
      }
      setLoading(false);
  };

  const calcularYGuardar = async () => {
      // Fórmula de Batería: 60% Horas + 40% Calidad
      // Base ideal: 8 horas y 5 estrellas
      const factorHoras = Math.min(horas, 9) / 8; // Tope en 9 horas
      const factorCalidad = calidad / 5;
      
      let porcentaje = Math.round((factorHoras * 60) + (factorCalidad * 40));
      if (porcentaje > 100) porcentaje = 100;
      
      setBateria(porcentaje);
      setRegistrado(true);

      const hoy = getFechaLocal();
      const { error } = await supabase.from("registros_sueno").upsert({
          owner_id: userId,
          fecha: hoy,
          horas_sueno: horas,
          calidad: calidad,
          bateria_calculada: porcentaje
      });
      
      if (error) console.error(error);
  };

  if (loading) return <div className="h-40 bg-[#161B22] animate-pulse rounded-2xl"></div>;

  // ESTADO: REGISTRADO (Muestra Batería Visual)
  if (registrado) {
      let color = "text-emerald-400";
      let mensaje = "🚀 ¡Sistemas al 100%! Hoy es día de Deep Work.";
      if (bateria < 70) { color = "text-yellow-400"; mensaje = "⚠️ Energía moderada. Prioriza lo esencial."; }
      if (bateria < 40) { color = "text-red-400"; mensaje = "🛑 Batería baja. Evita decisiones complejas."; }

      return (
          <div className="bg-[#161B22] border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
              <div className="flex justify-between items-start relative z-10">
                  <div>
                      <h3 className="text-white font-bold flex items-center gap-2"><BoltIcon className="w-5 h-5 text-yellow-500"/> Body Battery</h3>
                      <p className="text-xs text-gray-400 mt-1">Recuperación del sueño</p>
                  </div>
                  <button onClick={() => setRegistrado(false)} className="text-[10px] text-gray-500 hover:text-white underline">Editar</button>
              </div>

              <div className="flex items-center gap-4 mt-4 relative z-10">
                  <div className="relative">
                      <BoltIcon className={`w-12 h-12 ${color} drop-shadow-lg`}/>
                      {bateria > 80 && <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full animate-pulse"></div>}
                  </div>
                  <div>
                      <p className={`text-3xl font-mono font-bold ${color}`}>{bateria}%</p>
                      <p className="text-xs text-gray-300 max-w-[180px] leading-tight">{mensaje}</p>
                  </div>
              </div>

              {/* Barra de fondo decorativa */}
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 w-full opacity-30"></div>
              <div className="absolute bottom-0 left-0 h-1 bg-white transition-all duration-1000" style={{ width: `${bateria}%`, boxShadow: '0 0 10px white' }}></div>
          </div>
      );
  }

  // ESTADO: NO REGISTRADO (Formulario)
  return (
      <div className="bg-[#161B22] border border-white/10 p-6 rounded-2xl">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <MoonIcon className="w-5 h-5 text-indigo-400"/> Control de Sueño
          </h3>
          
          <div className="space-y-4">
              <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Horas dormidas</span>
                      <span className="text-white font-bold">{horas}h</span>
                  </div>
                  <input type="range" min="3" max="12" step="0.5" value={horas} onChange={e => setHoras(Number(e.target.value))} className="w-full accent-indigo-500 cursor-pointer"/>
              </div>

              <div>
                  <p className="text-xs text-gray-400 mb-2">Calidad del descanso</p>
                  <div className="flex gap-2 justify-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} onClick={() => setCalidad(s)} className="transition hover:scale-110">
                              <StarIcon className={`w-8 h-8 ${s <= calidad ? "text-yellow-400" : "text-gray-700"}`} />
                          </button>
                      ))}
                  </div>
              </div>

              <button onClick={calcularYGuardar} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-sm transition shadow-lg">
                  Calcular Energía
              </button>
          </div>
      </div>
  );
}