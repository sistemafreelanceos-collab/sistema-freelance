import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 segundos permitidos para el escaneo de visión

// Aumentar el límite de tamaño para imágenes grandes en base64 (hasta 10MB)
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { image, mimeType } = body;

        if (!image || !mimeType) {
            return NextResponse.json({ error: "Falta la imagen o el tipo MIME" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Falta la API Key" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Usamos gemini-2.5-flash porque es la versión multimodal más reciente soportada por esta API Key
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemPrompt = `
Eres un contador experto y asistente financiero.
Tu única tarea es analizar la imagen proporcionada (un recibo, factura o comprobante bancario) y extraer la siguiente información:
- monto: El total numérico del comprobante (solo el número, ej: 15000). Sin comas ni separadores de miles.
- descripcion: Un breve resumen de qué trata el gasto o ingreso (ej: "Compra en Carulla", "Transferencia de Juan").
- categoria: Clasifica el gasto en una de estas categorías estrictamente: Vivienda, Servicios, Suscripciones, Transporte, Alimentación, Salud, Educación, Deudas, Ocio, Mascotas, Seguros, Impuestos, Negocio, Nómina, Varios. Si no encaja, usa "Varios". Si parece un ingreso, devuelve la categoría que mejor encaje.
- fecha: La fecha del recibo en formato YYYY-MM-DD. Si no la encuentras, devuelve null.

RESPONDE ÚNICAMENTE CON UN OBJETO JSON VÁLIDO. NO INCLUYAS EXPLICACIONES, SINTAXIS DE MARKDOWN (como \`\`\`json) NI TEXTO ADICIONAL.
Ejemplo de salida exacta:
{"monto": 25000, "descripcion": "Uber al centro", "categoria": "Transporte", "fecha": "2023-10-25"}
`;

        const imageParts = [
            {
                inlineData: {
                    data: image,
                    mimeType: mimeType
                }
            }
        ];

        const result = await model.generateContent([systemPrompt, ...imageParts]);
        const responseText = result.response.text();

        // Limpieza del JSON por si Gemini devuelve markdown a pesar de la instrucción
        let cleanJson = responseText.trim();
        if (cleanJson.startsWith('```json')) {
            cleanJson = cleanJson.substring(7);
        }
        if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.substring(3);
        }
        if (cleanJson.endsWith('```')) {
            cleanJson = cleanJson.substring(0, cleanJson.length - 3);
        }
        cleanJson = cleanJson.trim();

        const data = JSON.parse(cleanJson);
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Error en Vision API:", error);
        return NextResponse.json(
            { error: error?.message || "No se pudo leer el recibo contablemente. Asegúrate de que la foto sea legible." },
            { status: 500 }
        );
    }
}
