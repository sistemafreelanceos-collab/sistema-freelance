"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Workspace } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import CreateWorkspaceModal from "../components/modals/CreateWorkspaceModal";

interface WorkspaceContextType {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    currentRole: string | null;
    isLoading: boolean;
    switchWorkspace: (workspaceId: string) => Promise<void>;
    refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
    const [currentRole, setCurrentRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Guardamos el ID del usuario actual para detectar cambios de sesión
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const router = useRouter();

    const fetchWorkspaces = useCallback(async () => {
        // Solo mostramos loading global si NO hay datos previos (Carga Inicial)
        // Esto evita el "pantallazo" al cambiar de ventana
        if (workspaces.length === 0) setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // 🛑 DETECCIÓN DE CAMBIO DE USUARIO
            // Si el usuario cambió (o se deslogueó), limpiamos todo inmediatamente
            if (!user) {
                setWorkspaces([]);
                setCurrentWorkspace(null);
                setCurrentUserId(null);
                localStorage.removeItem('onyx_workspace_id'); // Limpiar rastro anterior
                setIsLoading(false);
                return;
            }

            // Si es un usuario nuevo distinto al anterior, reseteamos estados visuales
            if (currentUserId && currentUserId !== user.id) {
                console.log("Cambio de usuario detectado, limpiando...");
                setWorkspaces([]);
                setCurrentWorkspace(null);
            }
            setCurrentUserId(user.id);

            // Consulta de workspaces
            const { data: members, error } = await supabase
                .from('workspace_members')
                .select('workspace_id, role, workspaces(*)')
                .eq('user_id', user.id);

            if (error) {
                console.error("Error fetching workspaces:", error);
                setIsLoading(false);
                return;
            }

            if (members && members.length > 0) {
                // Filtramos nulls por si acaso alguna relación está rota
                const loadedWorkspaces = members
                    .map((m: any) => m.workspaces)
                    .filter((w: any) => w !== null) as Workspace[];

                setWorkspaces(loadedWorkspaces);

                // 🛡️ LÓGICA ANTI-MEZCLA
                // Solo usamos el ID del localStorage si REALMENTE pertenece a este usuario
                const storedWorkspaceId = localStorage.getItem('onyx_workspace_id');
                const workspaceValido = loadedWorkspaces.find(w => w.id === storedWorkspaceId);

                const active = workspaceValido || loadedWorkspaces[0];

                setCurrentWorkspace(active);

                // Buscar rol
                const activeMember = members.find((m: any) => m.workspace_id === active.id);
                setCurrentRole(activeMember?.role || 'viewer');

                // Actualizar localStorage con el dato CONFIRMADO y SEGURO
                if (active) localStorage.setItem('onyx_workspace_id', active.id);

                setShowCreateModal(false);
            } else {
                // Si no tiene empresas, limpiamos y pedimos crear
                setWorkspaces([]);
                setCurrentWorkspace(null);
                localStorage.removeItem('onyx_workspace_id');
                setShowCreateModal(true);
            }
        } catch (error) {
            console.error("Critical Workspace Error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUserId]); // Dependencia clave

    // Escuchar cambios de autenticación en tiempo real
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                setWorkspaces([]);
                setCurrentWorkspace(null);
                setCurrentUserId(null);
                localStorage.removeItem('onyx_workspace_id');
                router.push('/');
            } else if (event === 'SIGNED_IN') {
                fetchWorkspaces();
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchWorkspaces, router]);

    // Carga inicial
    useEffect(() => {
        fetchWorkspaces();
    }, [fetchWorkspaces]);

    const switchWorkspace = async (workspaceId: string) => {
        const target = workspaces.find(w => w.id === workspaceId);
        if (target) {
            setCurrentWorkspace(target);
            localStorage.setItem('onyx_workspace_id', target.id);
            toast.success(`Cambiado a: ${target.name}`);

            // Recarga suave para actualizar componentes dependientes
            window.location.reload();
        }
    };

    return (
        <WorkspaceContext.Provider value={{
            workspaces,
            currentWorkspace,
            currentRole,
            isLoading,
            switchWorkspace,
            refreshWorkspaces: fetchWorkspaces
        }}>
            {children}

            <CreateWorkspaceModal
                isOpen={showCreateModal && !isLoading}
                onClose={() => {
                    if (workspaces.length > 0) setShowCreateModal(false);
                }}
                onSuccess={async (newId) => {
                    await fetchWorkspaces();
                    await switchWorkspace(newId);
                    setShowCreateModal(false);
                }}
            />
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) throw new Error("useWorkspace must be used within a WorkspaceProvider");
    return context;
}
