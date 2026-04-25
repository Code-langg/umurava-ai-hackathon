"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGemini = runGemini;
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let genAI;
function getGenAI() {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("Missing GEMINI_API_KEY in .env");
        }
        genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    return genAI;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function runGemini(prompt) {
    const genAIClient = getGenAI();
    const modelNames = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"];
    const maxRetriesPerModel = 3;
    let lastError;
    for (const modelName of modelNames) {
        const model = genAIClient.getGenerativeModel({ model: modelName });
        for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
            try {
                console.log(`Trying model: ${modelName}, attempt ${attempt}`);
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            }
            catch (error) {
                lastError = error;
                const status = error?.status;
                const isRetryable = status === 503 || status === 429;
                console.error(`Model ${modelName} error:`, error?.message || error);
                if (!isRetryable) {
                    throw error;
                }
                if (attempt < maxRetriesPerModel) {
                    const delay = Math.pow(2, attempt) * 1000;
                    console.log(`Model ${modelName} failed with ${status}. Retrying in ${delay} ms...`);
                    await sleep(delay);
                }
                else {
                    console.log(`Model ${modelName} exhausted retries. Trying next model...`);
                }
            }
        }
    }
    throw lastError;
}
