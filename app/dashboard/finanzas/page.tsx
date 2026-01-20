"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type Movimiento = {
  id: string;
  fecha: string;
  descripcion: string; // Nota: En SQL lo llamamos 'referencia' o 'nota', ajustaremos en la query
  monto: number;
  moneda: string;
  tipo: "ingreso" | "egreso";
  fuente: string;
  referencia?: string;
  nota?: string;
  categoria?: string;
  cliente?: { nombre: string } | null; // Join
  cuenta?: { nombre: string } | null;  // Join
};

export default function FinanzasPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | "ingreso" | "egreso">("todos");

  useEffect(() => {
    const cargarFinanzas = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Traemos movimientos con los datos de Cliente y Cuenta (Joins)
      const { data, error } = await supabase
        .from("movimientos")
        .select(`
          *,
          cliente:clientes(nombre),
          cuenta:cuentas(nombre)
        `)
        .eq("owner_id", session.user.id)
        .order("fecha", { ascending: false }) // Más recientes primero
        .limit(50); // Traemos los últimos 50 para no saturar

      if (error) {
        console.error("Error cargando finanzas:", error);
      } else {
        setMovimientos(data as any[]);
      }
      setLoading(false);
    };

    cargarFinanzas();
  }, []);

  const movimientosFiltrados = movimientos.filter(m => filtro === "todos" ? true : m.tipo === filtro);

  // Cálculos rápidos para las tarjetas de arriba
  const totalIngresos = movimientos.filter(m => m.tipo === "ingreso").reduce((sum, m) => sum + m.monto, 0); // Ojo: esto suma monedas mixtas, idealmente filtrar por moneda
  const totalEgresos = movimientos.filter(m => m.tipo === "egreso").reduce((sum, m) => sum + m.monto, 0);

  if (loading) return <div className="p-8 text-gray-400">Cargando movimientos...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      <h1 className="text-3xl font-bold text-white mb-6">Finanzas</h1>

      {/* TARJETAS RESUMEN (Simple) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#161B22] border border-white/10 p-6 rounded-2xl">
          <p className="text-xs text-gray-400 uppercase font-bold">Ingresos (Vista Rápida)</p>
          <p className="text-2xl font-mono text-emerald-400 font-bold">+ ${totalIngresos.toLocaleString()}</p>
        </div>
        <div className="bg-[#161B22] border border-white/10 p-6 rounded-2xl">
          <p className="text-xs text-gray-400 uppercase font-bold">Gastos (Vista Rápida)</p>
          <p className="text-2xl font-mono text-red-400 font-bold">- ${totalEgresos.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-900/40 to-black border border-blue-500/30 p-6 rounded-2xl">
          <p className="text-xs text-blue-200 uppercase font-bold">Flujo Neto</p>
          <p className="text-2xl font-mono text-white font-bold">$ {(totalIngresos - totalEgresos).toLocaleString()}</p>
        </div>
      </div>

      {/* FILTROS Y TABLA */}
      <div className="bg-[#161B22] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-bold text-white">Últimos Movimientos</h3>
          <div className="flex bg-[#0F1115] rounded-lg p-1 border border-white/5">
            <button onClick={() => setFiltro("todos")} className={`px-3 py-1 text-xs rounded-md transition ${filtro === "todos" ? "bg-white/10 text-white" : "text-gray-400"}`}>Todos</button>
            <button onClick={() => setFiltro("ingreso")} className={`px-3 py-1 text-xs rounded-md transition ${filtro === "ingreso" ? "bg-emerald-500/20 text-emerald-400" : "text-gray-400"}`}>Ingresos</button>
            <button onClick={() => setFiltro("egreso")} className={`px-3 py-1 text-xs rounded-md transition ${filtro === "egreso" ? "bg-red-500/20 text-red-400" : "text-gray-400"}`}>Gastos</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1C2128] text-gray-400 font-medium">
              <tr>
                <th className="p-4">Fecha</th>
                <th className="p-4">Descripción</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Cuenta</th>
                <th className="p-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {movimientosFiltrados.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay movimientos registrados.</td></tr>
              ) : (
                movimientosFiltrados.map((m) => (
                  <tr key={m.id} className="hover:bg-white/5 transition group">
                    <td className="p-4 text-gray-400 whitespace-nowrap">{m.fecha}</td>
                    <td className="p-4">
                      <div className="text-white font-medium">{m.referencia || m.nota || "Sin detalle"}</div>
                      <div className="text-xs text-gray-500">
                        {m.cliente ? `Cliente: ${m.cliente.nombre}` : m.fuente}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] uppercase border ${
                        m.tipo === 'ingreso' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {m.categoria || m.tipo}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">{m.cuenta?.nombre || "—"}</td>
                    <td className={`p-4 text-right font-mono font-bold ${m.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.tipo === 'ingreso' ? '+' : '-'} {m.monto.toLocaleString()} <span className="text-[10px] text-gray-500">{m.moneda}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}