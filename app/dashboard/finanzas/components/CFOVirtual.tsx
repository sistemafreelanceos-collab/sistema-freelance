"use client";
import { useState, useRef, useEffect } from "react";
import { useFinanzas } from "../../../hooks/useFinanzas";
import { SparklesIcon, PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

export default function CFOVirtual() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
        { role: 'ai', text: "Soy Onyx, tu CFO virtual. Analizo tus finanzas en tiempo real. ¿Qué quieres saber?" }
    ]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { movimientos, cuentas, presupuestos, gastosFijos } = useFinanzas();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            // 1. Preparamos el resumen financiero para la IA
            const contextoFinanciero = {
                resumen: "Datos actuales del mes",
                total_ingresos: movimientos.filter(m => m.tipo === 'ingreso').reduce((a, b) => a + b.monto, 0),
                total_gastos: movimientos.filter(m => m.tipo === 'egreso').reduce((a, b) => a + b.monto, 0),
                cuentas_saldo: cuentas.map(c => ({ nombre: c.nombre, saldo: c.saldo_calculado || 0 })),
                gastos_recientes: movimientos.slice(0, 5).map(m => `${m.referencia}: $${m.monto}`),
                presupuestos: presupuestos.map(p => ({
                    categoria: p.categoria,
                    limite: p.monto_limite,
                    gastado: movimientos.filter(m => m.categoria === p.categoria && m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0)
                })),
                gastos_fijos: gastosFijos.map(g => `${g.nombre}: $${g.monto} (${g.dia_pago} de cada mes)`)
            };

            // 2. Enviamos al Backend
            const res = await fetch('/api/cfo-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: userMsg,
                    financialContext: contextoFinanciero
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.reply || "Error al conectar con Onyx");

            setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);

        } catch (error) {
            console.error("Error CFO:", error);
            setMessages(prev => [...prev, { role: 'ai', text: "Lo siento, mi cerebro se desconectó un momento. Intenta de nuevo." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all hover:scale-110 
          ${isOpen ? 'scale-0 opacity-0' : 'bg-emerald-600 text-white'}`}
            >
                <SparklesIcon className="h-8 w-8" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-[#161B22] border border-emerald-500/30 rounded-2xl shadow-2xl flex flex-col h-[500px]"
                    >
                        <div className="p-4 bg-[#0D1117] border-b border-emerald-500/20 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-emerald-500/20 rounded-full">
                                    <SparklesIcon className="h-5 w-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">Onyx AI</h3>
                                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                        CFO Virtual • En línea
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/5 p-1 rounded-lg transition">
                                <XMarkIcon className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                            ? 'bg-emerald-600 text-white rounded-br-none'
                                            : 'bg-[#21262D] text-gray-200 border border-white/5 rounded-bl-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-[#21262D] p-3 rounded-2xl rounded-bl-none border border-white/5 flex gap-1">
                                        <span className="w-2 h-2 bg-emerald-500/50 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-emerald-500/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="w-2 h-2 bg-emerald-500/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 border-t border-white/10 bg-[#0D1117] flex gap-2">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Pregúntale a tus datos..."
                                className="flex-1 bg-[#21262D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition placeholder:text-gray-600"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PaperAirplaneIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
