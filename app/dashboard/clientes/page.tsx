"use client";

import { useEffect, useMemo, useState } from "react";
// Se eliminó Link y useRouter para evitar errores de compilación en Vercel
import { supabase } from "../../../lib/supabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- TIPOS ---
type FrecuenciaPago = "semanal" | "quincenal" | "mensual" | "bimestral" | "anual" | "unico";
type Moneda = "USD" | "COP" | "EUR" | "MXN";

type Cliente = {
  id: string;
  owner_id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  empresa: string | null;
  estado: "activo" | "inactivo" | "prospecto";
  nota: string | null;
  monto: number | null;
  moneda: Moneda;
  frecuencia_pago: FrecuenciaPago;
  proximo_pago: string | null;
  ultimo_pago?: string | null;
  created_at: string;
  pagos_cliente?: { monto: number }[];
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

type QuoteItem = {
    id: number;
    desc: string;
    qty: number;
    price: number;
};

const LIMITE_CLIENTES_GRATIS = 3;

// --- HELPERS ---
function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatFechaLatino(fechaISO: string | null | undefined) {
  if (!fechaISO) return "Contra Entrega";
  const soloFecha = fechaISO.split('T')[0];
  const partes = soloFecha.split('-'); 
  if (partes.length !== 3) return fechaISO;
  const [anio, mes, dia] = partes;
  return `${dia}-${mes}-${anio}`;
}

function calcularProximoPago(baseISO: string, frecuencia: FrecuenciaPago) {
  const partes = baseISO.split('-');
  const base = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  let next = new Date(base);
  
  switch (frecuencia) {
    case "semanal": next.setDate(base.getDate() + 7); break;
    case "quincenal": next.setDate(base.getDate() + 15); break;
    case "mensual": next.setMonth(base.getMonth() + 1); break;
    case "bimestral": next.setMonth(base.getMonth() + 2); break;
    case "anual": next.setFullYear(base.getFullYear() + 1); break;
    case "unico": return toISODate(new Date()); // Retorno seguro
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

// Determina si es proyecto
function esClienteProyecto(c: Cliente) {
    return c.frecuencia_pago === 'unico' || !c.proximo_pago;
}

export default function ClientesPage() {
  const [loading, setLoading] = useState(true);

  // Datos
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]); 
  const [isPremium, setIsPremium] = useState(false);
  const [query, setQuery] = useState("");
  const [myProfile, setMyProfile] = useState<any>(null);

  // Modales
  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editCliente, setEditCliente] = useState<(Cliente & { contra_entrega?: boolean }) | null>(null);
  const [pagoOpen, setPagoOpen] = useState(false);
  const [pagoSaving, setPagoSaving] = useState(false);
  const [pagoCliente, setPagoCliente] = useState<Cliente | null>(null);
  const [verOpen, setVerOpen] = useState(false);
  const [verCliente, setVerCliente] = useState<Cliente | null>(null);
  const [historialPagos, setHistorialPagos] = useState<PagoHistorial[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [prospectoOpen, setProspectoOpen] = useState(false);
  const [prospectoSaving, setProspectoSaving] = useState(false);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([{ id: 1, desc: "Servicios Profesionales", qty: 1, price: 0 }]);

  // Forms
  const [createForm, setCreateForm] = useState({
    nombre: "", empresa: "", email: "", telefono: "", monto: "", 
    moneda: "USD" as Moneda, frecuencia_pago: "mensual" as FrecuenciaPago, 
    proximo_pago: "", nota: "",
    contra_entrega: false
  });

  const [prospectoForm, setProspectoForm] = useState({
    nombre: "", empresa: "", email: "", telefono: "", moneda: "USD" as Moneda
  });

  const [pagoForm, setPagoForm] = useState({
    fecha_pago: toISODate(new Date()),
    monto: "", 
    moneda: "USD" as Moneda, 
    referencia: "", 
    cuenta_id: "", 
    nota: "", 
    file: null as File | null,
    tipo: "parcial" as "completo" | "parcial"
  });

  const reachedFreeLimit = !isPremium && clientes.length >= LIMITE_CLIENTES_GRATIS;

  const clientesFiltrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(c => c.nombre.toLowerCase().includes(q) || c.empresa?.toLowerCase().includes(q));
  }, [clientes, query]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;

      const [resProfile, resClientes, resCuentas] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("clientes").select("*, pagos_cliente(monto)").order("created_at", { ascending: false }),
        supabase.from("cuentas").select("id, nombre, moneda, is_principal").eq("owner_id", userId)
      ]);

      if (resProfile.data) {
          setIsPremium(resProfile.data.plan === 'premium' && resProfile.data.plan_status === 'active');
          setMyProfile(resProfile.data); 
      }
      if (resClientes.data) setClientes(resClientes.data as Cliente[]);
      if (resCuentas.data) setCuentas(resCuentas.data as Cuenta[]);
      setLoading(false);
    };
    init();
  }, []);

  const generarReciboPDF = (pago: PagoHistorial, clienteParaRecibo: Cliente) => {
    if (!clienteParaRecibo) return;
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(40, 40, 40); doc.text("RECIBO DE PAGO", 14, 22);
    doc.setFontSize(10); doc.setTextColor(100, 100, 100); 
    doc.text(`No. Referencia: ${pago.referencia || pago.id.slice(0, 8)}`, 14, 28); 
    doc.text(`Fecha: ${formatFechaLatino(pago.fecha_pago)}`, 14, 33);
    doc.setFontSize(11); doc.setTextColor(0, 0, 0); const myName = myProfile?.nombre || "Freelancer"; 
    doc.text(myName, 140, 22); doc.setFontSize(9); doc.setTextColor(80, 80, 80); 
    doc.text(myProfile?.empresa || "", 140, 27); doc.text(myProfile?.email || "", 140, 32);
    doc.line(14, 38, 196, 38);
    doc.setFontSize(10); doc.setTextColor(150, 150, 150); doc.text("RECIBIDO DE:", 14, 45); 
    doc.setFontSize(12); doc.setTextColor(0, 0, 0); doc.text(clienteParaRecibo.nombre, 14, 51);
    const tableColumn = ["Concepto", "Método", "Monto"];
    const tableRows = [[pago.nota || `Pago de servicios`, pago.cuenta?.nombre || "Transferencia", `$${pago.monto.toLocaleString()} ${pago.moneda}`]];
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 65, theme: 'grid', headStyles: { fillColor: [40, 40, 40] } });
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 100;
    doc.setTextColor(16, 185, 129); doc.setFontSize(20); doc.setFont("helvetica", "bold"); doc.text("PAGADO", 140, finalY);
    doc.setLineWidth(0.5); doc.setDrawColor(16, 185, 129); doc.rect(135, finalY - 8, 40, 12);
    doc.save(`Recibo_${clienteParaRecibo.nombre}_${pago.fecha_pago}.pdf`);
  };

  const generarPDFDocument = (clienteData: any, items: QuoteItem[]) => {
      const doc = new jsPDF();
      doc.setFontSize(22); doc.setTextColor(16, 185, 129); doc.text("COTIZACIÓN", 14, 22);
      doc.setFontSize(10); doc.setTextColor(100, 100, 100); const fecha = new Date().toLocaleDateString(); doc.text(`Fecha: ${fecha}`, 14, 28);
      doc.setFontSize(12); doc.setTextColor(0, 0, 0); const myName = myProfile?.nombre || "Freelancer";
      doc.text(myName, 140, 22); doc.setFontSize(10); doc.setTextColor(80, 80, 80); doc.text(myProfile?.empresa || "", 140, 27); doc.text(myProfile?.email || "", 140, 32);
      doc.setDrawColor(200, 200, 200); doc.line(14, 38, 196, 38); 
      doc.setFontSize(10); doc.setTextColor(150, 150, 150); doc.text("COTIZADO A:", 14, 45);
      doc.setFontSize(12); doc.setTextColor(0, 0, 0); doc.text(clienteData.nombre, 14, 51);
      const tableColumn = ["Descripción", "Cant.", "Precio Unit.", "Total"];
      let grandTotal = 0;
      const tableRows = items.map(item => {
          const total = item.qty * item.price; grandTotal += total;
          return [item.desc, item.qty, `$${item.price.toLocaleString()}`, `$${total.toLocaleString()}`];
      });
      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 70, theme: 'striped', headStyles: { fillColor: [22, 27, 34] } });
      const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 120;
      doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text(`TOTAL (${clienteData.moneda}): $${grandTotal.toLocaleString()}`, 140, finalY);
      doc.save(`Cotizacion_${clienteData.nombre.replace(/ /g, "_")}.pdf`);
  };

  const addQuoteItem = () => setQuoteItems([...quoteItems, { id: Date.now(), desc: "", qty: 1, price: 0 }]);
  const removeQuoteItem = (id: number) => setQuoteItems(quoteItems.filter(i => i.id !== id));

  const guardarYCotizarProspecto = async () => {
    if(!prospectoForm.nombre) return alert("El nombre es obligatorio");
    setProspectoSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const payload = {
        owner_id: session?.user.id, nombre: prospectoForm.nombre, empresa: prospectoForm.empresa || null, email: prospectoForm.email || null, telefono: prospectoForm.telefono || null,
        moneda: prospectoForm.moneda, estado: 'prospecto', frecuencia_pago: 'unico', monto: 0,
    };
    const { data, error } = await supabase.from("clientes").insert(payload).select("*, pagos_cliente(monto)").single();
    if (error) { alert("Error: " + error.message); setProspectoSaving(false); return; }
    setClientes([data as Cliente, ...clientes]);
    generarPDFDocument(payload, quoteItems);
    setProspectoSaving(false); setProspectoOpen(false); alert("¡Prospecto guardado y cotización descargada! 🚀");
    setProspectoForm({ nombre: "", empresa: "", email: "", telefono: "", moneda: "USD" }); setQuoteItems([{ id: 1, desc: "Servicios Profesionales", qty: 1, price: 0 }]);
  };

  const generarCotizacionExistente = () => { if(!verCliente) return; generarPDFDocument(verCliente, quoteItems); };

  const abrirDetalles = async (c: Cliente) => {
    setVerCliente(c); setVerOpen(true); setLoadingHistorial(true);
    const { data: pagos } = await supabase.from("pagos_cliente").select(`id, fecha_pago, monto, moneda, referencia, nota, cuenta:cuentas(nombre)`).eq("cliente_id", c.id).order("fecha_pago", { ascending: false });
    if (pagos) setHistorialPagos(pagos as any[]); setLoadingHistorial(false);
  };

  const crearCliente = async () => {
    if (!createForm.nombre.trim()) return alert("Nombre obligatorio");
    setCreateSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const isContraEntrega = createForm.contra_entrega;
    const fechaPago = isContraEntrega ? null : (createForm.proximo_pago || null);
    const frecuenciaFinal = isContraEntrega ? 'unico' : createForm.frecuencia_pago;

    const payload = {
      owner_id: session?.user.id, nombre: createForm.nombre, empresa: createForm.empresa || null, email: createForm.email || null, telefono: createForm.telefono || null, monto: createForm.monto ? Number(createForm.monto) : null, moneda: createForm.moneda, frecuencia_pago: frecuenciaFinal, proximo_pago: fechaPago, nota: createForm.nota || null, estado: 'activo'
    };

    const { data, error } = await supabase.from("clientes").insert(payload).select("*, pagos_cliente(monto)").single();
    setCreateSaving(false);
    if (error) alert(error.message);
    else {
      setClientes([data as Cliente, ...clientes]); setCreateOpen(false);
      setCreateForm({ nombre: "", empresa: "", email: "", telefono: "", nota: "", monto: "", moneda: "USD", frecuencia_pago: "mensual", proximo_pago: "", contra_entrega: false });
    }
  };

  const openQuoteModalExistente = () => { if (verCliente && verCliente.monto) { setQuoteItems([{ id: 1, desc: `Servicio ${verCliente.frecuencia_pago}`, qty: 1, price: verCliente.monto }]); } else { setQuoteItems([{ id: 1, desc: "", qty: 1, price: 0 }]); } setQuoteOpen(true); };

  const toggleEstado = async (c: Cliente) => {
    let nuevoEstado: "activo" | "inactivo" = "activo";
    if (c.estado === "prospecto") nuevoEstado = "activo"; else if (c.estado === "activo") nuevoEstado = "inactivo"; else nuevoEstado = "activo";
    const { error } = await supabase.from("clientes").update({ estado: nuevoEstado }).eq("id", c.id);
    if (!error) { const actualizado = { ...c, estado: nuevoEstado }; setClientes(prev => prev.map(cl => cl.id === c.id ? actualizado as Cliente : cl)); if (verCliente?.id === c.id) setVerCliente(actualizado as Cliente); }
  };

  const guardarEdicion = async () => {
    if(!editCliente) return;
    setEditSaving(true);
    const isContraEntrega = editCliente.contra_entrega;
    const fechaPago = isContraEntrega ? null : editCliente.proximo_pago;
    const frecuenciaFinal = isContraEntrega ? 'unico' : editCliente.frecuencia_pago;

    const updates = {
        nombre: editCliente.nombre, empresa: editCliente.empresa, email: editCliente.email, telefono: editCliente.telefono, monto: editCliente.monto, moneda: editCliente.moneda, frecuencia_pago: frecuenciaFinal, proximo_pago: fechaPago, nota: editCliente.nota, estado: editCliente.estado
    };

    const { error } = await supabase.from("clientes").update(updates).eq("id", editCliente.id);
    setEditSaving(false);
    if (error) { alert(error.message); } else {
        const clienteActualizado = { ...editCliente, ...updates } as Cliente;
        setClientes(prev => prev.map(c => c.id === editCliente.id ? clienteActualizado : c));
        if(verCliente?.id === editCliente.id) setVerCliente(clienteActualizado);
        setEditOpen(false);
    }
  };

  const eliminarCliente = async (id: string) => { if(!confirm("Eliminar?")) return; await supabase.from("clientes").delete().eq("id", id); setClientes(prev => prev.filter(c => c.id !== id)); };

  const registrarPagoModal = async () => {
    if (!pagoCliente || !pagoForm.cuenta_id) return alert("Falta cuenta");
    setPagoSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    const { data: pagoRow } = await supabase.from("pagos_cliente").insert({ 
        owner_id: session?.user.id, cliente_id: pagoCliente.id, cuenta_id: pagoForm.cuenta_id, 
        fecha_pago: pagoForm.fecha_pago, monto: Number(pagoForm.monto), moneda: pagoForm.moneda, 
        referencia: pagoForm.referencia, nota: `${pagoForm.nota ? pagoForm.nota + ' - ' : ''}${pagoForm.tipo === 'parcial' ? 'ABONO' : 'PAGO'}`
    }).select().single();

    if (pagoForm.file) { try { const url = await uploadComprobante(pagoForm.file, session?.user.id as string, pagoCliente.id, pagoRow.id); await supabase.from("pagos_cliente").update({ comprobante_url: url }).eq("id", pagoRow.id); } catch(e) {} }

    await supabase.from("movimientos").insert({ owner_id: session?.user.id, cuenta_id: pagoForm.cuenta_id, tipo: 'ingreso', categoria: 'negocio', fuente: 'pago_cliente', cliente_id: pagoCliente.id, pago_cliente_id: pagoRow.id, fecha: pagoForm.fecha_pago, monto: Number(pagoForm.monto), moneda: pagoForm.moneda, referencia: pagoForm.referencia });

    const updates: any = { ultimo_pago: pagoForm.fecha_pago };
    if (pagoForm.tipo === 'completo') {
        if (pagoCliente.proximo_pago && pagoCliente.frecuencia_pago !== 'unico') {
            updates.proximo_pago = calcularProximoPago(pagoForm.fecha_pago, pagoCliente.frecuencia_pago);
        }
    }
    await supabase.from("clientes").update(updates).eq("id", pagoCliente.id);

    setClientes(prev => prev.map(c => {
        if (c.id === pagoCliente.id) {
            const nuevosPagos = [...(c.pagos_cliente || []), { monto: Number(pagoForm.monto) }];
            return { ...c, ...updates, pagos_cliente: nuevosPagos };
        }
        return c;
    }));
    
    setPagoOpen(false); setPagoSaving(false); 
    
    if(confirm("Pago registrado ✅. ¿Descargar recibo?")) {
        const pagoTemp: PagoHistorial = { id: pagoRow.id, fecha_pago: pagoForm.fecha_pago, monto: Number(pagoForm.monto), moneda: pagoForm.moneda, referencia: pagoForm.referencia || "", nota: pagoForm.nota || "", cuenta: { nombre: "Cuenta seleccionada" } };
        if(pagoCliente) setTimeout(() => generarReciboPDF(pagoTemp, pagoCliente), 100);
    }
  };

  const openPago = (c: Cliente) => { 
      setPagoCliente(c); 
      const principal = cuentas.find(cta => cta.is_principal)?.id || cuentas[0]?.id || ""; 
      const esProyecto = esClienteProyecto(c);
      setPagoForm({ 
          fecha_pago: toISODate(new Date()), monto: String(c.monto || 0), moneda: c.moneda, 
          referencia: "", cuenta_id: principal, nota: "", file: null, 
          tipo: esProyecto ? "parcial" : "completo" 
      }); 
      setPagoOpen(true); 
  };

  const handleOpenEdit = (c: Cliente) => {
      setEditCliente({
          ...c,
          contra_entrega: c.proximo_pago === null
      });
      setEditOpen(true);
  };

  if (loading) return <div className="p-8 text-gray-400">Cargando...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-white">Clientes</h1>
            <p className="text-gray-400 text-sm">Gestiona tus contratos y recaudos</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => { setQuoteItems([{ id: 1, desc: "Servicios Profesionales", qty: 1, price: 0 }]); setProspectoOpen(true); }} className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-lg transition border border-white/20 flex items-center gap-2">📄 Cotización Rápida</button>
            <button onClick={() => setCreateOpen(true)} disabled={reachedFreeLimit} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg transition disabled:opacity-50">+ Nuevo Cliente</button>
        </div>
      </div>

      <div className="mb-6">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="🔍 Buscar cliente..." className="w-full bg-[#161B22] border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientesFiltrados.map(c => {
            const isLate = c.proximo_pago && c.proximo_pago < toISODate(new Date());
            const esProyecto = esClienteProyecto(c);
            let badgeClass = "bg-gray-700/30 text-gray-400 border-gray-600"; 
            if (c.estado === 'activo') badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            if (c.estado === 'prospecto') badgeClass = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

            const totalPagado = c.pagos_cliente?.reduce((sum, p) => sum + p.monto, 0) || 0;
            const deudaTotal = c.monto || 0;
            const restante = deudaTotal - totalPagado;
            const porcentaje = deudaTotal > 0 ? Math.min((totalPagado / deudaTotal) * 100, 100) : 0;

            return (
                <div key={c.id} className={`bg-[#161B22] border rounded-2xl p-6 transition-all hover:shadow-lg flex flex-col justify-between group ${c.estado === 'inactivo' ? 'border-white/5 opacity-60' : 'border-white/10 hover:border-emerald-500/40'}`}>
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <div className="cursor-pointer" onClick={() => abrirDetalles(c)}>
                                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition hover:underline">{c.nombre}</h3>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">{c.empresa || "Freelance"}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-1 rounded-full border uppercase font-bold ${badgeClass}`}>
                                {c.estado === 'prospecto' ? 'Standby' : c.estado}
                            </span>
                        </div>
                        
                        {c.estado === 'activo' && (
                            <div className="bg-[#0F1115] rounded-xl p-3 border border-white/5 mb-4">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-500 uppercase">{esProyecto ? 'Costo Total' : 'Tarifa Mensual'}</span>
                                    <span className="text-white font-mono font-bold">{c.monto ? `$${c.monto}` : '—'} <span className="text-[10px] text-gray-500">{c.moneda}</span></span>
                                </div>
                                
                                {esProyecto && c.monto && c.monto > 0 ? (
                                    <div className="mt-3 mb-1">
                                        <div className="flex justify-between text-[10px] mb-1">
                                            <span className="text-emerald-400 font-bold">Abonado: ${totalPagado}</span>
                                            <span className="text-red-400 font-bold">Resta: ${restante > 0 ? restante : 0}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${porcentaje}%` }}></div>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                                    <span className="text-xs text-gray-500 uppercase">Fecha Límite</span>
                                    <span className={`text-xs font-bold ${isLate ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                                        {formatFechaLatino(c.proximo_pago)}
                                    </span>
                                </div>
                            </div>
                        )}
                        {c.estado === 'prospecto' && (
                            <div className="bg-yellow-900/10 rounded-xl p-3 border border-yellow-500/10 mb-4">
                                <p className="text-xs text-yellow-500 text-center">⏳ Esperando confirmación</p>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 mt-2 pt-4 border-t border-white/5">
                        <button onClick={() => openPago(c)} disabled={c.estado !== 'activo'} className="flex-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-600/30 rounded-lg py-2 text-xs font-bold transition disabled:opacity-30 disabled:cursor-not-allowed">
                            💵 Registrar Pago
                        </button>
                        <button onClick={() => handleOpenEdit(c)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">✏️</button>
                        <button onClick={() => abrirDetalles(c)} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg">👁️</button>
                    </div>
                </div>
            );
        })}
      </div>

      {/* --- MODALES --- */}
      {/* (Código de modales idéntico al anterior pero dentro de este archivo unificado) */}
      
      {verOpen && verCliente && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1C2128] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/10 flex justify-between items-start bg-[#161B22]">
                    <div><h2 className="text-2xl font-bold text-white">{verCliente.nombre}</h2></div>
                    <button onClick={() => setVerOpen(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
                </div>
                <div className="overflow-y-auto p-6 space-y-8">
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">📜 Historial de Pagos</h3>
                        <div className="border border-white/10 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/5 text-gray-400"><tr><th className="p-3">Fecha</th><th className="p-3">Monto</th><th className="p-3">Recibo</th></tr></thead>
                                <tbody className="divide-y divide-white/5">
                                    {historialPagos.map(p => (
                                        <tr key={p.id} className="hover:bg-white/5">
                                            <td className="p-3 text-gray-300">{formatFechaLatino(p.fecha_pago)}</td>
                                            <td className="p-3 font-mono font-bold text-emerald-400">+{p.monto} {p.moneda}</td>
                                            <td className="p-3"><button onClick={() => verCliente && generarReciboPDF(p, verCliente)} className="text-xs bg-white/10 px-2 py-1 rounded">🧾</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="border-t border-white/10 pt-6">
                        <div className="flex items-center justify-between bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl">
                            <div><h4 className="text-blue-200 font-bold text-sm">Cambiar Estado</h4><p className="text-blue-200/60 text-xs">Mueve el cliente entre Activo, Inactivo o Standby.</p></div>
                            <button onClick={() => toggleEstado(verCliente)} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition">{verCliente.estado === 'prospecto' ? '✅ Convertir en Cliente Activo' : verCliente.estado === 'activo' ? '🛑 Desactivar' : '🔄 Reactivar'}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {prospectoOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-[#1C2128] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/10 bg-[#161B22] flex justify-between">
                    <div><h2 className="text-xl font-bold text-white">Cotización para Nuevo Prospecto</h2><p className="text-xs text-gray-400">Esto guardará al cliente en "Standby" y generará el PDF.</p></div>
                    <button onClick={() => setProspectoOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 space-y-4 border-r border-white/5 pr-4">
                        <h3 className="text-sm font-bold text-emerald-400 uppercase">1. Datos del Cliente</h3>
                        <div><label className="text-xs text-gray-500 block mb-1">Nombre / Razón Social *</label><input value={prospectoForm.nombre} onChange={e => setProspectoForm({...prospectoForm, nombre: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-2 rounded text-white" /></div>
                        <div><label className="text-xs text-gray-500 block mb-1">Empresa</label><input value={prospectoForm.empresa} onChange={e => setProspectoForm({...prospectoForm, empresa: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-2 rounded text-white" /></div>
                        <div><label className="text-xs text-gray-500 block mb-1">Email</label><input value={prospectoForm.email} onChange={e => setProspectoForm({...prospectoForm, email: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-2 rounded text-white" /></div>
                        <div><label className="text-xs text-gray-500 block mb-1">Moneda</label><select value={prospectoForm.moneda} onChange={e => setProspectoForm({...prospectoForm, moneda: e.target.value as Moneda})} className="w-full bg-[#0F1115] border border-gray-700 p-2 rounded text-white"><option value="USD">USD</option><option value="COP">COP</option></select></div>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <h3 className="text-sm font-bold text-emerald-400 uppercase">2. Items a Cotizar</h3>
                        <div className="space-y-2">
                            {quoteItems.map((item, index) => (
                                <div key={item.id} className="flex gap-2 items-center bg-white/5 p-2 rounded-lg">
                                    <input placeholder="Descripción" value={item.desc} onChange={(e) => { const n = [...quoteItems]; n[index].desc = e.target.value; setQuoteItems(n); }} className="flex-[2] bg-transparent border-none text-white text-sm outline-none placeholder-gray-500" />
                                    <input type="number" placeholder="Cant." value={item.qty} onChange={(e) => { const n = [...quoteItems]; n[index].qty = Number(e.target.value); setQuoteItems(n); }} className="w-16 bg-black/20 rounded p-1 text-center text-white text-sm outline-none" />
                                    <input type="number" placeholder="Precio" value={item.price} onChange={(e) => { const n = [...quoteItems]; n[index].price = Number(e.target.value); setQuoteItems(n); }} className="w-24 bg-black/20 rounded p-1 text-right text-white text-sm outline-none" />
                                    <button onClick={() => removeQuoteItem(item.id)} className="text-red-400 px-2">✕</button>
                                </div>
                            ))}
                            <button onClick={addQuoteItem} className="text-xs text-emerald-400 font-bold hover:underline">+ Agregar Item</button>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-white/10">
                            <p className="text-gray-400 text-xs">Total Estimado:</p>
                            <p className="text-xl font-bold text-white">${quoteItems.reduce((acc, i) => acc + (i.qty * i.price), 0).toLocaleString()} {prospectoForm.moneda}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-white/10 bg-[#161B22] flex justify-end gap-3">
                    <button onClick={() => setProspectoOpen(false)} className="text-gray-400 px-4 py-2 text-sm">Cancelar</button>
                    <button onClick={guardarYCotizarProspecto} disabled={prospectoSaving} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2 rounded-lg shadow-lg flex items-center gap-2 disabled:opacity-50">{prospectoSaving ? "Guardando..." : "💾 Guardar Prospecto & 📥 Descargar PDF"}</button>
                </div>
            </div>
        </div>
      )}

      {quoteOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-[#1C2128] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/10 bg-[#161B22]"><h2 className="text-xl font-bold text-white">Generar Cotización PDF</h2><p className="text-xs text-gray-400">Cliente: {verCliente?.nombre}</p></div>
                <div className="p-6 overflow-y-auto space-y-4">
                    {quoteItems.map((item, index) => (
                        <div key={item.id} className="flex gap-2 items-center bg-white/5 p-2 rounded-lg">
                            <input value={item.desc} onChange={(e) => {const n=[...quoteItems]; n[index].desc=e.target.value; setQuoteItems(n)}} className="flex-[2] bg-transparent border-none text-white text-sm outline-none" />
                            <input type="number" value={item.qty} onChange={(e) => {const n=[...quoteItems]; n[index].qty=Number(e.target.value); setQuoteItems(n)}} className="w-16 bg-black/20 rounded p-1 text-center text-white text-sm" />
                            <input type="number" value={item.price} onChange={(e) => {const n=[...quoteItems]; n[index].price=Number(e.target.value); setQuoteItems(n)}} className="w-24 bg-black/20 rounded p-1 text-right text-white text-sm" />
                            <button onClick={() => removeQuoteItem(item.id)} className="text-red-400 px-2">✕</button>
                        </div>
                    ))}
                    <button onClick={addQuoteItem} className="text-sm text-emerald-400 font-bold hover:underline">+ Agregar Item</button>
                </div>
                <div className="p-6 border-t border-white/10 bg-[#161B22] flex gap-3 justify-end">
                    <button onClick={() => setQuoteOpen(false)} className="text-gray-400 hover:text-white px-4 py-2 text-sm">Cancelar</button>
                    <button onClick={generarCotizacionExistente} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2 rounded-lg shadow-lg flex items-center gap-2">📥 Descargar PDF</button>
                </div>
            </div>
        </div>
      )}

      {createOpen && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1C2128] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
                <h3 className="text-white font-bold text-lg mb-4">Nuevo Cliente Activo</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block uppercase">Nombre *</label><input value={createForm.nombre} onChange={e => setCreateForm({...createForm, nombre: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-emerald-500" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block uppercase">Empresa</label><input value={createForm.empresa} onChange={e => setCreateForm({...createForm, empresa: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-emerald-500" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block uppercase">Email</label><input value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-emerald-500" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block uppercase">Teléfono</label><input value={createForm.telefono} onChange={e => setCreateForm({...createForm, telefono: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-emerald-500" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block uppercase">Monto Total Acuerdo</label><input type="number" value={createForm.monto} onChange={e => setCreateForm({...createForm, monto: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-emerald-500" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block uppercase">Moneda</label><select value={createForm.moneda} onChange={e => setCreateForm({...createForm, moneda: e.target.value as Moneda})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-emerald-500"><option value="USD">USD</option><option value="COP">COP</option><option value="EUR">EUR</option><option value="MXN">MXN</option></select></div>
                        <div><label className="text-xs text-gray-500 mb-1 block uppercase">Frecuencia</label><select value={createForm.frecuencia_pago} onChange={e => setCreateForm({...createForm, frecuencia_pago: e.target.value as FrecuenciaPago})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-emerald-500"><option value="mensual">Mensual</option><option value="quincenal">Quincenal</option><option value="unico">Pago Único (Proyecto)</option></select></div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block uppercase">Fecha Primer Cobro</label>
                            {createForm.contra_entrega ? (
                                <div className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-gray-400 text-sm italic">Pago al finalizar trabajo</div>
                            ) : (
                                <input type="date" value={createForm.proximo_pago} onChange={e => setCreateForm({...createForm, proximo_pago: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-emerald-500" />
                            )}
                            <div className="flex items-center gap-2 mt-2"><input type="checkbox" id="contraEntrega" checked={createForm.contra_entrega} onChange={e => setCreateForm({...createForm, contra_entrega: e.target.checked})} className="w-4 h-4 rounded border-gray-600 text-emerald-600 bg-[#0F1115]" /><label htmlFor="contraEntrega" className="text-xs text-gray-400 cursor-pointer select-none">Es pago contra entrega</label></div>
                        </div>
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
                        <div><label className="text-xs text-gray-500 mb-1 block">Frecuencia</label><select value={editCliente.frecuencia_pago} onChange={e => setEditCliente({...editCliente, frecuencia_pago: e.target.value as FrecuenciaPago})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white"><option value="mensual">Mensual</option><option value="quincenal">Quincenal</option><option value="unico">Pago Único (Proyecto)</option></select></div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block uppercase">Fecha Límite</label>
                            {editCliente.contra_entrega ? (
                                <div className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-gray-400 text-sm italic">Pago al finalizar trabajo</div>
                            ) : (
                                <input type="date" value={editCliente.proximo_pago || ""} onChange={e => setEditCliente({...editCliente, proximo_pago: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white outline-none" />
                            )}
                            <div className="flex items-center gap-2 mt-2"><input type="checkbox" id="contraEntregaEdit" checked={editCliente.contra_entrega || false} onChange={e => setEditCliente({...editCliente, contra_entrega: e.target.checked})} className="w-4 h-4 rounded border-gray-600 text-emerald-600 bg-[#0F1115]" /><label htmlFor="contraEntregaEdit" className="text-xs text-gray-400 cursor-pointer select-none">Es pago contra entrega</label></div>
                        </div>
                    </div>
                    <button onClick={guardarEdicion} disabled={editSaving} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg disabled:opacity-50">{editSaving ? "Guardando..." : "Guardar Cambios"}</button>
                    <button onClick={() => setEditOpen(false)} className="w-full text-gray-500 text-sm hover:text-white">Cancelar</button>
                </div>
            </div>
        </div>
      )}

      {pagoOpen && pagoCliente && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1C2128] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-white font-bold text-lg mb-4">Registrar Ingreso</h3>
                <div className="space-y-4">
                    {esClienteProyecto(pagoCliente) && (
                        <div className="flex gap-2 p-1 bg-black/30 rounded-lg">
                            <button onClick={() => setPagoForm({ ...pagoForm, tipo: "completo" })} className={`flex-1 py-2 text-xs font-bold rounded-md transition ${pagoForm.tipo === "completo" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"}`}>Pago Completo</button>
                            <button onClick={() => setPagoForm({ ...pagoForm, tipo: "parcial" })} className={`flex-1 py-2 text-xs font-bold rounded-md transition ${pagoForm.tipo === "parcial" ? "bg-yellow-600 text-white" : "text-gray-400 hover:text-white"}`}>Abono / Parcial</button>
                        </div>
                    )}
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
                    <input placeholder="Nota (Opcional)" value={pagoForm.nota} onChange={e => setPagoForm({...pagoForm, nota: e.target.value})} className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white text-sm" />
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