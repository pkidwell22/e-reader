import type { ParseResult } from "./types";
import type { ImageAsset } from "@/lib/types";
import { generateId } from "@/lib/storage/db";
import { titleFromFilename } from "@/lib/utils";

/**
 * FB2 (FictionBook) Parser — XML-based ebook format popular in Russia.
 * Parses body sections into chapters, extracts inline binary images.
 */
export async function parseFb2(file: File): Promise<ParseResult> {
  const defaultTitle = titleFromFilename(file.name);
  const text = await file.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "application/xml");

  // Check for parse errors
  if (doc.querySelector("parsererror")) {
    // Retry as text/xml
    const doc2 = parser.parseFromString(text, "text/xml");
    if (doc2.querySelector("parsererror")) {
      return createFallback(defaultTitle, "Could not parse this FB2 file — invalid XML.");
    }
    return processFb2Doc(doc2, defaultTitle);
  }

  return processFb2Doc(doc, defaultTitle);
}

function processFb2Doc(doc: Document, defaultTitle: string): ParseResult {
  // Extract metadata
  const titleInfo = doc.querySelector("title-info");
  const title =
    titleInfo?.querySelector("book-title")?.textContent?.trim() || defaultTitle;
  const authorFirst =
    titleInfo?.querySelector("author first-name")?.textContent?.trim() || "";
  const authorLast =
    titleInfo?.querySelector("author last-name")?.textContent?.trim() || "";
  const author =
    [authorFirst, authorLast].filter(Boolean).join(" ") || "Unknown";

  // Extract binary images
  const images: ImageAsset[] = [];
  const imageMap = new Map<string, string>(); // id → blob URL

  const binaries = doc.querySelectorAll("binary");
  binaries.forEach((binary) => {
    const id = binary.getAttribute("id");
    const contentType = binary.getAttribute("content-type") || "image/jpeg";
    const base64Data = binary.textContent?.replace(/\s/g, "");

    if (id && base64Data) {
      try {
        const byteChars = atob(base64Data);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteArray[i] = byteChars.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        imageMap.set(id, blobUrl);
        imageMap.set(`#${id}`, blobUrl);

        images.push({
          id: generateId(),
          bookId: "",
          blob,
          thumbnail: null,
          mimeType: contentType,
          width: 0,
          height: 0,
          caption: null,
          altText: null,
          order: images.length,
        });
      } catch {
        // Skip invalid base64
      }
    }
  });

  // Extract cover image
  let coverImage: Blob | null = null;
  const coverpageImage = doc.querySelector("coverpage image");
  if (coverpageImage) {
    const href =
      coverpageImage.getAttribute("l:href") ||
      coverpageImage.getAttribute("xlink:href") ||
      coverpageImage.getAttribute("href") ||
      "";
    const cleanHref = href.replace(/^#/, "");
    const blobUrl = imageMap.get(cleanHref) || imageMap.get(href);
    if (blobUrl && images.length > 0) {
      coverImage = images[0].blob;
    }
  }

  // Process body sections into chapters
  const chapters: ParseResult["chapters"] = [];
  const body = doc.querySelector("body");

  if (body) {
    const sections = body.querySelectorAll(":scope > section");

    if (sections.length > 0) {
      sections.forEach((section, idx) => {
        const html = fb2SectionToHtml(section, imageMap);
        const sectionTitle =
          section.querySelector(":scope > title")
            ? extractFb2Title(section.querySelector(":scope > title")!)
            : `Chapter ${idx + 1}`;

        if (html.trim()) {
          chapters.push({
            id: generateId(),
            title: sectionTitle,
            content: html,
            imageId: null,
            order: chapters.length,
          });
        }
      });
    } else {
      // No sections — treat entire body as one chapter
      const html = fb2SectionToHtml(body, imageMap);
      chapters.push({
        id: generateId(),
        title: title,
        content: html,
        imageId: null,
        order: 0,
      });
    }
  }

  if (chapters.length === 0) {
    return createFallback(title, "No readable content found in this FB2 file.");
  }

  return {
    title,
    author,
    chapters,
    images,
    coverImage,
    contentType: images.length > 0 ? "mixed" : "text",
    metadata: {
      format: "fb2",
      imageCount: images.length,
    },
  };
}

function fb2SectionToHtml(
  section: Element,
  imageMap: Map<string, string>
): string {
  let html = "";

  for (const child of Array.from(section.children)) {
    const tag = child.tagName.toLowerCase();

    switch (tag) {
      case "title":
        html += `<h2>${extractFb2Title(child)}</h2>`;
        break;
      case "subtitle":
        html += `<h3>${escapeText(child.textContent || "")}</h3>`;
        break;
      case "epigraph":
        html += `<blockquote>${fb2InlineToHtml(child, imageMap)}</blockquote>`;
        break;
      case "p":
        html += `<p>${fb2InlineToHtml(child, imageMap)}</p>`;
        break;
      case "empty-line":
        html += "<br />";
        break;
      case "poem": {
        html += "<blockquote>";
        const stanzas = child.querySelectorAll("stanza");
        stanzas.forEach((stanza) => {
          const verses = stanza.querySelectorAll("v");
          verses.forEach((v) => {
            html += `<p>${escapeText(v.textContent || "")}</p>`;
          });
          html += "<br />";
        });
        html += "</blockquote>";
        break;
      }
      case "cite":
        html += `<blockquote>${fb2InlineToHtml(child, imageMap)}</blockquote>`;
        break;
      case "image": {
        const href =
          child.getAttribute("l:href") ||
          child.getAttribute("xlink:href") ||
          child.getAttribute("href") ||
          "";
        const cleanHref = href.replace(/^#/, "");
        const blobUrl = imageMap.get(cleanHref) || imageMap.get(href);
        if (blobUrl) {
          html += `<img src="${blobUrl}" alt="" />`;
        }
        break;
      }
      case "table": {
        html += "<table>";
        const rows = child.querySelectorAll("tr");
        rows.forEach((tr) => {
          html += "<tr>";
          const cells = tr.querySelectorAll("td, th");
          cells.forEach((cell) => {
            const cellTag = cell.tagName.toLowerCase();
            html += `<${cellTag}>${escapeText(cell.textContent || "")}</${cellTag}>`;
          });
          html += "</tr>";
        });
        html += "</table>";
        break;
      }
      case "section":
        // Nested section — recurse
        html += fb2SectionToHtml(child, imageMap);
        break;
      default:
        if (child.textContent?.trim()) {
          html += `<p>${escapeText(child.textContent)}</p>`;
        }
    }
  }

  return html;
}

function fb2InlineToHtml(
  el: Element,
  imageMap: Map<string, string>
): string {
  let html = "";

  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      html += escapeText(node.textContent || "");
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const child = node as Element;
      const tag = child.tagName.toLowerCase();

      switch (tag) {
        case "strong":
        case "b":
          html += `<strong>${fb2InlineToHtml(child, imageMap)}</strong>`;
          break;
        case "emphasis":
        case "em":
        case "i":
          html += `<em>${fb2InlineToHtml(child, imageMap)}</em>`;
          break;
        case "strikethrough":
          html += `<del>${fb2InlineToHtml(child, imageMap)}</del>`;
          break;
        case "a":
          html += fb2InlineToHtml(child, imageMap);
          break;
        case "image": {
          const href =
            child.getAttribute("l:href") ||
            child.getAttribute("xlink:href") ||
            child.getAttribute("href") ||
            "";
          const cleanHref = href.replace(/^#/, "");
          const blobUrl = imageMap.get(cleanHref) || imageMap.get(href);
          if (blobUrl) {
            html += `<img src="${blobUrl}" alt="" />`;
          }
          break;
        }
        case "p":
          html += `<p>${fb2InlineToHtml(child, imageMap)}</p>`;
          break;
        default:
          html += fb2InlineToHtml(child, imageMap);
      }
    }
  }

  return html;
}

function extractFb2Title(titleEl: Element): string {
  const paragraphs = titleEl.querySelectorAll("p");
  if (paragraphs.length > 0) {
    return Array.from(paragraphs)
      .map((p) => p.textContent?.trim())
      .filter(Boolean)
      .join(" — ");
  }
  return titleEl.textContent?.trim() || "";
}

function escapeText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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
    metadata: { format: "fb2", imageCount: 0 },
  };
}
