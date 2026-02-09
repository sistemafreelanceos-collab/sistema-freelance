"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { supabase } from "@/lib/supabaseClient";
import { useWorkspace } from "@/app/providers/WorkspaceProvider";
import { toast } from "sonner";
import WelcomeModal from "../components/modals/WelcomeModal"; // Asegúrate que este archivo exista

interface OnboardingContextType {
    startTour: () => void;
    startModuleTour: (module: 'finanzas' | 'clientes' | 'calendario') => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const { currentWorkspace } = useWorkspace();

    // Estados
    const [showWelcome, setShowWelcome] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Configuración del Tour (Tus pasos originales)
    const tourSteps = {
        global: [
            { popover: { title: '👋 ¡Bienvenido!', description: 'Este es tu nuevo sistema operativo.' } },
            { element: '#tour-workspace-switcher', popover: { title: '🏢 Tu Espacio', description: 'Cambia entre empresas aquí.', side: "right", align: 'start' } },
            { element: '#tour-nav-finanzas', popover: { title: '💰 Finanzas', description: 'Controla tus ingresos y gastos.', side: "right", align: 'start' } },
        ],
        finanzas: [], // ... (puedes rellenar tus pasos aquí)
        clientes: [],
        calendario: []
    };

    useEffect(() => {
        if (!currentWorkspace) return;

        const checkStatus = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            setUserId(session.user.id);

            // Verificamos si ya vio el onboarding
            const { data } = await supabase.from("profiles").select("has_seen_onboarding").eq("id", session.user.id).single();

            // SI ES NUEVO (false) -> Abrimos el Modal
            if (data && !data.has_seen_onboarding) {
                setShowWelcome(true);
            }
        };
        checkStatus();
    }, [currentWorkspace]);

    const handleWelcomeFinish = () => {
        setShowWelcome(false);
        // Al cerrar el modal, iniciamos el Tour automáticamente
        setTimeout(() => {
            if (userId) driveTour('global', userId);
        }, 500);
    };

    const driveTour = (tourType: string, uid?: string) => {
        const steps = tourSteps[tourType as keyof typeof tourSteps] || [];
        const tourDriver = driver({
            showProgress: true,
            animate: true,
            steps: steps as any,
            onDestroyStarted: () => {
                tourDriver.destroy();
                if (tourType === 'global' && uid) completeGlobalOnboarding(uid);
                else localStorage.setItem(`has_seen_tour_${tourType}`, 'true');
            },
        });
        tourDriver.drive();
    };

    const completeGlobalOnboarding = async (uid: string) => {
        await supabase.from("profiles").update({ has_seen_onboarding: true }).eq("id", uid);
        toast.success("¡Listo! A trabajar 🚀");
    };

    return (
        <OnboardingContext.Provider value={{ startTour: () => userId && driveTour('global', userId), startModuleTour: (m) => driveTour(m) }}>
            {children}

            {/* AQUÍ ESTABA LO QUE FALTABA */}
            <WelcomeModal
                isOpen={showWelcome}
                workspaceId={currentWorkspace?.id || ""}
                currentName={currentWorkspace?.name || "Tu Empresa"}
                onComplete={handleWelcomeFinish}
            />
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (context === undefined) throw new Error("useOnboarding must be used within an OnboardingProvider");
    return context;
}
