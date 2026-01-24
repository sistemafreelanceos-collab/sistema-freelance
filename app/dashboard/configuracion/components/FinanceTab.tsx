"use client";
import { ConfigPerfil } from "../types";

interface Props {
  config: ConfigPerfil;
  setConfig: (c: ConfigPerfil) => void;
  guardar: () => void;
  saving: boolean;
}

export default function FinanceTab({ config, setConfig, guardar, saving }: Props) {
  
  // Lista ampliada de monedas globales
  const monedasDisponibles = [
    "USD", "EUR", "COP", "MXN", "ARS", "CLP", "PEN", "BRL", // Latam & US/EU
    "JPY", "GBP", "CAD", "AUD", "CNY", "CHF", "KRW"         // Global / Asia
  ];

  // Función para activar/desactivar monedas
  const toggleMoneda = (moneda: string) => {
    const current = config.monedas_activas || [];
    let updated = [];
    
    if (current.includes(moneda)) {
      // Si ya estaba, la quitamos
      updated = current.filter(m => m !== moneda);
    } else {
      // Si no estaba, la agregamos
      updated = [...current, moneda];
    }

    // Actualizamos la config
    setConfig({ ...config, monedas_activas: updated });

    // Inteligencia: Si la moneda de la meta ya no está activa, la cambiamos a la primera disponible
    if (config.meta_moneda === moneda && !updated.includes(moneda)) {
        setConfig(prev => ({ ...prev, monedas_activas: updated, meta_moneda: updated[0] || "USD" }));
    } 
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn pb-10">
      
      {/* SECCIÓN 1: MONEDAS ACTIVAS */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">💰 Monedas de Trabajo</h3>
        <p className="text-xs text-gray-400 mb-4">Selecciona todas las divisas que aceptarás en tus proyectos.</p>
        
        <div className="flex gap-2 flex-wrap">
          {monedasDisponibles.map(m => (
            <button 
              key={m} 
              onClick={() => toggleMoneda(m)} 
              className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                config.monedas_activas.includes(m) 
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]" 
                  : "bg-black/20 border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* SECCIÓN 2: METAS Y SALUD */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl space-y-6 shadow-xl">
        <h3 className="text-white font-bold flex items-center gap-2">📈 Metas & Salud</h3>
        
        {/* Meta Financiera CON SELECTOR */}
        <div>
          <label className="text-xs text-gray-400 block mb-2 font-bold uppercase">Meta Mensual de Facturación</label>
          <div className="flex gap-2">
             <div className="relative flex-1">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                 <input 
                   type="number" 
                   className="w-full bg-black/20 border border-white/10 rounded-lg p-3 pl-8 text-white text-lg font-bold focus:border-emerald-500 outline-none transition" 
                   placeholder="0.00"
                   value={config.meta_mensual} 
                   onChange={e => setConfig({...config, meta_mensual: Number(e.target.value)})} 
                 />
             </div>
             
             {/* Selector de Moneda para la Meta */}
             <select 
                value={config.meta_moneda}
                onChange={e => setConfig({...config, meta_moneda: e.target.value})}
                className="bg-black/20 border border-white/10 rounded-lg px-4 text-white font-bold text-sm focus:border-emerald-500 outline-none cursor-pointer"
             >
                {config.monedas_activas.map(m => (
                    <option key={m} value={m} className="bg-[#161B22] text-white">{m}</option>
                ))}
                {config.monedas_activas.length === 0 && <option value="USD" className="bg-[#161B22]">USD</option>}
             </select>
          </div>
          <p className="text-[10px] text-gray-500 mt-2">
             El sistema usará {config.meta_moneda} para medir tu progreso en el tablero principal.
          </p>
        </div>

        {/* Límite de Horas */}
        <div className="border-t border-white/5 pt-4">
          <label className="text-xs text-gray-400 block mb-2 font-bold uppercase">Límite de Horas Diarias (Anti-Burnout)</label>
          <div className="flex items-center gap-3">
            <input 
              type="number" 
              className="w-24 bg-black/20 border border-white/10 rounded-lg p-3 text-white text-lg font-bold text-center focus:border-red-500 outline-none transition" 
              value={config.limite_horas_diario} 
              onChange={e => setConfig({...config, limite_horas_diario: Number(e.target.value)})} 
            />
            <span className="text-gray-500 text-sm font-medium">Horas / día máximo</span>
          </div>
        </div>
      </div>

      <div className="col-span-full flex justify-end mt-4 border-t border-white/5 pt-6">
        <button 
          onClick={guardar} 
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-emerald-900/20 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? "Guardando..." : "💾 Guardar Finanzas"}
        </button>
      </div>
    </div>
  );
}