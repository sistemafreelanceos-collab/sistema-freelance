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
  plan: Plan;
  plan_status: "active" | "inactive";
  plan_renovacion: string | null; // date string
};

export default function SuscripcionPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [accionando, setAccionando] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Simulación de facturas (luego vendrán de Stripe)
  const facturas = [
    { id: 1024, fecha: "12 Ene, 2026", monto: "$29.00 USD", estado: "Pagado" },
    { id: 1023, fecha: "12 Dic, 2025", monto: "$29.00 USD", estado: "Pagado" },
    { id: 1022, fecha: "12 Nov, 2025", monto: "$29.00 USD", estado: "Pagado" },
  ];

  const isPremium = profile?.plan === "premium" && profile?.plan_status === "active";

  const planTitle = useMemo(() => {
    return isPremium ? "FreelanceOS Pro" : "FreelanceOS Gratis";
  }, [isPremium]);

  const planPrice = useMemo(() => {
    return isPremium ? "$29" : "$0";
  }, [isPremium]);

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        router.push("/");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id,email,nombre,plan,plan_status,plan_renovacion")
        .eq("id", session.user.id)
        .single();

      if (error) {
        toast.error("No se pudo cargar tu suscripción. Revisa profiles/RLS.");
        console.error(error);
        setCargando(false);
        return;
      }

      setProfile(data as Profile);
      setCargando(false);
    };

    init();
  }, [router]);

  // Demo: cambiar plan sin Stripe (para test)
  const cambiarPlanDemo = async () => {
    if (!profile) return;
    setAccionando(true);

    const nuevoPlan: Plan = profile.plan === "gratis" ? "premium" : "gratis";

    const { error } = await supabase
      .from("profiles")
      .update({
        plan: nuevoPlan,
        plan_status: "active",
        plan_renovacion: nuevoPlan === "premium" ? "2026-02-12" : null,
      })
      .eq("id", profile.id);

    if (error) {
      toast.error(error.message);
      setAccionando(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("id,email,nombre,plan,plan_status,plan_renovacion")
      .eq("id", profile.id)
      .single();

    if (data) setProfile(data as Profile);
    setAccionando(false);
  };

  const cancelarDemo = async () => {
    if (!profile) return;
    setAccionando(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        plan_status: "inactive",
        plan_renovacion: null,
      })
      .eq("id", profile.id);

    if (error) {
      toast.error(error.message);
      setAccionando(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("id,email,nombre,plan,plan_status,plan_renovacion")
      .eq("id", profile.id)
      .single();

    if (data) setProfile(data as Profile);
    setAccionando(false);
  };

  if (cargando) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-[#161B22] border border-white/10 rounded-2xl p-8 text-gray-300">
          Cargando suscripción...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/perfil"
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition text-gray-400"
        >
          ←
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Suscripción y Facturación</h1>
          <p className="text-gray-400 text-sm">Gestiona tu plan y facturación.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* IZQ */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#161B22] border border-yellow-500/30 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs uppercase font-bold text-yellow-500 mb-1">Tu Plan Actual</p>
                <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                  {planTitle} {isPremium && <span className="text-yellow-400">Pro</span>}
                </h2>
                <p className="text-gray-400 text-sm mt-2">
                  {isPremium ? "Facturación Mensual" : "Plan con restricciones"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  {planPrice}
                  <span className="text-lg text-gray-500 font-normal">{isPremium ? "/mes" : ""}</span>
                </p>

                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-2 border ${profile?.plan_status === "active"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                >
                  • {profile?.plan_status === "active" ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-white/5 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Próximo cobro:</span>
                <span className="text-white font-bold">
                  {isPremium ? (profile?.plan_renovacion ?? "—") : "—"}
                </span>
              </div>

              <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-full w-[30%] shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
              </div>

              <p className="text-[10px] text-gray-500 mt-2 text-right">
                {isPremium ? "Se cobrará a tu método de pago" : "Actualiza para desbloquear funciones"}
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={cambiarPlanDemo}
                disabled={accionando}
                className="bg-white text-black font-bold px-6 py-2.5 rounded-lg hover:bg-gray-200 transition text-sm disabled:opacity-60"
              >
                {accionando ? "Procesando..." : isPremium ? "Bajar a Gratis (Demo)" : "Mejorar a Pro (Demo)"}
              </button>

              {isPremium && (
                <button
                  onClick={cancelarDemo}
                  disabled={accionando}
                  className="border border-red-500/30 text-red-400 px-6 py-2.5 rounded-lg hover:bg-red-500/10 transition text-sm disabled:opacity-60"
                >
                  Cancelar Suscripción (Demo)
                </button>
              )}
            </div>

            {!isPremium && (
              <div className="mt-5 text-xs text-gray-300 border border-white/10 bg-black/20 rounded-xl p-3">
                <p className="font-bold mb-2">Restricciones Plan Gratis</p>
                <ul className="list-disc ml-4 space-y-1 text-gray-400">
                  <li>Máximo 3 clientes</li>
                  <li>Máximo 30 gastos/mes</li>
                  <li>Estadísticas básicas</li>
                </ul>
              </div>
            )}
          </div>

          {/* FACTURAS */}
          <div className="bg-[#161B22] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">🧾 Historial de Facturas</h3>

            {!isPremium ? (
              <div className="text-sm text-gray-400 bg-white/5 border border-white/10 rounded-xl p-4">
                Tu plan Gratis no genera facturas. Actualiza a Pro para ver historial de pagos.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-900 text-gray-400 font-medium">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Monto</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3 text-right">Descargar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {facturas.map((f) => (
                      <tr key={f.id} className="hover:bg-white/5 transition">
                        <td className="p-3 text-white">{f.fecha}</td>
                        <td className="p-3 text-gray-300">{f.monto}</td>
                        <td className="p-3">
                          <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs font-bold">
                            {f.estado}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button className="text-gray-400 hover:text-white transition">📥 PDF</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* DER */}
        <div className="space-y-6">
          <div className="bg-[#161B22] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Método de Pago</h3>

            <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-xl p-5 border border-white/10 shadow-2xl relative overflow-hidden mb-6">
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="w-10 h-6 rounded bg-white/20 flex items-center justify-center">
                  <div className="w-6 h-4 bg-yellow-500/80 rounded-sm"></div>
                </div>
                <span className="text-white/50 text-xs font-mono">DEBIT</span>
              </div>

              <div className="text-xl font-mono text-white tracking-widest mb-4 relative z-10">
                •••• •••• •••• 4242
              </div>

              <div className="flex justify-between items-end relative z-10">
                <div>
                  <p className="text-[9px] text-white/50 uppercase">Titular</p>
                  <p className="text-xs text-white font-medium uppercase tracking-wide">
                    {profile?.nombre || profile?.email?.split("@")[0] || "Usuario"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-white/50 uppercase">Plan</p>
                  <p className="text-xs text-white font-medium">{isPremium ? "PRO" : "GRATIS"}</p>
                </div>
              </div>
            </div>

            <button
              className="w-full border border-gray-600 text-gray-300 hover:border-white hover:text-white py-2 rounded-lg text-xs font-bold transition disabled:opacity-60"
              disabled={!isPremium}
              onClick={() => toast.info("Luego conectamos Stripe para métodos de pago")}
            >
              + Agregar Nuevo Método
            </button>

            {!isPremium && (
              <p className="text-[10px] text-gray-500 mt-2">
                Solo los usuarios Pro pueden gestionar métodos de pago.
              </p>
            )}
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6">
            <h4 className="font-bold text-blue-300 text-sm mb-2">¿Necesitas ayuda?</h4>
            <p className="text-xs text-blue-200/60 mb-4">
              Si tienes problemas con tu facturación, contáctanos directamente.
            </p>
            <button className="text-xs text-blue-400 font-bold hover:underline">
              Contactar Soporte →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
