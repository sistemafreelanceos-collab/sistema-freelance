import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const { eventos, nombreUsuario = "Usuario" } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "Falta la API Key de Gemini" }, { status: 500 });
        }

        if (!eventos || eventos.length === 0) {
            return NextResponse.json({ text: "Parece que fue un día tranquilo. No hay registros en la bitácora hoy." });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const promptText = `
Eres un relator épico y biógrafo profesional empotrado en el sistema operativo Onyx OS.
Tu trabajo es tomar una lista fría y técnica de eventos que el usuario (${nombreUsuario}) realizó en el día, y transformarla en un CAUTIVADOR PÁRRAFO de historia fluida. 

REGLAS:
1. Escribe en TERCERA PERSONA (hablando de ${nombreUsuario}) o como un observador estoico.
2. Une los eventos de forma lógica (ej. "Comenzó la mañana moviendo el proyecto X a revisión, para luego cobrar Y...").
3. Que se lea como un pequeño capítulo de un libro motivador de negocios o productividad.
4. MÁXIMO 2 o 3 párrafos cortos. Letra elegante y prosa fluida.
5. NO incluyas introducciones como "Aquí tienes tu historia". Solo devuelve el relato.

LOS EVENTOS CRUDOS REGISTRADOS ESTE DÍA SON:
${eventos.map((e: any, index: number) => `${index + 1}. [${e.tipo}] a las ${e.hora}: ${e.mensaje}`).join('\n')}

ESCRIBE EL CAPÍTULO DEL DÍA AHORA:
    `.trim();

        const modelsToTry = ["gemini-2.0-flash-001", "gemini-2.5-flash"];
        let lastError: any = null;

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(promptText);
                const response = await result.response;
                const generatedText = response.text();

                return NextResponse.json({ text: generatedText });

            } catch (error: any) {
                console.error(`Error con modelo ${modelName} en generate-timeline-story:`, error.message);
                lastError = error;
                continue;
            }
        }

        throw lastError;

    } catch (error: any) {
        console.error("Generate Timeline Story Error:", error);
        return NextResponse.json(
            { error: `Onyx AI no pudo relatar la historia. (Error: ${error.message})` },
            { status: 500 }
        );
    }
}
