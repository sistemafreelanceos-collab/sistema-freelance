import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Tu llave maestra (La ...rTQY del proyecto Omar-IA)
  const API_KEY = "AIzaSyAiYicKX3mXOmL1bGRJfWNG4OYNYG5rTQY";

  try {
    const { mensaje } = await request.json();

    // CAMBIO CLAVE: Usamos "gemini-pro" que es compatible con TODO.
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: mensaje }] }],
        }),
      }
    );

    const data = await response.json();
    
    if (data.error) {
        return NextResponse.json({ text: "Error de Google: " + data.error.message }, { status: 500 });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta.";
    
    return NextResponse.json({ text });

  } catch (error) {
    return NextResponse.json({ text: "Error del servidor interno." }, { status: 500 });
  }
}