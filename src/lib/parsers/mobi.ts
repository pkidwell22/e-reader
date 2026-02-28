import type { ParseResult } from "./types";
import { generateId } from "@/lib/storage/db";
import { titleFromFilename } from "@/lib/utils";

/**
 * MOBI/PalmDOC Parser — basic support for DRM-free MOBI files.
 * Extracts text content from PalmDOC records.
 * Does not support DRM-protected files or KF8/AZW3 format.
 */
export async function parseMobi(file: File): Promise<ParseResult> {
  const defaultTitle = titleFromFilename(file.name);
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);

  try {
    // Read PalmDOC header
    const title = readPalmTitle(view) || defaultTitle;

    // Read MOBI header
    const numRecords = view.getUint16(76, false);
    if (numRecords === 0) {
      return createFallback(title, "No records found in this MOBI file.");
    }

    // Read record offsets
    const recordOffsets: number[] = [];
    for (let i = 0; i < numRecords; i++) {
      const offset = view.getUint32(78 + i * 8, false);
      recordOffsets.push(offset);
    }

    // Read first record (PalmDOC header)
    if (recordOffsets.length < 2) {
      return createFallback(title, "Invalid MOBI structure.");
    }

    const record0Start = recordOffsets[0];
    const compression = view.getUint16(record0Start, false);
    const textLength = view.getUint32(record0Start + 4, false);
    const recordCount = view.getUint16(record0Start + 8, false);

    // Check for MOBI header
    let mobiTitle = title;
    let author = "Unknown";
    try {
      const mobiMagic = readString(view, record0Start + 16, 4);
      if (mobiMagic === "MOBI") {
        // Read MOBI header fields
        const fullTitleOffset = view.getUint32(record0Start + 16 + 84 - 16, false);
        const fullTitleLength = view.getUint32(record0Start + 16 + 88 - 16, false);
        if (fullTitleOffset > 0 && fullTitleLength > 0 && fullTitleLength < 1000) {
          const extractedTitle = readString(
            view,
            record0Start + fullTitleOffset,
            fullTitleLength
          );
          if (extractedTitle) mobiTitle = extractedTitle;
        }
      }
    } catch {
      // MOBI header extraction failed
    }

    // Extract text from data records
    let textContent = "";
    const maxRecords = Math.min(recordCount, recordOffsets.length - 1);

    for (let i = 1; i <= maxRecords; i++) {
      const start = recordOffsets[i];
      const end =
        i + 1 < recordOffsets.length ? recordOffsets[i + 1] : buffer.byteLength;
      const recordData = new Uint8Array(buffer.slice(start, end));

      let decoded: string;
      if (compression === 1) {
        // No compression
        decoded = new TextDecoder("utf-8", { fatal: false }).decode(recordData);
      } else if (compression === 2) {
        // PalmDOC compression
        decoded = decompressPalmDoc(recordData);
      } else {
        // Unknown compression
        decoded = new TextDecoder("utf-8", { fatal: false }).decode(recordData);
      }

      textContent += decoded;

      // Stop if we've reached the text length
      if (textContent.length >= textLength) {
        textContent = textContent.substring(0, textLength);
        break;
      }
    }

    if (!textContent.trim()) {
      return createFallback(
        mobiTitle,
        "Could not extract text from this MOBI file. It may be DRM-protected or use an unsupported encoding."
      );
    }

    // Check if content is HTML or plain text
    const isHtml = textContent.includes("<html") || textContent.includes("<body") || textContent.includes("<p>");

    let html: string;
    if (isHtml) {
      // Strip HTML headers, keep body content
      html = textContent
        .replace(/^[\s\S]*?<body[^>]*>/i, "")
        .replace(/<\/body[\s\S]*$/i, "")
        .replace(/<head[\s\S]*?<\/head>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "");
    } else {
      // Convert plain text to HTML
      html = textContent
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .split(/\n\s*\n/)
        .map((p) => `<p>${p.trim()}</p>`)
        .join("\n");
    }

    // Split into chapters
    const chapters = splitMobiChapters(html, mobiTitle);

    return {
      title: mobiTitle,
      author,
      chapters,
      images: [],
      coverImage: null,
      contentType: "text",
      metadata: {
        format: "mobi",
        imageCount: 0,
      },
    };
  } catch {
    return createFallback(
      defaultTitle,
      "Could not parse this MOBI file. It may be corrupted or use an unsupported format."
    );
  }
}

// ─── PalmDOC decompression ──────────────────────────────────────────

function decompressPalmDoc(data: Uint8Array): string {
  const output: number[] = [];
  let i = 0;

  while (i < data.length) {
    const byte = data[i++];

    if (byte === 0) {
      output.push(0);
    } else if (byte >= 1 && byte <= 8) {
      // Copy next N bytes literally
      for (let j = 0; j < byte && i < data.length; j++) {
        output.push(data[i++]);
      }
    } else if (byte >= 0x80) {
      // Distance-length pair
      if (i >= data.length) break;
      const nextByte = data[i++];
      const distance = (((byte << 8) | nextByte) >> 3) & 0x7ff;
      const length = (nextByte & 0x07) + 3;

      for (let j = 0; j < length; j++) {
        const srcIdx = output.length - distance;
        if (srcIdx >= 0 && srcIdx < output.length) {
          output.push(output[srcIdx]);
        }
      }
    } else if (byte >= 0x09 && byte <= 0x7f) {
      output.push(byte);
    } else {
      // Space + character
      output.push(0x20);
      output.push(byte ^ 0x80);
    }
  }

  return new TextDecoder("utf-8", { fatal: false }).decode(
    new Uint8Array(output)
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function readString(
  view: DataView,
  offset: number,
  length: number
): string {
  const bytes = new Uint8Array(view.buffer, offset, length);
  return new TextDecoder("utf-8", { fatal: false })
    .decode(bytes)
    .replace(/\0+$/, "");
}

function readPalmTitle(view: DataView): string | null {
  try {
    // Palm database name is at offset 0, 32 bytes max
    return readString(view, 0, 32).trim() || null;
  } catch {
    return null;
  }
}

function splitMobiChapters(
  html: string,
  defaultTitle: string
): ParseResult["chapters"] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild;

  if (!root) {
    return [
      {
        id: generateId(),
        title: defaultTitle,
        content: html,
        imageId: null,
        order: 0,
      },
    ];
  }

  const chapters: ParseResult["chapters"] = [];
  let currentContent = "";
  let currentTitle = "";

  for (const child of Array.from(root.children)) {
    const tag = child.tagName.toLowerCase();

    if (tag === "h1" || tag === "h2" || (tag === "p" && child.querySelector("b, strong") && child.textContent && child.textContent.length < 100)) {
      if (currentContent.trim()) {
        chapters.push({
          id: generateId(),
          title: currentTitle || `Section ${chapters.length + 1}`,
          content: currentContent,
          imageId: null,
          order: chapters.length,
        });
      }
      currentTitle = child.textContent?.trim() || "";
      currentContent = child.outerHTML;
    } else {
      currentContent += child.outerHTML;
    }
  }

  if (currentContent.trim()) {
    chapters.push({
      id: generateId(),
      title: currentTitle || defaultTitle,
      content: currentContent,
      imageId: null,
      order: chapters.length,
    });
  }

  if (chapters.length === 0) {
    chapters.push({
      id: generateId(),
      title: defaultTitle,
      content: html,
      imageId: null,
      order: 0,
    });
  }

  return chapters;
}

function createFallback(title: string, message: string): ParseResult {
  return {
    title,
    author: "Unknown",
    chapters: [
      {
        id: generateId(),
        title,
        content: `<div style="text-align:center;padding:4rem 2rem;">
          <p style="font-size:1.25rem;margin-bottom:1rem;">${message}</p>
        </div>`,
        imageId: null,
        order: 0,
      },
    ],
    images: [],
    coverImage: null,
    contentType: "text",
    metadata: { format: "mobi", imageCount: 0 },
  };
}
