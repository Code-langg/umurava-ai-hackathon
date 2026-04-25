import { Job, Candidate } from "./types";

export function buildScreeningPrompt(job: Job, candidates: Candidate[]): string {
  return `
You are an AI recruitment assistant.

Evaluate ALL candidates and return structured JSON.

CRITICAL RULES:
- You MUST return ALL candidates
- Output MUST be a JSON ARRAY
- DO NOT skip any candidate
- DO NOT return a single object
- DO NOT add explanations outside JSON

SCORING:
- Skills: 40
- Experience: 30
- Education: 20
- Fit: 10

JOB:
${JSON.stringify(job, null, 2)}

CANDIDATES:
${JSON.stringify(candidates, null, 2)}

OUTPUT FORMAT (STRICT):
[
  {
    "candidateId": "string",
    "name": "string",
    "score": number,
    "rank": number,
    "decision": "Shortlist" | "Reject",
    "strengths": ["string"],
    "criticalGaps": ["string"],
    "minorGaps": ["string"],
    "whyShortlisted": "string",
    "recommendation": "string",
    "scoreBreakdown": {
      "skills": number,
      "experience": number,
      "education": number,
      "fit": number
    }
  }
]

VALIDATION RULES:
- scoreBreakdown MUST sum to total score
- ranks MUST be unique
- ALL candidates must appear
- Arrays must NEVER be null

RETURN ONLY JSON.
`;
}