"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { PlayIcon, PauseIcon, StopIcon, BoltIcon, ClockIcon, ArrowLeftIcon, MusicalNoteIcon } from "@heroicons/react/24/solid";

interface Props {
  userId: string;
  proyectos: any[];
  onUpdateXP: (puntos: number) => void;
}

// URL del sonido (Puedes cambiarlo por un archivo local en /public/sounds/gong.mp3)
const ZEN_SOUND_URL = "https://pixabay.com/es/music/hermosas-obras-de-teatro-please-calm-my-mind-125566/";

export default function DeepWork({ userId, proyectos, onUpdateXP }: Props) {
  // ESTADOS DEL TIMER
  const [minutos, setMinutos] = useState(90);
  const [segundos, setSegundos] = useState(0);
  const [activo, setActivo] = useState(false);
  
  // ESTADOS DE FLUJO
  const [fase, setFase] = useState<'config' | 'respiracion' | 'focus' | 'resumen' | 'historial'>('config');
  const [proyectoId, setProyectoId] = useState("");
  const [energiaInicial, setEnergiaInicial] = useState(5);
  const [energiaFinal, setEnergiaFinal] = useState(5);
  const [logroTexto, setLogroTexto] = useState("");
  
  // HISTORIAL
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  // RESPIRACIÓN
  const [textoRespiracion, setTextoRespiracion] = useState("Inhala...");
  const [escalaCirculo, setEscalaCirculo] = useState(1);

  // REFS
  const timerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- LÓGICA DEL TIMER ---
  useEffect(() => {
    if (activo && fase === 'focus') {
      timerRef.current = setInterval(() => {
        setSegundos((s) => {
          if (s === 0) {
            if (minutos === 0) {
              finalizarSesion();
              return 0;
            }
            setMinutos((m) => m - 1);
            return 59;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activo, minutos, fase]);

  // --- AUDIO ---
  const reproducirSonido = () => {
    if (audioRef.current) {
        audioRef.current.volume = 0.5; // Volumen al 50%
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log("Audio play error:", e));
    }
  };

  // --- INICIAR FLUJO ---
  const iniciarProceso = () => {
      reproducirSonido(); // <--- SONIDO AQUÍ
      setFase('respiracion');
      ejecutarRespiracion();
  };

  const ejecutarRespiracion = async () => {
      const ciclo = async (ms: number, txt: string, escala: number) => {
          setTextoRespiracion(txt);
          setEscalaCirculo(escala);
          await new Promise(r => setTimeout(r, ms));
      };

      // 2 Ciclos de Box Breathing (4-4-4-4)
      for (let i = 0; i < 2; i++) {
          await ciclo(4000, "Inhala... 😤", 1.5);
          await ciclo(4000, "Retén... 😐", 1.5);
          await ciclo(4000, "Exhala... 😮‍💨", 1.0);
          await ciclo(4000, "Retén... 😐", 1.0);
      }

      setFase('focus');
      setActivo(true);
  };

  const pausarTimer = () => setActivo(!activo);

  const finalizarSesion = () => {
      setActivo(false);
      setFase('resumen');
  };

  const guardarSesion = async () => {
      const duracion = 90 - minutos; 
      if (duracion > 0) {
          await supabase.from("sesiones_focus").insert({
              owner_id: userId,
              duracion_minutos: duracion,
              logros: logroTexto,
              proyecto_id: proyectoId || null,
              energia_inicial: energiaInicial,
              energia_final: energiaFinal
          });
          
          onUpdateXP(50); // +50 XP
          alert(`¡Sesión Guardada! +50 XP ⚡`);
      }
      
      // Reset
      setFase('config');
      setMinutos(90); setSegundos(0);
      setLogroTexto("");
  };

  // --- CARGAR HISTORIAL ---
  const verHistorial = async () => {
      setFase('historial');
      setCargandoHistorial(true);
      
      const { data } = await supabase
          .from("sesiones_focus")
          .select(`
            *,
            proyectos ( nombre )
          `)
          .eq("owner_id", userId)
          .order("fecha", { ascending: false })
          .limit(20);

      setHistorial(data || []);
      setCargandoHistorial(false);
  };

  // --- ELEMENTO DE AUDIO OCULTO ---
  // Nota: crossOrigin permite reproducir desde dominios externos sin problemas de CORS a veces
  const AudioElement = () => (
    <audio ref={audioRef} src={ZEN_SOUND_URL} crossOrigin="anonymous" preload="auto" />
  );

  // =======================================================
  // RENDERIZADO POR FASES
  // =======================================================

  // 1. FASE CONFIGURACIÓN (HOME DEL WIDGET)
  if (fase === 'config') return (
      <div className="bg-[#161B22] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <AudioElement />
          
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><span className="text-blue-400">🧠</span> Deep Work</h3>
            <button onClick={verHistorial} className="text-xs text-gray-500 hover:text-white flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg transition">
                <ClockIcon className="w-3 h-3" /> Historial
            </button>
          </div>
          
          <div className="space-y-4">
              <div>
                  <label className="text-xs text-gray-400 block mb-1 uppercase font-bold">Asignar a Proyecto (Opcional)</label>
                  <select className="w-full bg-black/30 border border-gray-700 p-2 rounded-lg text-white text-sm outline-none" value={proyectoId} onChange={e => setProyectoId(e.target.value)}>
                      <option value="">-- Sin proyecto --</option>
                      {proyectos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
              </div>

              <div>
                  <label className="text-xs text-gray-400 block mb-1 uppercase font-bold">Nivel de Energía Actual: {energiaInicial}/10</label>
                  <input type="range" min="1" max="10" value={energiaInicial} onChange={e => setEnergiaInicial(Number(e.target.value))} className="w-full accent-blue-500 cursor-pointer"/>
                  <div className="flex justify-between text-[10px] text-gray-500"><span>🧟 Zombi</span><span>⚡ Dios</span></div>
              </div>

              <button onClick={iniciarProceso} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition flex justify-center gap-2 items-center group">
                  <PlayIcon className="w-5 h-5 group-hover:scale-110 transition"/> INICIAR SESIÓN
              </button>

              <div className="text-center">
                <span className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
                    <MusicalNoteIcon className="w-3 h-3"/> Sonido Zen activado al iniciar
                </span>
              </div>
          </div>
      </div>
  );

  // 2. FASE HISTORIAL
  if (fase === 'historial') return (
    <div className="bg-[#161B22] border border-white/10 rounded-2xl p-6 h-[400px] flex flex-col">
        <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
            <button onClick={() => setFase('config')} className="p-1 hover:bg-white/10 rounded-full"><ArrowLeftIcon className="w-4 h-4 text-white"/></button>
            <h3 className="text-lg font-bold text-white">Últimas Sesiones</h3>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {cargandoHistorial ? (
                <p className="text-center text-gray-500 text-xs mt-10">Cargando bitácora...</p>
            ) : historial.length === 0 ? (
                <p className="text-center text-gray-500 text-xs mt-10">No hay sesiones registradas aún.</p>
            ) : (
                historial.map((sesion) => (
                    <div key={sesion.id} className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-emerald-400">{new Date(sesion.fecha).toLocaleDateString()}</span>
                            <span className="text-xs font-mono text-gray-400">{sesion.duracion_minutos} min</span>
                        </div>
                        <p className="text-sm text-white font-medium mb-1">{sesion.logros || "Sin notas"}</p>
                        {sesion.proyectos && (
                            <span className="text-[10px] bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded inline-block">
                                📂 {sesion.proyectos.nombre}
                            </span>
                        )}
                        <div className="flex gap-2 mt-2 text-[10px] text-gray-500">
                             <span>⚡ Inicio: {sesion.energia_inicial}/10</span>
                             <span>🏁 Fin: {sesion.energia_final}/10</span>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );

  // 3. FASE RESPIRACIÓN (FULL SCREEN)
  if (fase === 'respiracion') return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-in fade-in duration-500">
          <AudioElement />
          <p className="text-gray-400 text-sm mb-8 tracking-widest uppercase">Calibrando sistema nervioso...</p>
          <div 
            className="w-40 h-40 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full blur-xl transition-all duration-[4000ms] ease-in-out"
            style={{ transform: `scale(${escalaCirculo})`, opacity: 0.6 }}
          />
          <h2 className="text-4xl font-bold text-white mt-8 font-mono animate-pulse">{textoRespiracion}</h2>
      </div>
  );

  // 4. FASE FOCUS (WIDGET COMPACTO)
  if (fase === 'focus') return (
      <div className="bg-[#161B22] border border-blue-500/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
          <div className="flex justify-between items-start mb-4">
               <div>
                  <h3 className="text-xl font-bold text-white">Modo Enfoque</h3>
                  <p className="text-xs text-blue-400 animate-pulse">● Grabando sesión...</p>
               </div>
               {proyectoId && <span className="text-[10px] bg-blue-900/50 text-blue-200 px-2 py-1 rounded">Activo</span>}
          </div>
          
          <div className="text-6xl font-mono font-bold text-white text-center my-6 tabular-nums">
              {String(minutos).padStart(2, '0')}:{String(segundos).padStart(2, '0')}
          </div>

          <div className="flex gap-3">
              <button onClick={pausarTimer} className={`flex-1 py-3 rounded-xl font-bold transition flex justify-center ${activo ? "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30" : "bg-emerald-600 text-white hover:bg-emerald-500"}`}>
                  {activo ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
              </button>
              <button onClick={finalizarSesion} className="px-4 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500/30 transition">
                  <StopIcon className="w-6 h-6"/>
              </button>
          </div>
      </div>
  );

  // 5. FASE RESUMEN
  return (
      <div className="bg-[#1C2128] border border-emerald-500/50 p-6 rounded-2xl animate-in zoom-in">
          <h3 className="text-xl font-bold text-white mb-2">¡Misión Cumplida! 🚩</h3>
          
          <div className="space-y-4 mt-4">
              <div>
                  <label className="text-xs text-gray-400 block mb-1">¿Qué lograste?</label>
                  <textarea value={logroTexto} onChange={e => setLogroTexto(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white h-20 outline-none focus:border-emerald-500" placeholder="Ej: Terminé la API..." autoFocus />
              </div>

              <div>
                  <label className="text-xs text-gray-400 block mb-1">Energía Final: {energiaFinal}/10</label>
                  <input type="range" min="1" max="10" value={energiaFinal} onChange={e => setEnergiaFinal(Number(e.target.value))} className="w-full accent-emerald-500 cursor-pointer"/>
              </div>

              <button onClick={guardarSesion} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg">
                  Guardar y Reclamar XP
              </button>
          </div>
      </div>
  );
}