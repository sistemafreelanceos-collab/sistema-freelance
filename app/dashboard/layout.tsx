"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [colorFondo, setColorFondo] = useState("#0F1115");
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [planUsuario, setPlanUsuario] = useState<"gratis" | "premium">("premium");

  // Usuario real (Supabase)
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("Usuario");
  const [userInitials, setUserInitials] = useState<string>("U");

  // ✅ AQUÍ AGREGAMOS "CUENTAS" AL MENÚ
  const MENU_ITEMS = [
    { ruta: "/dashboard", icon: "🏠", label: "Inicio" },
    { ruta: "/dashboard/calendario", icon: "📅", label: "Calendario" },
    { ruta: "/dashboard/clientes", icon: "👥", label: "Clientes" },
    { ruta: "/dashboard/cuentas", icon: "💳", label: "Cuentas" }, // <--- NUEVO
    { ruta: "/dashboard/finanzas", icon: "💰", label: "Finanzas" },
    { ruta: "/dashboard/habitos", icon: "🥗", label: "Hábitos" },
    { ruta: "/dashboard/estadisticas", icon: "📈", label: "Estadísticas" },
  ];

  // Helper: iniciales
  const makeInitials = (nameOrEmail: string) => {
    const clean = (nameOrEmail || "").trim();
    if (!clean) return "U";
    if (clean.includes("@")) return clean.slice(0, 2).toUpperCase();
    const parts = clean.split(" ").filter(Boolean);
    const a = parts[0]?.[0] ?? "U";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase();
  };

  // Traer sesión
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) { router.push("/"); return; }

      const email = session.user.email ?? "";
      setUserEmail(email);

      const metaName = (session.user.user_metadata?.full_name as string) || (session.user.user_metadata?.name as string) || "";
      const displayName = metaName || (email ? email.split("@")[0] : "Usuario");
      setUserName(displayName);
      setUserInitials(makeInitials(displayName || email));
    };

    loadUser();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { router.push("/"); return; }
      setUserEmail(session.user.email ?? "");
    });

    return () => { sub.subscription.unsubscribe(); };
  }, [router]);

  const handleLogout = async () => {
    setMenuPerfilAbierto(false);
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex h-screen text-white font-sans overflow-hidden transition-colors duration-500" style={{ backgroundColor: colorFondo }}>
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#161B22]/95 backdrop-blur-xl border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-black shadow-lg shadow-emerald-500/20">F</div>
            <span className="font-bold text-lg tracking-tight">FreelanceOS</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white">✕</button>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.ruta}
              href={item.ruta}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                pathname === item.ruta ? "bg-white/10 text-white border border-white/10 shadow-sm" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 pb-4">
          {planUsuario === "premium" ? (
            <div className="bg-gradient-to-br from-yellow-500/20 to-amber-700/20 border border-yellow-500/30 p-4 rounded-xl text-center relative overflow-hidden group shadow-lg shadow-yellow-900/20">
              <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-xl -mr-8 -mt-8 pointer-events-none"></div>
              <p className="text-[10px] text-yellow-200/70 uppercase font-bold mb-1 tracking-wider">Tu Membresía</p>
              <div className="flex items-center justify-center gap-2 mb-2 scale-110">
                <span className="text-xl drop-shadow-md">👑</span>
                <span className="font-bold text-white tracking-wide drop-shadow-md">PREMIUM</span>
              </div>
              <p className="text-[10px] text-yellow-100/60">Acceso total habilitado</p>
            </div>
          ) : (
            <div className="bg-gray-800/40 border border-white/10 p-4 rounded-xl text-center">
              <p className="text-xs font-bold text-gray-300 mb-2">Plan Gratuito</p>
              <button onClick={() => setPlanUsuario("premium")} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg transition shadow-lg shadow-emerald-900/20">💎 MEJORAR AHORA</button>
            </div>
          )}
        </div>
        
        {/* Footer Sidebar */}
        <div className="p-4 border-t border-white/5">
           <div className="flex items-center gap-3 opacity-50 text-xs text-gray-400">
              <span>🎨 Tema: Dark</span>
           </div>
        </div>
      </aside>

      {mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"></div>}

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 bg-white/[0.02]">
        <header className="h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-gray-400 hover:text-white p-1 border border-white/10 rounded-lg"><span className="text-xl">☰</span></button>
            <div className="text-sm text-gray-400 truncate"><span className="hidden md:inline">Dashboard <span className="mx-2">/</span></span><span className="text-white font-medium capitalize">{pathname.split("/").pop() || "Inicio"}</span></div>
          </div>

          <div className="relative">
            <button onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)} className="flex items-center gap-3 hover:bg-white/5 py-1.5 px-2 md:px-3 rounded-xl transition border border-transparent hover:border-white/10">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-white">{userName}</p>
                {planUsuario === "premium" && <p className="text-[10px] font-bold uppercase text-yellow-400 tracking-wide">★ PRO MEMBER</p>}
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white/10 shadow-lg">{userInitials}</div>
            </button>

            {menuPerfilAbierto && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#161B22] border border-gray-700 rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700 bg-white/5">
                  <p className="text-xs text-gray-400 mb-1">Cuenta conectada</p>
                  <p className="text-sm font-medium text-white truncate">{userEmail || "—"}</p>
                </div>
                <div className="p-2">
                  <Link href="/dashboard/perfil" className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition mb-1" onClick={() => setMenuPerfilAbierto(false)}>⚙️ Configuración / Perfil</Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition">🚪 Cerrar Sesión</button>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth">{children}</div>
      </main>
    </div>
  );
}