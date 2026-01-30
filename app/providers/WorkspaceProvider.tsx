"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Workspace, WorkspaceMember } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
    const router = useRouter();

    const fetchWorkspaces = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Obtener workspaces donde soy miembro
            const { data: members, error: membersError } = await supabase
                .from('workspace_members')
                .select('workspace_id, role, workspaces(*)')
                .eq('user_id', user.id);

            if (membersError) {
                console.error("Error fetching workspaces:", membersError);
                // No mostrar error toast si es porque la tabla no existe aún (durante migración)
                if (membersError.code !== '42P01') {
                    toast.error("Error cargando empresas");
                }
                return;
            }

            if (members && members.length > 0) {
                // Mapear resultado para extraer el objeto workspace limpio
                const loadedWorkspaces = members.map((m: any) => m.workspaces) as Workspace[];
                setWorkspaces(loadedWorkspaces);

                // 2. Determinar workspace activo
                const storedWorkspaceId = localStorage.getItem('onyx_workspace_id');
                const lastActive = loadedWorkspaces.find(w => w.id === storedWorkspaceId) || loadedWorkspaces[0];

                setCurrentWorkspace(lastActive);

                // Setear el rol actual para el workspace activo
                const activeMember = members.find((m: any) => m.workspace_id === lastActive.id);
                setCurrentRole(activeMember?.role || 'viewer');

                // Guardar en local storage por si acaso
                if (lastActive) localStorage.setItem('onyx_workspace_id', lastActive.id);
            } else {
                // Caso raro: Usuario sin workspace (si falló migración)
                setWorkspaces([]);
                setCurrentWorkspace(null);
            }

        } catch (error) {
            console.error("Workspace Provider Logic Error:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWorkspaces();
    }, [fetchWorkspaces]);

    const switchWorkspace = async (workspaceId: string) => {
        const target = workspaces.find(w => w.id === workspaceId);
        if (target) {
            setCurrentWorkspace(target);
            localStorage.setItem('onyx_workspace_id', target.id);
            toast.success(`Cambiado a: ${target.name}`);

            // Recargar para refrescar data de otros hooks que dependen del workspace_id
            // Opcional: Podríamos hacer soft refresh si los hooks escuchan el context ID
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
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error("useWorkspace must be used within a WorkspaceProvider");
    }
    return context;
}
