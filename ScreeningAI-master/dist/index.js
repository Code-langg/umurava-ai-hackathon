"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gemini_1 = require("./gemini");
const prompt_1 = require("./prompt");
const sampleData_1 = require("./sampleData");
function cleanJsonResponse(text) {
    return text.replace(/```json/g, "").replace(/```/g, "").trim();
}
function validateResults(results) {
    for (const candidate of results) {
        if (!candidate.candidateId ||
            !candidate.name ||
            typeof candidate.score !== "number" ||
            typeof candidate.rank !== "number" ||
            !candidate.decision ||
            !Array.isArray(candidate.strengths) ||
            !Array.isArray(candidate.criticalGaps) ||
            !Array.isArray(candidate.minorGaps) ||
            !candidate.scoreBreakdown ||
            typeof candidate.scoreBreakdown.skills !== "number" ||
            typeof candidate.scoreBreakdown.experience !== "number" ||
            typeof candidate.scoreBreakdown.education !== "number" ||
            typeof candidate.scoreBreakdown.fit !== "number") {
            throw new Error("Invalid AI response structure");
        }
    }
}
async function main() {
    try {
        const prompt = (0, prompt_1.buildScreeningPrompt)(sampleData_1.sampleJob, sampleData_1.sampleCandidates);
        const rawText = await (0, gemini_1.runGemini)(prompt);
        console.log("RAW AI RESPONSE:\n", rawText);
        const cleaned = cleanJsonResponse(rawText);
        const parsed = JSON.parse(cleaned);
        validateResults(parsed);
        console.log("\nPARSED RESULTS:\n");
        console.log(JSON.stringify(parsed, null, 2));
    }
    catch (error) {
        console.error("Error running AI screening:", error);
    }
}
main();
