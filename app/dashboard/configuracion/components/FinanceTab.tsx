"use client";

import React from "react";
import { ConfigPerfil } from "../../../../types"; // <--- IMPORTAMOS EL TIPO OFICIAL
import { toast } from "sonner";

// Eliminamos la definición local de ConfigPerfil y Moneda para usar la global o inferencia
type Moneda = "USD" | "COP" | "EUR" | "MXN" | "ARS" | "BRL" | "CLP" | "PEN" | "VES" | "BOB" | "PYG" | "UYU" | "GBP" | "CAD" | "AUD";
const ALL_MONEDAS: { code: Moneda; flag: string; name: string }[] = [
  { code: "USD", flag: "🇺🇸", name: "Dólar EE.UU." },
  { code: "COP", flag: "🇨🇴", name: "Peso Colombiano" },
  { code: "EUR", flag: "🇪🇺", name: "Euro" },
  { code: "MXN", flag: "🇲🇽", name: "Peso Mexicano" },
  { code: "ARS", flag: "🇦🇷", name: "Peso Argentino" },
  { code: "BRL", flag: "🇧🇷", name: "Real Brasileño" },
  { code: "CLP", flag: "🇨🇱", name: "Peso Chileno" },
  { code: "PEN", flag: "🇵🇪", name: "Sol Peruano" },
  { code: "VES", flag: "🇻🇪", name: "Bolívar Venezolano" },
  { code: "BOB", flag: "🇧🇴", name: "Boliviano" },
  { code: "PYG", flag: "🇵🇾", name: "Guaraní Paraguayo" },
  { code: "UYU", flag: "🇺🇾", name: "Peso Uruguayo" },
  { code: "GBP", flag: "🇬🇧", name: "Libra Esterlina" },
  { code: "CAD", flag: "🇨🇦", name: "Dólar Canadiense" },
  { code: "AUD", flag: "🇦🇺", name: "Dólar Australiano" },
];

type Props = {
  config: ConfigPerfil;
  setConfig: React.Dispatch<React.SetStateAction<ConfigPerfil>>;
  guardar?: () => Promise<void>; // Opcional si lo usas
  saving?: boolean; // Opcional
};

export default function FinanceTab({ config, setConfig, guardar, saving }: Props) {
  const toggleMoneda = (moneda: string) => {
    setConfig((prev) => {
      const currentList = prev.monedas_activas || [];
      const already = currentList.includes(moneda);

      // Evitar quedarte con 0 monedas activas
      if (already && currentList.length === 1) {
        return prev;
      }

      const updated = already
        ? currentList.filter((m) => m !== moneda)
        : [...currentList, moneda];

      // Si la moneda de la meta queda desactivada, se reasigna
      const metaNueva =
        prev.meta_moneda === moneda && !updated.includes(moneda)
          ? (updated[0] ?? "USD")
          : prev.meta_moneda;

      return {
        ...prev,
        monedas_activas: updated,
        meta_moneda: metaNueva,
      };
    });
  };

  const setMetaMoneda = (moneda: string) => {
    const currentList = config.monedas_activas || [];
    // Solo permitir meta en una moneda activa
    if (!currentList.includes(moneda)) {
      toast.warning("Activa esa moneda primero para poder usarla como meta.");
      return;
    }
    setConfig((prev) => ({ ...prev, meta_moneda: moneda }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Finanzas</h2>
        <p className="text-sm text-gray-400">
          Configura monedas activas y la moneda principal para metas.
        </p>
      </div>

      {/* Monedas activas */}
      <div className="bg-[#161B22] border border-white/10 rounded-2xl p-4">
        <p className="text-sm font-bold text-white mb-3">Monedas activas</p>

        <div className="flex flex-wrap gap-2">
          {ALL_MONEDAS.map(({ code, flag, name }) => {
            const active = config.monedas_activas?.includes(code);
            return (
              <button
                key={code}
                onClick={() => toggleMoneda(code)}
                title={name}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${active
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                    : "bg-[#0F1115] text-gray-200 border-white/10 hover:bg-white/5"
                  }`}
              >
                <span>{flag}</span> {code}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 mt-3">
          * Debes dejar al menos 1 moneda activa.
        </p>
      </div>

      {/* Moneda meta */}
      <div className="bg-[#161B22] border border-white/10 rounded-2xl p-4">
        <p className="text-sm font-bold text-white mb-3">Moneda de metas</p>

        <div className="flex flex-wrap gap-2">
          {(config.monedas_activas || []).map((code) => {
            const selected = config.meta_moneda === code;
            const info = ALL_MONEDAS.find(m => m.code === code);
            return (
              <button
                key={code}
                onClick={() => setMetaMoneda(code)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${selected
                    ? "bg-blue-500/10 text-blue-200 border-blue-500/30"
                    : "bg-[#0F1115] text-gray-200 border-white/10 hover:bg-white/5"
                  }`}
              >
                {info?.flag && <span>{info.flag}</span>}
                {selected ? `✓ ${code}` : code}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 mt-3">
          La moneda de metas debe estar dentro de tus monedas activas.
        </p>
      </div>

      {/* Botón Guardar */}
      {guardar && (
        <div className="flex justify-end pt-4">
          <button
            onClick={guardar}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-emerald-500/20 transition transform active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      )}
    </div>
  );
}