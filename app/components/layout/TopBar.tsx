"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useNotifications } from "@/app/hooks/useNotifications";
import { useUI } from "@/app/providers/UIProvider";
import { useQueryClient } from "@tanstack/react-query";
import {
    MagnifyingGlassIcon,
    PlusIcon,
    BellIcon,
    Bars3Icon,
    UserPlusIcon,
    CurrencyDollarIcon,
    ClipboardDocumentCheckIcon,
    BookOpenIcon
} from "@heroicons/react/24/outline";

import ManualUsuarioPanel from "../modals/ManualUsuarioPanel";

interface TopBarProps {
    setMobileMenuOpen: (open: boolean) => void;
    userName: string;
    userEmail: string;
    avatarUrl: string | null;
    userInitials: string;
}

export default function TopBar({
    setMobileMenuOpen,
    userName,
    userEmail,
    avatarUrl,
    userInitials
}: TopBarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const { openCommand } = useUI();
    const queryClient = useQueryClient();

    const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
    const [quickActionsOpen, setQuickActionsOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [manualOpen, setManualOpen] = useState(false);

    const handleLogout = async () => {
        setMenuPerfilAbierto(false);

        // 1. Limpiar caché de React Query (datos en memoria)
        queryClient.removeQueries();
        queryClient.clear();

        // 2. Limpiar TODO el LocalStorage (Slate Limpio)
        localStorage.clear();

        // 3. Cerrar sesión en Supabase
        await supabase.auth.signOut();

        router.refresh(); // Forzar recarga segura
        router.push("/");
    };

    const currentSection = pathname.split("/").pop() || "Inicio";

    return (
        <header className="h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 backdrop-blur-md border-b border-white/5 bg-black/10">
            <div className="flex items-center gap-4">
                {/* Mobile Toggle */}
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="md:hidden text-gray-400 hover:text-white p-1 border border-white/10 rounded-lg"
                >
                    <Bars3Icon className="w-6 h-6" />
                </button>

                {/* Breadcrumb / Title */}
                <div className="text-sm text-gray-400 truncate flex items-center gap-2">
                    <span className="hidden md:inline">Dashboard</span>
                    <span className="hidden md:inline text-white/20">/</span>
                    <span className="text-white font-medium capitalize">{currentSection}</span>
                </div>
            </div>

            {/* CENTER: Global Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
                <button
                    id="tour-global-search"
                    onClick={openCommand}
                    className="w-full flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-400 transition-all group"
                >
                    <MagnifyingGlassIcon className="w-4 h-4 group-hover:text-white" />
                    <span>Buscar...</span>
                    <div className="ml-auto flex gap-1">
                        <span className="text-xs bg-black/30 px-1.5 py-0.5 rounded border border-white/10">Ctrl</span>
                        <span className="text-xs bg-black/30 px-1.5 py-0.5 rounded border border-white/10">K</span>
                    </div>
                </button>
            </div>

            <div className="flex items-center gap-3 md:gap-4">

                {/* HELP MANUAL */}
                <button
                    onClick={() => setManualOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 text-sm font-medium text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/30 rounded-lg transition-all shadow-lg"
                    title="Manual de Usuario"
                >
                    <BookOpenIcon className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden md:inline">Manual</span>
                </button>

                {/* Quick Actions (+) */}
                <div className="relative">
                    <button
                        onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                        className="w-8 h-8 md:w-9 md:h-9 bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                    >
                        <PlusIcon className="w-5 h-5 md:w-6 md:h-6 font-bold" />
                    </button>

                    {quickActionsOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-[#161B22] border border-gray-700 rounded-xl shadow-2xl py-2 z-50 animate-in slide-in-from-top-2 fade-in">
                            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones Rápidas</div>

                            <Link href="/dashboard/clientes?modal=nuevo" onClick={() => setQuickActionsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition">
                                <UserPlusIcon className="w-4 h-4 text-emerald-500" /> Nuevo Cliente
                            </Link>
                            <Link href="/dashboard/finanzas?modal=gasto" onClick={() => setQuickActionsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition">
                                <CurrencyDollarIcon className="w-4 h-4 text-rose-500" /> Registrar Gasto
                            </Link>
                            <Link href="/dashboard/calendario?modal=tarea" onClick={() => setQuickActionsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition">
                                <ClipboardDocumentCheckIcon className="w-4 h-4 text-blue-500" /> Nueva Tarea
                            </Link>
                        </div>
                    )}
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                        className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition"
                    >
                        <BellIcon className="w-6 h-6" />
                        {/* Red dot if unread > 0 */}
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-2 border-[#0F1115]"></span>
                            </span>
                        )}
                    </button>

                    {notificationsOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-[#161B22] border border-gray-700 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-2 fade-in overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-white/5">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Notificaciones</span>
                                {unreadCount > 0 && (
                                    <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">{unreadCount} Nuevas</span>
                                )}
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 text-sm">
                                        No tienes notificaciones.
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            onClick={() => {
                                                if (!notif.read) markAsRead(notif.id);
                                                if (notif.link) router.push(notif.link);
                                            }}
                                            className={`p-4 hover:bg-white/5 transition border-b border-white/5 cursor-pointer group ${!notif.read ? "bg-white/[0.02]" : ""}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.type === 'success' ? 'bg-emerald-500' :
                                                    notif.type === 'warning' ? 'bg-yellow-500' :
                                                        notif.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
                                                    }`}></div>
                                                <div>
                                                    <p className={`text-sm leading-snug ${!notif.read ? "text-white font-medium" : "text-gray-400"}`}>
                                                        {notif.title}
                                                    </p>
                                                    {notif.message && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>}
                                                    <p className="text-[10px] text-gray-600 mt-1">
                                                        {new Date(notif.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {!notif.read && <div className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-2 border-t border-gray-700 text-center">
                                <button
                                    onClick={() => markAllAsRead()}
                                    className="text-xs text-gray-400 hover:text-white transition disabled:opacity-50"
                                    disabled={unreadCount === 0}
                                >
                                    Marcar todas como leídas
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile */}
                <div className="relative">
                    <button onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)} className="flex items-center gap-3 hover:bg-white/5 py-1.5 px-2 rounded-xl transition border border-transparent hover:border-white/10">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold text-white">{userName}</p>
                        </div>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Perfil" className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-white/10 shadow-lg bg-gray-800" />
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
            </div>

            {/* Mobile Search Button (visible only on mobile) */}
            <button onClick={openCommand} className="md:hidden absolute left-14 text-white/50 hover:text-white">
                <MagnifyingGlassIcon className="w-5 h-5" />
            </button>

            {/* Slide-Over Manual */}
            <ManualUsuarioPanel isOpen={manualOpen} onClose={() => setManualOpen(false)} />

        </header>
    );
}
