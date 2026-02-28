import type { ParseResult } from "./types";
import { generateId } from "@/lib/storage/db";
import { titleFromFilename } from "@/lib/utils";

/**
 * PDF Parser — uses pdf.js (dynamically imported) to extract text content
 * from PDF files. Each PDF page maps to a reader page.
 */
export async function parsePdf(file: File): Promise<ParseResult> {
  const title = titleFromFilename(file.name);
  const buffer = await file.arrayBuffer();

  // Dynamic import pdf.js — only load when needed
  const pdfjsLib = await import("pdfjs-dist");

  // Set worker source to use the bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  const numPages = pdf.numPages;
  const chapters: ParseResult["chapters"] = [];

  // Extract metadata
  let pdfTitle = title;
  let pdfAuthor = "Unknown";
  try {
    const metadata = await pdf.getMetadata();
    const info = metadata.info as Record<string, string>;
    if (info?.Title) pdfTitle = info.Title;
    if (info?.Author) pdfAuthor = info.Author;
  } catch {
    // Metadata not available — use defaults
  }

  // Group pages into chapters of ~10 pages each for better navigation
  const PAGES_PER_CHAPTER = 10;
  const totalChapters = Math.ceil(numPages / PAGES_PER_CHAPTER);

  for (let chapterIdx = 0; chapterIdx < totalChapters; chapterIdx++) {
    const startPage = chapterIdx * PAGES_PER_CHAPTER + 1;
    const endPage = Math.min((chapterIdx + 1) * PAGES_PER_CHAPTER, numPages);
    let chapterHtml = "";

    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Build HTML from text items
      let pageHtml = "";
      let lastY: number | null = null;
      let currentParagraph = "";

      for (const item of textContent.items) {
        if (!("str" in item)) continue;

        const textItem = item as { str: string; transform: number[]; height: number; fontName: string };
        const y = textItem.transform[5];
        const text = textItem.str;

        if (text.trim() === "") {
          if (currentParagraph.trim()) {
            currentParagraph += " ";
          }
          continue;
        }

        // Detect line breaks based on Y position changes
        if (lastY !== null && Math.abs(y - lastY) > 2) {
          const gap = Math.abs(y - lastY);

          if (gap > 20) {
            // Large gap — new paragraph
            if (currentParagraph.trim()) {
              pageHtml += wrapParagraph(currentParagraph.trim(), textItem.height);
              currentParagraph = "";
            }
          } else {
            // Small gap — line break within paragraph
            currentParagraph += " ";
          }
        }

        currentParagraph += escapeHtml(text);
        lastY = y;
      }

      // Flush remaining paragraph
      if (currentParagraph.trim()) {
        pageHtml += wrapParagraph(currentParagraph.trim(), 12);
      }

      if (pageHtml) {
        // Add page separator
        if (pageNum > startPage) {
          pageHtml =
            `<hr style="margin:2rem 0;border:none;border-top:1px solid var(--border);" />` +
            pageHtml;
        }
        chapterHtml += pageHtml;
      }
    }

    if (chapterHtml.trim()) {
      const chapterTitle =
        totalChapters === 1
          ? pdfTitle
          : `Pages ${startPage}–${endPage}`;

      chapters.push({
        id: generateId(),
        title: chapterTitle,
        content: chapterHtml,
        imageId: null,
        order: chapterIdx,
      });
    }
  }

  // If no text was extracted, create a placeholder
  if (chapters.length === 0) {
    chapters.push({
      id: generateId(),
      title: pdfTitle,
      content: `<div style="text-align:center;padding:4rem 2rem;">
        <p style="font-size:1.25rem;margin-bottom:1rem;">This PDF appears to contain scanned images rather than text.</p>
        <p style="color:var(--text-secondary);">Text extraction is not possible for image-only PDFs. The file has ${numPages} page(s).</p>
      </div>`,
      imageId: null,
      order: 0,
    });
  }

  // Try to render first page as cover
  let coverImage: Blob | null = null;
  try {
    const firstPage = await pdf.getPage(1);
    const viewport = firstPage.getViewport({ scale: 1.5 });

    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (firstPage.render as any)({
        canvasContext: ctx,
        viewport,
        canvas: canvas,
      }).promise;
      coverImage = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.8 });
    }
  } catch {
    // Cover generation failed — use generated cover
  }

  pdf.destroy();

  return {
    title: pdfTitle,
    author: pdfAuthor,
    chapters,
    images: [],
    coverImage,
    contentType: "text",
    metadata: {
      format: "pdf",
      imageCount: 0,
    },
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapParagraph(text: string, fontSize: number): string {
  // Detect headings by font size (heuristic)
  if (fontSize >= 20) {
    return `<h2>${text}</h2>`;
  }
  if (fontSize >= 16) {
    return `<h3>${text}</h3>`;
  }
  return `<p>${text}</p>`;
}
