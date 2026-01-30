"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { ConfigPerfil } from "../../../types";
import BrandTab from "./components/BrandTab";
import FinanceTab from "./components/FinanceTab";
import ServicesTab from "./components/ServicesTab";
import ContractsTab from "./components/ContractsTab";
import ProfileTab from "./components/ProfileTab";
import DataTab from "./components/DataTab";
import TeamTab from "./components/TeamTab"; // New import
import { toast } from "sonner";

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"perfil" | "marca" | "finanzas" | "servicios" | "contratos" | "datos" | "equipo">("perfil"); // Default to perfil
  const [saving, setSaving] = useState(false);

  // Estado centralizado para el PERFIL (Marca y Finanzas comparten tabla)
  const [config, setConfig] = useState<ConfigPerfil>({
    // Mapeo BD
    nombre: "",
    empresa: "",
    telefono: "",
    direccion: "",
    email: "",
    avatar_url: "",

    // Suscripción
    plan: "gratis" as const,
    plan_status: "active" as const,
    plan_renovacion: null,

    // Configuración actual
    color_tema: "#0F1115",
    branding_legal: "",
    branding_logo_url: "",
    firma_digital_url: "",
    datos_fiscales: "",
    monedas_activas: ["USD", "COP"],
    meta_mensual: 0,
    meta_moneda: "USD",
    limite_horas_diario: 8,
    // Nuevos campos inicializados
    nombre_completo: "",
    titulo_profesional: "",
    bio: "",
    email_contacto: "",
    website: "",
    ubicacion: ""
  });

  // 1. CARGA INICIAL
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (p) {
        setConfig({
          // Mapeo Directo BD -> State
          nombre: p.nombre || "",
          empresa: p.empresa || "",
          telefono: p.telefono || "",
          direccion: p.direccion || "",
          email: p.email || user.email || "", // Fallback al auth email
          avatar_url: p.avatar_url || "",

          datos_fiscales: p.datos_fiscales || "",
          color_tema: p.color_tema || "#0F1115",
          branding_logo_url: p.branding_logo_url || "",
          firma_digital_url: p.firma_digital_url || "",

          monedas_activas: p.monedas_activas || ["USD", "COP"],
          meta_mensual: p.meta_mensual || 0,
          meta_moneda: p.meta_moneda || "USD",
          limite_horas_diario: p.limite_horas_diario || 8,

          // Suscripción
          plan: p.plan || "gratis",
          plan_status: p.plan_status || "active",
          plan_renovacion: p.plan_renovacion || null,

          // Compatibilidad UI (Alias)
          nombre_completo: p.nombre || "",
          branding_legal: p.empresa || "", // Alias para componentes viejos
          email_contacto: p.email || user.email || "",
          ubicacion: p.direccion || "",
        });
      }
      setLoading(false);
    };
    init();
  }, []);

  // 2. FUNCIÓN DE GUARDADO PARA PERFIL
  const guardarPerfil = async () => {
    setSaving(true);
    const toastId = toast.loading("Guardando configuración...");

    // Filtramos solo las columnas que existen en la BD
    const payload = {
      nombre: config.nombre,
      empresa: config.empresa,
      telefono: config.telefono,
      direccion: config.direccion,
      avatar_url: config.avatar_url,

      datos_fiscales: config.datos_fiscales,
      color_tema: config.color_tema,
      branding_logo_url: config.branding_logo_url,
      firma_digital_url: config.firma_digital_url,

      monedas_activas: config.monedas_activas,
      meta_mensual: config.meta_mensual,
      meta_moneda: config.meta_moneda,
      limite_horas_diario: config.limite_horas_diario,

      // También branding_legal si es distinto a empresa o se usa en otro lado
      branding_legal: config.branding_legal || config.empresa
    };

    const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
    setSaving(false);

    if (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error("Error al guardar: " + error.message);
    } else {
      toast.dismiss(toastId);
      toast.success("¡Configuración guardada correctamente!");
    }
  };

  if (loading) return <div className="p-10 text-white animate-pulse">Cargando FreelanceOS...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 p-6">
      <h1 className="text-3xl font-bold text-white mb-8">⚙️ Configuración</h1>

      {/* --- MENU DE PESTAÑAS --- */}
      <div className="flex gap-6 border-b border-white/10 mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: "perfil", label: "👤 Perfil Base" },
          { id: "marca", label: "🎨 Marca & Firma" },
          { id: "finanzas", label: "💰 Finanzas & Metas" },
          { id: "servicios", label: "📦 Servicios Recurrentes" },
          { id: "contratos", label: "📜 Contratos & Cláusulas" },
          { id: "equipo", label: "👥 Equipo" }, // New tab
          { id: "datos", label: "💾 Datos" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb - 3 text - sm font - bold whitespace - nowrap transition border - b - 2 ${activeTab === tab.id
              ? "text-emerald-400 border-emerald-400"
              : "text-gray-400 border-transparent hover:text-white"
              } `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- RENDERIZADO CONDICIONAL --- */}
      <div className="min-h-[400px]">
        {activeTab === "perfil" && (
          <ProfileTab config={config} setConfig={setConfig} guardar={guardarPerfil} saving={saving} />
        )}

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

        {activeTab === "datos" && (
          <DataTab userId={userId} />
        )}

        {/* --- TEAM TAB --- */}
        {activeTab === "equipo" && (
          <TeamTab />
        )}
      </div>
    </div>
  );
}