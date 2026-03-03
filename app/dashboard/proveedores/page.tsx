"use client";
import { useState } from "react";
import { useProveedores } from "../../hooks/useProveedores";
import TarjetaProveedor from "./Components/TarjetaProveedor";
import ModalNuevoProveedor from "./Components/ModalNuevoProveedor";
import ModalDetalleProveedor from "./Components/ModalDetalleProveedor";
import { Proveedor } from "../../../types/proveedores";
import { toast } from "sonner";

export default function ProveedoresPage() {
    const {
        loading,
        proveedoresFiltrados,
        cuentas,
        query,
        setQuery,
        crearProveedor,
        actualizarProveedor,
        eliminarProveedor,
        crearProyectoProveedor,
        editarProyectoProveedor,
        eliminarProyectoProveedor,
        registrarPago,
    } = useProveedores();

    const [modalNuevo, setModalNuevo] = useState(false);
    const [proveedorEditar, setProveedorEditar] = useState<Proveedor | null>(null);
    const [proveedorDetalle, setProveedorDetalle] = useState<Proveedor | null>(null);

    // Keep detalle in sync when data refreshes
    const proveedorDetalleActualizado = proveedorDetalle
        ? proveedoresFiltrados.find(p => p.id === proveedorDetalle.id) || proveedorDetalle
        : null;

    const pagadoPorMoneda: Record<string, number> = {};
    const pendientePorMoneda: Record<string, number> = {};
    let proyectosActivos = 0;

    proveedoresFiltrados.forEach(p => {
        (p.proyectos_proveedor || []).forEach(proy => {
            if (proy.estado !== 'completado') proyectosActivos++;
        });
        (p.pagos_proveedor || []).forEach(pg => {
            const mon = pg.moneda || 'USD';
            if (pg.estado === 'pagado') {
                pagadoPorMoneda[mon] = (pagadoPorMoneda[mon] || 0) + pg.monto;
            } else {
                pendientePorMoneda[mon] = (pendientePorMoneda[mon] || 0) + pg.monto;
            }
        });
    });

    const handleGuardarProveedor = async (data: Partial<Proveedor>) => {
        if (proveedorEditar) {
            await actualizarProveedor({ ...data, id: proveedorEditar.id });
        } else {
            await crearProveedor(data);
        }
        setProveedorEditar(null);
        setModalNuevo(false);
    };

    const handleEliminar = (id: string) => {
        toast.error("¿Eliminar este proveedor?", {
            action: { label: "Eliminar", onClick: () => { eliminarProveedor(id); setProveedorDetalle(null); } },
            cancel: { label: "Cancelar", onClick: () => { } },
            duration: 5000,
        });
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Proveedores</h1>
                    <p className="text-gray-400 text-sm mt-1">Gestiona subcontratistas, freelancers y proveedores</p>
                </div>
                <button
                    onClick={() => { setProveedorEditar(null); setModalNuevo(true); }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-900/20 transition hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                    + Nuevo Proveedor
                </button>
            </div>

            {/* KPI Banner */}
            {proveedoresFiltrados.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#161B22] border border-white/5 rounded-2xl p-5 flex flex-col justify-center">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Resumen Proveedores</p>
                        <div className="flex gap-4">
                            <div>
                                <p className="text-3xl font-bold text-white">{proveedoresFiltrados.length}</p>
                                <p className="text-[10px] text-gray-500">Registrados</p>
                            </div>
                            <div className="w-px bg-white/10" />
                            <div>
                                <p className="text-3xl font-bold text-white">{proyectosActivos}</p>
                                <p className="text-[10px] text-blue-400">Proyectos activos</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#161B22] border border-emerald-500/10 rounded-2xl p-5 flex flex-col justify-center">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Total Pagado
                        </p>
                        {Object.keys(pagadoPorMoneda).length === 0 ? (
                            <p className="text-2xl font-bold text-gray-500 font-mono">$0</p>
                        ) : (
                            <div className="space-y-1">
                                {Object.entries(pagadoPorMoneda).map(([mon, val]) => (
                                    <p key={mon} className="text-lg font-bold text-emerald-400 font-mono leading-none">
                                        {new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 }).format(val)} <span className="text-[10px] text-emerald-600">{mon}</span>
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-[#161B22] border border-red-500/10 rounded-2xl p-5 flex flex-col justify-center">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Por Pagar
                        </p>
                        {Object.keys(pendientePorMoneda).length === 0 ? (
                            <p className="text-2xl font-bold text-gray-500 font-mono">$0</p>
                        ) : (
                            <div className="space-y-1">
                                {Object.entries(pendientePorMoneda).map(([mon, val]) => (
                                    <p key={mon} className="text-lg font-bold text-red-400 font-mono leading-none">
                                        {new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 }).format(val)} <span className="text-[10px] text-red-600">{mon}</span>
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-md">
                <span className="absolute left-3 top-3 text-gray-500">🔍</span>
                <input
                    type="text"
                    placeholder="Buscar proveedor, empresa o especialidad..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 pl-10 pr-4 py-3 rounded-xl text-white focus:border-indigo-500/50 transition outline-none"
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-[#161B22] border border-white/5 rounded-2xl p-5 animate-pulse h-48" />
                    ))}
                </div>
            ) : proveedoresFiltrados.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                    <div className="text-6xl mb-4">🏭</div>
                    <h3 className="text-xl text-white font-bold">Sin proveedores aún</h3>
                    <p className="text-gray-500 mt-1">Agrega subcontratistas, freelancers o empresas a las que les pagas.</p>
                    <button
                        onClick={() => setModalNuevo(true)}
                        className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition"
                    >
                        + Nuevo Proveedor
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {proveedoresFiltrados.map(p => (
                        <TarjetaProveedor
                            key={p.id}
                            proveedor={p}
                            onClick={setProveedorDetalle}
                            onEditar={prov => { setProveedorEditar(prov); setModalNuevo(true); }}
                            onEliminar={handleEliminar}
                        />
                    ))}
                </div>
            )}

            {/* Modales */}
            <ModalNuevoProveedor
                isOpen={modalNuevo}
                onClose={() => { setModalNuevo(false); setProveedorEditar(null); }}
                onGuardar={handleGuardarProveedor}
                proveedorEditar={proveedorEditar}
            />

            <ModalDetalleProveedor
                isOpen={!!proveedorDetalle}
                onClose={() => setProveedorDetalle(null)}
                proveedor={proveedorDetalleActualizado}
                cuentas={cuentas}
                onCrearProyecto={crearProyectoProveedor}
                onEditarProyecto={editarProyectoProveedor}
                onEliminarProyecto={eliminarProyectoProveedor}
                onRegistrarPago={registrarPago}
            />
        </div>
    );
}
