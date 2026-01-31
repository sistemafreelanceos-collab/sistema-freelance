"use client";

import { useState } from "react";
import { useCuentas } from "../../hooks/useCuentas";
import SkeletonGrid from "../components/SkeletonGrid";
import { toast } from "sonner";

import { PencilIcon } from "@heroicons/react/24/solid";

export default function CuentasPage() {
  const { cuentas, loading, guardarCuenta, eliminarCuenta, hacerPrincipal } = useCuentas();

  // Estados locales de UI (Formularios y Modales se quedan aquí, la lógica de datos se va)
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    banco: "",
    tipo: "ahorros",
    numero: "",
    moneda: "COP",
  });

  const handleEditar = (cuenta: any) => {
    setForm({
      nombre: cuenta.nombre,
      banco: cuenta.banco || "",
      tipo: cuenta.tipo,
      numero: cuenta.numero || "",
      moneda: cuenta.moneda,
    });
    setEditingId(cuenta.id);
    setModalOpen(true);
  };

  const handleCancelar = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm({ nombre: "", banco: "", tipo: "ahorros", numero: "", moneda: "COP" });
  }

  const handleGuardar = async () => {
    if (!form.nombre) return toast.warning("Ponle un nombre a la cuenta");
    setSaving(true);
    try {
      // Si hay editingId, pasamos el ID para actualizar. Si no, creación normal.
      await guardarCuenta(form, cuentas.length === 0, editingId || undefined);
      handleCancelar(); // Cierra y reseta
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SkeletonGrid />;

  return (
    <div className="max-w-4xl mx-auto pb-20 p-4 sm:p-6">

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Mis Cuentas</h1>
          <p className="text-gray-400 text-sm">Administra dónde recibes tu dinero</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm({ nombre: "", banco: "", tipo: "ahorros", numero: "", moneda: "COP" }); setModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg transition shadow-lg">
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
              <p className={`text-2xl font-mono font-bold ${(c.saldo_calculado || 0) >= 0 ? 'text-white' : 'text-red-400'}`}>
                $ {(c.saldo_calculado || 0).toLocaleString()} <span className="text-sm text-gray-500">{c.moneda}</span>
              </p>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 mt-4 items-center">
              <button onClick={() => handleEditar(c)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition bg-white/5 px-2 py-1 rounded">
                <PencilIcon className="w-3 h-3" /> Editar
              </button>

              {!c.is_principal && (
                <button onClick={() => hacerPrincipal(c.id)} className="text-xs text-gray-400 hover:text-white underline ml-2">
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#1C2128] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-4">{editingId ? "Editar Cuenta" : "Registrar nueva cuenta"}</h3>

            <div className="space-y-3">
              <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Alias (Ej: Nequi Personal)" className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white font-bold" />
              <input value={form.banco} onChange={e => setForm({ ...form, banco: e.target.value })} placeholder="Banco (Opcional)" className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white" />

              <div className="flex gap-2">
                <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className="bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white flex-1">
                  <option value="ahorros">Ahorros</option>
                  <option value="corriente">Corriente</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="billetera">Billetera Digital</option>
                </select>
                <select value={form.moneda} onChange={e => setForm({ ...form, moneda: e.target.value })} className="bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white w-24">
                  <option value="COP">COP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <input value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} placeholder="Número de cuenta (Opcional)" className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-lg text-white font-mono" />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={handleCancelar} className="text-gray-400 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition">Cancelar</button>
              <button onClick={handleGuardar} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg transition shadow-lg shadow-emerald-900/20">
                {saving ? "Guardando..." : (editingId ? "Actualizar" : "Crear Cuenta")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}