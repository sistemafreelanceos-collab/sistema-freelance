"use client";
import { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { GastoFijo, Movimiento } from "../../../../types";
import { CheckCircleIcon, ClockIcon, PencilIcon, TrashIcon, CalendarDaysIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { ModalPagarGasto } from "./ModalesFinanzas";
import { useWorkspace } from "../../../providers/WorkspaceProvider";

interface Props {
    gastosFijos: GastoFijo[];
    cuentas: any[];
    movimientos: Movimiento[];
    onOpenModal: () => void;
    onRecargar: () => void;
    onEdit: (gasto: GastoFijo) => void;
    onDelete: (id: string) => void;
    onSelect: (gasto: GastoFijo) => void;
}

export default function GastosFijosTab({ gastosFijos, cuentas, movimientos, onOpenModal, onRecargar, onEdit, onDelete, onSelect }: Props) {
    const { currentWorkspace } = useWorkspace();
    const [pagandoId, setPagandoId] = useState<string | null>(null);
    const [gastoAPagar, setGastoAPagar] = useState<GastoFijo | null>(null);

    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    // Función para determinar estado del gasto
    const getEstadoGasto = (gasto: GastoFijo) => {
        // 1. Verificar si ya se pagó
        const fechaUltimo = gasto.ultimo_pago ? new Date(gasto.ultimo_pago) : null;
        const pagadoPorCampo = fechaUltimo &&
            fechaUltimo.getMonth() === mesActual &&
            fechaUltimo.getFullYear() === anioActual;

        const pagadoPorMovimiento = movimientos.some(m => {
            // Buscamos en 'descripcion' (nuevo) o 'referencia' (viejo)
            const textoMovimiento = ((m as any).descripcion || m.referencia || "").toLowerCase();
            return (
                m.tipo === 'egreso' &&
                textoMovimiento.includes(gasto.nombre.toLowerCase()) &&
                new Date(m.fecha).getMonth() === mesActual &&
                new Date(m.fecha).getFullYear() === anioActual
            );
        });

        if (pagadoPorCampo || pagadoPorMovimiento) return { estado: 'pagado', texto: '¡Pagado!', dias: 0 };

        // 2. Lógica temporal
        const diaHoy = hoy.getDate();
        const fechaCreacion = gasto.created_at ? new Date(gasto.created_at) : new Date(0);

        // Si el gasto se creó ESTE mes y DESPUÉS del día de pago, no exigimos el pago de este mes.
        const esNuevoEsteMes = fechaCreacion.getMonth() === mesActual &&
            fechaCreacion.getFullYear() === anioActual &&
            fechaCreacion.getDate() > gasto.dia_pago;

        if (diaHoy > gasto.dia_pago && !esNuevoEsteMes) {
            // Vencido real
            const diasVencido = diaHoy - gasto.dia_pago;
            return { estado: 'vencido', texto: `Vencido hace ${diasVencido} días`, dias: diasVencido };
        }

        // 3. Pendiente
        let targetFecha = new Date(anioActual, mesActual, gasto.dia_pago);
        if (diaHoy > gasto.dia_pago || esNuevoEsteMes) {
            targetFecha = new Date(anioActual, mesActual + 1, gasto.dia_pago);
        }

        const diffTime = Math.abs(targetFecha.getTime() - hoy.getTime());
        const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return { estado: 'pendiente', texto: diasRestantes === 0 ? 'Vence hoy' : `Vence en ${diasRestantes} días`, dias: diasRestantes };
    };

    const getProximaFecha = (diaPago: number, yaPagado: boolean) => {
        const fechaActual = new Date();
        let fechaPago = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), diaPago);

        // Si hoy ya pasó el día de pago O SI YA ESTÁ PAGADO este mes, mostramos el siguiente
        if (fechaActual.getDate() > diaPago || yaPagado) {
            fechaPago = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, diaPago);
        }
        return fechaPago.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const abrirModalPago = (e: any, gasto: GastoFijo) => {
        e.stopPropagation();
        setGastoAPagar(gasto);
    };

    const handleConfirmarPago = async (cuentaId: string) => {
        if (!gastoAPagar) return;

        // 1. Validar Fondos
        const movimientosCuenta = movimientos.filter(m => m.cuenta_id === cuentaId);
        const saldoDisponible = movimientosCuenta.reduce((acc, m) => m.tipo === 'ingreso' ? acc + m.monto : acc - m.monto, 0);

        // Opcional: Puedes quitar esta validación si prefieres permitir saldo negativo
        /*
        if (saldoDisponible < gastoAPagar.monto) {
            toast.error(`❌ Fondos insuficientes. saldo: $${saldoDisponible}`);
            return;
        }
        */

        setPagandoId(gastoAPagar.id);

        try {
            // 🟢 CORRECCIÓN: Insertar solo en columnas existentes
            const { error: errMov } = await supabase.from("movimientos").insert({
                workspace_id: currentWorkspace?.id,
                tipo: "gasto", // 🟢 CAMBIO: De "egreso" a "gasto"
                monto: gastoAPagar.monto,
                moneda: gastoAPagar.moneda || "USD",
                descripcion: `Pago Mensual: ${gastoAPagar.nombre}`, // Usamos descripcion
                categoria: gastoAPagar.categoria,
                fecha: new Date().toISOString().slice(0, 10),
                cuenta_id: cuentaId
                // Eliminados: owner_id, fuente, referencia
            });

            if (!errMov) {
                // Actualizamos el gasto fijo para marcarlo como pagado
                await supabase.from("gastos_fijos").update({ ultimo_pago: new Date().toISOString() }).eq("id", gastoAPagar.id);

                toast.success("Pago registrado correctamente");
                setGastoAPagar(null); // Cerramos el modal solo si fue exitoso
                onRecargar();
            } else {
                console.error("Error Supabase:", errMov);
                toast.error("Error al registrar el pago: " + errMov.message);
            }
        } catch (error) {
            console.error("Error General:", error);
            toast.error("Error inesperado al procesar el pago");
        } finally {
            setPagandoId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-white font-bold text-xl">Gastos Recurrentes</h3>
                    <p className="text-xs text-gray-400">Control de pagos mensuales.</p>
                </div>
                <button onClick={onOpenModal} className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg text-sm shadow-lg hover:bg-indigo-500 transition">+ Nuevo Fijo</button>
            </div>

            {gastosFijos.length === 0 ? (
                <div className="text-center p-10 border border-dashed border-white/10 rounded-xl text-gray-500">
                    No tienes gastos fijos registrados.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gastosFijos.map((gf) => {
                        const { estado, texto, dias } = getEstadoGasto(gf);
                        const esVencido = estado === 'vencido';
                        const esPagado = estado === 'pagado';
                        const cuentaAsociada = cuentas.find(c => c.id === gf.cuenta_id);

                        return (
                            <div
                                key={gf.id}
                                onClick={() => onSelect(gf)}
                                className={`p-5 rounded-xl border transition flex flex-col justify-between gap-4 relative cursor-pointer group 
                                ${esPagado ? 'bg-[#1C2128]/50 border-emerald-500/30' :
                                        esVencido ? 'bg-red-900/10 border-red-500/50 hover:bg-red-900/20' :
                                            'bg-[#1C2128] border-white/10 hover:border-indigo-500/50 hover:bg-white/5'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className={`font-bold capitalize ${esPagado ? 'text-emerald-400' : esVencido ? 'text-red-400' : 'text-white'}`}>{gf.nombre}</p>
                                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400 uppercase">{gf.categoria}</span>
                                        </div>
                                        <p className="text-xs text-indigo-300 mt-1 flex items-center gap-1">
                                            <CalendarDaysIcon className="w-3 h-3" />
                                            <span className="capitalize">{getProximaFecha(gf.dia_pago, esPagado)}</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => onEdit(gf)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition"><PencilIcon className="w-4 h-4" /></button>
                                        <button onClick={() => onDelete(gf.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xl font-mono text-white font-bold">${Number(gf.monto).toLocaleString()} <span className="text-[10px] text-gray-500">{gf.moneda || 'USD'}</span></p>

                                    {cuentaAsociada ? (
                                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            Via: <span className="text-emerald-400 font-bold">{cuentaAsociada.nombre}</span>
                                        </p>
                                    ) : (
                                        <p className="text-[10px] text-gray-500 mt-1 italic">
                                            Paga desde cuenta principal
                                        </p>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                                    {esPagado ? (
                                        <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg w-full justify-center">
                                            <CheckCircleIcon className="w-5 h-5" /> {texto}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between w-full gap-3">
                                            <div className={`flex items-center gap-1 text-xs font-bold ${esVencido ? 'text-red-400 animate-pulse' : 'text-orange-400'}`}>
                                                {esVencido ? <ExclamationTriangleIcon className="w-4 h-4" /> : <ClockIcon className="w-4 h-4" />}
                                                {texto}
                                            </div>
                                            <button onClick={(e) => abrirModalPago(e, gf)} disabled={pagandoId === gf.id} className="bg-white text-black text-xs font-bold px-4 py-2 rounded-lg hover:scale-105 transition shadow-lg flex-1">
                                                {pagandoId === gf.id ? "..." : "Pagar"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ModalPagarGasto
                isOpen={!!gastoAPagar}
                onClose={() => setGastoAPagar(null)}
                onConfirm={handleConfirmarPago}
                gasto={gastoAPagar}
                cuentas={cuentas}
            />
        </div>
    );
}