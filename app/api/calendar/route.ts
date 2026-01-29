import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { provider_token } = await req.json();

        if (!provider_token) {
            return NextResponse.json({ error: "Token de Google no proporcionado" }, { status: 401 });
        }

        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: provider_token });

        const calendar = google.calendar({ version: 'v3', auth });

        // Pedimos eventos desde hoy hasta los próximos 30 días (u otro rango si prefieres)
        // Para simplificar, pedimos un timeMin
        // Start of current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: startOfMonth.toISOString(),
            maxResults: 100,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const items = response.data.items || [];

        const mappedEvents = items.map((event) => {
            const start = event.start?.dateTime || event.start?.date;
            const end = event.end?.dateTime || event.end?.date;
            const isAllDay = !event.start?.dateTime;

            return {
                id: event.id || Math.random().toString(36),
                title: `📅 ${event.summary || 'Sin título'}`,
                start: start ? new Date(start) : new Date(),
                end: end ? new Date(end) : new Date(),
                allDay: isAllDay,
                resource: {
                    descripcion: event.description || "Evento importado de Google",
                    categoria: "Google",
                    tipo_evento: 'tarea', // Usamos tarea para que encaje en el tipo existente
                    es_automatico: true,
                    completada: false,
                    colorOverride: "#DB4437" // Color rojo Google oficial
                }
            };
        });

        return NextResponse.json(mappedEvents);

    } catch (error: any) {
        console.error("Google API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
