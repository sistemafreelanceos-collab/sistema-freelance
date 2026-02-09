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
import MotivationTab from "./components/MotivationTab"; // New import
import { toast } from "sonner";
import { useWorkspace } from "../../providers/WorkspaceProvider"; // 🟢 Importar Hook de Workspace (Corregido)

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"perfil" | "marca" | "finanzas" | "servicios" | "contratos" | "datos" | "equipo" | "motivacion">("perfil"); // Default to perfil
  const [saving, setSaving] = useState(false);
  const { currentWorkspace } = useWorkspace(); // 🟢 Obtener workspace actual

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

    // Motivación
    motivation_enabled: true,
    motivation_frequency: 60,

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
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Si no hay usuario, redirigir o mostrar error, pero TERMINAR carga
          setLoading(false);
          return;
        }
        setUserId(user.id);

        const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (p) {
          setConfig({
            // Mapeo Directo BD -> State
            nombre: p.nombre || "",
            empresa: p.empresa || currentWorkspace?.name || "", // 🟢 Default al Workspace Name
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

            // Motivación
            motivation_enabled: p.motivation_enabled ?? true,
            motivation_frequency: p.motivation_frequency ?? 60,

            // Suscripción
            plan: p.plan || "gratis",
            plan_status: p.plan_status || "active",
            plan_renovacion: p.plan_renovacion || null,

            // Compatibilidad UI (Alias)
            nombre_completo: p.nombre || "",
            branding_legal: p.empresa || currentWorkspace?.name || "", // 🟢 Default al Workspace Name
            email_contacto: p.email || user.email || "",
            ubicacion: p.direccion || "",
          });
        }
      } catch (error) {
        console.error("Error loading config:", error);
      } finally {
        setLoading(false);
      }
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

      // Motivación
      motivation_enabled: config.motivation_enabled,
      motivation_frequency: config.motivation_frequency,

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
          { id: "motivacion", label: "💡 Motivación" },
          { id: "servicios", label: "📦 Servicios Recurrentes" },
          { id: "contratos", label: "📜 Contratos" }, // Bloqueado visualmente
          { id: "equipo", label: "👥 Equipo" },
          { id: "datos", label: "💾 Datos" }
        ].map(tab => {
          const isLocked = tab.id === "contratos";
          return (
            <button
              key={tab.id}
              onClick={() => !isLocked && setActiveTab(tab.id as any)}
              disabled={isLocked}
              className={`pb-3 text-sm font-bold whitespace-nowrap transition border-b-2 flex items-center gap-2 ${activeTab === tab.id
                ? "text-emerald-400 border-emerald-400"
                : isLocked
                  ? "text-gray-600 border-transparent cursor-not-allowed"
                  : "text-gray-400 border-transparent hover:text-white"
                } `}
            >
              {tab.label} {isLocked && <span className="text-[10px] bg-gray-700 text-gray-400 px-1.5 rounded">Pronto</span>}
            </button>
          );
        })}
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

        {activeTab === "motivacion" && (
          <MotivationTab config={config} setConfig={setConfig} guardar={guardarPerfil} saving={saving} />
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