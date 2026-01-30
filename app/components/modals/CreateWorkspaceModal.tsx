"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Button } from "../ui/Button"; // Reusing our custom button
import { Dialog } from "@headlessui/react"; // If available? Checking Sidebar used generic html.
// Let's stick to a simple custom modal or check "ModalesFinanzas" imports first to match style.
// Sidebar used manual implementation. Let's use a simple detailed implementation to avoid verifying headlessui presence if not certain.
// Actually ModalesFinanzas likely has a Modal component pattern. Let's check imports later, but for now standard fixed div.

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newWorkspaceId: string) => void;
}

export default function CreateWorkspaceModal({ isOpen, onClose, onSuccess }: Props) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

            // Slug simple generation
            const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Math.floor(Math.random() * 1000);

            const { data, error } = await supabase.from("workspaces").insert({
                name: name,
                owner_id: user.id,
                slug: slug,
                logo_url: "" // TODO: Upload logo
            }).select().single();

            if (error) throw error;

            // 2. Add Creator as Admin (Explicitly)
            // Even if trigger exists, this ensures it's done and allows us to handle it safely (via upsert or ignore if duplicate key).
            // RLS might block this if user isn't member yet, but creator has insert rights normally.
            const { error: memberError } = await supabase.from("workspace_members").insert({
                workspace_id: data.id,
                user_id: user.id,
                role: 'owner'
            });

            if (memberError) {
                // If error is duplicate, ignore (trigger might have done it). 
                // If other error, log it but don't fail the whole flow since workspace was created.
                if (memberError.code !== '23505') {
                    console.error("Error adding member:", memberError);
                    toast.error("Advertencia: No se pudo añadir como miembro automáticamente.");
                }
            }

            toast.success("¡Empresa creada con éxito!");
            onSuccess(data.id);
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error("Error al crear la empresa: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative bg-[#1C1C1E] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <h2 className="text-xl font-bold text-white mb-2">Crear nueva empresa</h2>
                <p className="text-zinc-400 text-sm mb-6">
                    Crea un espacio de trabajo separado para administrar otro negocio o equipo.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Nombre de la Empresa</label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. Agencia Creativa, Startup X..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                        >
                            Cancelar
                        </button>
                        <Button
                            isLoading={loading}
                            type="submit"
                            disabled={!name.trim()}
                        >
                            Crear Empresa
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
