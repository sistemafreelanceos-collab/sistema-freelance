"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

// --- TIPOS ---
type AlertaPago = {
  id: string;
  cliente: string;
  fecha: string;
  monto: number;
  moneda: string;
  tipo: "vencido" | "por_vencer";
  dias_diferencia: number;
};

// --- HELPER FECHA ---
function formatFechaLatino(fechaISO: string | null | undefined) {
  if (!fechaISO) return "—";
  const soloFecha = fechaISO.split('T')[0];
  const partes = soloFecha.split('-'); 
  if (partes.length !== 3) return fechaISO;
  const [anio, mes, dia] = partes;
  return `${dia}-${mes}-${anio}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  // Métricas
  const [saldosPorMoneda, setSaldosPorMoneda] = useState<Record<string, number>>({});
  const [ingresosMesPorMoneda, setIngresosMesPorMoneda] = useState<Record<string, number>>({});
  
  const [clientesActivos, setClientesActivos] = useState(0);
  const [ultimosMovimientos, setUltimosMovimientos] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<AlertaPago[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/"); return; }

      const userId = session.user.id;

      // 1. NOMBRE USUARIO
      const { data: profile } = await supabase.from("profiles").select("nombre").eq("id", userId).single();
      const nombreReal = profile?.nombre || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "Usuario";
      setUserName(nombreReal);

      // 2. ALERTAS (Vencimientos)
      const hoy = new Date();
      hoy.setHours(0,0,0,0);
      
      const { data: clientesData } = await supabase
        .from("clientes")
        .select("id, nombre, proximo_pago, monto, moneda, estado")
        .eq("owner_id", userId);

      // Diccionario para buscar nombres rápido después
      const mapaNombres: Record<string, string> = {};
      const clientesPendientes: any[] = [];
      let conteoActivos = 0;

      if (clientesData) {
        clientesData.forEach(c => {
            mapaNombres[c.id] = c.nombre; // Guardamos id: nombre
            if (c.estado === 'activo') {
                conteoActivos++;
                if (c.proximo_pago) clientesPendientes.push(c);
            }
        });
      }
      setClientesActivos(conteoActivos);

      // Procesar Alertas
      const nuevasAlertas: AlertaPago[] = [];
      clientesPendientes.forEach(c => {
          const partes = c.proximo_pago.split('-');
          const fechaPago = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
          const diffTime = fechaPago.getTime() - hoy.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

          if (diffDays < 0) {
              nuevasAlertas.push({ id: c.id, cliente: c.nombre, fecha: c.proximo_pago, monto: c.monto || 0, moneda: c.moneda, tipo: "vencido", dias_diferencia: Math.abs(diffDays) });
          } else if (diffDays >= 0 && diffDays <= 3) {
              nuevasAlertas.push({ id: c.id, cliente: c.nombre, fecha: c.proximo_pago, monto: c.monto || 0, moneda: c.moneda, tipo: "por_vencer", dias_diferencia: diffDays });
          }
      });
      setAlertas(nuevasAlertas.sort((a, b) => (a.tipo === 'vencido' ? -1 : 1)));

      // 3. FINANZAS (Consulta SIMPLE y ROBUSTA)
      // Ya no usamos Join complejo que falla si no hay FK.
      const { data: movs, error } = await supabase
        .from("movimientos")
        .select("*")
        .eq("owner_id", userId);

      if (error) console.error("Error cargando finanzas:", error);

      if (movs) {
        const saldosTemp: Record<string, number> = {};
        const ingresosMesTemp: Record<string, number> = {};
        const mesActual = new Date().getMonth();
        const anioActual = new Date().getFullYear();

        // Enriquecer movimientos con el nombre del cliente (usando el mapa que creamos arriba)
        const movimientosEnriquecidos = movs.map(m => ({
            ...m,
            nombre_cliente: m.cliente_id ? mapaNombres[m.cliente_id] : null
        }));

        movimientosEnriquecidos.forEach(m => {
            const moneda = m.moneda || 'USD';
            if (!saldosTemp[moneda]) saldosTemp[moneda] = 0;
            if (!ingresosMesTemp[moneda]) ingresosMesTemp[moneda] = 0;

            if (m.tipo === 'ingreso') saldosTemp[moneda] += m.monto;
            else saldosTemp[moneda] -= m.monto;

            const partes = m.fecha.split('-');
            const fMov = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
            
            if (m.tipo === 'ingreso' && fMov.getMonth() === mesActual && fMov.getFullYear() === anioActual) {
                ingresosMesTemp[moneda] += m.monto;
            }
        });

        setSaldosPorMoneda(saldosTemp);
        setIngresosMesPorMoneda(ingresosMesTemp);
        setUltimosMovimientos(movimientosEnriquecidos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 3));
      }

      setLoading(false);
    };

    init();
  }, [router]);

  // Lógica segura para el texto
  const getDescripcion = (m: any) => {
    if (m.nombre_cliente) return `Pago de ${m.nombre_cliente}`; // Ahora lo sacamos del mapa manual
    if (m.referencia) return `Ref: ${m.referencia}`;
    if (m.nota) return m.nota;
    return "Ingreso sin detalle";
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Cargando tablero...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-10">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Hola, {userName} 👋</h1>
        <p className="text-gray-400">Aquí tienes el resumen de tu negocio hoy.</p>
      </div>

      {/* ALERTAS */}
      {alertas.length > 0 && (
        <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">⚠️ Atención Requerida ({alertas.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alertas.map((alerta) => (
                    <div key={alerta.id} className={`p-4 rounded-xl border flex items-center justify-between shadow-lg ${alerta.tipo === 'vencido' ? 'bg-red-500/10 border-red-500/40 text-red-200' : 'bg-yellow-500/10 border-yellow-500/40 text-yellow-200'}`}>
                        <div>
                            <div className="flex items-center gap-2 mb-1"><span className="text-lg">{alerta.tipo === 'vencido' ? '🚨' : '⏰'}</span><span className="font-bold">{alerta.cliente}</span></div>
                            <p className="text-xs opacity-80">{alerta.tipo === 'vencido' ? `Vencido hace ${alerta.dias_diferencia} días` : alerta.dias_diferencia === 0 ? '¡Vence HOY!' : `Vence en ${alerta.dias_diferencia} días`}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-mono font-bold text-lg">${alerta.monto}</p>
                            <p className="text-[10px] uppercase font-bold opacity-70">{alerta.moneda}</p>
                            <Link href="/dashboard/clientes" className="text-[10px] underline hover:text-white mt-1 block">Cobrar →</Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Saldo Global */}
        <div className="bg-gradient-to-br from-emerald-900/40 to-black border border-emerald-500/30 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[160px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
            <div>
                <p className="text-xs text-emerald-300 uppercase font-bold mb-3">Saldo Global</p>
                <div className="space-y-2">
                    {Object.keys(saldosPorMoneda).length === 0 ? <p className="text-3xl font-mono font-bold text-white">$ 0</p> : 
                        Object.entries(saldosPorMoneda).map(([moneda, valor]) => (
                            <div key={moneda} className="flex items-baseline justify-between border-b border-emerald-500/10 last:border-0 pb-2 last:pb-0">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-mono font-bold text-white tracking-tight">$ {valor.toLocaleString()}</span>
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-900/40 px-1.5 py-0.5 rounded border border-emerald-500/20">{moneda}</span>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
            <div className="mt-4 pt-2 border-t border-white/5"><Link href="/dashboard/cuentas" className="text-xs text-gray-400 hover:text-white underline">Ver mis cuentas →</Link></div>
        </div>

        {/* Clientes */}
        <div className="bg-[#161B22] border border-white/10 p-6 rounded-2xl hover:border-white/20 transition flex flex-col justify-between">
            <div>
                <p className="text-xs text-blue-300 uppercase font-bold mb-2">Clientes Activos</p>
                <div className="flex items-end gap-2 mb-1">
                    <p className="text-3xl font-bold text-white">{clientesActivos}</p>
                    <span className="text-sm text-gray-500 mb-1">proyectos</span>
                </div>
            </div>
            <Link href="/dashboard/clientes" className="text-xs text-gray-400 hover:text-white underline mt-2">Administrar clientes →</Link>
        </div>

        {/* Ingresos Mes */}
        <div className="bg-[#161B22] border border-white/10 p-6 rounded-2xl hover:border-white/20 transition flex flex-col justify-between">
            <div>
                <p className="text-xs text-yellow-300 uppercase font-bold mb-3">Ingresos este mes</p>
                <div className="space-y-2">
                    {Object.keys(ingresosMesPorMoneda).length === 0 ? <p className="text-3xl font-bold text-emerald-400">$ 0</p> : 
                        Object.entries(ingresosMesPorMoneda).map(([moneda, valor]) => (
                            <div key={moneda} className="flex items-baseline gap-2 border-b border-white/5 last:border-0 pb-1 last:pb-0">
                                <p className="text-2xl font-bold text-emerald-400">+ {valor.toLocaleString()}</p>
                                <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">{moneda}</span>
                            </div>
                        ))
                    }
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Basado en pagos registrados</p>
        </div>
      </div>

      {/* SECUNDARIA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#161B22] border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
                <Link href="/dashboard/clientes" className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-emerald-500/30 transition text-center group"><span className="text-2xl mb-2 block group-hover:scale-110 transition">💵</span><span className="text-sm font-bold text-gray-300 group-hover:text-white">Registrar Ingreso</span></Link>
                <Link href="/dashboard/calendario" className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-blue-500/30 transition text-center group"><span className="text-2xl mb-2 block group-hover:scale-110 transition">📅</span><span className="text-sm font-bold text-gray-300 group-hover:text-white">Agendar Tarea</span></Link>
                <Link href="/dashboard/cuentas" className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-yellow-500/30 transition text-center group"><span className="text-2xl mb-2 block group-hover:scale-110 transition">💳</span><span className="text-sm font-bold text-gray-300 group-hover:text-white">Nueva Cuenta</span></Link>
                <Link href="/dashboard/perfil" className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-purple-500/30 transition text-center group"><span className="text-2xl mb-2 block group-hover:scale-110 transition">⚙️</span><span className="text-sm font-bold text-gray-300 group-hover:text-white">Mi Perfil</span></Link>
            </div>
        </div>

        {/* ACTIVIDAD RECIENTE (Ahora con NOMBRES y SIN ERRORES) */}
        <div className="bg-[#161B22] border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white">Actividad Reciente</h3>
                <Link href="/dashboard/finanzas" className="text-xs text-emerald-400 hover:underline">Ver todo</Link>
            </div>
            
            <div className="space-y-3">
                {ultimosMovimientos.length === 0 ? <p className="text-gray-500 text-sm py-4 text-center">No hay movimientos recientes.</p> : 
                    ultimosMovimientos.map((m, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition">
                            <div>
                                {/* AQUÍ USAMOS LA LÓGICA SEGURA */}
                                <p className="text-sm font-bold text-white capitalize">
                                    {getDescripcion(m)}
                                </p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    {formatFechaLatino(m.fecha)}
                                    <span className="opacity-50">•</span>
                                    <span className="capitalize">{m.tipo}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <span className={`font-mono font-bold block ${m.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {m.tipo === 'ingreso' ? '+' : '-'} {m.monto.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">{m.moneda}</span>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
      </div>
    </div>
  );
}