"use client";
import { BoltIcon } from "@heroicons/react/24/solid";

interface Props {
  xp: number;
  nivel: number;
}

export default function LevelBar({ xp, nivel }: Props) {
  // Lógica simple de RPG: Cada nivel cuesta más XP (Nivel * 100)
  const xpParaSiguienteNivel = nivel * 100;
  const progreso = Math.min((xp / xpParaSiguienteNivel) * 100, 100);

  return (
    <div className="bg-gradient-to-r from-indigo-900 to-purple-900 border border-indigo-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-lg mb-6 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute top-0 right-0 p-4 opacity-10">
          <BoltIcon className="w-24 h-24 text-white" />
      </div>

      <div className="bg-black/40 p-3 rounded-xl border border-white/10 flex flex-col items-center min-w-[80px] z-10">
          <span className="text-[10px] text-indigo-300 font-bold uppercase">Nivel</span>
          <span className="text-3xl font-bold text-white font-mono">{nivel}</span>
      </div>

      <div className="flex-1 z-10">
          <div className="flex justify-between text-xs text-indigo-200 mb-1 font-bold">
              <span>Freelancer XP</span>
              <span>{xp} / {xpParaSiguienteNivel} XP</span>
          </div>
          <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                style={{ width: `${progreso}%` }}
              ></div>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 italic">
              Completa hábitos (+10 XP) y sesiones de Deep Work (+50 XP) para subir.
          </p>
      </div>
    </div>
  );
}