"use client";
import { Cliente, EstadoProyecto, Proyecto } from "../../../../types";
import { supabase } from "../../../../lib/supabaseClient";

interface Props {
  cliente: Cliente;
  onEliminarCliente: (id: string) => void;
  onEliminarProyecto: (projId: string, clienteId: string) => void;
  onOpenProyecto: (c: Cliente) => void;
  onUpdateClienteLocal: (c: Cliente) => void;
  onVerDetalleProyecto: (p: Proyecto, c: Cliente) => void;
  onOpenPago: (c: Cliente) => void;
  onVerCliente: (c: Cliente) => void;
}

const STATUS_COLORS: Record<EstadoProyecto, string> = {
  pendiente: "bg-red-500",
  en_progreso: "bg-yellow-500",
  revision: "bg-blue-500",
  finalizado: "bg-emerald-500"
};

const FREQ_LABELS: Record<string, string> = {
  unidad: "Único",
  mensual: "Mensual",
  quincenal: "Quincenal",
  semanal: "Semanal"
};

export default function TarjetaCliente({ cliente, onEliminarCliente, onEliminarProyecto, onOpenProyecto, onUpdateClienteLocal, onVerDetalleProyecto, onVerCliente }: Props) {

  const rotarEstado = async (p: Proyecto, e: React.MouseEvent) => {
    e.stopPropagation();
    const estados: EstadoProyecto[] = ["pendiente", "en_progreso", "revision", "finalizado"];
    const nextState = estados[(estados.indexOf(p.estado) + 1) % estados.length];

    await supabase.from("proyectos").update({ estado: nextState }).eq("id", p.id);
    const nuevosProyectos = cliente.proyectos?.map(proj => proj.id === p.id ? { ...proj, estado: nextState } : proj);
    onUpdateClienteLocal({ ...cliente, proyectos: nuevosProyectos });
  };

  const formatDateShort = (f?: string) => {
    if (!f) return "--/--";
    const [y, m, d] = f.split('-');
    return `${d}/${m}`;
  };

  // Función INTELIGENTE para el estado de la fecha
  const getFechaStatus = (fechaStr?: string, estaPagado: boolean = false, frecuencia: string = "unidad") => {
    if (!fechaStr) return { label: "📅 ", class: "text-gray-400" };

    // 1. CASO PAGADO (Prioridad)
    if (estaPagado) {
      // Si es recurrente, la fecha ya se movió al futuro, así que es el "Próximo Pago"
      if (frecuencia !== "unidad") {
        return { label: "Próx. Pago: ", class: "text-blue-300 font-medium" };
      }
      // Si es pago único, ya finalizó el cobro
      return { label: "✅ Pagado: ", class: "text-emerald-400 font-bold" };
    }

    // 2. CASO PENDIENTE (Alertas)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [y, m, d] = fechaStr.split('-').map(Number);
    const fechaPago = new Date(y, m - 1, d);

    const diffTime = fechaPago.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: "🚨 VENCIDA: ", class: "text-red-500 font-extrabold animate-pulse" };
    }
    if (diffDays <= 3) {
      return { label: "⚠️ Por Vencer: ", class: "text-yellow-400 font-bold" };
    }

    // Si falta mucho y no está pagado
    return { label: "Próx. Pago: ", class: "text-gray-400" };
  };

  const projectCount = cliente.proyectos?.length || 0;

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:border-emerald-500/30 transition group shadow-xl flex flex-col justify-between relative">

      <button onClick={(e) => { e.stopPropagation(); onEliminarCliente(cliente.id); }} className="absolute top-4 right-4 text-gray-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition z-10">🗑️</button>

      <div>
        <div
          onClick={() => onVerCliente(cliente)}
          className="flex items-center gap-3 mb-5 cursor-pointer group/header hover:bg-white/5 p-2 -m-2 rounded-xl transition"
          title="Ver detalles del cliente"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-black border border-white/10 flex items-center justify-center font-bold text-white group-hover/header:scale-110 transition shadow-lg">
            {cliente.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white leading-tight group-hover/header:text-emerald-400 transition">{cliente.nombre}</h3>
            <p className="text-xs text-gray-400">{cliente.empresa || "Particular"}</p>
          </div>
          <div className="opacity-0 group-hover/header:opacity-100 text-gray-500">
            ℹ️
          </div>
        </div>

        {projectCount > 0 ? (
          <div className="space-y-3 mb-4 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {cliente.proyectos?.map(p => {
              const pagado = p.pagos_cliente?.reduce((sum, pago) => sum + pago.monto, 0) || 0;
              const porcentajePago = Math.min((pagado / (p.monto || 1)) * 100, 100);
              const estaPagado = pagado >= p.monto && p.monto > 0;
              const freq = FREQ_LABELS[p.frecuencia_pago || "unidad"] || "Único";

              // Calculamos el estado con la nueva lógica
              const fechaStatus = getFechaStatus(p.fecha_inicio, estaPagado, p.frecuencia_pago);

              return (
                <div
                  key={p.id}
                  onClick={() => onVerDetalleProyecto(p, cliente)}
                  className={`p-3 rounded-xl border transition cursor-pointer relative overflow-hidden flex-shrink-0 ${estaPagado ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                >
                  <div className="flex justify-between items-center mb-2 relative z-10">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <button onClick={(e) => rotarEstado(p, e)} className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[p.estado]} border border-white/20 shadow-sm flex-shrink-0 hover:scale-125 transition`} />
                      <span className="text-gray-200 truncate text-xs font-bold">{p.nombre}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 bg-black/30 px-1.5 rounded">{freq}</span>
                  </div>

                  {/* Fila 2: Fechas INTELIGENTES */}
                  <div className="flex justify-between text-[10px] mb-2 relative z-10">
                    <span className={`${fechaStatus.class} transition-colors`}>
                      {fechaStatus.label}{formatDateShort(p.fecha_inicio)}
                    </span>
                    {p.entregables_totales > 0 && <span className="text-gray-400">📦 {p.entregables_listos}/{p.entregables_totales}</span>}
                  </div>

                  {/* Fila 3: Barra de Progreso */}
                  <div className="relative z-10">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className={estaPagado ? "text-emerald-400 font-bold" : "text-gray-400"}>
                        {estaPagado ? "✅ Al día" : `Abonado: $${pagado.toLocaleString()} ${p.moneda}`}
                      </span>
                      <span className="text-white font-mono font-bold">${p.monto.toLocaleString()} {p.moneda}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${estaPagado ? "bg-emerald-500" : "bg-yellow-500"}`} style={{ width: `${porcentajePago}%` }}></div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-white/5 rounded-xl text-xs text-gray-600">Sin proyectos activos</div>
        )}
      </div>

      <div className="mt-2 pt-3 border-t border-white/5">
        <button onClick={() => onOpenProyecto(cliente)} className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg py-3 text-xs font-bold transition flex justify-center gap-2">
          ⚡ Agregar Proyecto
        </button>
      </div>
    </div>
  );
}