"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

// --- TIPOS ---
type Plan = "gratis" | "premium";
type FrecuenciaPago = "semanal" | "quincenal" | "mensual" | "bimestral" | "anual";
type Moneda = "USD" | "COP" | "EUR" | "MXN";

type Cliente = {
  id: string;
  owner_id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  empresa: string | null;
  estado: "activo" | "inactivo";
  nota: string | null;
  monto: number | null;
  moneda: Moneda;
  frecuencia_pago: FrecuenciaPago;
  proximo_pago: string | null;
  ultimo_pago?: string | null;
  created_at: string;
};

type Cuenta = {
  id: string;
  nombre: string;
  moneda: string;
  is_principal?: boolean;
};

type PagoHistorial = {
  id: string;
  fecha_pago: string;
  monto: number;
  moneda: string;
  referencia: string | null;
  nota: string | null;
  cuenta?: { nombre: string } | null;
};

const LIMITE_CLIENTES_GRATIS = 3;

// --- HELPERS DE FECHA ---

// 1. Para lógica interna (Base de datos y cálculos)
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

// 2. Para MOSTRAR en pantalla (DD-MM-YYYY)
function formatFechaLatino(fechaISO: string | null | undefined) {
  if (!fechaISO) return "—";
  // Cortar la hora si viene (YYYY-MM-DDT...)
  const soloFecha = fechaISO.split('T')[0];
  const partes = soloFecha.split('-'); 
  // Asegurar que tenemos año, mes, dia
  if (partes.length !== 3) return fechaISO;
  const [anio, mes, dia] = partes;
  return `${dia}-${mes}-${anio}`;
}

function calcularProximoPago(baseISO: string, frecuencia: FrecuenciaPago) {
  // Truco para evitar problemas de zona horaria al calcular
  const partes = baseISO.split('-');
  const base = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  
  let next = new Date(base);
  switch (frecuencia) {
    case "semanal": next.setDate(base.getDate() + 7); break;
    case "quincenal": next.setDate(base.getDate() + 15); break;
    case "mensual": next.setMonth(base.getMonth() + 1); break;
    case "bimestral": next.setMonth(base.getMonth() + 2); break;
    case "anual": next.setFullYear(base.getFullYear() + 1); break;
  }
  return toISODate(next);
}

const uploadComprobante = async (file: File, ownerId: string, clienteId: string, pagoId: string) => {
  const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, "_").toLowerCase();
  const path = `${ownerId}/${clienteId}/${pagoId}/${Date.now()}_${safeName}`;
  const { error } = await supabase.storage.from("comprobantes").upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
};

export default function ClientesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Datos Principales
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]); 
  const [isPremium, setIsPremium] = useState(false);
  const [query, setQuery] = useState("");

  // Modales
  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);

  const [pagoOpen, setPagoOpen] = useState(false);
  const [pagoSaving, setPagoSaving] = useState(false);
  const [pagoCliente, setPagoCliente] = useState<Cliente | null>(null);

  const [verOpen, setVerOpen] = useState(false);
  const [verCliente, setVerCliente] = useState<Cliente | null>(null);
  const [historialPagos, setHistorialPagos] = useState<PagoHistorial[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({
    nombre: "", empresa: "", email: "", telefono: "", monto: "", 
    moneda: "USD" as Moneda, frecuencia_pago: "mensual" as FrecuenciaPago, 
    proximo_pago: "", nota: "",
  });

  const [pagoForm, setPagoForm] = useState({
    fecha_pago: toISODate(new Date()),
    monto: "", moneda: "USD" as Moneda, referencia: "", cuenta_id: "", nota: "", file: null as File | null,
  });

  const reachedFreeLimit = !isPremium && clientes.length >= LIMITE_CLIENTES_GRATIS;

  const clientesFiltrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(c => c.nombre.toLowerCase().includes(q) || c.empresa?.toLowerCase().includes(q));
  }, [clientes, query]);

  // --- INIT ---
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/"); return; }
      const userId = session.user.id;

      const [resProfile, resClientes, resCuentas] = await Promise.all([
        supabase.from("profiles").select("plan,plan_status").eq("id", userId).single(),
        supabase.from("clientes").select("*").order("created_at", { ascending: false }),
        supabase.from("cuentas").select("id, nombre, moneda, is_principal").eq("owner_id", userId)
      ]);

      if (resProfile.data) setIsPremium(resProfile.data.plan === 'premium' && resProfile.data.plan_status === 'active');
      if (resClientes.data) setClientes(resClientes.data as Cliente[]);
      if (resCuentas.data) setCuentas(resCuentas.data as Cuenta[]);
      setLoading(false);
    };
    init();
  }, [router]);

  // --- DETALLES ---
  const abrirDetalles = async (c: Cliente) => {
    setVerCliente(c);
    setVerOpen(true);
    setLoadingHistorial(true);

    const { data: pagos, error } = await supabase
        .from("pagos_cliente")
        .select(`
            id, fecha_pago, monto, moneda, referencia, nota,
            cuenta:cuentas(nombre)
        `)
        .eq("cliente_id", c.id)
        .order("fecha_pago", { ascending: false });

    if (!error && pagos) {
        setHistorialPagos(pagos as any[]);
    }
    setLoadingHistorial(false);
  };

  // --- CREAR ---
  const crearCliente = async () => {
    if (!createForm.nombre.trim()) return alert("Nombre obligatorio");
    if (reachedFreeLimit) return alert("Límite de plan gratuito alcanzado.");
    setCreateSaving(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    const payload = {
      owner_id: session?.user.id,
      nombre: createForm.nombre,
      empresa: createForm.empresa || null,
      email: createForm.email || null,
      telefono: createForm.telefono || null,
      monto: createForm.monto ? Number(createForm.monto) : null,
      moneda: createForm.moneda,
      frecuencia_pago: createForm.frecuencia_pago,
      proximo_pago: createForm.proximo_pago || null,
      nota: createForm.nota || null,
      estado: 'activo'
    };

    const { data, error } = await supabase.from("clientes").insert(payload).select().single();
    setCreateSaving(false);
    
    if (error) alert(error.message);
    else {
      setClientes([data as Cliente, ...clientes]);
      setCreateOpen(false);
      setCreateForm({ nombre: "", empresa: "", email: "", telefono: "", nota: "", monto: "", moneda: "USD", frecuencia_pago: "mensual", proximo_pago: "" });
    }
  };

  // --- EDITAR ---
  const guardarEdicion = async () => {
    if (!editCliente) return;
    setEditSaving(true);
    const { error } = await supabase.from("clientes").update({
        nombre: editCliente.nombre, empresa: editCliente.empresa, email: editCliente.email,
        telefono: editCliente.telefono, monto: editCliente.monto, moneda: editCliente.moneda,
        frecuencia_pago: editCliente.frecuencia_pago, proximo_pago: editCliente.proximo_pago,
        nota: editCliente.nota, estado: editCliente.estado
    }).eq("id", editCliente.id);
    setEditSaving(false);
    if (error) alert(error.message);
    else {
        const clienteActualizado = { ...editCliente };
        setClientes(prev => prev.map(c => c.id === editCliente.id ? clienteActualizado as Cliente : c));
        // Si estábamos viendo los detalles de este mismo cliente, actualizamos el modal también
        if(verCliente?.id === editCliente.id) setVerCliente(clienteActualizado as Cliente);
        setEditOpen(false);
    }
  };

  // --- ELIMINAR / TOGGLE ---
  const eliminarCliente = async (id: string) => {
    if (!confirm("¿Eliminar definitivamente?")) return;
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (!error) setClientes(prev => prev.filter(c => c.id !== id));
  };

  const toggleEstado = async (c: Cliente) => {
    const nuevoEstado = c.estado === 'activo' ? 'inactivo' : 'activo';
    const { error } = await supabase.from("clientes").update({ estado: nuevoEstado }).eq("id", c.id);
    if (!error) {
        const actualizado = { ...c, estado: nuevoEstado };
        setClientes(prev => prev.map(cl => cl.id === c.id ? actualizado as Cliente : cl));
        if (verCliente?.id === c.id) setVerCliente(actualizado as Cliente);
    }
  };

  // --- PAGO ---
  const registrarPagoModal = async () => {
    if (!pagoCliente || !pagoForm.cuenta_id) return alert("Falta cuenta destino");
    setPagoSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const ownerId = session?.user.id; if(!ownerId) return;

    // 1. Pago
    const { data: pagoRow, error: errP } = await supabase.from("pagos_cliente").insert({
        owner_id: ownerId, cliente_id: pagoCliente.id, cuenta_id: pagoForm.cuenta_id,
        fecha_pago: pagoForm.fecha_pago, monto: Number(pagoForm.monto), moneda: pagoForm.moneda,
        referencia: pagoForm.referencia || null, nota: pagoForm.nota || null
    }).select().single();
    if(errP) { setPagoSaving(false); return alert(errP.message); }

    // 2. Archivo
    let url = null;
    if (pagoForm.file) {
        try {
            url = await uploadComprobante(pagoForm.file, ownerId, pagoCliente.id, pagoRow.id);
            await supabase.from("pagos_cliente").update({ comprobante_url: url }).eq("id", pagoRow.id);
        } catch(e) {}
    }

    // 3. Movimiento
    await supabase.from("movimientos").insert({
        owner_id: ownerId, cuenta_id: pagoForm.cuenta_id, tipo: 'ingreso', categoria: 'negocio',
        fuente: 'pago_cliente', cliente_id: pagoCliente.id, pago_cliente_id: pagoRow.id,
        fecha: pagoForm.fecha_pago, monto: Number(pagoForm.monto), moneda: pagoForm.moneda,
        referencia: pagoForm.referencia, comprobante_url: url
    });

    // 4. Update Cliente
    const nextISO = calcularProximoPago(pagoForm.fecha_pago, pagoCliente.frecuencia_pago);
    await supabase.from("clientes").update({ ultimo_pago: pagoForm.fecha_pago, proximo_pago: nextISO }).eq("id", pagoCliente.id);

    setClientes(prev => prev.map(c => c.id === pagoCliente.id ? { ...c, ultimo_pago: pagoForm.fecha_pago, proximo_pago: nextISO } : c));
    setPagoOpen(false); setPagoSaving(false); alert("Pago registrado ✅");
  };

  const openPago = (c: Cliente) => {
    setPagoCliente(c);
    const principal = cuentas.find(cta => cta.is_principal)?.id || cuentas[0]?.id || "";
    setPagoForm({ fecha_pago: toISODate(new Date()), monto: String(c.monto || 0), moneda: c.moneda, referencia: "", cuenta_id: principal, nota: "", file: null });
    setPagoOpen(true);
  };

  if (loading) return <div className="p-8 text-gray-400">Cargando...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-white">Clientes</h1>
            <p className="text-gray-400 text-sm">Gestiona tus contratos y recaudos</p>
        </div>
        <div className="flex gap-2">
            {reachedFreeLimit && <Link href="/dashboard/suscripcion" className="px-4 py-2 bg-yellow-500/10 text-yellow-200 border border-yellow-500/30 rounded-lg text-xs font-bold">Mejorar Plan</Link>}
            <button onClick={() => setCreateOpen(true)} disabled={reachedFreeLimit} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg transition disabled:opacity-50">+ Nuevo Cliente</button>
        </div>
      </div>

      <div className="mb-6">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="🔍 Buscar cliente..." className="w-full bg-[#161B22] border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none" />
      </div>

      {/* GRID CLIENTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientesFiltrados.map(c => {
            const isLate = c.proximo_pago && c.proximo_pago < toISODate(new Date());
            return (
                <div key={c.id} className={`bg-[#161B22] border rounded-2xl p-6 transition-all hover:shadow-lg flex flex-col justify-between group ${c.estado === 'inactivo' ? 'border-white/5 opacity-60' : 'border-white/10 hover:border-emerald-500/40'}`}>
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <div className="cursor-pointer" onClick={() => abrirDetalles(c)}>
                                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition hover:underline">{c.nombre}</h3>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">{c.empresa || "Freelance"}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-1 rounded-full border ${c.estado === 'activo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-700/30 text-gray-400 border-gray-600'}`}>
                                {c.estado}
                            </span>
                        </div>
                        <div className="space-y-1 mb-4 cursor-pointer" onClick={() => abrirDetalles(c)}>
                            <p className="text-sm text-gray-400">📧 {c.email || "—"}</p>
                            <p className="text-sm text-gray-400">📱 {c.telefono || "—"}</p>
                        </div>
                        <div className="bg-[#0F1115] rounded-xl p-3 border border-white/5 mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-500 uppercase">Tarifa</span>
                                <span className="text-white font-mono font-bold">{c.monto ? `$${c.monto}` : '—'} <span className="text-[10px] text-gray-500">{c.moneda}</span></span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 uppercase">Prox. Pago</span>
                                <span className={`text-xs font-bold ${isLate && c.estado === 'activo' ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                                    {/* AQUI APLICAMOS FORMATO LATINO */}
                                    {formatFechaLatino(c.proximo_pago)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-2 pt-4 border-t border-white/5">
                        <button onClick={() => openPago(c)} disabled={c.estado === 'inactivo'} className="flex-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-600/30 rounded-lg py-2 text-xs font-bold transition disabled:opacity-50">💵 Cobrar</button>
                        <button onClick={() => { setEditCliente(c); setEditOpen(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">✏️</button>
                        <button onClick={() => abrirDetalles(c)} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg">👁️</button>
                    </div>
                </div>
            );
        })}
      </div>

      {/* --- MODAL DETALLES & HISTORIAL --- */}
      {verOpen && verCliente && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1C2128] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/10 flex justify-between items-start bg-[#161B22]">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{verCliente.nombre}</h2>
                        <p className="text-emerald-400 text-sm font-medium">{verCliente.empresa}</p>
                    </div>
                    <button onClick={() => setVerOpen(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
                </div>

                <div className="overflow-y-auto p-6 space-y-8">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-[#0F1115] p-4 rounded-xl border border-white/5">
                            <p className="text-gray-500 uppercase text-xs font-bold mb-1">Contacto</p>
                            <p className="text-white">{verCliente.email || "No email"}</p>
                            <p className="text-white">{verCliente.telefono || "No tel"}</p>
                        </div>
                        <div className="bg-[#0F1115] p-4 rounded-xl border border-white/5">
                            <p className="text-gray-500 uppercase text-xs font-bold mb-1">Acuerdo</p>
                            <p className="text-white font-bold">${verCliente.monto} {verCliente.moneda} / {verCliente.frecuencia_pago}</p>
                            <p className="text-gray-400 text-xs mt-1">Próximo cobro: {formatFechaLatino(verCliente.proximo_pago)}</p>
                        </div>
                        {verCliente.nota && (
                            <div className="col-span-2 bg-[#0F1115] p-4 rounded-xl border border-white/5">
                                <p className="text-gray-500 uppercase text-xs font-bold mb-1">Notas</p>
                                <p className="text-gray-300 italic">"{verCliente.nota}"</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">📜 Historial de Pagos</h3>
                        {loadingHistorial ? (
                            <p className="text-gray-500">Cargando historial...</p>
                        ) : historialPagos.length === 0 ? (
                            <div className="text-center p-6 border border-dashed border-gray-700 rounded-xl text-gray-500">No hay pagos registrados aún.</div>
                        ) : (
                            <div className="border border-white/10 rounded-xl overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white/5 text-gray-400">
                                        <tr>
                                            <th className="p-3">Fecha</th>
                                            <th className="p-3">Monto</th>
                                            <th className="p-3">Cuenta</th>
                                            <th className="p-3">Ref</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {historialPagos.map(p => (
                                            <tr key={p.id} className="hover:bg-white/5">
                                                {/* FORMATO LATINO AQUI */}
                                                <td className="p-3 text-gray-300">{formatFechaLatino(p.fecha_pago)}</td>
                                                <td className="p-3 font-mono font-bold text-emerald-400">+{p.monto} {p.moneda}</td>
                                                <td className="p-3 text-gray-400">{p.cuenta?.nombre || "—"}</td>
                                                <td className="p-3 text-gray-500 text-xs">{p.referencia || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-white/10 pt-6">
                        <div className="flex items-center justify-between bg-red-500/5 border border-red-500/20 p-4 rounded-xl">
                            <div>
                                <h4 className="text-red-200 font-bold text-sm">¿Finalizar trabajo?</h4>
                                <p className="text-red-200/60 text-xs">Desactiva al cliente si ya no trabajan juntos.</p>
                            </div>
                            <button onClick={() => toggleEstado(verCliente)} className={`px-4 py-2 rounded-lg text-xs font-bold transition border ${verCliente.estado === 'activo' ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-white'}`}>
                                {verCliente.estado === 'activo' ? '🛑 Desactivar Cliente' : '✅ Reactivar Cliente'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL CREAR --- */}
      {createOpen && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1C2128] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
                <h3 className="text-white font-bold text-lg mb-4">Nuevo Cliente</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block uppercase">Nombre *</label><input value={createForm.nombre} onChange={e => setCreateForm({...createForm, nombre: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-emerald-500" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block uppercase">Empresa</label><input value={createForm.empresa} onChange={e => setCreateForm({...createForm, empresa: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-emerald-500" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block uppercase">Email</label><input value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-emerald-500" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block uppercase">Teléfono</label><input value={createForm.telefono} onChange={e => setCreateForm({...createForm, telefono: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-emerald-500" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block uppercase">Monto</label><input type="number" value={createForm.monto} onChange={e => setCreateForm({...createForm, monto: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-emerald-500" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block uppercase">Moneda</label><select value={createForm.moneda} onChange={e => setCreateForm({...createForm, moneda: e.target.value as Moneda})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-emerald-500"><option value="USD">USD</option><option value="COP">COP</option><option value="EUR">EUR</option><option value="MXN">MXN</option></select></div>
                        <div><label className="text-xs text-gray-500 mb-1 block uppercase">Frecuencia</label><select value={createForm.frecuencia_pago} onChange={e => setCreateForm({...createForm, frecuencia_pago: e.target.value as FrecuenciaPago})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-emerald-500"><option value="mensual">Mensual</option><option value="quincenal">Quincenal</option><option value="semanal">Semanal</option><option value="bimestral">Bimestral</option><option value="anual">Anual</option></select></div>
                        <div><label className="text-xs text-gray-500 mb-1 block uppercase">Próximo Pago</label><input type="date" value={createForm.proximo_pago} onChange={e => setCreateForm({...createForm, proximo_pago: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-emerald-500" /></div>
                        <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block uppercase">Nota</label><textarea value={createForm.nota} onChange={e => setCreateForm({...createForm, nota: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-emerald-500 h-20" /></div>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button onClick={() => setCreateOpen(false)} className="flex-1 py-3 rounded-lg border border-white/10 text-gray-400 hover:text-white">Cancelar</button>
                        <button onClick={crearCliente} disabled={createSaving} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg disabled:opacity-50">{createSaving ? "Guardando..." : "Crear"}</button>
                    </div>
                </div>
            </div>
         </div>
      )}

      {/* --- MODAL EDITAR --- */}
      {editOpen && editCliente && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1C2128] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
                <h3 className="text-white font-bold text-lg mb-4">Editar Cliente</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">Nombre</label><input value={editCliente.nombre} onChange={e => setEditCliente({...editCliente, nombre: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block">Empresa</label><input value={editCliente.empresa || ""} onChange={e => setEditCliente({...editCliente, empresa: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block">Email</label><input value={editCliente.email || ""} onChange={e => setEditCliente({...editCliente, email: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block">Teléfono</label><input value={editCliente.telefono || ""} onChange={e => setEditCliente({...editCliente, telefono: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block">Monto</label><input value={editCliente.monto || ""} onChange={e => setEditCliente({...editCliente, monto: Number(e.target.value)})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block">Moneda</label><select value={editCliente.moneda} onChange={e => setEditCliente({...editCliente, moneda: e.target.value as Moneda})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white"><option value="USD">USD</option><option value="COP">COP</option></select></div>
                        <div><label className="text-xs text-gray-500 mb-1 block">Frecuencia</label><select value={editCliente.frecuencia_pago} onChange={e => setEditCliente({...editCliente, frecuencia_pago: e.target.value as FrecuenciaPago})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white"><option value="mensual">Mensual</option><option value="quincenal">Quincenal</option></select></div>
                        <div><label className="text-xs text-gray-500 mb-1 block">Prox Pago</label><input type="date" value={editCliente.proximo_pago || ""} onChange={e => setEditCliente({...editCliente, proximo_pago: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white" /></div>
                    </div>
                    <button onClick={guardarEdicion} disabled={editSaving} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg disabled:opacity-50">{editSaving ? "Guardando..." : "Guardar Cambios"}</button>
                    <button onClick={() => setEditOpen(false)} className="w-full text-gray-500 text-sm hover:text-white">Cancelar</button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL PAGO --- */}
      {pagoOpen && pagoCliente && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1C2128] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-white font-bold text-lg mb-4">Registrar Pago</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input type="date" value={pagoForm.fecha_pago} onChange={e => setPagoForm({...pagoForm, fecha_pago: e.target.value})} className="bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white" />
                        <select value={pagoForm.cuenta_id} onChange={e => setPagoForm({...pagoForm, cuenta_id: e.target.value})} className="bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white">
                            <option value="">Destino...</option>
                            {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.moneda})</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <input value={pagoForm.monto} onChange={e => setPagoForm({...pagoForm, monto: e.target.value})} placeholder="Monto" className="flex-1 bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white" />
                        <span className="p-3 bg-white/5 rounded-lg text-white font-bold border border-white/10">{pagoForm.moneda}</span>
                    </div>
                    <input type="file" onChange={e => setPagoForm({...pagoForm, file: e.target.files?.[0] || null})} className="w-full text-xs text-gray-400" />
                    <button onClick={registrarPagoModal} disabled={pagoSaving} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg disabled:opacity-50">{pagoSaving ? "Procesando..." : "Confirmar Ingreso"}</button>
                    <button onClick={() => setPagoOpen(false)} className="w-full text-gray-500 text-sm hover:text-white">Cancelar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}