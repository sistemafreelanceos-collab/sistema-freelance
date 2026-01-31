import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { provider_token, start, end } = body;

        if (!provider_token) {
            return NextResponse.json({ error: "Token de Google no proporcionado. Por favor cierra sesión y vuelve a entrar con Google." }, { status: 401 });
        }

        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: provider_token });

        const calendar = google.calendar({ version: 'v3', auth });

        // 1. DEFINIR RANGO DE FECHAS INTELIGENTE
        // Si el frontend no manda fechas, usamos un rango por defecto seguro:
        // Desde: 1 mes atrás (para ver historial reciente)
        // Hasta: 3 meses adelante (para planeación)
        const defaultStart = new Date();
        defaultStart.setMonth(defaultStart.getMonth() - 1);

        const defaultEnd = new Date();
        defaultEnd.setMonth(defaultEnd.getMonth() + 3);

        const timeMin = start ? new Date(start).toISOString() : defaultStart.toISOString();
        const timeMax = end ? new Date(end).toISOString() : defaultEnd.toISOString();

        // 2. PEDIR EVENTOS A GOOGLE
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin,
            timeMax: timeMax,
            maxResults: 2500, // Aumentamos de 100 a 2500 para no perder nada
            singleEvents: true, // Expande los eventos recurrentes (ej: Daily Standup)
            orderBy: 'startTime',
        });

        const items = response.data.items || [];

        // 3. MAPEO DE DATOS PARA ONYX OS
        const mappedEvents = items.map((event) => {
            // Google devuelve 'dateTime' para eventos precisos y 'date' para eventos de todo el día
            const startRaw = event.start?.dateTime || event.start?.date;
            const endRaw = event.end?.dateTime || event.end?.date;

            // Detectar si es todo el día (si no tiene dateTime, es date puro)
            const isAllDay = !event.start?.dateTime;

            return {
                id: event.id || Math.random().toString(36),
                title: `📅 ${event.summary || '(Sin título)'}`,
                start: startRaw ? new Date(startRaw) : new Date(),
                end: endRaw ? new Date(endRaw) : new Date(),
                allDay: isAllDay,
                resource: {
                    // Guardamos metadatos útiles
                    descripcion: event.description || "",
                    ubicacion: event.location || "",
                    link: event.htmlLink,
                    categoria: "Google",
                    tipo_evento: 'google_event', // Tipo específico para distinguir
                    es_automatico: true,
                    completada: false, // Los eventos de calendario no se "completan" igual que las tareas
                    colorOverride: event.colorId ? undefined : "#DB4437", // Usar rojo si no trae color propio
                    googleId: event.id
                }
            };
        });

        return NextResponse.json(mappedEvents);

    } catch (error: any) {
        console.error("Google API Error:", error);

        // Manejo específico de Token Expirado
        if (error.code === 401 || error.message?.includes('invalid_token')) {
            return NextResponse.json({ error: "Sesión de Google expirada" }, { status: 401 });
        }

        return NextResponse.json({ error: error.message || "Error desconocido" }, { status: 500 });
    }
}
