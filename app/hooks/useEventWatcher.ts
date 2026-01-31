
import { useEffect, useState, useRef } from 'react';
import { useCalendario } from './useCalendario';
import { toast } from 'sonner';
import moment from 'moment';

// Sonido sutil "Ping" (Base64 para no depender de archivos externos)
const NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Placeholder corto (se necesitaría uno real, usaremos un truco o sin sonido si falla)
// Nota: El base64 de arriba es dummy. Usaremos uno real simple o un 'beep'.
// Mejor opción: AudioContext oscillator para no cargar assets.

export function useEventWatcher() {
    const { eventos } = useCalendario(); // Asumimos que esto trae todo mezclado
    const [alertMinutes, setAlertMinutes] = useState(10); // Configurable
    const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());

    // Referencia para el intervalo
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Cargar Preferencias y Permisos
    useEffect(() => {
        const savedMin = localStorage.getItem('onyx_alert_minutes');
        if (savedMin) setAlertMinutes(parseInt(savedMin));

        // Pedir permiso para Notificaciones Nativas
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // 2. Función de Reproducción de Sonido (Oscilador)
    const playSound = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.error("Audio error", e);
        }
    };

    // 3. El Cerebro (Check Logic)
    const checkEvents = () => {
        if (!eventos || eventos.length === 0) return;

        const now = moment();

        eventos.forEach((ev: any) => {
            // Validar que el evento tenga fecha/hora
            if (!ev.start && !ev.fecha) return;

            const startStr = ev.start?.dateTime || ev.start || `${ev.fecha}T${ev.hora || '09:00'}`;
            const eventTime = moment(startStr);

            // Si el evento es hoy
            if (!eventTime.isSame(now, 'day')) return;

            const diffMinutes = eventTime.diff(now, 'minutes');
            const eventId = ev.id;

            // Lógica de Disparo:
            // - Faltan entre 0 y alertMinutes
            // - No ha pasado todavía (diff > 0)
            // - No ha sido notificado ya
            if (diffMinutes > 0 && diffMinutes <= alertMinutes && !notifiedIds.has(eventId)) {
                triggerAlert(ev, diffMinutes);
                setNotifiedIds(prev => new Set(prev).add(eventId));
            }
        });
    };

    // 4. Disparador de Alertas
    const triggerAlert = (ev: any, minutesLeft: number) => {
        const title = `📅 ${ev.summary || ev.titulo || 'Evento'}`;
        const body = `Comienza en ${minutesLeft} minutos.`;

        // A. Sonido
        playSound();

        // B. Toast In-App
        toast.message(title, {
            description: body,
            action: {
                label: "Ver",
                onClick: () => console.log("Nav to event"), // Podríamos navegar al calendario
            },
            duration: 10000, // Durar bastante
        });

        // C. Notificación Nativa (Si está oculto o minimizado)
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            // Solo si el documento está oculto (opcional, o siempre)
            if (document.visibilityState === 'hidden' || true) {
                new Notification(title, {
                    body: body,
                    icon: '/icon.png' // Icono genérico
                });
            }
        }
    };

    // 5. Ciclo de Vida (Polling)
    useEffect(() => {
        // Ejecutar chequeo inicial
        checkEvents();

        // Configurar intervalo (cada 60s)
        intervalRef.current = setInterval(checkEvents, 60000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [eventos, alertMinutes, notifiedIds]); // Dependencias: si cambian eventos o config, reevaluar.

    return {
        alertMinutes,
        setAlertMinutes: (min: number) => {
            setAlertMinutes(min);
            localStorage.setItem('onyx_alert_minutes', min.toString());
        }
    };
}
