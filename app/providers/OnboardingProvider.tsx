"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { supabase } from "@/lib/supabaseClient";
import { useWorkspace } from "@/app/providers/WorkspaceProvider";
import { toast } from "sonner";

interface OnboardingContextType {
    startTour: () => void;
    startModuleTour: (module: 'finanzas' | 'clientes' | 'calendario') => void;
}

// DriverJS Types help
type DriveStep = {
    element?: string;
    popover: {
        title: string;
        description: string;
        side?: "top" | "right" | "bottom" | "left" | "top-start" | "top-end" | "bottom-start" | "bottom-end" | "right-start" | "right-end" | "left-start" | "left-end"; // driver.js specific sides
        align?: "start" | "center" | "end";
    };
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const { currentWorkspace } = useWorkspace();
    const [hasSeenGlobal, setHasSeenGlobal] = useState(true);

    const tourSteps = {
        global: [
            {
                popover: {
                    title: '👋 ¡Bienvenido a OnyxOS!',
                    description: 'Tu nuevo sistema operativo para gestionar clientes, finanzas y equipo.',
                    // No side/element = Center
                }
            },
            { element: '#tour-workspace-switcher', popover: { title: '🏢 Tu Espacio', description: 'Cambia entre tu espacio Personal y tu Empresa aquí.', side: "right", align: 'start' } },
            { element: '#tour-global-search', popover: { title: '⚡ Buscador Global (Ctrl + K)', description: 'Navega rápido sin usar el mouse.', side: "bottom", align: 'start' } },
            { element: '#tour-nav-clientes', popover: { title: '👥 Clientes', description: 'Tu CRM y gestión de proyectos.', side: "right", align: 'start' } },
            { element: '#tour-nav-finanzas', popover: { title: '💰 Finanzas', description: 'Ingresos, gastos y presupuestos.', side: "right", align: 'start' } },
            { element: '#tour-settings', popover: { title: '⚙️ Equipo', description: 'Invita colaboradores y configura tu cuenta.', side: "right", align: 'start' } }
        ],
        finanzas: [
            {
                popover: {
                    title: '💰 Módulo Financiero',
                    description: 'Aquí controlas la salud de tu negocio. Vamos a ver lo clave.',
                }
            },
            { element: '#tour-finance-overview', popover: { title: '📊 Visión General', description: 'Tu balance actual, ingresos y gastos del mes.', side: "bottom", align: 'start' } },
            { element: '#tour-finance-tabs', popover: { title: '📑 Pestañas', description: 'Navega entre Tablero, Semáforo (Presupuestos) y Recurrentes (Suscripciones).', side: "bottom", align: 'start' } },
        ],
        clientes: [
            {
                popover: {
                    title: '👥 Cartera de Clientes',
                    description: 'Gestiona proyectos y relaciones comerciales.',
                }
            },
            { element: '#tour-clients-header', popover: { title: '➕ Nuevo Cliente', description: 'Registra un nuevo cliente o prospecto aquí.', side: "bottom", align: 'start' } },
            { element: '#tour-clients-search', popover: { title: '🔍 Buscador', description: 'Filtra rápidamente por nombre o empresa.', side: "bottom", align: 'start' } },
        ],
        calendario: [
            {
                popover: {
                    title: '📅 Agenda Operativa',
                    description: 'Tu tiempo es dinero. Organízalo aquí.',
                }
            },
            { element: '#tour-calendar-sync', popover: { title: '🔄 Google Sync', description: 'Sincroniza tus eventos bidireccionalmente.', side: "bottom", align: 'start' } },
            { element: '#tour-calendar-add', popover: { title: '➕ Agendar', description: 'Crea tareas, bloquea tiempo o registra entregas.', side: "bottom", align: 'start' } },
            { element: '#tour-calendar-capacity', popover: { title: '🔋 Capacidad Diaria', description: 'Evita el burnout. Mira cuántas horas reales tienes disponibles.', side: "left", align: 'start' } },
        ]
    };

    useEffect(() => {
        if (!currentWorkspace) return;
        const checkStatus = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const { data } = await supabase.from("profiles").select("has_seen_onboarding").eq("id", session.user.id).single();
            if (data && !data.has_seen_onboarding) {
                setHasSeenGlobal(false);
                setTimeout(() => driveTour('global', session.user.id), 1500);
            }
        };
        checkStatus();
    }, [currentWorkspace]);

    const driveTour = (tourType: 'global' | 'finanzas' | 'clientes' | 'calendario', userId?: string) => {
        const steps = tourSteps[tourType];

        const tourDriver = driver({
            showProgress: true,
            animate: true,
            steps: steps as any,
            onDestroyStarted: () => {
                tourDriver.destroy();
                if (tourType === 'global' && userId) {
                    completeGlobalOnboarding(userId);
                } else if (tourType !== 'global') {
                    localStorage.setItem(`has_seen_tour_${tourType}`, 'true');
                }
            },
        });
        tourDriver.drive();
    };

    const completeGlobalOnboarding = async (userId: string) => {
        await supabase.from("profiles").update({ has_seen_onboarding: true }).eq("id", userId);
        setHasSeenGlobal(true);
        toast.success("¡Tour completado! A trabajar 🚀");
    };

    const startTour = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) driveTour('global', session.user.id);
    };

    const startModuleTour = (module: 'finanzas' | 'clientes' | 'calendario') => {
        const seen = localStorage.getItem(`has_seen_tour_${module}`);
        if (!seen) {
            driveTour(module);
        }
    };

    return (
        <OnboardingContext.Provider value={{ startTour, startModuleTour }}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error("useOnboarding must be used within an OnboardingProvider");
    }
    return context;
}
