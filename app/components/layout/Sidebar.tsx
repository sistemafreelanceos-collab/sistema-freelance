"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export const MENU_ITEMS = [
    { ruta: "/dashboard", icon: "🏠", label: "Inicio" },
    { ruta: "/dashboard/timeline", icon: "📝", label: "Bitácora" },
    { ruta: "/dashboard/calendario", icon: "📅", label: "Calendario" },
    { ruta: "/dashboard/clientes", icon: "👥", label: "Clientes" },
    { ruta: "/dashboard/cuentas", icon: "💳", label: "Cuentas" },
    { ruta: "/dashboard/finanzas", icon: "💰", label: "Finanzas" },
    { ruta: "/dashboard/habitos", icon: "🥗", label: "Hábitos" },
    { ruta: "/dashboard/estadisticas", icon: "📈", label: "Estadísticas" },
    { ruta: "/dashboard/configuracion", icon: "⚙️", label: "Configuración" },
];

interface SidebarProps {
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    planUsuario: "gratis" | "premium";
}

import WorkspaceSwitcher from "./WorkspaceSwitcher";

// ...

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen, planUsuario }: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    // Persistir estado colapsado
    useEffect(() => {
        const savedState = localStorage.getItem("sidebar-collapsed");
        if (savedState === "true") setCollapsed(true);
    }, []);

    const toggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        localStorage.setItem("sidebar-collapsed", String(newState));
    };

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-50 bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out md:relative 
      ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      ${collapsed ? "md:w-20" : "md:w-64"}
      w-64
      `}
        >
            <div id="tour-workspace-switcher" className={`p-4 flex flex-col gap-4 border-b border-white/5`}>
                <WorkspaceSwitcher collapsed={collapsed} />

                {/* Mobile Close */}
                <button onClick={() => setMobileMenuOpen(false)} className="md:hidden absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            </div>

            <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-hide">
                {MENU_ITEMS.map((item) => (
                    <Link
                        key={item.ruta}
                        id={
                            item.ruta === "/dashboard/clientes" ? "tour-nav-clientes" :
                                item.ruta === "/dashboard/finanzas" ? "tour-nav-finanzas" :
                                    item.ruta === "/dashboard/configuracion" ? "tour-settings" :
                                        undefined
                        }
                        href={item.ruta}
                        onClick={() => setMobileMenuOpen(false)}
                        title={collapsed ? item.label : ""}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition group
              ${pathname === item.ruta
                                ? "bg-white/10 text-white border border-white/10 shadow-sm"
                                : "text-white/60 hover:bg-white/5 hover:text-white"}
              ${collapsed ? "justify-center" : ""}
            `}
                    >
                        <span className="text-lg">{item.icon}</span>
                        {!collapsed && <span className="whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-200">{item.label}</span>}
                    </Link>
                ))}
            </nav>

            {/* Collapse Button (Desktop only) */}
            <div className="hidden md:flex justify-end p-2">
                <button
                    onClick={toggleCollapse}
                    className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition"
                >
                    {collapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
                </button>
            </div>

            <div className="px-4 pb-4">
                {planUsuario === "premium" && !collapsed && (
                    <div className="bg-gradient-to-br from-yellow-500/20 to-amber-700/20 border border-yellow-500/30 p-4 rounded-xl text-center relative overflow-hidden group shadow-lg shadow-yellow-900/20 animate-in zoom-in duration-300">
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
    );
}
