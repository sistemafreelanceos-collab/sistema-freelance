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
Eres Onyx, el asistente financiero personal de ${userName || 'el emprendedor'}.
Tu objetivo es dar un buen día personalizado y estratégico basado en los datos reales del usuario.

DATOS ACTUALES:
- Cuentas y saldos: ${JSON.stringify((financialContext || []).slice(0, 5))}
- Proyectos activos: ${activeProjects || 0}

REGLAS ESTRICTAS:
1. Tono: Directo, motivador, como el mejor CFO personal. No genérico.
2. Menciona máximo 1 dato específico de los saldos o proyectos para personalizar.
3. Nunca digas que eres una IA ni te identifiques como Gemini.
4. Máximo 3 párrafos muy cortos. Sin listas ni sub-títulos.
5. Termina con una acción concreta que el usuario debería hacer hoy.
6. DEVUELVE ÚNICAMENTE EL TEXTO. Sin markdown, sin bloques de código.
    `;

        const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash"];
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
