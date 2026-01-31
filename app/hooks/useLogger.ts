import { supabase } from "@/lib/supabaseClient";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { toast } from "sonner"; // <--- IMPORTANTE

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

        // 1. Intentamos escribir
        const { error } = await supabase.from('timeline').insert({
            workspace_id: currentWorkspace.id,
            user_id: user.id,
            tipo,
            mensaje,
            icono,
            metadata: metadata || {},
        });

        // 2. 🛑 SI HAY ERROR, GRITAMOS (Aquí estaba el silencio antes)
        if (error) {
            console.error("❌ Error Bitácora:", error);
            // Esto te mostrará una alerta roja en la pantalla con la razón exacta
            toast.error(`Fallo al guardar en bitácora: ${error.message}`);
        }
    };

    return { logEvent };
};
