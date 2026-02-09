"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Button } from "../ui/Button";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    currentName: string;
    onSuccess: (newName: string) => void;
}

export default function RenameWorkspaceModal({ isOpen, onClose, workspaceId, currentName, onSuccess }: Props) {
    const [name, setName] = useState(currentName);
    const [loading, setLoading] = useState(false);

    // Sync name when modal opens or prop changes
    useEffect(() => {
        setName(currentName);
    }, [currentName, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (name.trim() === currentName) {
            onClose();
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from("workspaces")
                .update({ name: name.trim() })
                .eq("id", workspaceId);

            if (error) throw error;

            toast.success("Nombre actualizado correctamente");
            onSuccess(name.trim());
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error("Error al renombrar: " + error.message);
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
                <h2 className="text-xl font-bold text-white mb-2">Renombrar Empresa</h2>
                <p className="text-zinc-400 text-sm mb-6">
                    Elige un nuevo nombre para tu espacio de trabajo.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Nuevo Nombre</label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. Mi Nueva Agencia"
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
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
