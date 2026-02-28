import { detectFormat, type FileFormat } from "./detect";
import { parseTxt } from "./txt";
import { parseMarkdown } from "./markdown";
import { parseHtml } from "./html";
import { normalizeContent } from "./normalize";
import type { ParseResult } from "./types";
import { generateId } from "@/lib/storage/db";
import { titleFromFilename, getFileExtension } from "@/lib/utils";

export type { ParseResult, FileFormat };

// ─── Main parsing entry point ────────────────────────────────────────
export async function parseFile(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const format = detectFormat(file, buffer);

  let result: ParseResult;

  switch (format) {
    case "txt":
      result = await parseTxt(file);
      break;

    case "markdown":
      result = await parseMarkdown(file);
      break;

    case "html":
      result = await parseHtml(file);
      break;

    case "image":
      result = await parseImage(file);
      break;

    case "svg":
      result = await parseSvg(file);
      break;

    case "json":
    case "csv":
    case "yaml":
    case "xml":
    case "code":
      result = await parseCodeLike(file, format);
      break;

    // PDF — dynamically import pdf.js
    case "pdf": {
      const { parsePdf } = await import("./pdf");
      result = await parsePdf(file);
      break;
    }

    // EPUB — dynamically import EPUB parser
    case "epub": {
      const { parseEpub } = await import("./epub");
      result = await parseEpub(file);
      break;
    }

    // DOCX — dynamically import mammoth
    case "docx": {
      const { parseDocx } = await import("./docx");
      result = await parseDocx(file);
      break;
    }

    // RTF — custom parser
    case "rtf": {
      const { parseRtf } = await import("./rtf");
      result = await parseRtf(file);
      break;
    }

    // FB2 (FictionBook) — XML parser
    case "fb2": {
      const { parseFb2 } = await import("./fb2");
      result = await parseFb2(file);
      break;
    }

    // ODT (OpenDocument) — JSZip + XML parser
    case "odt": {
      const { parseOdt } = await import("./odt");
      result = await parseOdt(file);
      break;
    }

    // CBZ (Comic Book ZIP) — image extraction
    case "cbz": {
      const { parseCbz } = await import("./cbz");
      result = await parseCbz(file);
      break;
    }

    // CBR (Comic Book RAR) — treat as placeholder for now
    case "cbr":
      result = await parsePlaceholder(file, format);
      break;

    // MOBI/AZW (Kindle formats)
    case "mobi":
    case "azw": {
      const { parseMobi } = await import("./mobi");
      result = await parseMobi(file);
      break;
    }

    // DOC (legacy Word) — try text extraction fallback
    case "doc":
      result = await parsePlaceholder(file, format);
      break;

    default:
      result = await parseFallback(file);
      break;
  }

  // ─── Content Normalization ────────────────────────────────────────
  // Normalize all text/mixed chapter content into clean, semantic HTML.
  // Visual content (images, comics) keeps its layout-specific inline styles.
  if (result.contentType !== "visual") {
    result.chapters = result.chapters.map((chapter) => ({
      ...chapter,
      content: normalizeContent(chapter.content),
    }));
  }

  return result;
}

// ─── Image parser ────────────────────────────────────────────────────
async function parseImage(file: File): Promise<ParseResult> {
  const title = titleFromFilename(file.name);
  const objectUrl = URL.createObjectURL(file);

  return {
    title,
    author: "Unknown",
    chapters: [
      {
        id: generateId(),
        title: "Image",
        content: `<div style="display:flex;align-items:center;justify-content:center;min-height:80vh;"><img src="${objectUrl}" alt="${title}" style="max-width:100%;max-height:90vh;object-fit:contain;border-radius:4px;" /></div>`,
        imageId: null,
        order: 0,
      },
    ],
    images: [],
    coverImage: file,
    contentType: "visual",
    metadata: {
      format: getFileExtension(file.name),
      imageCount: 1,
    },
  };
}

// ─── SVG parser ──────────────────────────────────────────────────────
async function parseSvg(file: File): Promise<ParseResult> {
  const text = await file.text();
  const title = titleFromFilename(file.name);

  // Basic sanitization — strip scripts
  const sanitized = text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "");

  return {
    title,
    author: "Unknown",
    chapters: [
      {
        id: generateId(),
        title: "SVG",
        content: `<div style="display:flex;align-items:center;justify-content:center;min-height:80vh;">${sanitized}</div>`,
        imageId: null,
        order: 0,
      },
    ],
    images: [],
    coverImage: null,
    contentType: "visual",
    metadata: {
      format: "svg",
      imageCount: 1,
    },
  };
}

// ─── Code-like file parser ───────────────────────────────────────────
async function parseCodeLike(
  file: File,
  format: string
): Promise<ParseResult> {
  const text = await file.text();
  const title = titleFromFilename(file.name);
  const ext = getFileExtension(file.name);

  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return {
    title,
    author: "Unknown",
    chapters: [
      {
        id: generateId(),
        title: `${title}.${ext}`,
        content: `<pre><code class="language-${ext}">${escaped}</code></pre>`,
        imageId: null,
        order: 0,
      },
    ],
    images: [],
    coverImage: null,
    contentType: "text",
    metadata: {
      format,
      imageCount: 0,
    },
  };
}

// ─── Placeholder for unimplemented parsers ───────────────────────────
async function parsePlaceholder(
  file: File,
  format: string
): Promise<ParseResult> {
  const title = titleFromFilename(file.name);

  return {
    title,
    author: "Unknown",
    chapters: [
      {
        id: generateId(),
        title: title,
        content: `<div style="text-align:center;padding:4rem 2rem;">
          <p style="font-size:1.25rem;margin-bottom:1rem;">📄 ${format.toUpperCase()} file detected</p>
          <p style="color:var(--text-secondary);">This format will be fully supported soon. The file has been added to your library.</p>
        </div>`,
        imageId: null,
        order: 0,
      },
    ],
    images: [],
    coverImage: null,
    contentType: "text",
    metadata: {
      format,
      imageCount: 0,
    },
  };
}

// ─── Fallback: try to read as text ───────────────────────────────────
async function parseFallback(file: File): Promise<ParseResult> {
  const title = titleFromFilename(file.name);
  let text: string;

  try {
    text = await file.text();
  } catch {
    return parsePlaceholder(file, "unknown");
  }

  // Check if content looks like text
  const nonPrintable = text
    .slice(0, 1000)
    .split("")
    .filter((c) => {
      const code = c.charCodeAt(0);
      return code < 32 && code !== 9 && code !== 10 && code !== 13;
    }).length;

  if (nonPrintable > 10) {
    return parsePlaceholder(file, "binary");
  }

  return parseTxt(file);
}
