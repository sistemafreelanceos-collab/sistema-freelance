"use client";

import { useState } from "react";
import { useClientes } from "../../hooks/useClientes";
import { Cliente, Proyecto } from "../../../types"; // Centralized Types
import TarjetaCliente from "./Components/TarjetaCliente";
import ModalNuevoCliente from "./Components/ModalNuevoCliente";
import ModalNuevoProyecto from "./Components/ModalNuevoProyecto";
import ModalPago from "./Components/ModalPago";
import ModalDetalleProyecto from "./Components/ModalDetalleProyecto";
import ModalEditarProyecto from "./Components/ModalEditarProyecto";
import ModalDetalleCliente from "./Components/ModalDetalleCliente";
import SkeletonGrid from "../components/SkeletonGrid";

export default function ClientesPage() {
  // --- CUSTOM HOOK (Lógica de Negocio) ---
  const {
    loading,
    clientesFiltrados,
    cuentas,
    packs,
    myProfile,
    userId,
    query,
    setQuery,
    crearCliente,
    crearProyecto,
    actualizarProyecto,
    registrarPago,
    eliminarCliente,
    eliminarProyecto,
    actualizarClienteLocal
  } = useClientes();

  // --- ESTADOS DE UI (Modales y Selección) ---
  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  const [modalProyectoOpen, setModalProyectoOpen] = useState(false);
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalClienteDetalleOpen, setModalClienteDetalleOpen] = useState(false); // Nuevo

  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);

  // --- HANDLERS UI (Conectan Hook + UI) ---

  const handleProyectoActualizado = (proyectoEditado: Proyecto) => {
    actualizarProyecto(proyectoEditado); // Data
    // UI Update (si está seleccionado)
    if (proyectoSeleccionado?.id === proyectoEditado.id) {
      setProyectoSeleccionado(proyectoEditado);
    }
  };

  const handlePagoRegistrado = (pago: any, clienteActualizado: Cliente) => {
    registrarPago(pago, clienteActualizado);
  };

  const handleVerDetalle = (p: Proyecto, c: Cliente) => {
    setProyectoSeleccionado(p);
    setClienteSeleccionado(c);
    setModalDetalleOpen(true);
  };

  const handleAbrirEdicion = (p: Proyecto) => {
    setProyectoSeleccionado(p);
    setModalEditarOpen(true);
  };

  const handleAbrirPagoDesdeDetalle = () => {
    setModalDetalleOpen(false); // Cerramos detalle
    setModalPagoOpen(true);     // Abrimos pago
  };

  if (loading) return <SkeletonGrid />;

  return (
    <div className="max-w-7xl mx-auto pb-20 p-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Cartera de Clientes</h1>
          <p className="text-gray-400 text-sm">Portafolio de negocios y gestión de entregables.</p>
        </div>
        <button
          onClick={() => setModalClienteOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition transform hover:scale-105"
        >
          + Nuevo Cliente
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="🔍 Buscar cliente o empresa..."
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none backdrop-blur-sm transition"
        />
      </div>

      {/* Grid de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
        {clientesFiltrados.map(cliente => (
          <TarjetaCliente
            key={cliente.id}
            cliente={cliente}
            onEliminarCliente={eliminarCliente}
            onEliminarProyecto={(pid) => eliminarProyecto(pid, cliente.id)}
            onOpenProyecto={(c) => { setClienteSeleccionado(c); setModalProyectoOpen(true); }}
            onUpdateClienteLocal={actualizarClienteLocal}
            onVerDetalleProyecto={handleVerDetalle}
            onOpenPago={(c) => { /* Deprecado desde tarjeta */ }}
            onVerCliente={(c) => { setClienteSeleccionado(c); setModalClienteDetalleOpen(true); }}
          />
        ))}
      </div>

      {/* --- MODALES --- */}

      <ModalDetalleCliente
        isOpen={modalClienteDetalleOpen}
        onClose={() => setModalClienteDetalleOpen(false)}
        cliente={clienteSeleccionado}
      />

      <ModalNuevoCliente
        isOpen={modalClienteOpen}
        onClose={() => setModalClienteOpen(false)}
        onClienteCreado={crearCliente}
        userId={userId}
      />

      <ModalNuevoProyecto
        isOpen={modalProyectoOpen}
        onClose={() => setModalProyectoOpen(false)}
        cliente={clienteSeleccionado}
        packs={packs}
        userId={userId}
        onProyectoCreado={crearProyecto}
      />

      <ModalPago
        isOpen={modalPagoOpen}
        onClose={() => setModalPagoOpen(false)}
        cliente={clienteSeleccionado}
        proyecto={proyectoSeleccionado}
        cuentas={cuentas}
        userId={userId}
        perfilUsuario={myProfile}
        onPagoRegistrado={handlePagoRegistrado}
      />

      <ModalDetalleProyecto
        isOpen={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        cliente={clienteSeleccionado}
        proyecto={proyectoSeleccionado}
        onEditar={handleAbrirEdicion}
        onRegistrarPago={handleAbrirPagoDesdeDetalle}
        onEliminar={eliminarProyecto}
      />

      <ModalEditarProyecto
        isOpen={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        proyecto={proyectoSeleccionado}
        onProyectoActualizado={handleProyectoActualizado}
        onEliminar={eliminarProyecto}
      />

    </div>
  );
}