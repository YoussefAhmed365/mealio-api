import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function main() {
    const response = await ai.models.generateContentStream({
        model: "gemini-2.5-flash", 
        contents: "Hello",
    });

    for await (const chunk of response) {
        console.log("Chunk:", chunk);
        console.log("Chunk text:", chunk.text);
    }
}

main().catch(console.error);
