"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { ConfigPerfil } from "./types";
import BrandTab from "./components/BrandTab";
import FinanceTab from "./components/FinanceTab";
import ServicesTab from "./components/ServicesTab";
import ContractsTab from "./components/ContractsTab";

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"marca" | "finanzas" | "servicios" | "contratos">("marca");
  const [saving, setSaving] = useState(false);

  // Estado centralizado para el PERFIL (Marca y Finanzas comparten tabla)
  const [config, setConfig] = useState<ConfigPerfil>({
    color_tema: "#0F1115",
    branding_legal: "",
    branding_logo_url: "",
    firma_digital_url: "",
    datos_fiscales: "",
    monedas_activas: ["USD", "COP"],
    meta_mensual: 0,
    meta_moneda: "USD", // <--- Inicializar aquí
    limite_horas_diario: 8,
  });

  // 1. CARGA INICIAL
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (p) {
        // Mapeamos los datos de la BD al estado
        setConfig({
          color_tema: p.color_tema || "#0F1115",
          branding_legal: p.branding_legal || "",
          branding_logo_url: p.branding_logo_url || "",
          firma_digital_url: p.firma_digital_url || "",
          datos_fiscales: p.datos_fiscales || "",
          monedas_activas: p.monedas_activas || ["USD", "COP"],
          meta_mensual: p.meta_mensual || 0,
          meta_moneda: p.meta_moneda || "USD", // <--- Cargar aquí
          limite_horas_diario: p.limite_horas_diario || 8,
        });
      }
      setLoading(false);
    };
    init();
  }, []);

  // 2. FUNCIÓN DE GUARDADO PARA PERFIL
  const guardarPerfil = async () => {
    setSaving(true);
    await supabase.from("profiles").update(config).eq("id", userId);
    setSaving(false);
    alert("¡Configuración guardada!");
  };

  if (loading) return <div className="p-10 text-white animate-pulse">Cargando FreelanceOS...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 p-6">
      <h1 className="text-3xl font-bold text-white mb-8">⚙️ Configuración</h1>

      {/* --- MENU DE PESTAÑAS --- */}
      <div className="flex gap-6 border-b border-white/10 mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: "marca", label: "🎨 Marca & Firma" },
          { id: "finanzas", label: "💰 Finanzas & Metas" },
          { id: "servicios", label: "📦 Servicios Recurrentes" },
          { id: "contratos", label: "📜 Contratos & Cláusulas" }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)} 
            className={`pb-3 text-sm font-bold whitespace-nowrap transition border-b-2 ${
              activeTab === tab.id 
                ? "text-emerald-400 border-emerald-400" 
                : "text-gray-400 border-transparent hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- RENDERIZADO CONDICIONAL --- */}
      <div className="min-h-[400px]">
        {activeTab === "marca" && (
          <BrandTab config={config} setConfig={setConfig} guardar={guardarPerfil} saving={saving} />
        )}
        
        {activeTab === "finanzas" && (
          <FinanceTab config={config} setConfig={setConfig} guardar={guardarPerfil} saving={saving} />
        )}

        {activeTab === "servicios" && (
          <ServicesTab userId={userId} monedas={config.monedas_activas} />
        )}

        {activeTab === "contratos" && (
          <ContractsTab userId={userId} />
        )}
      </div>
    </div>
  );
}