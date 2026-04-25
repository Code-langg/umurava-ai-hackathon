"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCSV = parseCSV;
const sync_1 = require("csv-parse/sync");
function parseCSV(csvText) {
    const records = (0, sync_1.parse)(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });
    return records.map((row, index) => ({
        id: row.id || `csv-${index + 1}`,
        name: row.name || "",
        skills: row.skills
            ? row.skills.split(",").map((skill) => skill.trim())
            : [],
        experienceYears: row.experienceYears ? Number(row.experienceYears) : 0,
        educationLevel: row.educationLevel || "",
        summary: row.summary || ""
    }));
}
