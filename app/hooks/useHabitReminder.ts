import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { usePathname, useRouter } from 'next/navigation';

export function useHabitReminder(userId: string | null) {
    const [showReminder, setShowReminder] = useState(false);
    const [missingHabitsCount, setMissingHabitsCount] = useState(0);
    const hasCheckedThisHour = useRef(false);
    const lastCheckTimeHour = useRef(-1);
    const pathname = usePathname();

    // 1. Configuración de Sonido
    const playSound = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            // Sonido "Bloop" característico
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.2);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } catch (e) {
            console.error("Audio error", e);
        }
    };

    const getFechaLocal = () => {
        const d = new Date();
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().split('T')[0];
    };

    const checkHabits = async () => {
        if (!userId) return;

        // No interrumpir si ya está en la página de hábitos
        if (pathname === '/dashboard/habitos') return;

        const hoy = getFechaLocal();

        try {
            // 1. Obtener hábitos activos
            const { data: habitosActivos } = await supabase
                .from('habitos')
                .select('id')
                .eq('owner_id', userId)
                .eq('activo', true);

            if (!habitosActivos || habitosActivos.length === 0) return; // No hay hábitos que trackear

            // 2. Obtener registros de hoy
            const { data: registrosHoy } = await supabase
                .from('registros_habitos')
                .select('habito_id')
                .eq('fecha', hoy)
                .in('habito_id', habitosActivos.map(h => h.id));

            const completadosId = new Set(registrosHoy?.map(r => r.habito_id) || []);
            const pendientes = habitosActivos.filter(h => !completadosId.has(h.id));

            if (pendientes.length > 0) {
                setMissingHabitsCount(pendientes.length);
                setShowReminder(true);
                playSound();
            }
        } catch (error) {
            console.error("Error checking habits:", error);
        }
    };

    useEffect(() => {
        if (!userId) return;

        const checkTime = () => {
            const now = new Date();
            const currentHour = now.getHours();

            // ==========================================
            // MODO PRUEBA DESACTIVADO (producción)
            // ==========================================
            const FORCE_TEST = false;

            if (FORCE_TEST) {
                // Si el force test está activo, chequeamos cada minuto (intervalo lo triggerea)
                // y disparamos si la IP o estado cambia.
                if (!hasCheckedThisHour.current) {
                    hasCheckedThisHour.current = true;
                    checkHabits();
                }
                return;
            }

            // Lógica normal: Disparar solo 1 vez cada cambio de hora (Ej: a las 9:00, a las 10:00, etc.)
            // Empezar a molestar desde las 10am hasta las 10pm
            if (currentHour >= 10 && currentHour <= 22) {
                if (lastCheckTimeHour.current !== currentHour) {
                    lastCheckTimeHour.current = currentHour;
                    checkHabits();
                }
            }
        };

        // Check inicial al montar
        checkTime();

        // Checkeo periódico
        const interval = setInterval(checkTime, 60000); // Revisar cada minuto si cambió la hora
        return () => clearInterval(interval);
    }, [userId, pathname]); // Si cambia de ruta o userId, re-evaluamos pero sin resetear la hora.

    const closeReminder = () => setShowReminder(false);

    return { showReminder, missingHabitsCount, closeReminder };
}
