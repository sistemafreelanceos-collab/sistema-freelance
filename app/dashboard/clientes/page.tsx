  "use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Cliente, Cuenta, PackServicio, Proyecto } from "./tipos";
import TarjetaCliente from "./Components/TarjetaCliente";
import ModalNuevoCliente from "./Components/ModalNuevoCliente";
import ModalNuevoProyecto from "./Components/ModalNuevoProyecto";
import ModalPago from "./Components/ModalPago";
import ModalDetalleProyecto from "./Components/ModalDetalleProyecto";
import ModalEditarProyecto from "./Components/ModalEditarProyecto";

export default function ClientesPage() {
  const [loading, setLoading] = useState(true);
  
  // --- DATOS ---
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [packs, setPacks] = useState<PackServicio[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [userId, setUserId] = useState("");
  const [query, setQuery] = useState("");

  // --- ESTADOS DE MODALES ---
  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  const [modalProyectoOpen, setModalProyectoOpen] = useState(false);
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  
  // --- ELEMENTOS SELECCIONADOS ---
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);

  // --- FILTRO DE BÚSQUEDA ---
  const clientesFiltrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(c => c.nombre.toLowerCase().includes(q) || c.empresa?.toLowerCase().includes(q));
  }, [clientes, query]);

  // --- CARGA INICIAL ---
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const [resProfile, resClientes, resProyectos, resCuentas, resPacks] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("clientes").select("*, pagos_cliente(monto)").order("created_at", { ascending: false }),
        
        // CARGA COMPLETA DE PROYECTOS CON PAGOS E HISTORIAL 👇
        supabase.from("proyectos")
            .select("*, gastos(monto), pagos_cliente(id, monto, fecha_pago, referencia)")
            .eq("owner_id", session.user.id)
            .neq("estado", "finalizado"),
            
        supabase.from("cuentas").select("id, nombre, moneda, is_principal").eq("owner_id", session.user.id),
        supabase.from("plantillas_proyectos").select("*").eq("owner_id", session.user.id)
      ]);

      if (resProfile.data) setMyProfile(resProfile.data);
      if (resCuentas.data) setCuentas(resCuentas.data as Cuenta[]);
      if (resPacks.data) setPacks(resPacks.data);

      if (resClientes.data) {
        // Unir clientes con sus proyectos correspondientes
        const clientesConProyectos = (resClientes.data as any[]).map(c => ({
          ...c,
          proyectos: resProyectos.data?.filter(p => p.cliente_id === c.id) || []
        }));
        setClientes(clientesConProyectos as Cliente[]);
      }
      setLoading(false);
    };
    init();
  }, []);

  // --- HANDLERS (ACTUALIZACIÓN DE ESTADO LOCAL) ---

  // 1. Crear Cliente
  const handleClienteCreado = (nuevoCliente: Cliente) => {
    setClientes([{ ...nuevoCliente, proyectos: [], pagos_cliente: [] }, ...clientes]);
  };

  // 2. Crear Proyecto
  const handleProyectoCreado = (nuevoProyecto: Proyecto) => {
    setClientes(prev => prev.map(c => c.id === nuevoProyecto.cliente_id ? { ...c, proyectos: [...(c.proyectos || []), nuevoProyecto] } : c));
  };

  // 3. Actualizar Proyecto (Edición o cambio de fecha automático)
  const handleProyectoActualizado = (proyectoEditado: Proyecto) => {
    setClientes(prev => prev.map(c => {
       if (c.id === proyectoEditado.cliente_id) {
           const proyectosActualizados = c.proyectos?.map(p => p.id === proyectoEditado.id ? proyectoEditado : p);
           return { ...c, proyectos: proyectosActualizados };
       }
       return c;
    }));
    // Actualizamos la selección para que el modal de detalle refleje los cambios al instante
    if (proyectoSeleccionado?.id === proyectoEditado.id) {
        setProyectoSeleccionado(proyectoEditado); 
    }
  };

  // 4. Registrar Pago (Actualiza Cliente y Proyecto)
  const handlePagoRegistrado = (pago: any, clienteActualizado: Cliente) => {
    // A. Actualizamos el cliente general (montos globales)
    setClientes(prev => prev.map(c => c.id === clienteActualizado.id ? clienteActualizado : c));
    
    // B. Actualizamos el proyecto específico (historial y barras)
    if (pago.proyecto_id) {
        const cliente = clientes.find(c => c.id === clienteActualizado.id);
        if (cliente && cliente.proyectos) {
            const proyecto = cliente.proyectos.find(p => p.id === pago.proyecto_id);
            if (proyecto) {
                // Creamos el nuevo objeto de proyecto con el pago agregado
                const nuevosPagosProyecto = [...(proyecto.pagos_cliente || []), pago];
                const proyectoActualizado = { ...proyecto, pagos_cliente: nuevosPagosProyecto };
                
                // Disparamos la actualización
                handleProyectoActualizado(proyectoActualizado);
            }
        }
    }
  };

  // 5. Eliminar Cliente
  const eliminarCliente = async (id: string) => {
    if (!confirm("⚠️ Se borrarán el cliente y sus proyectos. ¿Seguro?")) return;
    await supabase.from("clientes").delete().eq("id", id);
    setClientes(prev => prev.filter(c => c.id !== id));
  };

  // 6. Eliminar Proyecto
  const eliminarProyecto = async (proyectoId: string, clienteId: string) => {
    if (!confirm("¿Borrar proyecto?")) return;
    await supabase.from("proyectos").delete().eq("id", proyectoId);
    setClientes(prev => prev.map(c => c.id === clienteId ? { ...c, proyectos: c.proyectos?.filter(p => p.id !== proyectoId) } : c));
  };

  // 7. Actualización simple desde tarjeta
  const updateClienteLocal = (clienteActualizado: Cliente) => {
    setClientes(prev => prev.map(c => c.id === clienteActualizado.id ? clienteActualizado : c));
  };

  // --- CONTROL DE FLUJO DE MODALES ---

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

  if (loading) return <div className="p-10 text-white animate-pulse">Cargando FreelanceOS...</div>;

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

      {/* Grid de Clientes (AJUSTADO PARA PANTALLAS LAPTOP - MODO COMPACTO) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
        {clientesFiltrados.map(cliente => (
          <TarjetaCliente 
            key={cliente.id} 
            cliente={cliente}
            onEliminarCliente={eliminarCliente}
            onEliminarProyecto={eliminarProyecto}
            onOpenProyecto={(c) => { setClienteSeleccionado(c); setModalProyectoOpen(true); }}
            onUpdateClienteLocal={updateClienteLocal}
            onVerDetalleProyecto={handleVerDetalle}
            onOpenPago={(c) => { /* Deprecado desde tarjeta */ }}
          />
        ))}
      </div>

      {/* --- MODALES --- */}

      <ModalNuevoCliente 
        isOpen={modalClienteOpen} 
        onClose={() => setModalClienteOpen(false)} 
        onClienteCreado={handleClienteCreado}
        userId={userId} 
      />

      <ModalNuevoProyecto 
        isOpen={modalProyectoOpen} 
        onClose={() => setModalProyectoOpen(false)} 
        cliente={clienteSeleccionado} 
        packs={packs} 
        userId={userId} 
        onProyectoCreado={handleProyectoCreado} 
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
      />

      <ModalEditarProyecto 
        isOpen={modalEditarOpen} 
        onClose={() => setModalEditarOpen(false)} 
        proyecto={proyectoSeleccionado} 
        onProyectoActualizado={handleProyectoActualizado} 
      />

    </div>
  );
}