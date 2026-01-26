"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { 
  CurrencyDollarIcon, 
  ExclamationTriangleIcon, 
  ClockIcon, 
  CheckBadgeIcon 
} from "@heroicons/react/24/solid";

// Colores
const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
const COLORS_RISK = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function EstadisticasPage() {
  const [loading, setLoading] = useState(true);
  const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear());

  // ESTADOS DEL MODAL (NUEVO)
  const [modalMetaOpen, setModalMetaOpen] = useState(false);
  const [nuevaMetaInput, setNuevaMetaInput] = useState("");

  // DATOS GRÁFICAS
  const [dataMensual, setDataMensual] = useState<any[]>([]);
  const [dataCategorias, setDataCategorias] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ ingresos: 0, gastos: 0, utilidad: 0, margen: 0 });

  // DATOS CEO
  const [metaMensual, setMetaMensual] = useState(0);
  const [ingresosMesActual, setIngresosMesActual] = useState(0);
  const [progresoMeta, setProgresoMeta] = useState(0);
  const [riesgoClientes, setRiesgoClientes] = useState<any[]>([]);
  const [clienteDominante, setClienteDominante] = useState<any>(null);
  const [valorHoraReal, setValorHoraReal] = useState<any[]>([]);
  const [valorHoraPromedio, setValorHoraPromedio] = useState(0);
  const [tasaCierre, setTasaCierre] = useState({ tasa: 0, total: 0, convertidos: 0 });

  useEffect(() => {
    cargarDatosCompletos();
  }, [anioFiltro]);

  const cargarDatosCompletos = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const uid = session.user.id;

    // --- 1. CARGAR META ---
    const { data: config } = await supabase.from("config_finanzas").select("meta_mensual").eq("owner_id", uid).single();
    const meta = config?.meta_mensual || 0;
    setMetaMensual(meta);

    // --- 2. CARGAR MOVIMIENTOS DEL AÑO ---
    const startYear = `${anioFiltro}-01-01`;
    const endYear = `${anioFiltro}-12-31`;

    const { data: movs } = await supabase
      .from("movimientos")
      .select("*")
      .eq("owner_id", uid)
      .gte("fecha", startYear)
      .lte("fecha", endYear);

    if (movs) {
        // A. Data Mensual y Categorías
        const meses = Array(12).fill(0).map((_, i) => ({
            mes: new Date(0, i).toLocaleString('es-ES', { month: 'short' }),
            ingresos: 0,
            gastos: 0,
            utilidad: 0
        }));

        let totalIngresos = 0;
        let totalGastos = 0;
        const catGastos: Record<string, number> = {};

        movs.forEach(m => {
            const [y, mn] = m.fecha.split('-').map(Number);
            const mesIndex = mn - 1; 
            const monto = Number(m.monto);

            if (m.tipo === 'ingreso') {
                if(meses[mesIndex]) meses[mesIndex].ingresos += monto;
                totalIngresos += monto;
            } else {
                if(meses[mesIndex]) meses[mesIndex].gastos += monto;
                totalGastos += monto;
                const cat = m.categoria || "Varios";
                catGastos[cat] = (catGastos[cat] || 0) + monto;
            }
        });

        meses.forEach(m => m.utilidad = m.ingresos - m.gastos);
        setDataMensual(meses);

        const listaCat = Object.entries(catGastos)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
        setDataCategorias(listaCat);

        const utilidadNeta = totalIngresos - totalGastos;
        const margen = totalIngresos > 0 ? (utilidadNeta / totalIngresos) * 100 : 0;
        setKpis({ ingresos: totalIngresos, gastos: totalGastos, utilidad: utilidadNeta, margen });

        // B. Ingresos Mes Actual (Para Velocímetro)
        const hoy = new Date();
        const mesActual = hoy.getMonth();
        if (anioFiltro === hoy.getFullYear()) {
            const totalMesActual = meses[mesActual].ingresos;
            setIngresosMesActual(totalMesActual);
            setProgresoMeta(meta > 0 ? Math.min((totalMesActual / meta) * 100, 100) : 0);
        }
    }

    // --- 3. DATOS CEO ---
    const { data: proyectos } = await supabase.from("proyectos").select("id, cliente_id, clientes(nombre)").eq("owner_id", uid);
    
    // RIESGO CLIENTES
    const ingresosPorCliente: Record<string, number> = {};
    let totalIngresosAnio = 0;

    movs?.forEach(m => {
        if (m.tipo === 'ingreso') {
            totalIngresosAnio += m.monto;
            if (m.proyecto_id) {
                const proy = proyectos?.find(p => p.id === m.proyecto_id);
                // CORRECCIÓN AQUÍ: Usamos 'as any' para evitar el error de TypeScript
                const clienteData = proy?.clientes as any;
                const clienteNombre = clienteData?.nombre || "Sin Cliente";
                ingresosPorCliente[clienteNombre] = (ingresosPorCliente[clienteNombre] || 0) + m.monto;
            } else {
                ingresosPorCliente["Varios"] = (ingresosPorCliente["Varios"] || 0) + m.monto;
            }
        }
    });

    const dataRiesgo = Object.entries(ingresosPorCliente)
        .map(([name, value]) => ({ name, value, porcentaje: totalIngresosAnio > 0 ? (value / totalIngresosAnio) * 100 : 0 }))
        .sort((a, b) => b.value - a.value);

    setRiesgoClientes(dataRiesgo);
    if (dataRiesgo.length > 0 && dataRiesgo[0].porcentaje > 50) setClienteDominante(dataRiesgo[0]);

    // VALOR HORA REAL
    const { data: sesiones } = await supabase.from("sesiones_focus").select("duracion_minutos, proyecto_id").eq("owner_id", uid);
    const horasPorProyecto: Record<string, number> = {};
    sesiones?.forEach(s => {
        if(s.proyecto_id) horasPorProyecto[s.proyecto_id] = (horasPorProyecto[s.proyecto_id] || 0) + (s.duracion_minutos / 60);
    });

    const ingresosPorProyecto: Record<string, number> = {};
    movs?.forEach(m => {
        if(m.proyecto_id && m.tipo === 'ingreso') ingresosPorProyecto[m.proyecto_id] = (ingresosPorProyecto[m.proyecto_id] || 0) + m.monto;
    });

    const tablaValorHora = proyectos?.map(p => {
        const horas = horasPorProyecto[p.id] || 0;
        const ingresos = ingresosPorProyecto[p.id] || 0;
        // CORRECCIÓN AQUÍ TAMBIÉN
        const clienteData = p.clientes as any;
        return {
            nombre: clienteData?.nombre ? `${clienteData.nombre} - Proyecto` : "Proyecto",
            horas: horas,
            ingresos: ingresos,
            tasa: horas > 0 ? ingresos / horas : 0
        };
    }).filter(p => p.horas > 0 || p.ingresos > 0).sort((a,b) => b.tasa - a.tasa) || [];

    setValorHoraReal(tablaValorHora);
    const totalIngresosProy = tablaValorHora.reduce((acc, curr) => acc + curr.ingresos, 0);
    const totalHorasProy = tablaValorHora.reduce((acc, curr) => acc + curr.horas, 0);
    setValorHoraPromedio(totalHorasProy > 0 ? totalIngresosProy / totalHorasProy : 0);

    // TASA DE CIERRE
    const { data: clientes } = await supabase.from("clientes").select("estado").eq("owner_id", uid);
    const totalLeads = clientes?.length || 0;
    const activos = clientes?.filter(c => c.estado === 'activo').length || 0;
    setTasaCierre({
        total: totalLeads,
        convertidos: activos,
        tasa: totalLeads > 0 ? (activos / totalLeads) * 100 : 0
    });

    setLoading(false);
  };

  // --- NUEVA LÓGICA DE MODAL ---
  const abrirModalMeta = () => {
      setNuevaMetaInput(metaMensual.toString());
      setModalMetaOpen(true);
  };

  const guardarMeta = async () => {
      const val = Number(nuevaMetaInput);
      if (!isNaN(val) && val >= 0) {
          const { data: { session } } = await supabase.auth.getSession();
          await supabase.from("config_finanzas").update({ meta_mensual: val }).eq("owner_id", session?.user.id);
          setMetaMensual(val);
          setProgresoMeta(val > 0 ? Math.min((ingresosMesActual / val) * 100, 100) : 0);
          setModalMetaOpen(false);
      }
  };

  if (loading) return <div className="text-center py-20 text-gray-500 animate-pulse">Analizando negocio...</div>;

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
                      <CurrencyDollarIcon className="w-5 h-5 text-emerald-400"/> Meta del Mes
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

          {/* RIESGO CLIENTES */}
          <div className="bg-[#161B22] border border-white/10 p-6 rounded-2xl">
              <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-bold flex items-center gap-2">
                      <ExclamationTriangleIcon className={`w-5 h-5 ${clienteDominante ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}/> Riesgo Cartera
                  </h3>
                  {clienteDominante ? <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-1 rounded border border-red-500/30 font-bold">⚠️ {clienteDominante.name} &gt; 50%</span> : <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded border border-emerald-500/30">✅ Diversificado</span>}
              </div>
              <div className="h-40 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={riesgoClientes.slice(0, 4)} margin={{ left: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={100} tick={{fill: '#9CA3AF', fontSize: 10}} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#1C2128', border: 'none' }} itemStyle={{color:'#fff'}} formatter={(val: number) => `${val.toFixed(1)}%`} />
                          <Bar dataKey="porcentaje" radius={[0, 4, 4, 0]} barSize={15}>
                              {riesgoClientes.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.porcentaje > 50 ? '#EF4444' : COLORS_RISK[index % COLORS_RISK.length]} />)}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
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
                      <BarChart data={dataMensual} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                          <XAxis dataKey="mes" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                          <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1C2128', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
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
                          <Tooltip contentStyle={{ backgroundColor: '#1C2128', border: '1px solid #333' }} itemStyle={{color: '#fff'}} />
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
              <h3 className="text-white font-bold mb-4 flex items-center gap-2"><ClockIcon className="w-5 h-5 text-blue-400"/> Valor Hora Real</h3>
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
              <div><h3 className="text-white font-bold mb-2 flex items-center gap-2"><CheckBadgeIcon className="w-5 h-5 text-purple-400"/> Conversión</h3><p className="text-xs text-gray-500">Efectividad comercial.</p></div>
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
                        onClick={guardarMeta} 
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