import pdfParse from "pdf-parse";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);

    const cleanedText = data.text
      .replace(/\r/g, "")
      .replace(/\n{2,}/g, "\n")
      .trim();

    if (!cleanedText) {
      throw new Error("No readable text found in PDF");
    }

    return cleanedText;
  } catch (error) {
    console.error("PDF parsing failed:", error);
    throw new Error(
      "This PDF could not be parsed. Please upload a text-based resume PDF."
    );
  }
}