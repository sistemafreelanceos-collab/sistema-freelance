"use client";
import { useState } from "react";
import { Proveedor, ProyectoProveedor } from "../../../../types/proveedores";
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon, BriefcaseIcon, CurrencyDollarIcon, DocumentArrowDownIcon } from "@heroicons/react/24/solid";
import ModalProyectoProveedor from "./ModalProyectoProveedor";
import ModalPagoProveedor from "./ModalPagoProveedor";
import { descargarReciboPago } from "./ProveedorReciboPDF";

interface Props {
    proveedor: Proveedor | null;
    cuentas: any[];
    isOpen: boolean;
    onClose: () => void;
    onCrearProyecto: (proveedorId: string, data: Partial<ProyectoProveedor>) => Promise<void>;
    onEditarProyecto: (data: Partial<ProyectoProveedor> & { id: string }) => Promise<void>;
    onEliminarProyecto: (id: string) => Promise<void>;
    onRegistrarPago: (pago: any) => Promise<void>;
}

const ESTADO_STYLE: Record<string, string> = {
    pendiente: "bg-gray-500/20 text-gray-400 border-gray-500/20",
    en_progreso: "bg-blue-500/20 text-blue-300 border-blue-500/20",
    completado: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
};
const ESTADO_LABEL: Record<string, string> = {
    pendiente: "Pendiente",
    en_progreso: "En progreso",
    completado: "Completado",
};

export default function ModalDetalleProveedor({ proveedor, cuentas, isOpen, onClose, onCrearProyecto, onEditarProyecto, onEliminarProyecto, onRegistrarPago }: Props) {
    const [modalProyecto, setModalProyecto] = useState(false);
    const [proyectoAEditar, setProyectoAEditar] = useState<ProyectoProveedor | null>(null);
    const [proyectoParaPagar, setProyectoParaPagar] = useState<ProyectoProveedor | null>(null);
    const [confirmEliminar, setConfirmEliminar] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"proyectos" | "pagos">("proyectos");

    if (!isOpen || !proveedor) return null;

    const proyectos = proveedor.proyectos_proveedor || [];
    const todosLosPagos = proveedor.pagos_proveedor || [];
    const totalPagado = todosLosPagos.filter(p => p.estado === "pagado").reduce((s, p) => s + p.monto, 0);

    const handleCrearProyecto = async (data: Partial<ProyectoProveedor>) => {
        if (proyectoAEditar) {
            await onEditarProyecto({ ...data, id: proyectoAEditar.id });
            setProyectoAEditar(null);
        } else {
            await onCrearProyecto(proveedor.id, data);
        }
        setModalProyecto(false);
    };

    const handleEliminar = async (id: string) => {
        await onEliminarProyecto(id);
        setConfirmEliminar(null);
    };

    const handleDescargarRecibo = async (pago: any) => {
        // Encontramos el proyecto asociado a este pago para pasar la data al PDF
        const proyectoAsociado = proyectos.find(p => p.id === pago.proyecto_proveedor_id);

        await descargarReciboPago({
            numero: `PGO-${pago.id.substring(0, 6).toUpperCase()}`,
            fecha: pago.fecha_pago,
            proveedor: {
                nombre: proveedor.nombre,
                empresa: proveedor.empresa || undefined,
                especialidad: proveedor.especialidad || undefined,
            },
            proyecto: proyectoAsociado?.nombre,
            monto: pago.monto,
            moneda: pago.moneda || 'USD',
            descripcion: pago.descripcion || 'Pago por servicios prestados',
            cuenta: 'Cuenta de Salida',
            estado: pago.estado,
        });
    };

    // Build a proveedor object for ModalPagoProveedor, scoped to the selected project
    const proveedorParaPago: Proveedor | null = proyectoParaPagar
        ? {
            ...proveedor,
            moneda: proyectoParaPagar.moneda,
            pagos_proveedor: (proyectoParaPagar.pagos_proveedor || []),
        }
        : null;

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

            {/* Centered modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-[#0D1117] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex justify-between items-start p-6 border-b border-white/10">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{proveedor.nombre}</h2>
                            {proveedor.empresa && <p className="text-sm text-gray-400">{proveedor.empresa}</p>}
                            {proveedor.especialidad && (
                                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                                    {proveedor.especialidad}
                                </span>
                            )}
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition mt-1">
                            <XMarkIcon className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Info rápida */}
                    <div className="px-6 py-3 border-b border-white/5 flex gap-6 text-xs text-gray-500">
                        {proveedor.email && <span>✉️ {proveedor.email}</span>}
                        {proveedor.telefono && <span>📞 {proveedor.telefono}</span>}
                        {proveedor.nit && <span>🪪 {proveedor.nit}</span>}
                    </div>

                    {/* KPI — agrupado por moneda de cada proyecto */}
                    {(() => {
                        const pagadoPorMoneda: Record<string, number> = {};
                        proyectos.forEach(proy => {
                            const mon = proy.moneda || 'USD';
                            const pagado = (proy.pagos_proveedor || [])
                                .filter(p => p.estado === 'pagado')
                                .reduce((s, p) => s + p.monto, 0);
                            pagadoPorMoneda[mon] = (pagadoPorMoneda[mon] || 0) + pagado;
                        });
                        const monedas = Object.keys(pagadoPorMoneda);

                        return (
                            <div className="grid grid-cols-2 gap-3 p-4 border-b border-white/5">
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-[10px] text-gray-500 uppercase">Proyectos</p>
                                    <p className="text-2xl font-bold text-white">{proyectos.length}</p>
                                </div>
                                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-center">
                                    <p className="text-[10px] text-gray-500 uppercase mb-1">Pagado</p>
                                    {monedas.length === 0 ? (
                                        <p className="text-lg font-bold text-emerald-400 font-mono">$0</p>
                                    ) : (
                                        monedas.map(mon => (
                                            <p key={mon} className="text-base font-bold text-emerald-400 font-mono leading-tight">
                                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: mon, maximumFractionDigits: 0 }).format(pagadoPorMoneda[mon])}
                                                <span className="text-[10px] ml-1 text-emerald-700">{mon}</span>
                                            </p>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Tabs */}
                    <div className="flex px-6 border-b border-white/10">
                        <button
                            onClick={() => setActiveTab("proyectos")}
                            className={`py-3 px-4 text-sm font-bold border-b-2 transition ${activeTab === "proyectos" ? "border-indigo-500 text-indigo-400" : "border-transparent text-gray-400 hover:text-white"}`}
                        >
                            Proyectos ({proyectos.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("pagos")}
                            className={`py-3 px-4 text-sm font-bold border-b-2 transition ${activeTab === "pagos" ? "border-indigo-500 text-indigo-400" : "border-transparent text-gray-400 hover:text-white"}`}
                        >
                            Historial de Pagos ({todosLosPagos.length})
                        </button>
                    </div>

                    {/* Contenido principal con Tabs */}
                    <div className="flex-1 overflow-y-auto p-6 bg-black/20 space-y-4">
                        {activeTab === "proyectos" ? (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Proyectos Activos</h3>
                                    <button
                                        onClick={() => setModalProyecto(true)}
                                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-xl transition"
                                    >
                                        <PlusIcon className="w-4 h-4" /> Nuevo
                                    </button>
                                </div>

                                {proyectos.length === 0 ? (
                                    <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-[#0D1117]/50">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <BriefcaseIcon className="w-8 h-8 text-gray-500" />
                                        </div>
                                        <h3 className="text-lg text-white font-bold">Sin proyectos</h3>
                                        <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">No hay proyectos registrados con este proveedor.</p>
                                        <button
                                            onClick={() => setModalProyecto(true)}
                                            className="mt-6 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition"
                                        >
                                            + Agregar el primero
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {proyectos.map(proy => {
                                            const pagadoProy = (proy.pagos_proveedor || [])
                                                .filter(p => p.estado === "pagado")
                                                .reduce((s, p) => s + p.monto, 0);
                                            const pct = proy.monto > 0 ? Math.min(100, Math.round((pagadoProy / proy.monto) * 100)) : 0;
                                            const fmtProy = (n: number) =>
                                                new Intl.NumberFormat("es-CO", { style: "currency", currency: proy.moneda, maximumFractionDigits: 0 }).format(n);

                                            return (
                                                <div key={proy.id} className="bg-[#161B22] border border-white/5 rounded-2xl p-5 hover:border-indigo-500/30 transition group">
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="font-bold text-white text-lg">{proy.nombre}</p>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ESTADO_STYLE[proy.estado]}`}>
                                                                    {ESTADO_LABEL[proy.estado]}
                                                                </span>
                                                            </div>
                                                            {proy.descripcion && <p className="text-sm text-gray-400 line-clamp-2">{proy.descripcion}</p>}
                                                            {proy.fecha_pago && (
                                                                <p className="text-xs text-indigo-400 bg-indigo-500/10 inline-block px-2 py-1 rounded-md mt-2">
                                                                    📅 Estimado pago: {new Date(proy.fecha_pago + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => { setProyectoAEditar(proy); setModalProyecto(true); }}
                                                                className="p-2 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition"
                                                                title="Editar proyecto"
                                                            >
                                                                <PencilIcon className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmEliminar(proy.id)}
                                                                className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition"
                                                                title="Eliminar proyecto"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Confirmar eliminación inline */}
                                                    {confirmEliminar === proy.id && (
                                                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between">
                                                            <p className="text-sm text-red-200 font-bold">¿Seguro que quieres eliminar este proyecto?</p>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => handleEliminar(proy.id)} className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition">Sí, eliminar</button>
                                                                <button onClick={() => setConfirmEliminar(null)} className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-lg transition border border-white/10">Cancelar</button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Progress & Pay Button */}
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                                        <div className="md:col-span-3 space-y-2">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-gray-400">Pagado: <span className="text-emerald-400 font-bold font-mono">{fmtProy(pagadoProy)}</span></span>
                                                                <span className="text-gray-400">Costo total: <span className="text-white font-bold font-mono">{fmtProy(proy.monto)}</span></span>
                                                            </div>
                                                            <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden border border-white/5">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-yellow-500' : 'bg-white/10'}`}
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {pct < 100 ? (
                                                            <button
                                                                onClick={() => setProyectoParaPagar(proy)}
                                                                className="w-full text-xs font-bold bg-[#0D1117] hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white py-2.5 rounded-xl transition"
                                                            >
                                                                Pagar
                                                            </button>
                                                        ) : (
                                                            <div className="w-full text-center py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                                                Liquidado
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="space-y-4">
                                {todosLosPagos.length === 0 ? (
                                    <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-[#0D1117]/50">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CurrencyDollarIcon className="w-8 h-8 text-gray-500" />
                                        </div>
                                        <h3 className="text-lg text-white font-bold">Sin pagos registrados</h3>
                                        <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">No hay historial financiero con este proveedor.</p>
                                    </div>
                                ) : (
                                    <div className="bg-[#161B22] border border-white/5 rounded-2xl overflow-hidden">
                                        {todosLosPagos.sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime()).map((pago, idx) => (
                                            <div key={pago.id} className={`flex justify-between items-center p-4 ${idx !== todosLosPagos.length - 1 ? 'border-b border-white/5' : ''}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pago.estado === 'pagado' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                        <CurrencyDollarIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-sm">{pago.descripcion || 'Pago de servicios'}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {new Date(pago.fecha_pago + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            {pago.estado === 'pendiente' && <span className="text-yellow-500 ml-2">(Pendiente)</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold font-mono ${pago.estado === 'pagado' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                                        {new Intl.NumberFormat("es-CO", { style: "currency", currency: pago.moneda || "USD", maximumFractionDigits: 0 }).format(pago.monto)}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 mb-2">{pago.moneda || 'USD'}</p>

                                                    {pago.estado === 'pagado' && (
                                                        <button
                                                            onClick={() => handleDescargarRecibo(pago)}
                                                            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition"
                                                            title="Descargar comprobante en PDF"
                                                        >
                                                            <DocumentArrowDownIcon className="w-3 h-3" /> PDF
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Notas */}
                    {proveedor.notas && (
                        <div className="bg-[#161B22] p-6 border-t border-white/5">
                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-wider flex items-center gap-1">
                                <span className="text-indigo-500">✍️</span> Notas
                            </p>
                            <p className="text-sm text-gray-300 leading-relaxed">{proveedor.notas}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sub-modales */}
            <ModalProyectoProveedor
                isOpen={modalProyecto}
                onClose={() => { setModalProyecto(false); setProyectoAEditar(null); }}
                onGuardar={handleCrearProyecto}
                proyectoEditar={proyectoAEditar || undefined}
            />

            <ModalPagoProveedor
                isOpen={!!proyectoParaPagar}
                onClose={() => setProyectoParaPagar(null)}
                proveedor={proveedorParaPago}
                montoProyecto={proyectoParaPagar?.monto}
                cuentas={cuentas}
                onRegistrar={async (pago) => {
                    await onRegistrarPago({ ...pago, proyecto_proveedor_id: proyectoParaPagar?.id });
                    setProyectoParaPagar(null);
                }}
            />
        </>
    );
}
