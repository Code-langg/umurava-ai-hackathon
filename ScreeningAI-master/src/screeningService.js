"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.screenCandidates = screenCandidates;
const gemini_1 = require("./gemini");
const prompt_1 = require("./prompt");
function cleanJsonResponse(text) {
    return text.replace(/```json/g, "").replace(/```/g, "").trim();
}
// fallback safety builder
function normalizeCandidate(candidate) {
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
        whyShortlisted: typeof candidate.whyShortlisted === "string"
            ? candidate.whyShortlisted
            : "",
        recommendation: typeof candidate.recommendation === "string"
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
async function screenCandidates(job, candidates, shortlistLimit = 20) {
    const prompt = (0, prompt_1.buildScreeningPrompt)(job, candidates);
    const rawText = await (0, gemini_1.runGemini)(prompt);
    console.log("RAW SCREENING RESPONSE:", rawText);
    const cleaned = cleanJsonResponse(rawText);
    let parsed;
    try {
        parsed = JSON.parse(cleaned);
    }
    catch (err) {
        console.error("JSON parse failed:", cleaned);
        throw new Error("AI returned invalid JSON");
    }
    // normalize into array always
    const array = Array.isArray(parsed) ? parsed : [parsed];
    const safeResults = array.map(normalizeCandidate);
    // sort by score
    const results = safeResults.sort((a, b) => b.score - a.score);
    const shortlist = results
        .filter((c) => c.decision === "Shortlist")
        .slice(0, shortlistLimit);
    return { results, shortlist };
}
