import type { ParseResult } from "./types";
import { generateId } from "@/lib/storage/db";
import { titleFromFilename } from "@/lib/utils";

/**
 * RTF Parser — converts Rich Text Format to HTML.
 * Handles basic RTF control words: bold, italic, underline, paragraphs,
 * font sizes, and unicode characters.
 */
export async function parseRtf(file: File): Promise<ParseResult> {
  const title = titleFromFilename(file.name);
  const text = await file.text();

  const html = rtfToHtml(text);
  const chapters = splitRtfChapters(html, title);

  // Try to extract title from first heading
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const firstHeading = doc.querySelector("h1, h2, h3");
  const extractedTitle = firstHeading?.textContent?.trim() || title;

  return {
    title: extractedTitle,
    author: "Unknown",
    chapters,
    images: [],
    coverImage: null,
    contentType: "text",
    metadata: {
      format: "rtf",
      imageCount: 0,
    },
  };
}

function rtfToHtml(rtf: string): string {
  // Strip RTF header/footer
  let content = rtf;

  // Remove RTF header
  content = content.replace(/^\{\\rtf[^}]*\}?/, "");

  // Track formatting state
  let html = "";
  let bold = false;
  let italic = false;
  let underline = false;
  let currentParagraph = "";
  let fontSize = 0;
  let inGroup = 0;
  let skipGroup = false;

  const flushParagraph = () => {
    if (currentParagraph.trim()) {
      // Detect heading by font size
      if (fontSize >= 28) {
        html += `<h1>${currentParagraph.trim()}</h1>`;
      } else if (fontSize >= 24) {
        html += `<h2>${currentParagraph.trim()}</h2>`;
      } else if (fontSize >= 20) {
        html += `<h3>${currentParagraph.trim()}</h3>`;
      } else {
        html += `<p>${currentParagraph.trim()}</p>`;
      }
      currentParagraph = "";
    }
  };

  let i = 0;
  while (i < content.length) {
    const char = content[i];

    if (char === "{") {
      inGroup++;
      // Check if this is a group to skip (like headers, fonts, colors)
      const nextChars = content.substring(i + 1, i + 20);
      if (
        nextChars.startsWith("\\fonttbl") ||
        nextChars.startsWith("\\colortbl") ||
        nextChars.startsWith("\\stylesheet") ||
        nextChars.startsWith("\\info") ||
        nextChars.startsWith("\\header") ||
        nextChars.startsWith("\\footer") ||
        nextChars.startsWith("\\pict") ||
        nextChars.startsWith("\\*")
      ) {
        skipGroup = true;
      }
      i++;
      continue;
    }

    if (char === "}") {
      inGroup--;
      if (inGroup <= 0) skipGroup = false;
      i++;
      continue;
    }

    if (skipGroup) {
      i++;
      continue;
    }

    if (char === "\\") {
      // Parse control word
      let word = "";
      i++;
      while (i < content.length && /[a-zA-Z]/.test(content[i])) {
        word += content[i];
        i++;
      }

      // Parse optional numeric parameter
      let param = "";
      while (i < content.length && /[-\d]/.test(content[i])) {
        param += content[i];
        i++;
      }

      // Skip trailing space
      if (i < content.length && content[i] === " ") i++;

      // Handle control words
      switch (word) {
        case "par":
        case "line":
          flushParagraph();
          break;
        case "b":
          if (param === "0") {
            if (bold) currentParagraph += "</strong>";
            bold = false;
          } else {
            bold = true;
            currentParagraph += "<strong>";
          }
          break;
        case "i":
          if (param === "0") {
            if (italic) currentParagraph += "</em>";
            italic = false;
          } else {
            italic = true;
            currentParagraph += "<em>";
          }
          break;
        case "ul":
          if (param === "0") {
            if (underline) currentParagraph += "</u>";
            underline = false;
          } else {
            underline = true;
            currentParagraph += "<u>";
          }
          break;
        case "ulnone":
          if (underline) currentParagraph += "</u>";
          underline = false;
          break;
        case "fs":
          fontSize = param ? parseInt(param) / 2 : 12;
          break;
        case "tab":
          currentParagraph += "&emsp;";
          break;
        case "u": {
          // Unicode character
          const code = parseInt(param);
          if (!isNaN(code)) {
            currentParagraph += String.fromCharCode(code < 0 ? code + 65536 : code);
          }
          // Skip replacement character
          if (i < content.length && content[i] === "?") i++;
          break;
        }
        case "lquote":
          currentParagraph += "\u2018";
          break;
        case "rquote":
          currentParagraph += "\u2019";
          break;
        case "ldblquote":
          currentParagraph += "\u201C";
          break;
        case "rdblquote":
          currentParagraph += "\u201D";
          break;
        case "emdash":
          currentParagraph += "\u2014";
          break;
        case "endash":
          currentParagraph += "\u2013";
          break;
        case "bullet":
          currentParagraph += "\u2022";
          break;
        default:
          // Skip unknown control words
          break;
      }
      continue;
    }

    // Regular character
    if (char === "\n" || char === "\r") {
      i++;
      continue;
    }

    currentParagraph += escapeHtml(char);
    i++;
  }

  flushParagraph();

  return html || "<p>Could not extract text from this RTF file.</p>";
}

function escapeHtml(char: string): string {
  switch (char) {
    case "&":
      return "&amp;";
    case "<":
      return "&lt;";
    case ">":
      return "&gt;";
    default:
      return char;
  }
}

function splitRtfChapters(
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
    if (tag === "h1" || tag === "h2") {
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
