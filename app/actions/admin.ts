"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Verifica si el usuario actual es admin
 */
export async function checkIsAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    return profile?.role === 'admin';
}

/**
 * Obtiene todos los usuarios (Solo para Admins)
 */
export async function getAdminUsers() {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) throw new Error("Unauthorized");

    const supabase = createClient();
    // Ordenamos por fecha de creación desc
    const { data: users, error } = await (await supabase)
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return users;
}

/**
 * Actualiza el rol de un usuario (Solo para Admins)
 */
export async function updateUserRole(targetUserId: string, newRole: 'admin' | 'user') {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) throw new Error("Unauthorized");

    const supabase = createClient();
    const { error } = await (await supabase)
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetUserId);

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/admin');
    return { success: true };
}
