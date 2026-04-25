import { runGemini } from "./gemini";
import { buildScreeningPrompt } from "./prompt";
import { Job, Candidate, AIResult } from "./types";

function cleanJsonResponse(text: string): string {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

// fallback safety builder
function normalizeCandidate(candidate: any): AIResult {
  return {
    candidateId: candidate.candidateId || "",
    name: candidate.name || "",
    score: typeof candidate.score === "number" ? candidate.score : 0,
    rank: typeof candidate.rank === "number" ? candidate.rank : 0,
    decision: candidate.decision === "Shortlist" ? "Shortlist" : "Reject",
    strengths: Array.isArray(candidate.strengths) ? candidate.strengths : [],
    criticalGaps: Array.isArray(candidate.criticalGaps)
      ? candidate.criticalGaps
      : [],
    minorGaps: Array.isArray(candidate.minorGaps)
      ? candidate.minorGaps
      : [],
    whyShortlisted:
      typeof candidate.whyShortlisted === "string"
        ? candidate.whyShortlisted
        : "",
    recommendation:
      typeof candidate.recommendation === "string"
        ? candidate.recommendation
        : "",
    scoreBreakdown: {
      skills: candidate.scoreBreakdown?.skills ?? 0,
      experience: candidate.scoreBreakdown?.experience ?? 0,
      education: candidate.scoreBreakdown?.education ?? 0,
      fit: candidate.scoreBreakdown?.fit ?? 0
    }
  };
}

export async function screenCandidates(
  job: Job,
  candidates: Candidate[],
  shortlistLimit = 20
): Promise<{ results: AIResult[]; shortlist: AIResult[] }> {
  const prompt = buildScreeningPrompt(job, candidates);

  const rawText = await runGemini(prompt);
  console.log("RAW SCREENING RESPONSE:", rawText);

  const cleaned = cleanJsonResponse(rawText);

  let parsed: any;

  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("JSON parse failed:", cleaned);
    throw new Error("AI returned invalid JSON");
  }

  // normalize into array always
  const array = Array.isArray(parsed) ? parsed : [parsed];

  const safeResults: AIResult[] = array.map(normalizeCandidate);

  // sort by score
  const results = safeResults.sort((a, b) => b.score - a.score);

  const shortlist = results
    .filter((c) => c.decision === "Shortlist")
    .slice(0, shortlistLimit);

  return { results, shortlist };
}