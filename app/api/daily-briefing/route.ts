import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    let userName = 'líder';
    let activeProjects = 0;

    try {
        const body = await req.json().catch(() => ({}));
        userName = body?.userName || userName;
        activeProjects = body?.activeProjects || activeProjects;
        const { financialContext } = body || {};
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ briefing: "No pude conectar con mi cerebro (Falta API Key)." }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const systemPrompt = `
Eres Gemini, la IA financiera integrada en este sistema para ${userName || 'el emprendedor'}.
Tu objetivo es recibir los datos actuales (saldo global, proyectos pendientes, hábitos del día) y generar un saludo personalizado y altamente estratégico para la mañana.
DATOS AL DÍA DE HOY:
- Cuentas y Saldos Actuales Resumidos: ${JSON.stringify((financialContext || []).slice(0, 5))}
- Proyectos Pendientes / Activos: ${activeProjects || 0}
- Hábitos del día: Organízate bien.
REGLAS:
1. Tono: Directo, motivador, estratégico. Como el mejor asistente/CEO.
2. No saludes con cosas genéricas ni digas que eres una IA. Saluda por su nombre.
3. Longitud: Máximo 3 párrafos cortos y precisos.
4. DEVUELVE ÚNICAMENTE EL TEXTO DEL MENSAJE. Nada extra
    `;

        const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash-001"];
        let lastError: any = null;

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });

                const result = await model.generateContent(systemPrompt);
                const text = result.response.text();

                // Envolvemos la respuesta de texto plano en un JSON estructurado nosotros mismos
                return NextResponse.json({ briefing: text });

            } catch (error: any) {
                console.error(`Error con modelo ${modelName} en Daily Briefing:`, error.message);
                lastError = error;
                // Si es un error de Quota Excedida (Rate Limit), detenemos la búsqueda porque ningún modelo funcionará.
                if (error.message && error.message.includes("Quota")) {
                    break;
                }
                continue;
            }
        }

        throw lastError;

    } catch (error: any) {
        console.error("Daily Briefing Error Final:", error);

        // Si es un error de Quota Excedida, devolver un mensaje amigable en lugar de mostrar el error feo
        if (error.message && (error.message.includes("429") || error.message.includes("Quota"))) {
            const fallbackMensaje = `
                <p><strong>¡Buenos días, ${userName || 'Omar'}! ☕</strong></p>
                <p class="mt-2 text-yellow-300">Proyectos Activos: ${activeProjects || 0}</p>
                <p>Recuerda revisar tus cuentas pendientes y mantener tus hábitos al día.</p>
            `;
            return NextResponse.json({ briefing: fallbackMensaje });
        }

        return NextResponse.json(
            { briefing: `¡Buenos días! Tuve un error del servidor: ${error.message || 'Desconocido'}` },
            { status: 500 }
        );
    }
}
