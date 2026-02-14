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

    // Prompt Maestro para Onyx Pro
    const systemPrompt = `
      Eres 'Onyx', el CFO Inteligente y Agente Activo de este negocio.
      
      TU OBJETIVO:
      1. Analizar los datos financieros y la pregunta del usuario.
      2. Responder con sarcasmo profesional pero útil.
      3. DETECTAR INTENCIÓN: Si el usuario quiere crear un gasto o ingreso, EXTRAER los datos.
      
      FORMATO DE RESPUESTA (Debes responder ESTRICTAMENTE este JSON):
      {
        "reply": "Texto de tu respuesta aquí (máx 2 oraciones).",
        "action": null | {
          "type": "CREATE_MOVIMIENTO",
          "payload": {
            "monto": number,
            "descripcion": "string",
            "categoria": "string (Alimentación | Transporte | Servicios | Hogar | Ocio | Salud | Educación | Ahorro | Otros)",
            "tipo": "ingreso" | "egreso"
          }
        }
      }

      DATOS DEL USUARIO:
      ${JSON.stringify(financialContext)}

      EJEMPLOS:
      - T: "¿Cuánto he gastado?" -> R: { "reply": "Llevas $500. ¿Vas por el récord?", "action": null }
      - T: "Gaste 100 en Uber" -> R: { "reply": "Anotado. ¿Fue viaje de negocios o placer?", "action": { "type": "CREATE_MOVIMIENTO", "payload": { "monto": 100, "descripcion": "Uber", "categoria": "Transporte", "tipo": "egreso" } } }
    `;

    // Secuencia de Fallback (Igual que antes pero con JSON config)
    const modelsToTry = ["gemini-2.0-flash-001", "gemini-2.5-flash"];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: "application/json" } // Forzamos JSON
        });

        const result = await model.generateContent(`${systemPrompt}\n\nPREGUNTA DEL USUARIO: "${question}"`);
        const response = await result.response;
        const jsonText = response.text();

        // Validamos que sea JSON real
        const parsedResponse = JSON.parse(jsonText);

        return NextResponse.json(parsedResponse);

      } catch (error: any) {
        console.error(`Error con modelo ${modelName}:`, error.message);
        lastError = error;
        continue;
      }
    }

    throw lastError;

  } catch (error: any) {
    console.error("CFO Error Final:", error);
    return NextResponse.json(
      { reply: `Onyx tuvo un glitch cognitivo. (Error: ${error.message})` },
      { status: 500 }
    );
  }
}
