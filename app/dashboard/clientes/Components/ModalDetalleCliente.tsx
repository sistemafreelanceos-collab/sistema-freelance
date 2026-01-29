"use client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { XMarkIcon, BriefcaseIcon, BanknotesIcon, InformationCircleIcon } from "@heroicons/react/24/solid";
import { Cliente, Proyecto } from "../../../../types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    cliente: Cliente | null;
}

export default function ModalDetalleCliente({ isOpen, onClose, cliente }: Props) {
    const [tab, setTab] = useState<'proyectos' | 'pagos' | 'info'>('proyectos');

    if (!cliente) return null;

    // Calcular totales generales
    const totalProyectos = cliente.proyectos?.length || 0;
    const totalPagadoHistorico = cliente.pagos_cliente?.reduce((sum, p) => sum + p.monto, 0) || 0;

    // Obtener lista plana de todos los pagos de todos los proyectos + pagos sueltos del cliente
    // A veces los pagos están en cliente.pagos_cliente (si son directos) o en proyectos.pagos_cliente
    // Pero en useClientes.ts parece que 'pagos_cliente' en el objeto cliente NO incluye los de proyectos anidados por defecto en la query simple,
    // PERO en cargarDatos se hace un map complejo. Asumiremos que 'proyectos' tiene sus pagos.
    // Vamos a consolidar todos los pagos para la pestaña "Historial".

    // Consolidar pagos:
    // 1. Pagos Directos: Aquellos en cliente.pagos_cliente que NO tienen proyecto_id (para evitar duplicados)
    const pagosDirectos = (cliente.pagos_cliente || [])
        .filter((p: any) => !p.proyecto_id)
        .map((p: any) => ({
            ...p,
            origen: "Directo",
            // Aseguramos que tenemos los campos base aunque vengan de la query simple
            fecha_pago: p.fecha_pago,
            monto: p.monto,
            referencia: p.referencia
        }));

    // 2. Pagos de Proyectos: Extraídos de la estructura anidada de proyectos
    const pagosProyectos = (cliente.proyectos?.flatMap(proj =>
        proj.pagos_cliente?.map((p: any) => ({
            ...p,
            origen: `Proyecto: ${proj.nombre}`,
            fecha_pago: p.fecha_pago,
            monto: p.monto,
            referencia: p.referencia
        })) || []
    ) || []);

    const todosLosPagos = [
        ...pagosDirectos,
        ...pagosProyectos
    ].sort((a, b) => new Date(b.fecha_pago || 0).getTime() - new Date(a.fecha_pago || 0).getTime());


    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-[#0D1117] border border-white/10 p-6 text-left align-middle shadow-xl transition-all">

                                {/* Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-black border-2 border-white/10 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                            {cliente.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <Dialog.Title as="h3" className="text-2xl font-bold text-white leading-tight">
                                                {cliente.nombre}
                                            </Dialog.Title>
                                            <p className="text-emerald-400 font-mono text-sm uppercase tracking-wide">{cliente.empresa || "Cliente Particular"}</p>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition">
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Stats Rápidos */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Total Pagado</p>
                                        <p className="text-xl font-bold text-emerald-400 font-mono">${todosLosPagos.reduce((s, p) => s + p.monto, 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Proyectos</p>
                                        <p className="text-xl font-bold text-white">{totalProyectos}</p>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Estado</p>
                                        <p className={`text-xl font-bold ${cliente.estado === 'activo' ? 'text-blue-400' : 'text-gray-400'}`}>{cliente.estado.toUpperCase()}</p>
                                    </div>
                                </div>

                                {/* Tabs Navigation */}
                                <div className="flex gap-2 border-b border-white/10 mb-6">
                                    <button onClick={() => setTab('proyectos')} className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${tab === 'proyectos' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                                        <BriefcaseIcon className="w-4 h-4" /> Proyectos
                                    </button>
                                    <button onClick={() => setTab('pagos')} className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${tab === 'pagos' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                                        <BanknotesIcon className="w-4 h-4" /> Historial de Pagos
                                    </button>
                                    <button onClick={() => setTab('info')} className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${tab === 'info' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                                        <InformationCircleIcon className="w-4 h-4" /> Info Cliente
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar pr-2">

                                    {tab === 'proyectos' && (
                                        <div className="space-y-3">
                                            {cliente.proyectos?.length === 0 ? (
                                                <p className="text-gray-500 text-center py-10">Sin proyectos registrados.</p>
                                            ) : (
                                                cliente.proyectos?.map(p => {
                                                    const pagado = p.pagos_cliente?.reduce((s, x) => s + x.monto, 0) || 0;
                                                    const porcentaje = Math.min((pagado / (p.monto || 1)) * 100, 100);

                                                    return (
                                                        <div key={p.id} className="bg-black/20 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-black/40 transition">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-1">
                                                                    <div className={`w-2 h-2 rounded-full ${p.estado === 'finalizado' ? 'bg-emerald-500' : p.estado === 'pendiente' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                                                    <h4 className="font-bold text-white">{p.nombre}</h4>
                                                                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400 uppercase">{p.estado}</span>
                                                                </div>
                                                                <div className="w-full max-w-sm h-1.5 bg-gray-700/50 rounded-full mt-2 overflow-hidden">
                                                                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${porcentaje}%` }}></div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-white font-mono font-bold">${p.monto.toLocaleString()} {p.moneda}</p>
                                                                <p className="text-xs text-gray-500">Pagado: <span className="text-emerald-400">${pagado.toLocaleString()}</span></p>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    )}

                                    {tab === 'pagos' && (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="text-gray-500 text-xs uppercase border-b border-white/10">
                                                        <th className="py-3 px-4">Fecha</th>
                                                        <th className="py-3 px-4">Referencia / Concepto</th>
                                                        <th className="py-3 px-4">Origen</th>
                                                        <th className="py-3 px-4 text-right">Monto</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm">
                                                    {todosLosPagos.length === 0 ? (
                                                        <tr><td colSpan={4} className="text-center py-8 text-gray-500">No hay pagos registrados.</td></tr>
                                                    ) : (
                                                        todosLosPagos.map((p, i) => (
                                                            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                                                                <td className="py-3 px-4 text-gray-300">{p.fecha_pago || "--/--/--"}</td>
                                                                <td className="py-3 px-4 text-white font-medium">{p.referencia || "Sin referencia"}</td>
                                                                <td className="py-3 px-4 text-gray-400 text-xs">{p.origen}</td>
                                                                <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">+${p.monto.toLocaleString()}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {tab === 'info' && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Email</label>
                                                    <p className="text-white bg-white/5 p-3 rounded-xl border border-white/5 select-all">{cliente.email || "No registrado"}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Teléfono</label>
                                                    <p className="text-white bg-white/5 p-3 rounded-xl border border-white/5 select-all">{cliente.telefono || "No registrado"}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Notas Internas</label>
                                                    <p className="text-gray-300 bg-white/5 p-4 rounded-xl border border-white/5 whitespace-pre-wrap">{cliente.nota || "Sin notas adicionales."}</p>
                                                </div>

                                                {cliente.proximo_pago && (
                                                    <div>
                                                        <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Próximo Pago Recurrente</label>
                                                        <p className="text-emerald-400 font-bold bg-emerald-900/20 p-3 rounded-xl border border-emerald-500/20">
                                                            {cliente.proximo_pago}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                </div>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
