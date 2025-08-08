import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";  

dotenv.config(); // Load environment variables from .env file   
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
async function main() {   
  const response = await ai.models.generateContent({    
    model: "gemini-2.0-flash",
    contents: "write a html and css code to give you a prompt and display the response",  
  });
  console.log(response.text);
} 
 
await main();

