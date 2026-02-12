const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    const genAI = new GoogleGenerativeAI("AIzaSyDjeN8zA2QRyqcET5j1crjgMx7XOxhWMaI");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        const result = await model.generateContent("Hola");
        const response = await result.response;
        console.log("SUCCESS:", response.text());
    } catch (error) {
        console.error("ERROR:", error.message);
    }
}

test();
