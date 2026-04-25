import * as XLSX from "xlsx";
import { Candidate } from "../types";

export function parseXLSX(buffer: Buffer): Candidate[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const records = XLSX.utils.sheet_to_json<any>(worksheet);

  return records.map((row: any, index: number) => ({
    id: row.id || `xlsx-${index + 1}`,
    name: row.name || row.Name || "",
    skills:
      typeof row.skills === "string"
        ? row.skills.split(",").map((s: string) => s.trim())
        : typeof row.Skills === "string"
        ? row.Skills.split(",").map((s: string) => s.trim())
        : [],
    experienceYears: Number(
      row.experienceYears || row.ExperienceYears || row.experience || 0
    ),
    educationLevel: row.educationLevel || row.EducationLevel || "",
    summary: row.summary || row.Summary || ""
  }));
}