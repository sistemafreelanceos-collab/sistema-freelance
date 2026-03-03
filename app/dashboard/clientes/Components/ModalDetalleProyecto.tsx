"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { toast } from "sonner";
import { Proyecto, Cliente } from "../../../../types";
import dynamic from "next/dynamic";

const PDFBuilderPanel = dynamic(() => import("./PDFBuilderPanel"), { ssr: false });

interface Props {
    isOpen: boolean;
    onClose: () => void;
    proyecto: Proyecto | null;
    cliente: Cliente | null;
    onEditar: (p: Proyecto) => void;
    onRegistrarPago: () => void;
    onEliminar: (id: string, clienteId: string) => void;
}

export default function ModalDetalleProyecto({ isOpen, onClose, proyecto, cliente, onEditar, onRegistrarPago, onEliminar }: Props) {
    const [miPerfil, setMiPerfil] = useState<any>(null);
    const [showPDFBuilder, setShowPDFBuilder] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchPerfil = async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                    setMiPerfil(data);
                }
            };
            fetchPerfil();
        }
    }, [isOpen]);

    if (!isOpen || !proyecto || !cliente) return null;

    const montoFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: proyecto.moneda || 'USD', maximumFractionDigits: 0 }).format(proyecto.monto);
    const pagado = proyecto.pagos_cliente?.reduce((sum: number, p: any) => sum + p.monto, 0) || 0;
    const yaPagoTodo = pagado >= proyecto.monto && proyecto.monto > 0;

    return (
        <>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">

                    {/* Header */}
                    <div className="flex justify-between items-start p-6 border-b border-white/10">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{proyecto.nombre}</h2>
                            <p className="text-gray-400 text-sm mt-1">Cliente: <span className="text-emerald-400">{cliente.nombre}</span></p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition bg-white/5 p-2 rounded-lg hover:bg-white/10">✕</button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <span className="text-xs text-gray-500 uppercase font-bold">Monto Total</span>
                                <div className="text-2xl font-mono text-white mt-1">{montoFormatted}</div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <span className="text-xs text-gray-500 uppercase font-bold">Estado</span>
                                <div className="mt-1">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                    ${proyecto.estado === 'pendiente' ? 'bg-yellow-500/20 text-yellow-400' :
                                            proyecto.estado === 'finalizado' ? 'bg-emerald-500/20 text-emerald-400' :
                                                'bg-blue-500/20 text-blue-400'}`}>
                                        {proyecto.estado.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {proyecto.descripcion && (
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <h4 className="text-sm font-bold text-gray-300 mb-2">Descripción / Notas</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">{proyecto.descripcion}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-white/10 bg-white/5 flex flex-col gap-3">

                        {/* Row 1: Main Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={onRegistrarPago}
                                disabled={yaPagoTodo}
                                className={`flex-1 font-bold py-3 rounded-xl transition flex justify-center items-center gap-2 ${yaPagoTodo ? 'bg-gray-800 text-gray-500' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                            >
                                {yaPagoTodo ? "✅ Pagado" : "💰 Registrar Pago"}
                            </button>

                            <button onClick={() => onEditar(proyecto)} className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 rounded-xl transition">
                                ✏️
                            </button>
                        </div>

                        {/* Row 2: Secondary Actions */}
                        <div className="flex gap-3">
                            {/* PDF Builder Button */}
                            {miPerfil && proyecto && cliente && (
                                <button
                                    onClick={() => setShowPDFBuilder(true)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 border border-white/10 text-sm"
                                >
                                    📄 Generar Documento
                                </button>
                            )}

                            {/* Delete Button */}
                            <button
                                onClick={() => {
                                    toast.error("¿Eliminar este proyecto permanentemente?", {
                                        action: { label: "Eliminar", onClick: () => { onEliminar(proyecto.id, cliente.id); onClose(); } },
                                        cancel: { label: "Cancelar", onClick: () => { } },
                                        duration: 5000,
                                    });
                                }}
                                className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl transition border border-red-500/20 text-sm"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* PDF Builder Panel */}
            {showPDFBuilder && miPerfil && proyecto && cliente && (
                <PDFBuilderPanel
                    isOpen={showPDFBuilder}
                    onClose={() => setShowPDFBuilder(false)}
                    proyecto={proyecto}
                    cliente={cliente}
                    perfil={miPerfil}
                />
            )}
        </>
    );
}