import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { question, financialContext } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ reply: "Falta la API Key" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Intentamos los modelos disponibles (secuencia de fallback)
    const modelsToTry = ["gemini-2.0-flash-001", "gemini-2.5-flash"];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Intentando modelo: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `
          Eres 'Onyx', el CFO (Director Financiero) de este negocio.
          
          Instrucciones:
          1. Analiza los DATOS: ${JSON.stringify(financialContext)}
          2. Responde a: "${question}"
          3. Sé directo, breve y estratégico. Usa emojis 📊.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        return NextResponse.json({ reply: response.text() });

      } catch (error: any) {
        console.error(`Error con modelo ${modelName}:`, error.message);
        lastError = error;
        // Continuamos con el siguiente modelo en la lista
        continue;
      }
    }

    // Si llegamos aquí, fallaron todos
    throw lastError;

  } catch (error: any) {
    console.error("CFO Error Final:", error);

    return NextResponse.json(
      { reply: `Onyx no pudo conectarse. Error final: ${error.message}` },
      { status: 500 }
    );
  }
}
