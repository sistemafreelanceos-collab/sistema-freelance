"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Estados
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Usuario
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("Usuario");
  const [userInitials, setUserInitials] = useState("U");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [planUsuario, setPlanUsuario] = useState<"gratis" | "premium">("premium");

  // ✅ MENÚ ACTUALIZADO (Con Configuración)
  const MENU_ITEMS = [
    { ruta: "/dashboard", icon: "🏠", label: "Inicio" },
    { ruta: "/dashboard/calendario", icon: "📅", label: "Calendario" },
    { ruta: "/dashboard/clientes", icon: "👥", label: "Clientes" },
    { ruta: "/dashboard/cuentas", icon: "💳", label: "Cuentas" }, 
    { ruta: "/dashboard/finanzas", icon: "💰", label: "Finanzas" },
    { ruta: "/dashboard/habitos", icon: "🥗", label: "Hábitos" },
    { ruta: "/dashboard/estadisticas", icon: "📈", label: "Estadísticas" },
    // 👇 Nuevo ítem agregado
    { ruta: "/dashboard/configuracion", icon: "⚙️", label: "Configuración" },
  ];

  const makeInitials = (str: string) => {
    const clean = (str || "").trim();
    if (!clean) return "U";
    if (clean.includes("@")) return clean.slice(0, 2).toUpperCase();
    const parts = clean.split(" ").filter(Boolean);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
  };

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) { router.push("/"); return; }

      setUserEmail(session.user.email ?? "");
      const meta = session.user.user_metadata || {};
      const name = meta.full_name || meta.name || session.user.email?.split("@")[0] || "Usuario";
      
      setUserName(name);
      setAvatarUrl(meta.avatar_url || null);
      setUserInitials(makeInitials(name));

      // Cargar color
      const { data: perfil } = await supabase.from("profiles").select("color_tema").eq("id", session.user.id).single();
      const colorFinal = perfil?.color_tema || "#0F1115";
      document.documentElement.style.setProperty('--sys-bg', colorFinal);
    };
    loadUser();

    const handleThemeChange = (event: any) => {
       if (event.detail) document.documentElement.style.setProperty('--sys-bg', event.detail);
    };
    window.addEventListener('change-theme', handleThemeChange);
    return () => window.removeEventListener('change-theme', handleThemeChange);
  }, [router]);

  const handleLogout = async () => {
    setMenuPerfilAbierto(false);
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    // Fondo controlado por variable CSS
    <div className="flex h-screen text-white font-sans overflow-hidden transition-colors duration-500" 
         style={{ backgroundColor: 'var(--sys-bg, #0F1115)' }}>
      
      {/* SIDEBAR (Ahora semitransparente para que tome el color del fondo) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
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
          {planUsuario === "premium" && (
            <div className="bg-gradient-to-br from-yellow-500/20 to-amber-700/20 border border-yellow-500/30 p-4 rounded-xl text-center relative overflow-hidden group shadow-lg shadow-yellow-900/20">
              <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-xl -mr-8 -mt-8 pointer-events-none"></div>
              <p className="text-[10px] text-yellow-200/70 uppercase font-bold mb-1 tracking-wider">Tu Membresía</p>
              <div className="flex items-center justify-center gap-2 mb-2 scale-110">
                <span className="text-xl drop-shadow-md">👑</span>
                <span className="font-bold text-white tracking-wide drop-shadow-md">PREMIUM</span>
              </div>
            </div>
          )}
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
              </div>
              {avatarUrl ? (
                 <img src={avatarUrl} alt="Perfil" className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-white/10 shadow-lg bg-gray-800"/>
              ) : (
                 <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white/10 shadow-lg">{userInitials}</div>
              )}
            </button>

            {menuPerfilAbierto && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#161B22] border border-gray-700 rounded-xl shadow-2xl py-2 z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
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