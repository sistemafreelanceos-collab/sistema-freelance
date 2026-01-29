"use client";
import { useMemo } from "react";
import { Movimiento, Presupuesto } from "../../../../types";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

interface Props {
    movimientos: Movimiento[];
    presupuestos: Presupuesto[];
    onOpenModal: () => void;
    onEdit: (presupuesto: Presupuesto) => void; // NUEVO
    onDelete: (id: string) => void; // NUEVO
}

export default function PresupuestosTab({ movimientos, presupuestos, onOpenModal, onEdit, onDelete }: Props) {

    const semaforo = useMemo(() => {
        const hoy = new Date();
        const mes = hoy.getMonth();
        const anio = hoy.getFullYear();

        const gastosMes = movimientos.filter(m => {
            const d = new Date(m.fecha);
            return m.tipo === 'egreso' && d.getMonth() === mes && d.getFullYear() === anio;
        });

        const gastoPorCat: Record<string, number> = {};
        gastosMes.forEach(m => {
            const cat = m.categoria || "varios";
            gastoPorCat[cat] = (gastoPorCat[cat] || 0) + m.monto;
        });

        return presupuestos.map(p => {
            const gastado = gastoPorCat[p.categoria] || 0;
            const porcentaje = p.monto_limite > 0 ? (gastado / p.monto_limite) * 100 : 0;

            let color = "bg-emerald-500";
            let texto = "Controlado";

            if (porcentaje >= 70 && porcentaje < 100) { color = "bg-yellow-500"; texto = "Precaución"; }
            else if (porcentaje >= 100) { color = "bg-red-500"; texto = "Excedido"; }

            return { ...p, gastado, porcentaje, color, texto };
        });
    }, [movimientos, presupuestos]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
                <h3 className="text-white font-bold text-xl">Semáforo de Presupuestos</h3>
                <button onClick={onOpenModal} className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-indigo-500 transition shadow-lg">+ Nuevo Límite</button>
            </div>

            {semaforo.length === 0 ? (
                <div className="text-center py-20 bg-[#161B22] border border-white/5 rounded-2xl">
                    <p className="text-gray-500">No has definido límites de gasto.</p>
                    <button onClick={onOpenModal} className="mt-4 text-indigo-400 hover:text-white underline text-sm">Crear el primero</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {semaforo.map((p) => (
                        <div key={p.id} className="bg-[#1C2128] border border-white/10 p-5 rounded-2xl relative group hover:border-white/20 transition">
                            {/* Botones de Acción (Visibles al hacer hover) */}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onEdit(p)} className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition">
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => onDelete(p.id)} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex justify-between items-end mb-4 pr-16">
                                <div>
                                    <h4 className="text-white font-bold capitalize text-lg">{p.categoria}</h4>
                                    <p className="text-xs text-gray-400">Tope: ${p.monto_limite.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-2">
                                <p className="text-3xl font-mono font-bold text-white">${p.gastado.toLocaleString()}</p>
                                <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase text-white ${p.color.replace('bg-', 'bg-opacity-20 text-')}`}>{p.texto}</span>
                            </div>

                            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                                <div className={`h-3 rounded-full transition-all duration-500 ${p.color}`} style={{ width: `${Math.min(p.porcentaje, 100)}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}