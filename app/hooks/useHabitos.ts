import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { UserXP } from "../../types";
import { toast } from "sonner";

export function useHabitos() {
    const [userId, setUserId] = useState("");
    const [proyectos, setProyectos] = useState<{ id: string, nombre: string }[]>([]);
    const [userXP, setUserXP] = useState<UserXP>({ xp_total: 0, nivel: 1 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const uid = session.user.id;
            setUserId(uid);

            const [resProyectos, resXP] = await Promise.all([
                supabase.from("proyectos").select("id, nombre").eq("owner_id", uid),
                supabase.from("user_xp").select("xp_total, nivel").eq("owner_id", uid).single()
            ]);

            setProyectos(resProyectos.data || []);

            if (resXP.data) {
                setUserXP(resXP.data);
            } else {
                await supabase.from("user_xp").insert({ owner_id: uid, xp_total: 0, nivel: 1 });
            }
            setLoading(false);
        };
        init();
    }, []);

    const updateXP = async (puntos: number) => {
        const nuevoXP = Math.max(0, userXP.xp_total + puntos);
        let nuevoNivel = userXP.nivel;
        if (nuevoXP >= nuevoNivel * 100) {
            nuevoNivel++;
            toast.success(`🎉 ¡SUBISTE A NIVEL ${nuevoNivel}! 🎉`);
        }
        const newData = { xp_total: nuevoXP, nivel: nuevoNivel };
        setUserXP(newData);
        await supabase.from("user_xp").update(newData).eq("owner_id", userId);
    };

    return {
        userId,
        proyectos,
        userXP,
        loading,
        updateXP
    };
}
