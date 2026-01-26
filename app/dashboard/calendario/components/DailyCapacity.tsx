"use client";
import { useMemo } from "react";

interface Props {
    eventos: any[];
    fechaSeleccionada: Date;
}

export default function DailyCapacity({ eventos, fechaSeleccionada }: Props) {
    const stats = useMemo(() => {
        // Filtrar solo TAREAS (ignoramos cobros/pagos que no consumen tiempo)
        const tareasDelDia = eventos.filter(ev => {
            const esTarea = ev.resource?.tipo_evento === 'tarea' || ev.resource?.tipo_evento === 'proyecto';
            if (!esTarea) return false;
            return new Date(ev.start).toDateString() === fechaSeleccionada.toDateString();
        });

        // Calculamos horas (duración real)
        const horasTotales = tareasDelDia.reduce((acc, curr) => {
            const duracionMs = new Date(curr.end).getTime() - new Date(curr.start).getTime();
            return acc + (duracionMs / (1000 * 60 * 60));
        }, 0);
        
        const maxHoras = 8;
        const porcentaje = Math.min((horasTotales / maxHoras) * 100, 100);
        
        let color = "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]";
        let texto = "Día Ligero 🌿";
        
        if (horasTotales >= 4 && horasTotales < 7) {
            color = "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]";
            texto = "Día Productivo ⚡";
        } else if (horasTotales >= 7) {
            color = "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]";
            texto = "¡Saturado! 🔥";
        }

        return { horas: horasTotales, porcentaje, color, texto };
    }, [eventos, fechaSeleccionada]);

    return (
        <div className="bg-[#161B22] border border-white/10 p-4 rounded-xl mb-6 shadow-lg relative overflow-hidden group">
            <div className="flex justify-between items-end mb-3 relative z-10">
                <div>
                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                        Carga ({fechaSeleccionada.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })})
                    </p>
                    <div className="flex items-baseline gap-1">
                        <h3 className="text-white font-bold text-2xl">{stats.horas.toFixed(1)}h</h3>
                        <span className="text-gray-500 text-xs">/ 8h</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`text-[10px] px-2 py-1 rounded border border-white/10 font-bold text-white ${stats.color.split(' ')[0]} bg-opacity-20`}>
                        {stats.texto}
                    </span>
                </div>
            </div>
            
            {/* Barra de progreso */}
            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden relative">
                <div className={`h-full transition-all duration-700 ease-out ${stats.color}`} style={{ width: `${stats.porcentaje}%` }}></div>
            </div>
        </div>
    );
}