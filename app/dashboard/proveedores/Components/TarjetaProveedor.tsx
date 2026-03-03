"use client";
import { Proveedor } from "../../../../types/proveedores";
import { PencilIcon, TrashIcon, BriefcaseIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";

interface Props {
    proveedor: Proveedor;
    onClick: (p: Proveedor) => void;
    onEditar: (p: Proveedor) => void;
    onEliminar: (id: string) => void;
}

export default function TarjetaProveedor({ proveedor, onClick, onEditar, onEliminar }: Props) {
    const proyectos = proveedor.proyectos_proveedor || [];
    const proyectosActivos = proyectos.filter(p => p.estado !== "completado");

    const pagosAnteriores = (proveedor.pagos_proveedor || []).filter(p => p.estado === "pagado");
    const totalPagado = pagosAnteriores.reduce((s, p) => s + p.monto, 0);

    return (
        <div
            className="bg-[#161B22] border border-white/5 rounded-2xl p-6 flex flex-col hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all group cursor-pointer relative overflow-hidden"
            onClick={() => onClick(proveedor)}
        >
            {/* Decoration accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full -z-0 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Header */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-bold text-white text-xl truncate">{proveedor.nombre}</h3>
                    {proveedor.empresa ? (
                        <p className="text-sm text-gray-400 truncate">{proveedor.empresa}</p>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Freelance / Independiente</p>
                    )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => onEditar(proveedor)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                    >
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onEliminar(proveedor.id)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Especialidad Badge */}
            {proveedor.especialidad && (
                <div className="mb-5">
                    <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                        {proveedor.especialidad}
                    </span>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1 text-gray-400">
                        <BriefcaseIcon className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Proyectos</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-bold text-white">{proyectos.length}</span>
                        {proyectosActivos.length > 0 && (
                            <span className="text-[10px] text-blue-400 font-medium">({proyectosActivos.length} activos)</span>
                        )}
                    </div>
                </div>

                <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10">
                    <div className="flex items-center gap-1.5 mb-1 text-emerald-500/70">
                        <CurrencyDollarIcon className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Total Pagado</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-bold text-emerald-400 font-mono">
                            {new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 }).format(totalPagado)}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold">{proveedor.moneda || "USD"}</span>
                    </div>
                </div>
            </div>

            {/* Contact Footer */}
            <div className="mt-auto pt-4 border-t border-white/5 flex gap-4 text-xs text-gray-500">
                {proveedor.email && (
                    <span className="flex items-center gap-1.5 truncate">
                        ✉️ <span className="truncate">{proveedor.email}</span>
                    </span>
                )}
                {proveedor.telefono && (
                    <span className="flex items-center gap-1.5 truncate flex-shrink-0">
                        📞 {proveedor.telefono}
                    </span>
                )}
            </div>
        </div>
    );
}
