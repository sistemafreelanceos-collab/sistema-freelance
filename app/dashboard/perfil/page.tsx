"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { toast } from "sonner";

type Plan = "gratis" | "premium";

type Profile = {
  id: string;
  email: string | null;
  nombre: string | null;
  empresa: string | null;
  telefono: string | null;
  direccion: string | null;
  avatar_url: string | null; // <--- AGREGADO
  plan: Plan;
  plan_status: "active" | "inactive";
  plan_renovacion: string | null; // date string
};

export default function PerfilPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false); // <--- ESTADO PARA LA SUBIDA
  const [profile, setProfile] = useState<Profile | null>(null);

  // Form state
  const [datos, setDatos] = useState({
    nombre: "",
    email: "",
    empresa: "",
    telefono: "",
    direccion: "",
    avatar_url: "" as string | null, // <--- AGREGADO AL ESTADO
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
        // Intentamos cargar al menos los datos básicos de la sesión si falla la tabla
        setDatos({
          nombre: session.user.user_metadata.full_name || "",
          email: session.user.email || "",
          empresa: session.user.user_metadata.business_name || "",
          telefono: "",
          direccion: "",
          avatar_url: session.user.user_metadata.avatar_url || null
        });
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
        avatar_url: p.avatar_url ?? session.user.user_metadata.avatar_url ?? null, // Cargar foto
      });

      setLoading(false);
    };

    init();
  }, [router]);

  // --- FUNCIÓN PARA SUBIR FOTO ---
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Subir al Bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // 2. Obtener URL Pública
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // 3. Actualizar estado visual inmediatamente
      setDatos({ ...datos, avatar_url: data.publicUrl });
      toast.success("Foto cargada ✅. Dale a 'Guardar Cambios' para confirmar.");

    } catch (error: any) {
      toast.error('Error subiendo imagen: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- Guardar cambios (update)
  const guardarCambios = async () => {
    // Obtenemos usuario actual para asegurar ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);

    // 1. ACTUALIZAR METADATOS (Para que el Header se actualice rápido)
    await supabase.auth.updateUser({
      data: {
        full_name: datos.nombre,
        business_name: datos.empresa,
        avatar_url: datos.avatar_url // Guardamos foto en metadatos
      }
    });

    // 2. ACTUALIZAR TABLA PROFILES
    const updates = {
      id: user.id, // Aseguramos ID
      nombre: datos.nombre || null,
      empresa: datos.empresa || null,
      telefono: datos.telefono || null,
      direccion: datos.direccion || null,
      avatar_url: datos.avatar_url || null, // Guardamos foto en DB
      updated_at: new Date(),
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(updates); // Usamos upsert por seguridad

    setSaving(false);

    if (error) {
      console.error(error);
      toast.error("Error guardando perfil: " + error.message);
      return;
    }

    toast.success("¡Perfil actualizado con éxito! ✅");
    router.refresh();
  };

  // (Solo demo) Cambiar plan desde UI
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
      if (error) {
        toast.error(error.message);
        return;
      }
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

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Configuración de Perfil</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* COLUMNA IZQUIERDA */}
        <div className="space-y-6">

          {/* Avatar CON FUNCIONALIDAD */}
          <div className="bg-[#161B22] border border-white/10 rounded-2xl p-6 text-center shadow-xl">
            <div className="w-24 h-24 mx-auto mb-4 relative group">
              {datos.avatar_url ? (
                <img
                  src={datos.avatar_url}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover border-4 border-[#0F1115] shadow-lg bg-gray-800"
                />
              ) : (
                <div className="w-full h-full bg-emerald-600 rounded-full flex items-center justify-center font-bold text-3xl text-white border-4 border-[#0F1115] shadow-lg">
                  {initials}
                </div>
              )}

              {/* Overlay al pasar el mouse */}
              <label className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white text-xs font-bold backdrop-blur-sm">
                📷 Cambiar
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploading}
                />
              </label>
            </div>

            <h2 className="text-xl font-bold text-white capitalize">{datos.nombre || "Sin nombre"}</h2>
            <p className="text-sm text-gray-400 mb-4">{datos.email}</p>

            {/* Botón visible también por si no ven el hover */}
            <label className="cursor-pointer text-xs text-emerald-400 hover:text-emerald-300 font-medium border border-emerald-500/30 px-3 py-1 rounded-full transition inline-block">
              {uploading ? "Subiendo..." : "Subir nueva foto"}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
              />
            </label>
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

            {profile && (
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
            )}

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
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
              <span className="text-emerald-500">📝</span> Datos Personales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Nombre Completo</label>
                <input
                  type="text"
                  value={datos.nombre}
                  onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
                  className="w-full bg-[#0F1115] border border-gray-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none transition capitalize"
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
                disabled={saving || uploading}
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
                onClick={() => toast.info("Luego hacemos reset password con Supabase")}
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