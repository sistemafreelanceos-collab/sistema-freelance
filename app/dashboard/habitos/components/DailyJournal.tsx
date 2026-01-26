"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { BookOpenIcon } from "@heroicons/react/24/solid";

interface Props {
  userId: string;
}

const PROMPTS = [
    "1. ¿Por qué estoy agradecido hoy?",
    "2. ¿Cuál es la ÚNICA cosa que hará que hoy sea un éxito?",
    "3. ¿Qué me está preocupando innecesariamente?"
];

export default function DailyJournal({ userId }: Props) {
  const [contenido, setContenido] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [ultimoGuardado, setUltimoGuardado] = useState("");

  const getFechaLocal = () => {
      const d = new Date();
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };

  useEffect(() => {
    cargarDiario();
  }, [userId]);

  const cargarDiario = async () => {
      const hoy = getFechaLocal();
      const { data } = await supabase.from("journal_estoico").select("contenido").eq("owner_id", userId).eq("fecha", hoy).single();
      
      if (data) setContenido(data.contenido);
      else setContenido(PROMPTS.join("\n\n")); // Cargar prompts por defecto si está vacío
  };

  const guardar = async () => {
      setGuardando(true);
      const hoy = getFechaLocal();
      
      await supabase.from("journal_estoico").upsert({
          owner_id: userId,
          fecha: hoy,
          contenido: contenido
      });

      setGuardando(false);
      const ahora = new Date();
      setUltimoGuardado(`${ahora.getHours()}:${String(ahora.getMinutes()).padStart(2, '0')}`);
  };

  return (
    <div className="bg-[#161B22] border border-white/10 p-6 rounded-2xl flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-bold flex items-center gap-2">
                <BookOpenIcon className="w-5 h-5 text-gray-400"/> Journal Estoico
            </h3>
            <span className="text-[10px] text-gray-500">
                {guardando ? "Guardando..." : ultimoGuardado ? `Guardado ${ultimoGuardado}` : ""}
            </span>
        </div>
        
        <textarea 
            className="flex-1 w-full bg-black/20 border border-white/5 rounded-xl p-4 text-sm text-gray-300 leading-relaxed outline-none focus:border-white/20 resize-none custom-scrollbar"
            placeholder="Escribe aquí tus pensamientos..."
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            onBlur={guardar} // Auto-guardar al salir del foco
        />
        
        <p className="text-[10px] text-gray-600 mt-2 text-center">
            * Se guarda automáticamente al terminar de escribir.
        </p>
    </div>
  );
}