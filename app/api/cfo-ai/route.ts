import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { movimientos, presupuestos, gastosFijos, config } = await req.json();

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key no configurada" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Actúa como un experto CFO Virtual para un freelancer. Analiza los siguientes datos financieros y dame 3 consejos CLAROS, BREVES y ACCIONABLES para mejorar mi situación financiera este mes.
      
      IMPORTANTE:
      - Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
      {
        "consejos": [
          { "titulo": "Título corto", "descripcion": "Explicación breve", "icono": "ahorro" | "alerta" | "inversion" }
        ],
        "resumen": "Un resumen de 1 linea del estado actual"
      }
      - No incluyas markdown, solo el JSON raw.
      - Sé directo. Si hay gastos excesivos, dilo. Si hay oportunidad de ahorro, dila.
      
      DATOS:
      - Configuración: ${JSON.stringify(config)}
      - Presupuestos: ${JSON.stringify(presupuestos)}
      - Gastos Fijos (Recurrentes): ${JSON.stringify(gastosFijos)}
      - Movimientos recientes (Resumidos): ${JSON.stringify(movimientos.slice(0, 50))} (Solo últimos 50)
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Limpiar posible markdown ```json ... ```
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();

    return NextResponse.json(JSON.parse(jsonString));
  } catch (error: any) {
    console.error("Error en CFO AI:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
