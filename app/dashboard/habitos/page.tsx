"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import HabitTracker from "./components/HabitTracker";
import DeepWork from "./components/DeepWork";
import LevelBar from "./components/LevelBar";
import BodyBattery from "./components/BodyBattery"; // Nuevo
import DailyJournal from "./components/DailyJournal"; // Nuevo

export default function HabitosPage() {
  const [userId, setUserId] = useState("");
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [userXP, setUserXP] = useState({ xp: 0, nivel: 1 });
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;
      setUserId(uid);

      const { data: proys } = await supabase.from("proyectos").select("id, nombre").eq("owner_id", uid);
      setProyectos(proys || []);

      const { data: xpData } = await supabase.from("user_xp").select("xp_total, nivel").eq("owner_id", uid).single();
      if (xpData) setUserXP({ xp: xpData.xp_total, nivel: xpData.nivel });
      else await supabase.from("user_xp").insert({ owner_id: uid, xp_total: 0, nivel: 1 });
    };
    init();
  }, []);

  const handleUpdateXP = async (puntos: number) => {
      const nuevoXP = Math.max(0, userXP.xp + puntos);
      let nuevoNivel = userXP.nivel;
      if (nuevoXP >= nuevoNivel * 100) {
          nuevoNivel++;
          alert(`🎉 ¡SUBISTE A NIVEL ${nuevoNivel}! 🎉`);
      }
      setUserXP({ xp: nuevoXP, nivel: nuevoNivel });
      await supabase.from("user_xp").update({ xp_total: nuevoXP, nivel: nuevoNivel }).eq("owner_id", userId);
  };

  if (!userId) return <div className="p-10 text-white animate-pulse">Cargando Bio-Data...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 p-6">
      
      {!focusMode && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4">
            <h1 className="text-3xl font-bold text-white mb-2">Bio-Hacking & Rutina 🧬</h1>
            <p className="text-gray-400 text-sm mb-6">Gestiona tu energía, no solo tu tiempo.</p>
            <LevelBar xp={userXP.xp} nivel={userXP.nivel} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* COLUMNA 1: HÁBITOS Y JOURNAL */}
        {!focusMode && (
            <div className="space-y-6 animate-in fade-in">
                <div className="h-[500px]">
                    <HabitTracker userId={userId} onUpdateXP={handleUpdateXP} />
                </div>
                <div className="h-[400px]">
                    <DailyJournal userId={userId} />
                </div>
            </div>
        )}

        {/* COLUMNA 2: ENERGÍA Y DEEP WORK */}
        <div className={`space-y-6 ${!focusMode ? 'sticky top-6' : 'w-full max-w-2xl mx-auto mt-20'}`}>
            
            {/* Solo mostramos la batería si NO estamos en modo enfoque (para no distraer) */}
            {!focusMode && <BodyBattery userId={userId} />}

            <DeepWork 
                userId={userId} 
                proyectos={proyectos} 
                onUpdateXP={handleUpdateXP} 
                onFocusMode={setFocusMode} 
            />
        </div>

      </div>
    </div>
  );
}