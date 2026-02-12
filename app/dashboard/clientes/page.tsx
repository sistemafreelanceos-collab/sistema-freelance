"use client";
import { useState } from "react";
import { useClientes } from "../../hooks/useClientes";
import TarjetaCliente from "./Components/TarjetaCliente";
import ModalNuevoCliente from "./Components/ModalNuevoCliente";
import ModalNuevoProyecto from "./Components/ModalNuevoProyecto";
import ModalPago from "./Components/ModalPago";
import ModalDetalleProyecto from "./Components/ModalDetalleProyecto";
import ModalEditarProyecto from "./Components/ModalEditarProyecto";
import ModalDetalleCliente from "./Components/ModalDetalleCliente";
import ProjectKanban from "./Components/ProjectKanban";
import SkeletonGrid from "../components/SkeletonGrid";
import { Cliente, Proyecto } from "../../../types";
import { toast } from "sonner";

export default function ClientesPage() {
  const {
    loading,
    clientesFiltrados,
    todosLosProyectos,
    query,
    setQuery,
    crearCliente,
    crearProyecto,
    actualizarProyecto,
    actualizarClienteLocal,
    eliminarProyecto,
    userId,
    packs,
    cuentas,
    myProfile,
    cambiarEstadoProyecto
  } = useClientes();

  // ESTADO PARA VISTAS Y MODALES
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  // Modales
  const [isModalClienteOpen, setIsModalClienteOpen] = useState(false);
  const [modalNuevoProyOpen, setModalNuevoProyOpen] = useState(false);
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [modalDetalleProyOpen, setModalDetalleProyOpen] = useState(false);
  const [modalEditarProyOpen, setModalEditarProyOpen] = useState(false);
  const [modalDetalleClienteOpen, setModalDetalleClienteOpen] = useState(false);

  // Selección
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);

  // --- HANDLERS ---

  const handleNuevoProyecto = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setModalNuevoProyOpen(true);
  };

  const handleVerDetalleProyecto = (proyecto: Proyecto, cliente: Cliente) => {
    setSelectedProyecto(proyecto);
    setSelectedCliente(cliente);
    setModalDetalleProyOpen(true);
  };

  const handleEditarProyecto = (proyecto: Proyecto) => {
    setModalDetalleProyOpen(false);
    setSelectedProyecto(proyecto);
    setModalEditarProyOpen(true);
  };

  const handleRegistrarPago = (cliente: Cliente, proyecto?: Proyecto) => {
    setSelectedCliente(cliente);
    setSelectedProyecto(proyecto || null);
    setModalDetalleProyOpen(false);
    setModalPagoOpen(true);
  };

  const handleVerCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setModalDetalleClienteOpen(true);
  };

  const handlePagoRegistrado = (_nuevoPago: any, _clienteActualizado: Cliente) => {
    actualizarClienteLocal();
  };

  // Wrapper para crear proyecto que coincida con la firma esperada
  const handleCreateProjectWrapper = async (data: any) => {
    return await crearProyecto(data); // Corregido: llamada directa
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto pb-24">

      {/* Header y Controles */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Clientes y Proyectos</h1>
          <p className="text-gray-400 text-sm mt-1">Gestiona tu cartera, cotizaciones y flujo de trabajo</p>
        </div>

        <div className="flex items-center gap-3 bg-black/20 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            📋 Lista
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'board' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            📊 Tablero
          </button>
        </div>

        <button
          onClick={() => setIsModalClienteOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <span>+ Nuevo Cliente</span>
        </button>
      </div>

      {/* Buscador (Solo visible en modo lista) */}
      {viewMode === 'list' && (
        <div className="relative max-w-md">
          <span className="absolute left-3 top-3 text-gray-500">🔍</span>
          <input
            type="text"
            placeholder="Buscar cliente, empresa o email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-black/20 border border-white/10 pl-10 pr-4 py-3 rounded-xl text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition outline-none"
          />
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <SkeletonGrid />
      ) : (
        <>
          {/* VISTA LISTA */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {clientesFiltrados.length > 0 ? (
                clientesFiltrados.map((cliente) => (
                  <TarjetaCliente
                    key={cliente.id}
                    cliente={cliente}
                    // Legacy / Compatibility props
                    onNuevoProyecto={crearProyecto}
                    onUpdate={actualizarProyecto}
                    onClienteUpdated={actualizarClienteLocal}

                    // Functional props
                    onOpenProyecto={handleNuevoProyecto}
                    onVerDetalleProyecto={handleVerDetalleProyecto}
                    onOpenPago={handleRegistrarPago}
                    onVerCliente={handleVerCliente}
                  />
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-xl text-white font-bold">No hay clientes encontrados</h3>
                  <p className="text-gray-500">Prueba con otra búsqueda o crea uno nuevo.</p>
                </div>
              )}
            </div>
          )}

          {/* VISTA TABLERO (Kanban) */}
          {viewMode === 'board' && (
            <div className="h-[calc(100vh-250px)]">
              <ProjectKanban
                proyectos={todosLosProyectos}
                onStatusChange={cambiarEstadoProyecto}
              />
            </div>
          )}
        </>
      )}

      {/* --- MODALES --- */}

      <ModalNuevoCliente
        isOpen={isModalClienteOpen}
        onClose={() => setIsModalClienteOpen(false)}
        onClienteCreado={crearCliente}
        userId={userId}
      />

      <ModalNuevoProyecto
        isOpen={modalNuevoProyOpen}
        onClose={() => setModalNuevoProyOpen(false)}
        cliente={selectedCliente}
        packs={packs}
        userId={userId}
        onProyectoCreado={handleCreateProjectWrapper}
      />

      <ModalPago
        isOpen={modalPagoOpen}
        onClose={() => setModalPagoOpen(false)}
        cliente={selectedCliente}
        proyecto={selectedProyecto}
        cuentas={cuentas}
        userId={userId}
        perfilUsuario={myProfile}
        onPagoRegistrado={handlePagoRegistrado}
      />

      <ModalDetalleProyecto
        isOpen={modalDetalleProyOpen}
        onClose={() => setModalDetalleProyOpen(false)}
        proyecto={selectedProyecto}
        cliente={selectedCliente}
        onEditar={handleEditarProyecto}
        onRegistrarPago={() => selectedCliente && handleRegistrarPago(selectedCliente, selectedProyecto || undefined)}
        onEliminar={(pid, cid) => eliminarProyecto(pid, cid)}
      />

      <ModalEditarProyecto
        isOpen={modalEditarProyOpen}
        onClose={() => setModalEditarProyOpen(false)}
        proyecto={selectedProyecto}
        onEliminar={(pid, cid) => eliminarProyecto(pid, cid)}
        onProyectoActualizado={(p) => { actualizarProyecto(); }}
      />

      <ModalDetalleCliente
        isOpen={modalDetalleClienteOpen}
        onClose={() => setModalDetalleClienteOpen(false)}
        cliente={selectedCliente}
      />

    </div>
  );
}