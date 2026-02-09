"use client";

import { useState, useRef, useEffect } from "react";
import { useWorkspace } from "@/app/providers/WorkspaceProvider";
import { ChevronUpDownIcon, PlusIcon, CheckIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import CreateWorkspaceModal from "../modals/CreateWorkspaceModal";
import RenameWorkspaceModal from "../modals/RenameWorkspaceModal"; // Importamos el modal
import { supabase } from "@/lib/supabaseClient";

export default function WorkspaceSwitcher({ collapsed }: { collapsed: boolean }) {
    const { workspaces, currentWorkspace, switchWorkspace, isLoading, refreshWorkspaces } = useWorkspace();
    const [isOpen, setIsOpen] = useState(false);

    // Modales
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);

    // Estado para saber qué workspace estamos renombrando
    const [workspaceToRename, setWorkspaceToRename] = useState<{ id: string, name: string } | null>(null);

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
        let isMounted = true; // Evitar race conditions

        async function fetchPlan() {
            if (!currentWorkspace?.id) {
                if (isMounted) setPlanLabel("...");
                return;
            }

            try {
                // Pequeño cache local o Skeleton instantáneo
                setPlanLabel("...");

                const { data, error } = await supabase
                    .from('profiles')
                    .select('plan, plan_status')
                    .eq('id', currentWorkspace.owner_id)
                    .single();

                if (!isMounted) return;

                if (data) {
                    const isPremium = data.plan === 'premium' && data.plan_status === 'active';
                    setPlanLabel(isPremium ? "Plan Premium" : "Plan Gratuito");
                } else {
                    setPlanLabel("Plan Gratuito"); // Fallback seguro
                }
            } catch (e) {
                console.error("Error fetching plan", e);
                if (isMounted) setPlanLabel("Plan Gratuito");
            }
        }

        fetchPlan();

        return () => { isMounted = false; };
    }, [currentWorkspace?.id]); // Usamos ID para ser más precisos

    const handleCreateSuccess = (newId: string) => {
        switchWorkspace(newId);
        window.location.reload(); // Forzar recarga limpia
    };

    const handleRenameSuccess = async () => {
        await refreshWorkspaces(); // Recargar lista para ver el nombre nuevo
    };

    const openRenameModal = (e: React.MouseEvent, wsId: string, wsName: string) => {
        e.stopPropagation(); // Evitar cambiar de workspace al hacer click en editar
        setWorkspaceToRename({ id: wsId, name: wsName });
        setShowRenameModal(true);
        setIsOpen(false); // Cerrar dropdown
    };

    // SKELETON MEJORADO (Mantiene la estructura para evitar saltos)
    if (isLoading && !currentWorkspace) return (
        <div className={`flex items-center gap-2 w-full p-2 rounded-lg bg-white/5 animate-pulse ${collapsed ? "justify-center" : "justify-between"}`}>
            <div className="w-8 h-8 rounded-lg bg-white/10"></div>
            {!collapsed && (
                <div className="flex flex-col gap-1 flex-1">
                    <div className="h-3 w-20 bg-white/10 rounded"></div>
                    <div className="h-2 w-12 bg-white/10 rounded"></div>
                </div>
            )}
        </div>
    );

    // Fallback safe rendering
    const displayName = currentWorkspace?.name || "Seleccionar...";
    const displayInitials = displayName.substring(0, 2).toUpperCase();

    // Initials fallback logic
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
                            <div className="flex flex-col items-start truncate animate-in fade-in duration-300">
                                <span className="font-semibold text-sm text-white truncate max-w-[140px]">
                                    {displayName}
                                </span>
                                <span className={`text-[10px] capitalize truncate ${planLabel === "Plan Premium" ? "text-yellow-500 font-bold" : "text-zinc-400"}`}>
                                    {planLabel}
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
                                <div
                                    key={ws.id}
                                    onClick={() => {
                                        switchWorkspace(ws.id);
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer group/item"
                                >
                                    <div className="flex items-center gap-2 truncate flex-1">
                                        <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-xs border border-white/5">
                                            {ws.name.substring(0, 1).toUpperCase()}
                                        </div>
                                        <span className="truncate max-w-[120px]">{ws.name}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Edit Button (Only visible on hover) */}
                                        <button
                                            onClick={(e) => openRenameModal(e, ws.id, ws.name)}
                                            className="p-1 hover:bg-white/10 rounded-md text-zinc-500 hover:text-white opacity-0 group-hover/item:opacity-100 transition-opacity"
                                            title="Renombrar empresa"
                                        >
                                            <PencilSquareIcon className="w-3.5 h-3.5" />
                                        </button>

                                        {currentWorkspace?.id === ws.id && (
                                            <CheckIcon className="w-4 h-4 text-emerald-500" />
                                        )}
                                    </div>
                                </div>
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

            {workspaceToRename && (
                <RenameWorkspaceModal
                    isOpen={showRenameModal}
                    onClose={() => setShowRenameModal(false)}
                    workspaceId={workspaceToRename.id}
                    currentName={workspaceToRename.name}
                    onSuccess={handleRenameSuccess}
                />
            )}
        </>
    );
}
