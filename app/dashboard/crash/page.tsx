"use client";

import { useEffect } from "react";
import { Button } from "@/app/components/ui/Button";

export default function CrashPage() {

    const throwError = () => {
        throw new Error("💥 Boom! Test Error triggered manually.");
    };

    return (
        <div className="p-8 flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Zona de Peligro</h1>
            <p className="text-gray-400 mb-8">Esta página está diseñada para probar la pantalla de error.</p>

            <Button variant="danger" onClick={throwError}>
                Detonar Error
            </Button>
        </div>
    );
}
