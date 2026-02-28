import type { ParseResult } from "./types";
import { generateId } from "@/lib/storage/db";
import { titleFromFilename } from "@/lib/utils";

export async function parseTxt(file: File): Promise<ParseResult> {
  const text = await file.text();
  const title = titleFromFilename(file.name);

  // Split into paragraphs
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Try to detect a title from the first line if it looks like one
  let detectedTitle = title;
  let author = "Unknown";

  if (paragraphs.length > 0) {
    const firstPara = paragraphs[0];
    // If first paragraph is short (< 80 chars) and has no period, it might be a title
    if (firstPara.length < 80 && !firstPara.includes(".")) {
      detectedTitle = firstPara;
      // Check if second paragraph looks like an author line
      if (
        paragraphs.length > 1 &&
        paragraphs[1].length < 60 &&
        (paragraphs[1].toLowerCase().startsWith("by ") ||
          paragraphs[1].match(/^[A-Z][a-z]+ [A-Z][a-z]+$/))
      ) {
        author = paragraphs[1].replace(/^by\s+/i, "");
      }
    }
  }

  // Build HTML content
  const htmlContent = paragraphs
    .map((p) => {
      // Preserve line breaks within paragraphs
      const lines = p.split("\n").map((line) => escapeHtml(line));
      return `<p>${lines.join("<br>")}</p>`;
    })
    .join("\n");

  return {
    title: detectedTitle,
    author,
    chapters: [
      {
        id: generateId(),
        title: detectedTitle,
        content: htmlContent,
        imageId: null,
        order: 0,
      },
    ],
    images: [],
    coverImage: null,
    contentType: "text",
    metadata: {
      format: "txt",
      imageCount: 0,
    },
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
