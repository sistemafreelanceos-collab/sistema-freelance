"use client";
import { useState } from "react";
import { useHabitos } from "../../hooks/useHabitos";
import HabitTracker from "./components/HabitTracker";
import DeepWork from "./components/DeepWork";
import LevelBar from "./components/LevelBar";
import BodyBattery from "./components/BodyBattery";
import DailyJournal from "./components/DailyJournal";
import SkeletonGrid from "../components/SkeletonGrid";

export default function HabitosPage() {
  const { userId, proyectos, userXP, loading, updateXP } = useHabitos();
  const [focusMode, setFocusMode] = useState(false);

  if (loading || !userId) return <SkeletonGrid />;

  return (
    <div className="max-w-6xl mx-auto pb-20 p-6">

      {!focusMode && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4">
          <h1 className="text-3xl font-bold text-white mb-2">Bio-Hacking & Rutina 🧬</h1>
          <p className="text-gray-400 text-sm mb-6">Gestiona tu energía, no solo tu tiempo.</p>
          <LevelBar xp={userXP.xp_total} nivel={userXP.nivel} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* COLUMNA 1: HÁBITOS Y JOURNAL */}
        {!focusMode && (
          <div className="space-y-6 animate-in fade-in">
            <div className="h-[500px]">
              <HabitTracker userId={userId} onUpdateXP={updateXP} />
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
            onUpdateXP={updateXP}
            onFocusMode={setFocusMode}
          />
        </div>

      </div>
    </div>
  );
}