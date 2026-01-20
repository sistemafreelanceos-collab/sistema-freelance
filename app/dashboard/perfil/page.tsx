"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

type Plan = "gratis" | "premium";

type Profile = {
  id: string;
  email: string | null;
  nombre: string | null;
  empresa: string | null;
  telefono: string | null;
  direccion: string | null;
  plan: Plan;
  plan_status: "active" | "inactive";
  plan_renovacion: string | null; // date string
};

export default function PerfilPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Form state
  const [datos, setDatos] = useState({
    nombre: "",
    email: "",
    empresa: "",
    telefono: "",
    direccion: "",
  });

  // --- Helpers
  const initials = useMemo(() => {
    const base = (datos.nombre || datos.email || "U").trim();
    if (base.includes("@")) return base.slice(0, 2).toUpperCase();
    const parts = base.split(" ").filter(Boolean);
    const a = parts[0]?.[0] ?? "U";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase();
  }, [datos.nombre, datos.email]);

  const isPremium = profile?.plan === "premium" && profile?.plan_status === "active";

  // --- Cargar sesión + profile
  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        router.push("/");
        return;
      }

      const userId = session.user.id;

      // Traer profile
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error(error);
        alert("No se pudo cargar tu perfil. Revisa la tabla 'profiles' y las políticas RLS.");
        setLoading(false);
        return;
      }

      const p = data as Profile;
      setProfile(p);

      setDatos({
        nombre: p.nombre ?? "",
        email: p.email ?? session.user.email ?? "",
        empresa: p.empresa ?? "",
        telefono: p.telefono ?? "",
        direccion: p.direccion ?? "",
      });

      setLoading(false);
    };

    init();
  }, [router]);

  // --- Guardar cambios (update)
  const guardarCambios = async () => {
    if (!profile) return;

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        nombre: datos.nombre || null,
        empresa: datos.empresa || null,
        telefono: datos.telefono || null,
        direccion: datos.direccion || null,
      })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      console.error(error);
      alert("Error guardando perfil: " + error.message);
      return;
    }

    alert("¡Perfil actualizado con éxito! ✅");

    // refrescar profile (opcional)
    const { data } = await supabase.from("profiles").select("*").eq("id", profile.id).single();
    if (data) setProfile(data as Profile);
  };

  // (Solo demo) Cambiar plan desde UI - en producción esto se hace con pagos/Stripe.
  const togglePlanDemo = async () => {
    if (!profile) return;

    const newPlan: Plan = profile.plan === "gratis" ? "premium" : "gratis";

    const { error } = await supabase
      .from("profiles")
      .update({
        plan: newPlan,
        plan_status: "active",
        plan_renovacion: newPlan === "premium" ? "2027-01-12" : null,
      })
      .eq("id", profile.id);

    if (error) {
      alert(error.message);
      return;
    }

    const { data } = await supabase.from("profiles").select("*").eq("id", profile.id).single();
    if (data) setProfile(data as Profile);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Configuración de Perfil</h1>
        <div className="bg-[#161B22] border border-white/10 rounded-2xl p-8 text-gray-300">
          Cargando perfil...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Configuración de Perfil</h1>
        <div className="bg-[#161B22] border border-white/10 rounded-2xl p-8 text-red-300">
          No se encontró tu perfil. (Revisa SQL / trigger / RLS)
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Configuración de Perfil</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* COLUMNA IZQUIERDA */}
        <div className="space-y-6">
          {/* Avatar */}
          <div className="bg-[#161B22] border border-white/10 rounded-2xl p-6 text-center shadow-xl">
            <div className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-3xl mx-auto mb-4 border-4 border-[#0F1115] shadow-lg">
              {initials}
            </div>

            <h2 className="text-xl font-bold text-white">{datos.nombre || "Sin nombre"}</h2>
            <p className="text-sm text-gray-400 mb-4">{datos.email}</p>

            <button className="text-xs text-emerald-400 hover:text-emerald-300 font-medium border border-emerald-500/30 px-3 py-1 rounded-full transition">
              Cambiar Foto (próximo)
            </button>
          </div>

          {/* Membresía */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-amber-900/10 border border-yellow-500/30 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

            <p className="text-xs uppercase font-bold text-yellow-500/70 mb-2">Tu Plan Actual</p>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{isPremium ? "👑" : "🆓"}</span>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {isPremium ? "Premium" : "Gratis"}
              </h3>
            </div>

            <div className="space-y-2 text-sm text-gray-400 mb-6">
              <div className="flex justify-between">
                <span>Estado:</span>
                <span className={`font-bold ${profile.plan_status === "active" ? "text-emerald-400" : "text-red-400"}`}>
                  {profile.plan_status === "active" ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Renovación:</span>
                <span className="text-white">
                  {profile.plan_renovacion ? profile.plan_renovacion : "—"}
                </span>
              </div>
            </div>

            <Link
              href="/dashboard/suscripcion"
              className="block w-full text-center bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-200 border border-yellow-500/50 text-xs font-bold py-2 rounded-lg transition"
            >
              ADMINISTRAR SUSCRIPCIÓN
            </Link>

            {/* Solo para test mientras no hay Stripe */}
            <button
              onClick={togglePlanDemo}
              className="mt-3 w-full text-center bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold py-2 rounded-lg transition"
            >
              (Demo) Cambiar plan
            </button>

            {/* Restricciones del plan gratis */}
            {!isPremium && (
              <div className="mt-4 text-xs text-gray-300 border border-white/10 bg-black/20 rounded-xl p-3">
                <p className="font-bold mb-2">Restricciones Plan Gratis</p>
                <ul className="list-disc ml-4 space-y-1 text-gray-400">
                  <li>Máximo 3 clientes</li>
                  <li>Máximo 30 gastos/mes</li>
                  <li>Estadísticas básicas</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[#161B22] border border-white/10 rounded-2xl p-8 shadow-xl">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="text-emerald-500">📝</span> Datos Personales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Nombre Completo</label>
                <input
                  type="text"
                  value={datos.nombre}
                  onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
                  className="w-full bg-[#0F1115] border border-gray-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Nombre de tu Empresa / Marca</label>
                <input
                  type="text"
                  value={datos.empresa}
                  onChange={(e) => setDatos({ ...datos, empresa: e.target.value })}
                  className="w-full bg-[#0F1115] border border-gray-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Correo Electrónico</label>
                <input
                  type="email"
                  value={datos.email}
                  disabled
                  className="w-full bg-[#0F1115]/50 border border-gray-800 rounded-lg p-3 text-gray-400 cursor-not-allowed"
                />
                <p className="text-[10px] text-gray-600">El correo no se puede cambiar.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={datos.telefono}
                  onChange={(e) => setDatos({ ...datos, telefono: e.target.value })}
                  className="w-full bg-[#0F1115] border border-gray-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none transition"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Dirección de Facturación</label>
                <input
                  type="text"
                  value={datos.direccion}
                  onChange={(e) => setDatos({ ...datos, direccion: e.target.value })}
                  className="w-full bg-[#0F1115] border border-gray-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none transition"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={guardarCambios}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-emerald-900/20 flex items-center gap-2 disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>

          <div className="bg-[#161B22] border border-white/10 rounded-2xl p-8 shadow-xl opacity-80 hover:opacity-100 transition">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-300">🔒 Seguridad</h3>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Contraseña</p>
                <p className="text-xs text-gray-500">Cambia tu contraseña periódicamente.</p>
              </div>

              {/* Esto lo implementamos luego con reset password */}
              <button
                className="text-sm text-white bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
                onClick={() => alert("Luego hacemos reset password con Supabase")}
              >
                Cambiar Contraseña
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
