"use client";

import { useEffect, useState } from "react";

export default function BrandTab() {
  const [brandName, setBrandName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#10b981"); // emerald default
  const [loading, setLoading] = useState(true);

  // ✅ Cargar desde localStorage (solo cliente)
  useEffect(() => {
    try {
      const savedBrand = localStorage.getItem("brand_name");
      const savedColor = localStorage.getItem("brand_color");

      if (savedBrand) setBrandName(savedBrand);
      if (savedColor) setPrimaryColor(savedColor);
    } catch (error) {
      console.error("Error leyendo localStorage:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Guardar en localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("brand_name", brandName);
      localStorage.setItem("brand_color", primaryColor);
    }
  }, [brandName, primaryColor, loading]);

  if (loading) {
    return (
      <div className="p-6 text-gray-400">
        Cargando configuración de marca...
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">
          Identidad de marca
        </h2>
        <p className="text-sm text-gray-400">
          Personaliza el nombre y color principal de tu sistema.
        </p>
      </div>

      {/* Nombre de marca */}
      <div className="space-y-1">
        <label className="text-xs font-bold uppercase text-gray-400">
          Nombre de la marca
        </label>
        <input
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="Ej: FreelanceOS"
          className="w-full bg-[#0F1115] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500 transition"
        />
      </div>

      {/* Color principal */}
      <div className="space-y-1">
        <label className="text-xs font-bold uppercase text-gray-400">
          Color principal
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-12 h-12 rounded-lg border border-gray-700 bg-transparent cursor-pointer"
          />
          <span className="text-sm text-gray-300">
            {primaryColor}
          </span>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-6 p-4 rounded-xl border border-white/10 bg-[#0F1115]">
        <p className="text-xs text-gray-400 mb-2">Vista previa</p>
        <div
          className="px-4 py-3 rounded-lg text-white font-bold"
          style={{ backgroundColor: primaryColor }}
        >
          {brandName || "Tu marca"}
        </div>
      </div>
    </div>
  );
}
