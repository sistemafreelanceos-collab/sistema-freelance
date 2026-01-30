"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const FRASES_MOTIVADORAS = [
    "🚀 El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
    "💎 Tu trabajo tiene valor. No bajes tus estándares.",
    "🦁 Un freelancer no espera oportunidades, las crea.",
    "🔥 Hazlo con pasión o no lo hagas.",
    "⏳ El tiempo es tu activo más valioso. ¡Úsalo bien!",
    "💡 La creatividad es la inteligencia divirtiéndose.",
    "🌟 La excelencia no es un acto, es un hábito.",
    "🔨 Construye tus sueños o alguien más te contratará para construir los suyos.",
    "💰 Cobra lo que vales, no lo que el cliente quiere pagar.",
    "📈 Cada proyecto es un escalón más hacia tu libertad.",
    "🌍 Tu oficina es el mundo. Disfruta tu libertad.",
    "🎯 Enfócate en el 20% que genera el 80% de los resultados.",
    "🧘‍♂️ Descansar también es parte del trabajo.",
    "🚧 El único lugar donde el éxito viene antes que el trabajo es en el diccionario.",
    "🌱 Sigue sembrando, la cosecha llegará."
];

export default function MotivationSystem() {
    const [enabled, setEnabled] = useState(false);
    const [frequency, setFrequency] = useState(60); // Minutos

    useEffect(() => {
        const loadSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("profiles")
                .select("motivation_enabled, motivation_frequency")
                .eq("id", user.id)
                .single();

            if (data) {
                setEnabled(data.motivation_enabled ?? true);
                setFrequency(data.motivation_frequency ?? 60);
            }
        };

        loadSettings();
    }, []);

    useEffect(() => {
        if (!enabled) return;

        // Convertir minutos a milisegundos
        const intervalMs = frequency * 60 * 1000;

        const timer = setInterval(() => {
            const frase = FRASES_MOTIVADORAS[Math.floor(Math.random() * FRASES_MOTIVADORAS.length)];

            toast.custom((t) => (
                <div className="bg-gradient-to-r from-emerald-900 to-black border border-emerald-500/30 p-4 rounded-xl shadow-2xl flex items-center gap-4 max-w-md w-full animate-in slide-in-from-bottom-5 duration-500">
                    <span className="text-3xl">💡</span>
                    <div>
                        <p className="text-emerald-400 font-bold text-xs uppercase mb-1">Momento de Inspiración</p>
                        <p className="text-white font-medium text-sm italic">"{frase}"</p>
                    </div>
                    <button
                        onClick={() => toast.dismiss(t)}
                        className="ml-auto text-gray-500 hover:text-white p-1"
                    >
                        ✕
                    </button>
                </div>
            ), { duration: 8000 }); // Dura 8 segundos en pantalla

        }, intervalMs);

        return () => clearInterval(timer);
    }, [enabled, frequency]);

    return null; // Este componente no renderiza nada visualmente por sí mismo, solo gestiona los toasts
}
