"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import Sidebar from "../components/layout/Sidebar";
import TopBar from "../components/layout/TopBar";
import CommandPalette from "../components/ui/CommandPalette";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Estados Globales de UI
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Usuario
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("Usuario");
  const [userInitials, setUserInitials] = useState("U");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [planUsuario, setPlanUsuario] = useState<"gratis" | "premium">("premium");

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

  // Manejo de atajo Ctrl+K para Command Palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    // Fondo controlado por variable CSS
    <div className="flex h-screen text-white font-sans overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: 'var(--sys-bg, #0F1115)' }}>

      <Sidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        planUsuario={planUsuario}
      />

      {mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"></div>}

      <main className="flex-1 flex flex-col min-w-0 bg-white/[0.02]">
        <TopBar
          setMobileMenuOpen={setMobileMenuOpen}
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          userInitials={userInitials}
          onOpenCommand={() => setCommandOpen(true)}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth">
          {children}
        </div>
      </main>

      <CommandPalette open={commandOpen} setOpen={setCommandOpen} />
    </div>
  );
}