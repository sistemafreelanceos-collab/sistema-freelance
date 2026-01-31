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
    const [currentQuote, setCurrentQuote] = useState<string | null>(null);

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
            setCurrentQuote(frase); // Mostrar modal
        }, intervalMs);

        // Opcional: Mostrar uno al inicio para probar (comentar en prod si es molesto)
        // setTimeout(() => {
        //     const frase = FRASES_MOTIVADORAS[Math.floor(Math.random() * FRASES_MOTIVADORAS.length)];
        //     setCurrentQuote(frase);
        // }, 5000);

        return () => clearInterval(timer);
    }, [enabled, frequency]);

    if (!currentQuote) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative bg-[#161B22] border border-emerald-500/50 p-10 rounded-3xl max-w-2xl w-full text-center shadow-2xl shadow-emerald-900/40 animate-in zoom-in-95 duration-300">

                {/* Botón Cerrar */}
                <button
                    onClick={() => setCurrentQuote(null)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition"
                    title="Cerrar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Contenido */}
                <div className="mb-6 inline-flex p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-4xl">💡</span>
                </div>

                <h3 className="text-emerald-400 font-bold tracking-widest uppercase text-sm mb-6">Momento de Inspiración</h3>

                <p className="text-3xl md:text-4xl font-bold text-white leading-tight italic mb-8">
                    "{currentQuote}"
                </p>

                <button
                    onClick={() => setCurrentQuote(null)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-emerald-900/20"
                >
                    Continuar Trabajando
                </button>
            </div>
        </div>
    );
}
