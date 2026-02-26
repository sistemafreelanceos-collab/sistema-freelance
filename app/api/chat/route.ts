import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { mensaje } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ text: "Falta la API Key de Gemini" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Usamos genAI para estandarizar en todo el proyecto
    // Pasamos a gemini-2.5-flash para obtener velocidad y compatibilidad moderna.
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(mensaje);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { text: `Error del servidor interno u OpenAI. (Detalle: ${error.message})` },
      { status: 500 }
    );
  }
}