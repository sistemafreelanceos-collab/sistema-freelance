"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { toast } from "sonner";
import CreateWorkspaceModal from "../components/modals/CreateWorkspaceModal";

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

type CuentaConSaldo = {
  id: string;
  nombre: string;
  saldo: number;
  moneda: string;
};

// --- HELPER DE FECHA ---
function formatFechaLatino(fechaISO: string | null | undefined) {
  if (!fechaISO) return "—";
  const soloFecha = fechaISO.split('T')[0];
  const partes = soloFecha.split('-');
  if (partes.length !== 3) return fechaISO;
  const [anio, mes, dia] = partes;
  return `${dia}-${mes}-${anio}`;
}

// --- COMPONENTE AUXILIAR ---
function DetectorBienvenida({ setModal }: { setModal: (v: boolean) => void }) {
  const searchParams = useSearchParams();
  const esNuevo = searchParams.get("nuevo");

  useEffect(() => {
    if (esNuevo) {
      setModal(true);
    }
  }, [esNuevo, setModal]);

  return null;
}

export default function DashboardPage() {
  const router = useRouter();
  // 🟢 IMPORTANTE: Usamos isLoading global para saber si seguimos buscando empresa
  const { currentWorkspace, isLoading: isWorkspaceLoading, switchWorkspace } = useWorkspace();

  // Controls the "Create Company" modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  // Métricas
  const [ingresosMesPorMoneda, setIngresosMesPorMoneda] = useState<Record<string, number>>({});
  const [cuentasConSaldo, setCuentasConSaldo] = useState<CuentaConSaldo[]>([]);
  const [clientesActivos, setClientesActivos] = useState(0);
  const [totalProyectos, setTotalProyectos] = useState(0);
  const [ultimosMovimientos, setUltimosMovimientos] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<AlertaPago[]>([]);

  useEffect(() => {
    // Si todavía está cargando el contexto global, esperamos
    if (isWorkspaceLoading) return;

    // Si terminó de cargar y NO hay workspace, mostramos el modal de Crear Empresa Automáticamente
    if (!currentWorkspace) {
      setLoading(false);
      // FORCE OPEN MODAL FOR NEW USERS
      setShowCreateModal(true);
      return;
    }

    const init = async () => {
      // SOLO mostrar pantalla de carga si no hay datos previos (Evita parpadeos)
      // Usamos los estados para saber si ya se cargó algo antes
      const hasData = clientesActivos > 0 || totalProyectos > 0 || cuentasConSaldo.length > 0 || Object.keys(ingresosMesPorMoneda).length > 0;

      if (!hasData) setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/"); return; }

      const userId = session.user.id;
      const wsId = currentWorkspace.id; // ID DE LA EMPRESA ACTUAL

      // 1. NOMBRE USUARIO
      const { data: profile } = await supabase.from("profiles").select("nombre").eq("id", userId).single();
      const nombreReal = profile?.nombre || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "Usuario";
      setUserName(nombreReal);

      // 2. ALERTAS (Clientes de esta empresa)
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const { data: clientesPendientes } = await supabase
        .from("clientes")
        .select("id, nombre, proximo_pago, monto, moneda")
        .eq("workspace_id", wsId)
        .eq("estado", "activo")
        .not("proximo_pago", "is", null);

      if (clientesPendientes) {
        const nuevasAlertas: AlertaPago[] = [];
        clientesPendientes.forEach(c => {
          if (!c.proximo_pago) return;
          const partes = c.proximo_pago.split('-');
          const fechaPago = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
          const diffTime = fechaPago.getTime() - hoy.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            nuevasAlertas.push({
              id: c.id, cliente: c.nombre, fecha: c.proximo_pago, monto: c.monto || 0,
              moneda: c.moneda, tipo: "vencido", dias_diferencia: Math.abs(diffDays)
            });
          } else if (diffDays >= 0 && diffDays <= 3) {
            nuevasAlertas.push({
              id: c.id, cliente: c.nombre, fecha: c.proximo_pago, monto: c.monto || 0,
              moneda: c.moneda, tipo: "por_vencer", dias_diferencia: diffDays
            });
          }
        });
        setAlertas(nuevasAlertas.sort((a, b) => (a.tipo === 'vencido' ? -1 : 1)));
      }

      // 3. FINANZAS Y CUENTAS
      const { data: cuentasData } = await supabase
        .from("cuentas")
        .select("id, nombre, moneda")
        .eq("owner_id", userId);

      const { data: movs } = await supabase
        .from("movimientos")
        .select("monto, tipo, fecha, moneda, cuenta_id")
        .eq("workspace_id", wsId);

      if (movs && cuentasData) {
        const ingresosMesTemp: Record<string, number> = {};
        const mesActual = new Date().getMonth();
        const anioActual = new Date().getFullYear();
        const saldosTemp: Record<string, number> = {};

        movs.forEach(m => {
          const partes = m.fecha.split('-');
          const fMov = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
          const moneda = m.moneda || 'USD';

          if (m.tipo === 'ingreso' && fMov.getMonth() === mesActual && fMov.getFullYear() === anioActual) {
            ingresosMesTemp[moneda] = (ingresosMesTemp[moneda] || 0) + m.monto;
          }

          if (m.cuenta_id) {
            if (saldosTemp[m.cuenta_id] === undefined) saldosTemp[m.cuenta_id] = 0;
            if (m.tipo === 'ingreso') saldosTemp[m.cuenta_id] += m.monto;
            else saldosTemp[m.cuenta_id] -= m.monto;
          }
        });

        const cuentasList: CuentaConSaldo[] = cuentasData.map(c => ({
          id: c.id,
          nombre: c.nombre,
          moneda: c.moneda,
          saldo: saldosTemp[c.id] || 0
        })).filter(c => c.saldo !== 0);

        setCuentasConSaldo(cuentasList);
        setIngresosMesPorMoneda(ingresosMesTemp);
        setUltimosMovimientos(movs.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 3));
      }

      // 4. CLIENTES Y PROYECTOS ACTIVOS
      const { count: countClientes } = await supabase
        .from("clientes")
        .select("*", { count: 'exact', head: true })
        .eq("workspace_id", wsId)
        .eq("estado", "activo");

      const { count: countProyectos } = await supabase
        .from("proyectos")
        .select("*", { count: 'exact', head: true })
        .eq("workspace_id", wsId)
        .neq("estado", "finalizado");

      setClientesActivos(countClientes || 0);
      setTotalProyectos(countProyectos || 0);

      setLoading(false);
    };

    init();
  }, [router, currentWorkspace, isWorkspaceLoading]); // Dependencias clave

  const handleCreateSuccess = (newId: string) => {
    switchWorkspace(newId);
    window.location.reload();
  };

  // --- ESTADOS DE CARGA ---

  // 1. Si el contexto global sigue buscando empresa, mostramos Loading Global
  if (isWorkspaceLoading) return <div className="min-h-screen flex items-center justify-center text-emerald-500 animate-pulse">Buscando tu espacio de trabajo...</div>;

  // 2. Si ya terminó de buscar y NO hay empresa, mostramos "Crear Empresa" (Empty State)
  if (!currentWorkspace) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center relative">
        <div className="text-6xl mb-4">🏢</div>
        <h1 className="text-2xl font-bold text-white mb-2">Aún no tienes una empresa</h1>
        <p className="text-gray-400 mb-6 max-w-md">Parece que hubo un problema creando tu espacio automático. No te preocupes, puedes crear uno ahora.</p>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-bold transition flex items-center gap-2 mx-auto"
        >
          <span className="text-xl">+</span> Crear Mi Primera Empresa
        </button>

        {/* MODAL OFICIAL DE CREACIÓN */}
        <CreateWorkspaceModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    );
  }

  // 3. Si está cargando datos del dashboard (local)
  if (loading && currentWorkspace) return <div className="min-h-screen flex items-center justify-center text-gray-500">Cargando métricas...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <Suspense fallback={null}>
        <DetectorBienvenida setModal={setShowCreateModal} />
      </Suspense>

      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Hola, {userName} {currentWorkspace && <span className="text-emerald-500">@ {currentWorkspace.name}</span>} 👋
          </h1>
          <p className="text-gray-400">Aquí tienes el resumen de tu negocio hoy.</p>
        </div>
        <button onClick={() => router.push('/dashboard/perfil')} className="text-gray-500 hover:text-white text-2xl transition p-2 rounded-full hover:bg-white/10">⚙️</button>
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

      {/* MÉTRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-emerald-900/40 to-black border border-emerald-500/30 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div>
            <p className="text-xs text-emerald-300 uppercase font-bold mb-3">Saldo Global</p>
            <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
              {cuentasConSaldo.length === 0 ? (
                <p className="text-3xl font-mono font-bold text-white">$ 0</p>
              ) : (
                cuentasConSaldo.map((c) => (
                  <div key={c.id} className="flex items-baseline justify-between border-b border-emerald-500/10 last:border-0 pb-2 last:pb-0">
                    <span className="text-sm text-gray-300 truncate max-w-[120px]" title={c.nombre}>{c.nombre}</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-mono font-bold text-white tracking-tight">$ {c.saldo.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-900/40 px-1.5 py-0.5 rounded border border-emerald-500/20">{c.moneda}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-white/5"><Link href="/dashboard/cuentas" className="text-xs text-gray-400 hover:text-white underline">Ver mis cuentas →</Link></div>
        </div>

        <div className="bg-[#161B22] border border-white/10 p-6 rounded-2xl hover:border-white/20 transition flex flex-col justify-between">
          <div>
            <p className="text-xs text-blue-300 uppercase font-bold mb-2">Clientes Activos</p>
            <div className="flex flex-col gap-1 mb-1">
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-white">{clientesActivos}</p>
                <span className="text-sm text-gray-500">clientes</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg text-gray-400 font-bold">{totalProyectos}</span>
                <span className="text-xs text-gray-600">proyectos activos</span>
              </div>
            </div>
          </div>
          <Link href="/dashboard/clientes" className="text-xs text-gray-400 hover:text-white underline mt-2">Administrar clientes →</Link>
        </div>

        <div className="bg-[#161B22] border border-white/10 p-6 rounded-2xl hover:border-white/20 transition flex flex-col justify-between">
          <div><p className="text-xs text-yellow-300 uppercase font-bold mb-3">Ingresos este mes</p><div className="space-y-2">{Object.keys(ingresosMesPorMoneda).length === 0 ? (<p className="text-3xl font-bold text-emerald-400">$ 0</p>) : (Object.entries(ingresosMesPorMoneda).map(([moneda, valor]) => (<div key={moneda} className="flex items-baseline gap-2 border-b border-white/5 last:border-0 pb-1 last:pb-0"><p className="text-2xl font-bold text-emerald-400">+ {valor.toLocaleString()}</p><span className="text-[10px] font-bold text-gray-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">{moneda}</span></div>)))}</div></div>
          <p className="text-xs text-gray-500 mt-4">Basado en pagos registrados</p>
        </div>
      </div>

      {/* SECCIÓN SECUNDARIA (Acciones y Actividad) */}
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

        <div className="bg-[#161B22] border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white">Actividad Reciente</h3><Link href="/dashboard/finanzas" className="text-xs text-emerald-400 hover:underline">Ver todo</Link></div>
          <div className="space-y-3">
            {ultimosMovimientos.length === 0 ? (<p className="text-gray-500 text-sm py-4 text-center">No hay movimientos recientes.</p>) : (ultimosMovimientos.map((m, i) => (<div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5"><div><p className="text-sm font-bold text-gray-200 capitalize">{m.tipo}</p><p className="text-xs text-gray-500">{formatFechaLatino(m.fecha)}</p></div><div className="text-right"><span className={`font-mono font-bold block ${m.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>{m.tipo === 'ingreso' ? '+' : '-'} {m.monto.toLocaleString()}</span><span className="text-[10px] text-gray-500 font-bold uppercase">{m.moneda}</span></div></div>)))}
          </div>
        </div>
      </div>

      {/* 
         NOTA PARA EL USUARIO:
         Antes había aquí un modal de "Bienvenido". Lo he eliminado.
         Ahora usamos 'CreateWorkspaceModal' arriba, que es el modal nativo para crear empresa.
      */}

    </div>
  );
}