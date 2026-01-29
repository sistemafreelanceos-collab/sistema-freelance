"use client";

import { useEffect } from "react";
import { ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to an analytics service could go here
        console.error("Dashboard Error:", error);
    }, [error]);

    return (
        <div className="min-h-[500px] flex items-center justify-center p-6">
            <div className="bg-[#161B22] border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                <div className="bg-red-500/10 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-6">
                    <ExclamationTriangleIcon className="w-10 h-10 text-red-500" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">¡Ups! Algo salió mal</h2>
                <p className="text-gray-400 text-sm mb-6">
                    Ha ocurrido un error inesperado al cargar esta sección. No te preocupes, tus datos están seguros.
                </p>

                <div className="bg-black/30 p-4 rounded-xl border border-white/5 mb-6 text-left">
                    <p className="text-[10px] text-gray-500 font-mono break-all">
                        Error: {error.message || "Unknown error"}
                    </p>
                    {error.digest && (
                        <p className="text-[10px] text-gray-600 font-mono mt-1">ID: {error.digest}</p>
                    )}
                </div>

                <button
                    onClick={() => reset()}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/20"
                >
                    <ArrowPathIcon className="w-5 h-5" />
                    Reintentar
                </button>
            </div>
        </div>
    );
}
