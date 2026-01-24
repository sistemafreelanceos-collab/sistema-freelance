"use client";

import React from "react";

type Moneda = "USD" | "COP" | "EUR" | "MXN";

export type ConfigPerfil = {
  monedas_activas: Moneda[]; // ej: ["USD","COP"]
  meta_moneda: Moneda;       // moneda de meta actual
};

type Props = {
  config: ConfigPerfil;
  setConfig: React.Dispatch<React.SetStateAction<ConfigPerfil>>;
};

const ALL_MONEDAS: Moneda[] = ["USD", "COP", "EUR", "MXN"];

export default function FinanceTab({ config, setConfig }: Props) {
  const toggleMoneda = (moneda: Moneda) => {
    setConfig((prev: ConfigPerfil) => {
      const already = prev.monedas_activas.includes(moneda);

      // Evitar quedarte con 0 monedas activas
      if (already && prev.monedas_activas.length === 1) {
        return prev;
      }

      const updated = already
        ? prev.monedas_activas.filter((m) => m !== moneda)
        : [...prev.monedas_activas, moneda];

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

  const setMetaMoneda = (moneda: Moneda) => {
    // Solo permitir meta en una moneda activa
    if (!config.monedas_activas.includes(moneda)) {
      alert("Activa esa moneda primero para poder usarla como meta.");
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
          {ALL_MONEDAS.map((m) => {
            const active = config.monedas_activas.includes(m);
            return (
              <button
                key={m}
                onClick={() => toggleMoneda(m)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                  active
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                    : "bg-[#0F1115] text-gray-200 border-white/10 hover:bg-white/5"
                }`}
              >
                {m}
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
          {config.monedas_activas.map((m) => {
            const selected = config.meta_moneda === m;
            return (
              <button
                key={m}
                onClick={() => setMetaMoneda(m)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                  selected
                    ? "bg-blue-500/10 text-blue-200 border-blue-500/30"
                    : "bg-[#0F1115] text-gray-200 border-white/10 hover:bg-white/5"
                }`}
              >
                {selected ? `✓ ${m}` : m}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 mt-3">
          La moneda de metas debe estar dentro de tus monedas activas.
        </p>
      </div>
    </div>
  );
}
