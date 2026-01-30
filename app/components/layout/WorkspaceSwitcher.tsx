"use client";

import { useState, useRef, useEffect } from "react";
import { useWorkspace } from "@/app/providers/WorkspaceProvider";
import { ChevronUpDownIcon, PlusIcon, CheckIcon } from "@heroicons/react/24/outline";
import CreateWorkspaceModal from "../modals/CreateWorkspaceModal";
import { supabase } from "@/lib/supabaseClient";

export default function WorkspaceSwitcher({ collapsed }: { collapsed: boolean }) {
    const { workspaces, currentWorkspace, switchWorkspace, isLoading } = useWorkspace();
    const [isOpen, setIsOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [planLabel, setPlanLabel] = useState("Cargando...");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch Plan of the Workspace Owner
    useEffect(() => {
        async function fetchPlan() {
            if (!currentWorkspace) {
                setPlanLabel("");
                return;
            }

            try {
                // We fetch the profile of the OWNER of the workspace to see the plan of that workspace
                const { data, error } = await supabase
                    .from('profiles')
                    .select('plan, plan_status')
                    .eq('id', currentWorkspace.owner_id)
                    .single();

                if (data) {
                    const isPremium = data.plan === 'premium' && data.plan_status === 'active';
                    setPlanLabel(isPremium ? "Plan Premium" : "Plan Gratuito");
                } else {
                    setPlanLabel("Plan Gratuito");
                }
            } catch (e) {
                console.error("Error fetching plan", e);
                setPlanLabel("Plan Gratuito");
            }
        }

        fetchPlan();
    }, [currentWorkspace]);

    const handleCreateSuccess = (newId: string) => {
        switchWorkspace(newId);
        window.location.reload();
    };

    if (isLoading) return <div className="h-12 w-full animate-pulse bg-white/5 rounded-lg"></div>;

    const initials = currentWorkspace?.name
        ? currentWorkspace.name.substring(0, 2).toUpperCase()
        : "ON";

    return (
        <>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 w-full p-2 rounded-lg hover:bg-white/5 transition-colors group ${collapsed ? "justify-center" : "justify-between"}`}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        {/* Logo / Avatar */}
                        <div className="w-8 h-8 min-w-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-900/20 group-hover:scale-105 transition-transform">
                            {currentWorkspace?.logo_url ? (
                                <img src={currentWorkspace.logo_url} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <span className="text-sm">{initials}</span>
                            )}
                        </div>

                        {/* Name (Hidden if collapsed) */}
                        {!collapsed && (
                            <div className="flex flex-col items-start truncate">
                                <span className="font-semibold text-sm text-white truncate max-w-[140px]">
                                    {currentWorkspace?.name || "Seleccionar..."}
                                </span>
                                <span className={`text-[10px] capitalize truncate ${planLabel === "Plan Premium" ? "text-yellow-500 font-bold" : "text-zinc-400"}`}>
                                    {currentWorkspace ? planLabel : "Sin Espacio"}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Arrow */}
                    {!collapsed && (
                        <ChevronUpDownIcon className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                    )}
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className={`absolute top-full left-0 mt-2 w-64 bg-[#1C1C1E] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5 animate-in fade-in zoom-in-95 duration-100 ${collapsed ? "left-12 top-0" : ""}`}>

                        {/* Header */}
                        <div className="px-3 py-2 bg-white/5">
                            <p className="text-xs font-medium text-zinc-400">Mis Empresas</p>
                        </div>

                        {/* List */}
                        <div className="max-h-60 overflow-y-auto py-1">
                            {workspaces.map((ws) => (
                                <button
                                    key={ws.id}
                                    onClick={() => {
                                        switchWorkspace(ws.id);
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-xs border border-white/5">
                                            {ws.name.substring(0, 1).toUpperCase()}
                                        </div>
                                        <span className="truncate max-w-[150px]">{ws.name}</span>
                                    </div>
                                    {currentWorkspace?.id === ws.id && (
                                        <CheckIcon className="w-4 h-4 text-emerald-500" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="p-1">
                            <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
                                onClick={() => {
                                    setIsOpen(false);
                                    setShowCreateModal(true);
                                }}
                            >
                                <PlusIcon className="w-4 h-4" />
                                Crear nueva empresa
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <CreateWorkspaceModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCreateSuccess}
            />
        </>
    );
}
