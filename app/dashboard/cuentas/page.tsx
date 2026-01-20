"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

// --- TIPOS ---
type Cuenta = {
  id: string;
  nombre: string;
  banco: string | null;
  tipo: string | null; // Ahorros, Corriente
  numero: string | null;
  moneda: string;
  is_principal: boolean;
  saldo_calculado?: number; // <--- Nuevo campo virtual
};

type Movimiento = {
  monto: number;
  tipo: "ingreso" | "egreso";
  cuenta_id: string;
};

export default function CuentasPage() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para Modal Crear/Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    banco: "",
    tipo: "ahorros",
    numero: "",
    moneda: "COP",
  });

  // --- 1. CARGA INICIAL CON CÁLCULO DE SALDOS ---
  useEffect(() => {
    cargarCuentasYSaldo();
  }, []);

  const cargarCuentasYSaldo = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // A. Traemos las cuentas
    const { data: dataCuentas, error: errorCuentas } = await supabase
      .from("cuentas")
      .select("*")
      .eq("owner_id", session.user.id)
      .order("is_principal", { ascending: false });

    if (errorCuentas) {
      alert("Error cargando cuentas");
      setLoading(false);
      return;
    }

    // B. Traemos TODOS los movimientos para calcular saldos
    // (Nota: Para apps muy grandes esto se hace con una función SQL, pero para freelancers esto es rápido y gratis)
    const { data: dataMovimientos, error: errorMov } = await supabase
      .from("movimientos")
      .select("cuenta_id, tipo, monto")
      .eq("owner_id", session.user.id);

    if (errorMov) {
        console.error("Error calculando saldos", errorMov);
    }

    // C. Algoritmo de Cálculo de Saldo
    const cuentasConSaldo = (dataCuentas as Cuenta[]).map(cuenta => {
        // Filtrar movimientos de ESTA cuenta
        const movimientosCuenta = (dataMovimientos as Movimiento[] || []).filter(m => m.cuenta_id === cuenta.id);
        
        // Sumar Ingresos - Restar Egresos
        const total = movimientosCuenta.reduce((acc, mov) => {
            return mov.tipo === "ingreso" ? acc + mov.monto : acc - mov.monto;
        }, 0);

        return { ...cuenta, saldo_calculado: total };
    });

    setCuentas(cuentasConSaldo);
    setLoading(false);
  };

  // --- 2. CREAR CUENTA ---
  const guardarCuenta = async () => {
    if (!form.nombre) return alert("Ponle un nombre a la cuenta");
    setSaving(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase.from("cuentas").insert({
      owner_id: session?.user.id,
      nombre: form.nombre,
      banco: form.banco || null,
      tipo: form.tipo,
      numero: form.numero || null,
      moneda: form.moneda,
      is_principal: cuentas.length === 0 // Si es la primera, es principal automática
    });

    if (error) {
        alert("Error: " + error.message);
    } else {
        setModalOpen(false);
        setForm({ nombre: "", banco: "", tipo: "ahorros", numero: "", moneda: "COP" }); // Reset
        cargarCuentasYSaldo(); // Recargar lista
    }
    setSaving(false);
  };

  // --- 3. BORRAR CUENTA ---
  const eliminarCuenta = async (id: string) => {
    if(!confirm("¿Borrar cuenta? Se perderá el historial de saldo asociado.")) return;
    await supabase.from("cuentas").delete().eq("id", id);
    cargarCuentasYSaldo();
  };

  // --- 4. MARCAR PRINCIPAL ---
  const hacerPrincipal = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Primero quitamos principal a todas
    await supabase.from("cuentas").update({ is_principal: false }).eq("owner_id", session?.user.id);
    
    // Ponemos principal a la elegida
    await supabase.from("cuentas").update({ is_principal: true }).eq("id", id);
    
    cargarCuentasYSaldo();
  };

  // --- RENDER ---
  if (loading) return <div className="p-8 text-gray-400">Calculando saldos...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-white">Mis Cuentas</h1>
            <p className="text-gray-400 text-sm">Administra dónde recibes tu dinero</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg transition">
            + Nueva Cuenta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cuentas.map(c => (
            <div key={c.id} className={`relative p-6 rounded-2xl border transition-all ${c.is_principal ? 'bg-gradient-to-br from-emerald-900/40 to-black border-emerald-500/50 shadow-lg shadow-emerald-900/20' : 'bg-[#161B22] border-white/10 hover:border-white/30'}`}>
                
                {/* Badge Principal */}
                {c.is_principal && <span className="absolute top-4 right-4 text-[10px] font-bold bg-emerald-500 text-black px-2 py-1 rounded-full">PRINCIPAL</span>}

                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white">{c.nombre}</h3>
                        <p className="text-sm text-gray-400">{c.banco} • {c.tipo}</p>
                        <p className="text-xs text-gray-500 font-mono mt-1">{c.numero ? `**** ${c.numero.slice(-4)}` : 'Sin número'}</p>
                    </div>
                </div>

                {/* EL SALDO REAL CALCULADO */}
                <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Saldo Disponible</p>
                    <p className={`text-2xl font-mono font-bold ${ (c.saldo_calculado || 0) >= 0 ? 'text-white' : 'text-red-400' }`}>
                        $ {(c.saldo_calculado || 0).toLocaleString()} <span className="text-sm text-gray-500">{c.moneda}</span>
                    </p>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 mt-4">
                    {!c.is_principal && (
                        <button onClick={() => hacerPrincipal(c.id)} className="text-xs text-gray-400 hover:text-white underline">
                            Hacer principal
                        </button>
                    )}
                    <button onClick={() => eliminarCuenta(c.id)} className="text-xs text-red-400 hover:text-red-300 ml-auto">
                        Eliminar
                    </button>
                </div>
            </div>
        ))}
      </div>

      {/* Modal Nueva Cuenta */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1C2128] border border-white/10 p-6 rounded-2xl w-full max-w-md">
                <h3 className="text-white font-bold text-lg mb-4">Registrar nueva cuenta</h3>
                
                <div className="space-y-3">
                    <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Alias (Ej: Nequi Personal)" className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white" />
                    <input value={form.banco} onChange={e => setForm({...form, banco: e.target.value})} placeholder="Banco (Opcional)" className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white" />
                    
                    <div className="flex gap-2">
                        <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white flex-1">
                            <option value="ahorros">Ahorros</option>
                            <option value="corriente">Corriente</option>
                            <option value="efectivo">Efectivo</option>
                            <option value="billetera">Billetera Digital</option>
                        </select>
                        <select value={form.moneda} onChange={e => setForm({...form, moneda: e.target.value})} className="bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white w-24">
                            <option value="COP">COP</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                        </select>
                    </div>

                    <input value={form.numero} onChange={e => setForm({...form, numero: e.target.value})} placeholder="Número de cuenta (Opcional)" className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white" />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white px-4 py-2">Cancelar</button>
                    <button onClick={guardarCuenta} disabled={saving} className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg">
                        {saving ? "Guardando..." : "Crear Cuenta"}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}