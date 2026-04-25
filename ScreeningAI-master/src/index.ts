import { runGemini } from "./gemini";
import { buildScreeningPrompt } from "./prompt";
import { sampleJob, sampleCandidates } from "./sampleData";
import { AIResult } from "./types";

function cleanJsonResponse(text: string): string {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

function validateResults(results: AIResult[]): void {
  for (const candidate of results) {
    if (
      !candidate.candidateId ||
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
      typeof candidate.scoreBreakdown.fit !== "number"
    ) {
      throw new Error("Invalid AI response structure");
    }
  }
}

async function main() {
  try {
    const prompt = buildScreeningPrompt(sampleJob, sampleCandidates);
    const rawText = await runGemini(prompt);

    console.log("RAW AI RESPONSE:\n", rawText);

    const cleaned = cleanJsonResponse(rawText);
    const parsed: AIResult[] = JSON.parse(cleaned);

    validateResults(parsed);

    console.log("\nPARSED RESULTS:\n");
    console.log(JSON.stringify(parsed, null, 2));
  } catch (error) {
    console.error("Error running AI screening:", error);
  }
}

main();
