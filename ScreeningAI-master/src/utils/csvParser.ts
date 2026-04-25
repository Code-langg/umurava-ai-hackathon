import { parse } from "csv-parse/sync";
import { Candidate } from "../types";

export function parseCSV(csvText: string): Candidate[] {
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  return records.map((row: any, index: number) => ({
    id: row.id || `csv-${index + 1}`,
    name: row.name || "",
    skills: row.skills
      ? row.skills.split(",").map((skill: string) => skill.trim())
      : [],
    experienceYears: row.experienceYears ? Number(row.experienceYears) : 0,
    educationLevel: row.educationLevel || "",
    summary: row.summary || ""
  }));
}