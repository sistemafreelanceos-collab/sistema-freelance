"use client";
import { useEffect, useRef } from 'react';
import { EventoCalendario } from '../../../../types';

interface Props {
    eventos: EventoCalendario[];
}

export default function EventNotifier({ eventos }: Props) {
    // Usamos un ref para no disparar efectos infinitos si cambia 'eventos'
    // pero queremos chequear basado en clock.
    // Sin embargo, lo más simple es un setInterval que chequee.

    // Guardamos los IDs notificados para no repetir
    const notificadosRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const checkEventos = () => {
            const now = new Date();
            const fechaString = now.toDateString();
            const horaString = now.toTimeString().slice(0, 5); // "14:30"

            eventos.forEach(ev => {
                // Solo eventos del futuro/presente, no pasados
                // Y que sean TAREAS (no cobros automáticos)
                if (ev.resource?.tipo_evento !== 'tarea') return;

                const evDate = new Date(ev.start);

                // Coincidencia exacta de minuto
                if (
                    evDate.toDateString() === fechaString &&
                    evDate.toTimeString().slice(0, 5) === horaString
                ) {
                    if (!notificadosRef.current.has(ev.id)) {
                        notificadosRef.current.add(ev.id);

                        // Disparar Modal (Usamos un evento custom del navegador para simplicidad
                        // o podríamos pasar una prop 'onNotify', pero para desacoplar:
                        // window.dispatchEvent...) 
                        // Ojo: Mejor pasar prop si es posible. Pero como este componente
                        // es "invisible", usaremos un Hack de Audio + Alert o 
                        // mejor: un modal que se renderiza AQUI MISMO.

                        // Vamos a disparar un CustomEvent que la Page escuche
                        const event = new CustomEvent('calendar-alarm', { detail: ev });
                        window.dispatchEvent(event);
                    }
                }
            });
        };

        const interval = setInterval(checkEventos, 1000 * 60); // Chequear cada minuto
        checkEventos(); // Chequear al montar

        return () => clearInterval(interval);
    }, [eventos]);

    return null; // Componente lógico, sin UI propia directa (la UI la maneja la Page)
}
