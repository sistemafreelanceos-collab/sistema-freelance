import { useState, useEffect, useRef, useCallback } from 'react';

export function useDailyBriefing(payload: any) {
    const [showBriefing, setShowBriefing] = useState(false);
    const [briefingText, setBriefingText] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const hasFiredRef = useRef(false);
    const payloadRef = useRef(payload);

    // Mantenemos los datos actualizados sin provocar re-renders infinitos
    useEffect(() => {
        payloadRef.current = payload;
    }, [payload]);

    const triggerBriefing = useCallback(async (todayStr: string, currentData: any) => {
        try {
            setIsLoading(true);
            setShowBriefing(true); // Mostrar modal cargando

            const response = await fetch('/api/daily-briefing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentData) // Usamos currentData
            });

            const data = await response.json();
            if (response.ok) {
                setBriefingText(data.briefing);
                localStorage.setItem('lastDailyBriefing', todayStr);
            } else {
                setBriefingText(data.briefing || "Hubo un error conectando con Onyx.");
                hasFiredRef.current = false; // Permitir reintento
            }
        } catch (e) {
            console.error("Error fetching daily briefing:", e);
            setBriefingText("Ocurrió un error inesperado de red.");
            hasFiredRef.current = false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const checkTime = useCallback(() => {
        const currentData = payloadRef.current;
        if (!currentData || !currentData.workspaceName) return; // Esperar a tener datos

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // ==========================================
        // MODO PRUEBA ACTIVADO
        // ==========================================
        const FORCE_TEST = true;

        if (FORCE_TEST) {
            if (!hasFiredRef.current) {
                hasFiredRef.current = true;
                triggerBriefing("TEST_MODE_OK", currentData);
            }
            return;
        }

        // Lógica normal
        if (currentHour >= 7 && (currentHour > 7 || currentMinute >= 30) && currentHour < 12) {
            const todayStr = now.toISOString().split('T')[0];
            const lastBriefing = localStorage.getItem('lastDailyBriefing');

            if (lastBriefing !== todayStr && !hasFiredRef.current) {
                hasFiredRef.current = true;
                triggerBriefing(todayStr, currentData);
            }
        }
    }, [triggerBriefing]);

    // Evaluar cuando cambie si ya tenemos "workspaceName" disponible
    useEffect(() => {
        if (payload.workspaceName && !hasFiredRef.current) {
            checkTime();
        }
    }, [payload.workspaceName, checkTime]);

    // Intervalo de cada minuto (por si el reloj cruza las 7:30 estando abierto)
    useEffect(() => {
        const interval = setInterval(checkTime, 60000);
        return () => clearInterval(interval);
    }, [checkTime]);

    const closeBriefing = () => {
        setShowBriefing(false);
    };

    return { showBriefing, briefingText, isLoading, closeBriefing };
}
