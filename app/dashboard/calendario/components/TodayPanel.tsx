"use client";
import { useMemo } from "react";
import { CalendarDaysIcon, BanknotesIcon, ClockIcon } from "@heroicons/react/24/solid";

interface Props {
    eventos: any[];
    proyectosRaw: any[];
    pagosProveedores?: any[]; // proyectos_proveedor con fecha_pago
}

function fmt(n: number, mon = "USD") {
    return new Intl.NumberFormat("es-CO", {
        style: "currency", currency: mon, maximumFractionDigits: 0,
    }).format(n);
}

const HOY = new Date();
HOY.setHours(0, 0, 0, 0);

function diffDias(fechaStr: string) {
    const d = new Date(fechaStr + "T12:00:00");
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - HOY.getTime()) / 86400000);
}

export default function TodayPanel({ eventos, proyectosRaw, pagosProveedores = [] }: Props) {
    const hoyStr = `${HOY.getFullYear()}-${String(HOY.getMonth() + 1).padStart(2, "0")}-${String(HOY.getDate()).padStart(2, "0")}`;

    // ── Tareas de hoy ──────────────────────────────────────────────────
    const tareasHoy = useMemo(() =>
        eventos.filter(ev => {
            if (ev.resource?.tipo_evento !== "tarea") return false;
            try {
                return new Date(ev.start).toDateString() === HOY.toDateString();
            } catch { return false; }
        }),
        [eventos]
    );

    // ── Capacidad del día ──────────────────────────────────────────────
    const horasCargadas = useMemo(() => {
        return tareasHoy
            .filter(ev => !ev.allDay && ev.start && ev.end)
            .reduce((acc, ev) => {
                return acc + (new Date(ev.end).getTime() - new Date(ev.start).getTime()) / 3600000;
            }, 0);
    }, [tareasHoy]);

    const pct = Math.min(100, Math.round((horasCargadas / 8) * 100));
    const cargaColor = pct < 50 ? "bg-emerald-500" : pct < 88 ? "bg-yellow-500" : "bg-red-500";
    const cargaLabel = pct < 50 ? "Ligero 🌿" : pct < 88 ? "Productivo ⚡" : "Saturado 🔥";

    // ── Próximos cobros urgentes (clientes) ───────────────────────────
    const cobrosUrgentes = useMemo(() => {
        return proyectosRaw
            .filter(p => p.estado !== "finalizado")
            .map(p => {
                const pagado = (p.pagos_cliente || []).reduce((s: number, pg: any) => s + pg.monto, 0);
                if (pagado >= p.monto && p.monto > 0 && (p.frecuencia_pago || "unidad") === "unidad") return null;
                const fecha = p.fecha_fin || p.fecha_inicio;
                if (!fecha) return null;
                const dias = diffDias(fecha);
                if (dias > 14 || dias < -7) return null;
                return { id: p.id, nombre: p.nombre, cliente: p.cliente?.nombre || "—", monto: p.monto - pagado, moneda: p.moneda || "USD", dias, tipo: "cobro" as const };
            })
            .filter(Boolean)
            .sort((a: any, b: any) => a.dias - b.dias)
            .slice(0, 3) as any[];
    }, [proyectosRaw]);

    // ── Próximos pagos proveedores urgentes ───────────────────────────
    const pagosUrgentes = useMemo(() => {
        return pagosProveedores
            .filter(p => p.fecha_pago)
            .map(p => {
                const dias = diffDias(p.fecha_pago);
                if (dias > 14 || dias < -7) return null;
                return { id: p.id, nombre: p.nombre, cliente: "Proveedor", monto: p.monto, moneda: p.moneda || "USD", dias, tipo: "proveedor" as const };
            })
            .filter(Boolean)
            .sort((a: any, b: any) => a.dias - b.dias)
            .slice(0, 3) as any[];
    }, [pagosProveedores]);

    const todosPagos = [...cobrosUrgentes, ...pagosUrgentes].sort((a, b) => a.dias - b.dias).slice(0, 5);

    const diasLabel = (d: number) => {
        if (d < 0) return { text: `Venció hace ${Math.abs(d)}d`, cls: "text-red-400" };
        if (d === 0) return { text: "¡HOY!", cls: "text-yellow-400 animate-pulse font-black" };
        if (d <= 3) return { text: `En ${d} día${d > 1 ? "s" : ""}`, cls: "text-red-400" };
        if (d <= 7) return { text: `En ${d} días`, cls: "text-orange-400" };
        return { text: `En ${d} días`, cls: "text-gray-400" };
    };

    return (
        <div className="flex flex-col gap-4 p-4">
            {/* Capacidad del día */}
            <div className="bg-[#161B22] border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Hoy · {HOY.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "short" })}
                        </p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-300 bg-white/5 px-2 py-0.5 rounded-full">{cargaLabel}</span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold text-white">{horasCargadas.toFixed(1)}h</span>
                    <span className="text-gray-500 text-xs">/ 8h agendadas</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${cargaColor}`} style={{ width: `${pct}%` }} />
                </div>
            </div>

            {/* Tareas de hoy */}
            <div className="bg-[#161B22] border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <CalendarDaysIcon className="w-4 h-4 text-indigo-400" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tareas de Hoy</p>
                    {tareasHoy.length > 0 && (
                        <span className="ml-auto bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {tareasHoy.length}
                        </span>
                    )}
                </div>
                {tareasHoy.length === 0 ? (
                    <p className="text-gray-600 text-xs text-center py-3">🎉 Sin tareas hoy</p>
                ) : (
                    <div className="space-y-2">
                        {tareasHoy.slice(0, 4).map((ev: any) => (
                            <div key={ev.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ev.resource?.completada ? "bg-emerald-400" : "bg-indigo-400"}`} />
                                <p className={`text-xs font-bold flex-1 truncate ${ev.resource?.completada ? "line-through text-gray-600" : "text-white"}`}>
                                    {ev.title}
                                </p>
                                {ev.start && !ev.allDay && (
                                    <span className="text-[10px] text-gray-500 flex-shrink-0">
                                        {new Date(ev.start).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                )}
                            </div>
                        ))}
                        {tareasHoy.length > 4 && (
                            <p className="text-[10px] text-gray-500 text-center">+{tareasHoy.length - 4} más…</p>
                        )}
                    </div>
                )}
            </div>

            {/* Próximos pagos urgentes */}
            {todosPagos.length > 0 && (
                <div className="bg-[#161B22] border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <BanknotesIcon className="w-4 h-4 text-yellow-400" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pagos Próximos</p>
                    </div>
                    <div className="space-y-2">
                        {todosPagos.map((p: any) => {
                            const { text, cls } = diasLabel(p.dias);
                            return (
                                <div key={p.id + p.tipo} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`text-lg flex-shrink-0 ${p.tipo === "cobro" ? "text-emerald-400" : "text-orange-400"}`}>
                                            {p.tipo === "cobro" ? "💰" : "💸"}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{p.nombre}</p>
                                            <p className={`text-[10px] ${cls}`}>{text}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold font-mono text-white ml-2 flex-shrink-0">
                                        {fmt(p.monto, p.moneda)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
