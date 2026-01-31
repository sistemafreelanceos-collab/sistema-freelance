import { supabase } from "@/lib/supabaseClient";
import { useWorkspace } from "../providers/WorkspaceProvider";

export const useLogger = () => {
    const { currentWorkspace } = useWorkspace();

    const logEvent = async (
        tipo: 'finanzas' | 'cliente' | 'reunion' | 'habito' | 'sistema',
        mensaje: string,
        icono: string,
        metadata?: any
    ) => {
        if (!currentWorkspace) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            await supabase.from('timeline').insert({
                workspace_id: currentWorkspace.id,
                user_id: user.id,
                tipo,
                mensaje,
                icono,
                metadata: metadata || {},
            });
        } catch (error) {
            console.error("Error logging event:", error);
        }
    };

    return { logEvent };
};
