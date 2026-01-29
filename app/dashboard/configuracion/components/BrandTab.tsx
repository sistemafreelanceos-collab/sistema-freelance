"use client";

import React, { useEffect, useState } from "react";
import { ConfigPerfil } from "../../../../types"; // <--- IMPORTAMOS EL TIPO OFICIAL

type Props = {
  config: ConfigPerfil;
  setConfig: React.Dispatch<React.SetStateAction<ConfigPerfil>>;
  guardar: () => Promise<void>;
  saving: boolean;
};

export default function BrandTab({ config, setConfig, guardar, saving }: Props) {
  const [loadingLS, setLoadingLS] = useState(true);

  // ✅ Cargar desde localStorage (solo cliente)
  useEffect(() => {
    try {
      const savedBrand = localStorage.getItem("brand_name");
      const savedColor = localStorage.getItem("brand_color");

      // Si no hay en config todavía, lo inyectamos
      if (savedBrand && !config.branding_legal) {
        setConfig((prev) => ({ ...prev, branding_legal: savedBrand }));
      }
      if (savedColor && !config.color_tema) {
        setConfig((prev) => ({ ...prev, color_tema: savedColor }));
      }
    } catch (e) {
      console.error("Error localStorage:", e);
    } finally {
      setLoadingLS(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Guardar en localStorage cuando cambie config
  useEffect(() => {
    if (loadingLS) return;
    try {
      if (config.branding_legal !== undefined) {
        localStorage.setItem("brand_name", config.branding_legal || "");
      }
      if (config.color_tema !== undefined) {
        localStorage.setItem("brand_color", config.color_tema || "#10b981");
      }
    } catch (e) {
      console.error("Error guardando localStorage:", e);
    }
  }, [config.branding_legal, config.color_tema, loadingLS]);

  // Mapeamos las propiedades del tipo oficial a variables locales para usar en el JSX
  const brandName = config.branding_legal ?? "";
  const brandColor = config.color_tema ?? "#10b981";

  if (loadingLS) {
    return <div className="p-6 text-gray-400">Cargando marca...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Marca</h2>
        <p className="text-sm text-gray-400">
          Define el nombre y color principal del sistema.
        </p>
      </div>

      <div className="bg-[#161B22] border border-white/10 rounded-2xl p-4 space-y-4">
        {/* Nombre */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-gray-400">
            Nombre de la marca
          </label>
          <input
            value={brandName}
            // Actualizamos la propiedad correcta: branding_legal
            onChange={(e) => setConfig((prev) => ({ ...prev, branding_legal: e.target.value }))}
            placeholder="Ej: FreelanceOS"
            className="w-full bg-[#0F1115] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Color */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-gray-400">
            Color principal
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={brandColor}
              // Actualizamos la propiedad correcta: color_tema
              onChange={(e) => setConfig((prev) => ({ ...prev, color_tema: e.target.value }))}
              className="w-12 h-12 rounded-lg border border-gray-700 bg-transparent cursor-pointer"
            />
            <span className="text-sm text-gray-300">{brandColor}</span>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 rounded-xl border border-white/10 bg-[#0F1115]">
          <p className="text-xs text-gray-400 mb-2">Vista previa</p>
          <div
            className="px-4 py-3 rounded-lg text-white font-bold"
            style={{ backgroundColor: brandColor }}
          >
            {brandName || "Tu marca"}
          </div>
        </div>

        {/* Guardar */}
        <div className="flex justify-end">
          <button
            onClick={guardar}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}