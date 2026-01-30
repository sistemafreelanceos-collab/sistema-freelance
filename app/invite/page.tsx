"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

function InviteContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verificando invitación...");

    useEffect(() => {
        const accept = async () => {
            if (!token) {
                setStatus("error");
                setMessage("Token de invitación no encontrado.");
                return;
            }

            // Check if user is logged in
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // If not logged in, redirect to login with return URL
                // Note: The user MUST register/login first.
                // We should store the token in local storage or URL param to handle post-login.
                // For now, let's just ask them to login and come back (simple V1).
                setStatus("error");
                setMessage("Debes iniciar sesión para aceptar la invitación.");
                // Optionally redirect to login page with token
                return;
            }

            try {
                // Call the secure RPC function
                const { data, error } = await supabase.rpc("accept_invite", {
                    invite_token: token
                });

                if (error) throw error;

                if (data && data.success) {
                    setStatus("success");
                    setMessage("¡Te has unido al equipo correctamente!");
                    toast.success("Bienvenido al equipo");
                    // Redirect to dashboard after 2 seconds
                    setTimeout(() => router.push("/dashboard"), 2000);
                } else {
                    throw new Error(data?.error || "Invitación inválida o expirada.");
                }

            } catch (err: any) {
                console.error(err);
                setStatus("error");
                setMessage(err.message || "Ocurrió un error al procesar la invitación.");
            }
        };

        accept();
    }, [token, router]);

    return (
        <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-center p-4">
            <div className="bg-[#1C1C1E] border border-white/5 p-8 rounded-2xl max-w-md w-full text-center space-y-6">

                {status === "loading" && (
                    <div className="flex flex-col items-center animate-pulse">
                        <div className="w-12 h-12 bg-white/10 rounded-full mb-4"></div>
                        <h2 className="text-xl font-bold text-white">Procesando...</h2>
                        <p className="text-zinc-400">{message}</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full mb-4 flex items-center justify-center text-3xl">
                            🎉
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">¡Bienvenido!</h2>
                        <p className="text-zinc-400 mb-6">{message}</p>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-8 py-3 rounded-xl transition-all w-full"
                        >
                            Ir al Dashboard
                        </button>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full mb-4 flex items-center justify-center text-3xl">
                            ❌
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Error</h2>
                        <p className="text-red-400 mb-6">{message}</p>
                        <div className="space-y-3 w-full">
                            <button
                                onClick={() => router.push("/")}
                                className="bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-3 rounded-xl transition-all w-full"
                            >
                                Ir a Iniciar Sesión
                            </button>
                            <a href="/" className="block text-sm text-zinc-500 hover:text-white transition">
                                Volver al inicio
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function InvitePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0F1115] text-white flex items-center justify-center">Cargando...</div>}>
            <InviteContent />
        </Suspense>
    );
}
