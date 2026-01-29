"use client";
import { useState } from "react";
import { SparklesIcon, LightBulbIcon, ExclamationTriangleIcon, BanknotesIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface Props {
    movimientos: any[];
    presupuestos: any[];
    gastosFijos: any[];
    config: any;
}

export default function CFOVirtual({ movimientos, presupuestos, gastosFijos, config }: Props) {
    const [loading, setLoading] = useState(false);
    const [analisis, setAnalisis] = useState<any>(null);
    const [error, setError] = useState("");

    const analizarFinanzas = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/cfo-ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ movimientos, presupuestos, gastosFijos, config }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al consultar CFO");
            setAnalisis(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden mb-6">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <SparklesIcon className="w-32 h-32 text-indigo-400" />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <SparklesIcon className="w-6 h-6 text-yellow-400 animate-pulse" />
                            CFO Virtual AI
                        </h3>
                        <p className="text-indigo-200 text-sm">Tu asistente financiero inteligente.</p>
                    </div>
                    {!analisis && !loading && (
                        <button onClick={analizarFinanzas} className="bg-white text-indigo-900 font-bold px-4 py-2 rounded-lg text-sm hover:scale-105 transition shadow-lg flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4" /> Analizar Ahora
                        </button>
                    )}
                </div>

                {loading && (
                    <div className="flex items-center gap-3 text-indigo-200 animate-pulse py-4">
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        <p>Analizando tus patrones de gasto y presupuestos...</p>
                    </div>
                )}

                {error && (
                    <div className="text-red-400 bg-red-900/20 p-3 rounded-lg text-sm mb-4">
                        Error: {error}. (Verifica tu API Key)
                    </div>
                )}

                {analisis && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                            <p className="text-indigo-100 italic">"{analisis.resumen}"</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {analisis.consejos.map((consejo: any, i: number) => (
                                <div key={i} className="bg-[#161B22]/80 p-4 rounded-xl border border-white/5 hover:border-indigo-500/30 transition">
                                    <div className="mb-2">
                                        {consejo.icono === 'ahorro' && <BanknotesIcon className="w-6 h-6 text-emerald-400" />}
                                        {consejo.icono === 'alerta' && <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />}
                                        {consejo.icono === 'inversion' && <LightBulbIcon className="w-6 h-6 text-yellow-400" />}
                                    </div>
                                    <h4 className="font-bold text-white text-sm mb-1">{consejo.titulo}</h4>
                                    <p className="text-xs text-gray-400">{consejo.descripcion}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end mt-2">
                            <button onClick={analizarFinanzas} className="text-xs text-indigo-300 hover:text-white flex items-center gap-1">
                                <ArrowPathIcon className="w-3 h-3" /> Actualizar análisis
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
