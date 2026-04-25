import { runGemini } from "../gemini";
import { Candidate } from "../types";

function buildResumeExtractionPrompt(resumeText: string): string {
  return `
You are an AI resume parser.

Extract structured candidate information from the resume below.

RETURN STRICT JSON ONLY.
DO NOT include explanations.
DO NOT include markdown.

FORMAT:
{
  "name": "string",
  "skills": ["string"],
  "experienceYears": number,
  "educationLevel": "string",
  "summary": "string"
}

RULES:
- Use ONLY the resume content
- DO NOT guess or invent data
- skills must be an array of individual skills
- experienceYears must be a NUMBER (e.g., 3, not "3 years")
- summary must be concise (1–2 sentences max)

If missing data:
- name → ""
- skills → []
- experienceYears → 0
- educationLevel → ""
- summary → ""

IMPORTANT:
- Output MUST be valid JSON
- No extra text before or after JSON

Resume:
${resumeText}
`;
}

export async function extractCandidateFromResumeText(
  resumeText: string,
  fallbackId: string
): Promise<Candidate> {
  const prompt = buildResumeExtractionPrompt(resumeText);

  const raw = await runGemini(prompt);

  // Clean response
  const cleaned = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  let parsed: any;

  // Safe JSON parsing
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("❌ Failed to parse AI response:", cleaned);

    throw new Error("AI returned invalid JSON format");
  }

  // Normalize skills
  const skills = Array.isArray(parsed.skills)
    ? parsed.skills.map((s: string) => s.trim()).filter(Boolean)
    : [];

  // Validate minimum data (important)
  if (!parsed.name && skills.length === 0) {
    throw new Error("AI extraction failed: insufficient candidate data");
  }

  return {
    id: fallbackId,
    name: parsed.name || "",
    skills,
    experienceYears: Number(parsed.experienceYears || 0),
    educationLevel: parsed.educationLevel || "",
    summary: parsed.summary || ""
  };
}