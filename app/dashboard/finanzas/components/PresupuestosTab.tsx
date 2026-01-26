"use client";
import { useMemo } from "react";
import { Movimiento, Presupuesto } from "../types";

interface Props {
  movimientos: Movimiento[];
  presupuestos: Presupuesto[];
  onOpenModal: () => void;
}

export default function PresupuestosTab({ movimientos, presupuestos, onOpenModal }: Props) {
  
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
        const porcentaje = (gastado / p.monto_limite) * 100;
        
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
            <button onClick={onOpenModal} className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg text-sm">+ Nuevo Límite</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {semaforo.map((p) => (
                <div key={p.id} className="bg-[#1C2128] border border-white/10 p-5 rounded-2xl">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h4 className="text-white font-bold capitalize text-lg">{p.categoria}</h4>
                            <p className="text-xs text-gray-400">Tope: ${p.monto_limite}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase text-white ${p.color.replace('bg-', 'bg-opacity-20 text-')}`}>{p.texto}</span>
                    </div>
                    <div className="flex items-end gap-1 mb-2">
                        <p className="text-3xl font-mono font-bold text-white">${p.gastado.toLocaleString()}</p>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3">
                        <div className={`h-3 rounded-full transition-all duration-500 ${p.color}`} style={{ width: `${Math.min(p.porcentaje, 100)}%` }}></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}