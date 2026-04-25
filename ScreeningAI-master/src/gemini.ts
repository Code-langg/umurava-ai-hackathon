import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

let genAI: GoogleGenerativeAI | undefined;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY in .env");
    }

    genAI = new GoogleGenerativeAI(apiKey);
  }

  return genAI;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runGemini(prompt: string): Promise<string> {
  const genAIClient = getGenAI();
  const modelNames = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"];
  const maxRetriesPerModel = 3;

  let lastError: unknown;

  for (const modelName of modelNames) {
    const model = genAIClient.getGenerativeModel({ model: modelName });

    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        console.log(`Trying model: ${modelName}, attempt ${attempt}`);

        const result = await model.generateContent(prompt);
        const response = await result.response;

        return response.text();
      } catch (error: any) {
        lastError = error;

        const status = error?.status;
        const isRetryable = status === 503 || status === 429;

        console.error(`Model ${modelName} error:`, error?.message || error);

        if (!isRetryable) {
          throw error;
        }

        if (attempt < maxRetriesPerModel) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(
            `Model ${modelName} failed with ${status}. Retrying in ${delay} ms...`
          );
          await sleep(delay);
        } else {
          console.log(`Model ${modelName} exhausted retries. Trying next model...`);
        }
      }
    }
  }

  throw lastError;
}