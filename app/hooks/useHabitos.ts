import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { UserXP } from "../../types";
import { toast } from "sonner";
import { useWorkspace } from "../providers/WorkspaceProvider";

export function useHabitos() {
    const { currentWorkspace } = useWorkspace();
    const [userId, setUserId] = useState("");
    const [proyectos, setProyectos] = useState<{ id: string, nombre: string }[]>([]);
    const [userXP, setUserXP] = useState<UserXP>({ xp_total: 0, nivel: 1 } as UserXP);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const uid = session.user.id;
            setUserId(uid);

            if (!currentWorkspace) return;

            // Cargar Proyectos (Del Workspace actual) y XP (Del Usuario global)
            const [resProyectos, resXP] = await Promise.all([
                supabase.from("proyectos").select("id, nombre").eq("workspace_id", currentWorkspace.id),
                supabase.from("user_xp").select("*").eq("owner_id", uid).single()
            ]);

            setProyectos(resProyectos.data || []);

            if (resXP.data) {
                setUserXP(resXP.data);
            } else {
                // Crear fila de XP si no existe
                const { data: newXP } = await supabase.from("user_xp").insert({ owner_id: uid, xp_total: 0, nivel: 1 }).select().single();
                if (newXP) setUserXP(newXP);
            }
            setLoading(false);
        };
        init();
    }, [currentWorkspace]);

    const updateXP = async (puntos: number) => {
        const nuevoXP = Math.max(0, userXP.xp_total + puntos);
        let nuevoNivel = userXP.nivel;
        if (nuevoXP >= nuevoNivel * 100) {
            nuevoNivel++;
            toast.success(`🎉 ¡SUBISTE A NIVEL ${nuevoNivel}! 🎉`);
        }
        const newData = { ...userXP, xp_total: nuevoXP, nivel: nuevoNivel };
        setUserXP(newData);
        await supabase.from("user_xp").update({ xp_total: nuevoXP, nivel: nuevoNivel }).eq("owner_id", userId);
    };

    return {
        userId,
        proyectos,
        userXP,
        loading,
        updateXP
    };
}
