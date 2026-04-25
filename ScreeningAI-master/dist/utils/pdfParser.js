"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromPDF = extractTextFromPDF;
const pdf_parse_1 = __importDefault(require("pdf-parse"));
async function extractTextFromPDF(buffer) {
    try {
        const data = await (0, pdf_parse_1.default)(buffer);
        const cleanedText = data.text
            .replace(/\r/g, "")
            .replace(/\n{2,}/g, "\n")
            .trim();
        if (!cleanedText) {
            throw new Error("No readable text found in PDF");
        }
        return cleanedText;
    }
    catch (error) {
        console.error("PDF parsing failed:", error);
        throw new Error("This PDF could not be parsed. Please upload a text-based resume PDF.");
    }
}
