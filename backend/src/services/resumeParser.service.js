import fs from "fs/promises";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export async function extractResumeText(file) {
  if (file.mimetype === "application/pdf") {
    const data = await fs.readFile(file.path);
    const parsed = await pdfParse(data);
    return parsed.text.trim();
  }

  const result = await mammoth.extractRawText({ path: file.path });
  return result.value.trim();
}
