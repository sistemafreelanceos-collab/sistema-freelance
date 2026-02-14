"use client";
import { useState } from "react";
import { useEstadisticas } from "../../hooks/useEstadisticas";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
    CurrencyDollarIcon, ExclamationTriangleIcon, ClockIcon, CheckBadgeIcon
} from "@heroicons/react/24/solid";
import SkeletonDashboard from "../components/SkeletonDashboard";

// Colores
const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
const COLORS_RISK = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function EstadisticasPage() {
    const {
        loading, anioFiltro, setAnioFiltro,
        dataMensual, dataCategorias, kpis,
        metaMensual, ingresosMesActual, progresoMeta,
        riesgoClientes, clienteDominante, valorHoraReal, valorHoraPromedio, tasaCierre,
        guardarMeta: guardarMetaHook
    } = useEstadisticas();

    const [modalMetaOpen, setModalMetaOpen] = useState(false);
    const [nuevaMetaInput, setNuevaMetaInput] = useState("");

    const abrirModalMeta = () => {
        setNuevaMetaInput(metaMensual.toString());
        setModalMetaOpen(true);
    };

    const handleGuardarMeta = async () => {
        const success = await guardarMetaHook(Number(nuevaMetaInput));
        if (success) setModalMetaOpen(false);
    };

    if (loading) return <SkeletonDashboard />;

    return (
        <div className="max-w-7xl mx-auto pb-10 p-6">

            {/* HEADER & FILTRO */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Tablero del CEO 📊</h1>
                    <p className="text-gray-400 text-sm">Visión 360° de tus finanzas y rendimiento.</p>
                </div>
                <select
                    value={anioFiltro}
                    onChange={(e) => setAnioFiltro(Number(e.target.value))}
                    className="bg-[#161B22] border border-white/10 text-white rounded-lg px-4 py-2 outline-none font-bold hover:bg-white/5 transition"
                >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                </select>
            </div>

            {/* --- SECCIÓN 1: INDICADORES ESTRATÉGICOS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

                {/* VELOCÍMETRO META */}
                <div className="bg-[#161B22] border border-white/10 p-6 rounded-2xl relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <CurrencyDollarIcon className="w-5 h-5 text-emerald-400" /> Meta del Mes
                        </h3>
                        <button onClick={abrirModalMeta} className="text-xs text-gray-500 hover:text-white underline decoration-dashed">Editar Meta</button>
                    </div>
                    <div className="flex items-center justify-between mt-6">
                        <div>
                            <p className="text-4xl font-mono font-bold text-white">$ {ingresosMesActual.toLocaleString()}</p>
                            <p className="text-xs text-gray-400 mt-1">de $ {metaMensual.toLocaleString()} objetivo</p>
                        </div>
                        <div className="text-right">
                            <p className={`text-5xl font-bold ${progresoMeta >= 100 ? 'text-emerald-400' : 'text-indigo-400'}`}>{progresoMeta.toFixed(0)}%</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-wider">Logrado</p>
                        </div>
                    </div>
                    <div className="w-full bg-gray-800 h-4 rounded-full mt-6 overflow-hidden border border-white/5">
                        <div className={`h-full transition-all duration-1000 ease-out ${progresoMeta >= 100 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-indigo-600'}`} style={{ width: `${progresoMeta}%` }}></div>
                    </div>
                </div>

                {/* TARJETA: DEPENDENCIA DE CLIENTES (Antiguo Riesgo Cartera) */}
                <div className="bg-[#161B22] border border-gray-800 p-6 rounded-2xl col-span-1 lg:col-span-1">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-gray-100 font-bold flex items-center gap-2">
                                🏗️ Solidez del Negocio
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                ¿Qué tan dependiente eres de un solo cliente?
                            </p>
                        </div>
                        {/* Semáforo Visual */}
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${clienteDominante
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}>
                            {clienteDominante ? "⚠️ PELIGRO" : "✅ SANO"}
                        </div>
                    </div>

                    {/* Mensaje Explicativo Claro */}
                    <div className="mb-6 p-4 rounded-xl bg-black/20 border border-white/5">
                        {clienteDominante ? (
                            <p className="text-sm text-red-300 leading-relaxed">
                                <strong className="block mb-1 text-red-400">¡Cuidado!</strong>
                                Si <span className="font-bold underline">{clienteDominante.name}</span> decide irse mañana,
                                perderías el <span className="font-bold">{clienteDominante.porcentaje.toFixed(0)}%</span> de tus ingresos.
                                Tu prioridad debe ser buscar nuevos clientes urgente.
                            </p>
                        ) : (
                            <p className="text-sm text-gray-400 leading-relaxed">
                                <strong className="block mb-1 text-emerald-400">¡Buen trabajo!</strong>
                                Tienes los huevos en varias canastas. Ningún cliente controla tu futuro financiero.
                                Si uno se va, tu negocio sobrevive.
                            </p>
                        )}
                    </div>

                    {/* Lista de Clientes (Top 4) */}
                    <div className="space-y-3">
                        {riesgoClientes.slice(0, 4).map((c, i) => (
                            <div key={i} className="relative">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className={`font-bold ${i === 0 && c.porcentaje > 50 ? 'text-red-400' : 'text-gray-300'}`}>
                                        {c.name}
                                    </span>
                                    <span className="text-gray-500">{c.porcentaje.toFixed(1)}% de tus ingresos</span>
                                </div>
                                {/* Barra de Progreso */}
                                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${c.porcentaje > 50 ? 'bg-red-500' :
                                            c.porcentaje > 25 ? 'bg-yellow-500' : 'bg-emerald-500'
                                            }`}
                                        style={{ width: `${c.porcentaje}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN 2: GRÁFICAS FINANCIERAS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 bg-[#161B22] border border-white/10 p-6 rounded-2xl">
                    <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                        📊 Flujo de Caja Mensual
                        <div className="flex gap-2 text-[10px] ml-auto">
                            <span className="flex items-center gap-1 text-gray-400"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Ingresos</span>
                            <span className="flex items-center gap-1 text-gray-400"><span className="w-2 h-2 rounded-full bg-red-500"></span> Gastos</span>
                        </div>
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataMensual} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="mes" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1C2128', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                                <Bar dataKey="ingresos" name="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="gastos" name="Gastos" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-[#161B22] border border-white/10 p-6 rounded-2xl flex flex-col">
                    <h3 className="text-white font-bold mb-2">💸 Top Gastos</h3>
                    <div className="flex-1 min-h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={dataCategorias} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                    {dataCategorias.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1C2128', border: '1px solid #333' }} itemStyle={{ color: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-2xl font-bold text-white opacity-20">%</span></div>
                    </div>
                    <div className="mt-4 space-y-2">
                        {dataCategorias.map((cat, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span><span className="text-gray-300 capitalize">{cat.name}</span></div>
                                <span className="font-mono text-gray-400">${cat.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN 3: METRICAS AVANZADAS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#161B22] border border-white/10 p-6 rounded-2xl">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><ClockIcon className="w-5 h-5 text-blue-400" /> Valor Hora Real</h3>
                    <div className="flex items-center gap-4 mb-6 bg-blue-900/10 p-4 rounded-xl border border-blue-500/10">
                        <div><p className="text-xs text-blue-300 uppercase font-bold">Promedio</p><p className="text-3xl font-bold text-white font-mono">${valorHoraPromedio.toFixed(0)}<span className="text-sm text-gray-500">/hr</span></p></div>
                        <div className="h-10 w-px bg-white/10"></div>
                        <p className="text-xs text-gray-400 max-w-[200px]">Basado en ingresos reales y horas de Deep Work.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-gray-500 border-b border-white/5"><tr><th className="pb-2 font-normal">Proyecto</th><th className="pb-2 font-normal text-right">Horas</th><th className="pb-2 font-normal text-right">Ingresos</th><th className="pb-2 font-normal text-right">Valor Hora</th></tr></thead>
                            <tbody className="divide-y divide-white/5">
                                {valorHoraReal.length === 0 ? <tr><td colSpan={4} className="py-4 text-center text-gray-500">Faltan datos de tiempo/dinero.</td></tr> : valorHoraReal.map((p, i) => (
                                    <tr key={i} className="group hover:bg-white/5 transition"><td className="py-3 text-gray-300 font-bold">{p.nombre}</td><td className="py-3 text-right text-gray-400">{p.horas.toFixed(1)}h</td><td className="py-3 text-right text-emerald-400">${p.ingresos.toLocaleString()}</td><td className="py-3 text-right font-mono font-bold text-white bg-white/5 rounded-r-lg">${p.tasa.toFixed(0)}/hr</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-[#161B22] border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
                    <div><h3 className="text-white font-bold mb-2 flex items-center gap-2"><CheckBadgeIcon className="w-5 h-5 text-purple-400" /> Conversión</h3><p className="text-xs text-gray-500">Efectividad comercial.</p></div>
                    <div className="flex flex-col items-center justify-center py-6 relative">
                        <div className="w-32 h-32 rounded-full border-8 border-purple-900/30 flex items-center justify-center relative">
                            <div className="text-center"><p className="text-3xl font-bold text-white">{tasaCierre.tasa.toFixed(0)}%</p><p className="text-[10px] text-gray-400 uppercase">Cierre</p></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-black/20 p-2 rounded-lg"><p className="text-xl font-bold text-white">{tasaCierre.total}</p><p className="text-[10px] text-gray-500 uppercase">Leads</p></div>
                        <div className="bg-purple-500/10 p-2 rounded-lg border border-purple-500/20"><p className="text-xl font-bold text-purple-300">{tasaCierre.convertidos}</p><p className="text-[10px] text-purple-400 uppercase">Clientes</p></div>
                    </div>
                </div>
            </div>

            {/* --- NUEVO MODAL MINIMALISTA --- */}
            {modalMetaOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-[#1C2128] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-white font-bold text-lg mb-2">Definir Meta Mensual</h3>
                        <p className="text-gray-400 text-xs mb-4">¿Cuánto quieres facturar este mes?</p>

                        <input
                            type="number"
                            autoFocus
                            value={nuevaMetaInput}
                            onChange={(e) => setNuevaMetaInput(e.target.value)}
                            className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white text-xl font-mono font-bold outline-none focus:border-emerald-500 mb-6"
                            placeholder="5000"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setModalMetaOpen(false)}
                                className="flex-1 py-3 text-gray-400 hover:text-white text-sm font-bold transition rounded-xl hover:bg-white/5"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGuardarMeta}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}