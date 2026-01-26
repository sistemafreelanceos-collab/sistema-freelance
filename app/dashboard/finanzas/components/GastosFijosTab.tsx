"use client";
import { useState } from "react";
// CORRECCIÓN AQUÍ: Agregamos un "../" extra al principio
import { supabase } from "../../../../lib/supabaseClient";
import { GastoFijo } from "../types";
import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/outline";

interface Props {
  gastosFijos: GastoFijo[];
  cuentas: any[];
  onOpenModal: () => void;
  onRecargar: () => void;
}

export default function GastosFijosTab({ gastosFijos, cuentas, onOpenModal, onRecargar }: Props) {
  const [pagandoId, setPagandoId] = useState<string | null>(null);

  const hoy = new Date();
  const mesActual = hoy.getMonth();
  const anioActual = hoy.getFullYear();

  // Función Mágica: Pagar Recurrente
  const pagarCuota = async (gasto: GastoFijo) => {
      const cuentaId = cuentas.length > 0 ? cuentas[0].id : null;
      
      if (!cuentaId) return alert("❌ No tienes cuentas registradas para descontar el dinero.");
      
      if (!confirm(`¿Confirmar pago de ${gasto.nombre} por $${gasto.monto}? Se descontará de tu cuenta principal.`)) return;

      setPagandoId(gasto.id);

      // 2. Registrar el Gasto en el Historial (Movimientos)
      const { error: errMov } = await supabase.from("movimientos").insert({
          owner_id: (await supabase.auth.getUser()).data.user?.id,
          tipo: "egreso",
          monto: gasto.monto,
          moneda: gasto.moneda || "USD",
          referencia: `Pago Mensual: ${gasto.nombre}`,
          categoria: gasto.categoria,
          fecha: new Date().toISOString().slice(0, 10),
          cuenta_id: cuentaId,
          fuente: 'recurrente'
      });

      if (errMov) {
          alert("Error creando movimiento: " + errMov.message);
          setPagandoId(null);
          return;
      }

      // 3. Marcar el Gasto Fijo como "Pagado Hoy"
      const { error: errUpdate } = await supabase
          .from("gastos_fijos")
          .update({ ultimo_pago: new Date().toISOString() })
          .eq("id", gasto.id);

      if (!errUpdate) {
          onRecargar(); // Refrescar la pantalla
      }
      setPagandoId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex justify-between items-center">
            <div>
                <h3 className="text-white font-bold text-xl">Gastos Recurrentes</h3>
                <p className="text-xs text-gray-400">Controla tus pagos fijos del mes.</p>
            </div>
            <button onClick={onOpenModal} className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg text-sm">+ Nuevo Fijo</button>
        </div>
        
        {gastosFijos.length === 0 ? (
            <div className="text-center p-10 border border-dashed border-white/10 rounded-xl text-gray-500">
                No tienes gastos fijos. Agrega Arriendo, Netflix, etc.
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gastosFijos.map((gf) => {
                    // Lógica para saber si ya se pagó este mes
                    let estaPagado = false;
                    if (gf.ultimo_pago) {
                        const fechaUltimo = new Date(gf.ultimo_pago);
                        // Truco zona horaria simple
                        const fechaUser = new Date(fechaUltimo.getTime() + fechaUltimo.getTimezoneOffset() * 60000);
                        if (fechaUser.getMonth() === mesActual && fechaUser.getFullYear() === anioActual) {
                            estaPagado = true;
                        }
                    }

                    return (
                        <div key={gf.id} className={`p-5 rounded-xl border transition flex flex-col justify-between gap-4 ${estaPagado ? 'bg-[#1C2128]/50 border-emerald-500/30' : 'bg-[#1C2128] border-white/10 hover:border-indigo-500/50'}`}>
                            
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className={`font-bold capitalize ${estaPagado ? 'text-emerald-400' : 'text-white'}`}>{gf.nombre}</p>
                                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400 uppercase">{gf.categoria}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">📅 Día {gf.dia_pago} de cada mes</p>
                                </div>
                                <p className="text-xl font-mono text-white font-bold">${Number(gf.monto).toLocaleString()}</p>
                            </div>

                            {/* ESTADO DEL PAGO */}
                            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                                {estaPagado ? (
                                    <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg w-full justify-center">
                                        <CheckCircleIcon className="w-5 h-5" /> ¡Pagado este mes!
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between w-full gap-3">
                                        <div className="flex items-center gap-1 text-orange-400 text-xs">
                                            <ClockIcon className="w-4 h-4" /> Pendiente
                                        </div>
                                        <button 
                                            onClick={() => pagarCuota(gf)} 
                                            disabled={pagandoId === gf.id}
                                            className="bg-white text-black text-xs font-bold px-4 py-2 rounded-lg hover:scale-105 transition shadow-lg flex-1"
                                        >
                                            {pagandoId === gf.id ? "Registrando..." : "Pagar Ahora 💸"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
}