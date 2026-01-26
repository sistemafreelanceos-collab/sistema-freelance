"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  userId: string;
  updateTrigger: number; // Para forzar recarga
}

export default function BioDataChart({ userId, updateTrigger }: Props) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const cargarDatos = async () => {
        if (!userId) return;

        // 1. Obtener rango de fechas (últimos 14 días)
        const hoy = new Date();
        const dias = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(hoy.getDate() - i);
            dias.push(d.toISOString().split('T')[0]);
        }

        // 2. Traer Dinero (Ingresos)
        const { data: movs } = await supabase.from("movimientos")
            .select("fecha, monto")
            .eq("owner_id", userId)
            .eq("tipo", "ingreso")
            .gte("fecha", dias[0]);

        // 3. Traer Hábitos (Registros)
        const { data: habs } = await supabase.from("registros_habitos")
            .select("fecha")
            .in("fecha", dias); // Simplificado: Solo traemos fechas donde hubo checks

        // 4. Cruzar datos
        const merged = dias.map(fecha => {
            const ingresosDia = movs?.filter(m => m.fecha === fecha).reduce((sum, m) => sum + m.monto, 0) || 0;
            // Puntuación simple: Cuántos hábitos completé ese día (Arbitrario para demo)
            const habitosDia = habs?.filter(h => h.fecha === fecha).length || 0;
            const scoreHabitos = Math.min(habitosDia * 25, 100); // Asumiendo 4 hábitos = 100%

            return {
                fecha: fecha.slice(5), // MM-DD
                dinero: ingresosDia,
                habitos: scoreHabitos
            };
        });

        setData(merged);
    };
    cargarDatos();
  }, [userId, updateTrigger]);

  return (
    <div className="bg-[#161B22] border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Salud vs Dinero</h3>
            <div className="flex gap-4 text-xs font-bold">
                <span className="text-emerald-400 flex items-center gap-1">● % Hábitos</span>
                <span className="text-blue-400 flex items-center gap-1">● Ingresos ($)</span>
            </div>
        </div>
        
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorHabitos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDinero" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="fecha" stroke="#6B7280" fontSize={10} tickLine={false}/>
                    <YAxis yAxisId="left" stroke="#10B981" fontSize={10} tickLine={false} unit="%" />
                    <YAxis yAxisId="right" orientation="right" stroke="#3B82F6" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1C2128', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#9CA3AF' }}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="habitos" stroke="#10B981" fillOpacity={1} fill="url(#colorHabitos)" />
                    <Area yAxisId="right" type="monotone" dataKey="dinero" stroke="#3B82F6" fillOpacity={1} fill="url(#colorDinero)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
            * Compara tu disciplina diaria con tus días de facturación.
        </p>
    </div>
  );
}