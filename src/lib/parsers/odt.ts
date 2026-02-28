import type { ParseResult } from "./types";
import type { ImageAsset } from "@/lib/types";
import { generateId } from "@/lib/storage/db";
import { titleFromFilename } from "@/lib/utils";
import JSZip from "jszip";

/**
 * ODT (OpenDocument Text) Parser — unzips ODT container,
 * parses content.xml, extracts text and images.
 */
export async function parseOdt(file: File): Promise<ParseResult> {
  const defaultTitle = titleFromFilename(file.name);
  const buffer = await file.arrayBuffer();

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    return createFallback(defaultTitle, "Could not open this ODT file — invalid ZIP archive.");
  }

  // Parse content.xml
  const contentXml = await zip.file("content.xml")?.async("string");
  if (!contentXml) {
    return createFallback(defaultTitle, "Invalid ODT: missing content.xml");
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(contentXml, "application/xml");

  // Extract metadata from meta.xml
  let title = defaultTitle;
  let author = "Unknown";
  try {
    const metaXml = await zip.file("meta.xml")?.async("string");
    if (metaXml) {
      const metaDoc = parser.parseFromString(metaXml, "application/xml");
      const metaTitle =
        metaDoc.querySelector("title")?.textContent?.trim() ||
        metaDoc.getElementsByTagName("dc:title")[0]?.textContent?.trim();
      const metaAuthor =
        metaDoc.querySelector("creator")?.textContent?.trim() ||
        metaDoc.getElementsByTagName("dc:creator")[0]?.textContent?.trim() ||
        metaDoc.querySelector("initial-creator")?.textContent?.trim();
      if (metaTitle) title = metaTitle;
      if (metaAuthor) author = metaAuthor;
    }
  } catch {
    // Metadata extraction failed
  }

  // Extract images
  const images: ImageAsset[] = [];
  const imageMap = new Map<string, string>();

  const picturesFolder = zip.folder("Pictures");
  if (picturesFolder) {
    const imageFiles: string[] = [];
    picturesFolder.forEach((path) => {
      imageFiles.push("Pictures/" + path);
    });

    for (const imagePath of imageFiles) {
      const imageFile = zip.file(imagePath);
      if (!imageFile) continue;

      try {
        const blob = await imageFile.async("blob");
        const ext = imagePath.split(".").pop()?.toLowerCase() || "";
        const mimeType =
          ext === "png"
            ? "image/png"
            : ext === "svg"
              ? "image/svg+xml"
              : ext === "gif"
                ? "image/gif"
                : "image/jpeg";
        const typedBlob = new Blob([blob], { type: mimeType });
        const blobUrl = URL.createObjectURL(typedBlob);
        imageMap.set(imagePath, blobUrl);

        images.push({
          id: generateId(),
          bookId: "",
          blob: typedBlob,
          thumbnail: null,
          mimeType,
          width: 0,
          height: 0,
          caption: null,
          altText: null,
          order: images.length,
        });
      } catch {
        // Skip failed images
      }
    }
  }

  // Process body content
  const body = doc.getElementsByTagName("office:body")[0];
  const textBody = body?.getElementsByTagName("office:text")[0];

  if (!textBody) {
    return createFallback(title, "No text content found in this ODT file.");
  }

  const chapters = processOdtBody(textBody, imageMap, title);

  return {
    title,
    author,
    chapters,
    images,
    coverImage: null,
    contentType: images.length > 0 ? "mixed" : "text",
    metadata: {
      format: "odt",
      imageCount: images.length,
    },
  };
}

function processOdtBody(
  body: Element,
  imageMap: Map<string, string>,
  defaultTitle: string
): ParseResult["chapters"] {
  const chapters: ParseResult["chapters"] = [];
  let currentContent = "";
  let currentTitle = "";

  for (const child of Array.from(body.children)) {
    const tagName = child.tagName;

    // Detect heading elements
    if (tagName === "text:h") {
      const level = parseInt(child.getAttribute("text:outline-level") || "1");

      if (level <= 2) {
        // Split chapters on h1/h2
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
        const headingTag = level === 1 ? "h1" : "h2";
        currentContent = `<${headingTag}>${escapeText(currentTitle)}</${headingTag}>`;
      } else {
        const headingTag = `h${Math.min(level, 6)}`;
        currentContent += `<${headingTag}>${escapeText(child.textContent?.trim() || "")}</${headingTag}>`;
      }
      continue;
    }

    // Paragraph
    if (tagName === "text:p") {
      const html = processOdtParagraph(child, imageMap);
      if (html) currentContent += html;
      continue;
    }

    // List
    if (tagName === "text:list") {
      currentContent += processOdtList(child, imageMap);
      continue;
    }

    // Table
    if (tagName === "table:table") {
      currentContent += processOdtTable(child);
      continue;
    }

    // Fallback — extract text
    if (child.textContent?.trim()) {
      currentContent += `<p>${escapeText(child.textContent.trim())}</p>`;
    }
  }

  // Flush last chapter
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
      content: "<p>No readable content found.</p>",
      imageId: null,
      order: 0,
    });
  }

  return chapters;
}

function processOdtParagraph(
  p: Element,
  imageMap: Map<string, string>
): string {
  let html = "";
  let hasContent = false;

  for (const node of Array.from(p.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (text.trim()) hasContent = true;
      html += escapeText(text);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName;

      if (tag === "text:span") {
        const styleName = el.getAttribute("text:style-name") || "";
        const text = el.textContent || "";
        if (text.trim()) hasContent = true;

        // Try to detect bold/italic from style name
        if (styleName.toLowerCase().includes("bold") || styleName.includes("T1")) {
          html += `<strong>${escapeText(text)}</strong>`;
        } else if (styleName.toLowerCase().includes("italic")) {
          html += `<em>${escapeText(text)}</em>`;
        } else {
          html += escapeText(text);
        }
      } else if (tag === "text:a") {
        html += escapeText(el.textContent || "");
        hasContent = true;
      } else if (tag === "text:line-break") {
        html += "<br />";
      } else if (tag === "text:tab") {
        html += "&emsp;";
      } else if (tag === "text:s") {
        const count = parseInt(el.getAttribute("text:c") || "1");
        html += "&nbsp;".repeat(count);
      } else if (tag === "draw:frame" || tag === "draw:image") {
        const imgHtml = processOdtImage(el, imageMap);
        if (imgHtml) {
          html += imgHtml;
          hasContent = true;
        }
      } else if (el.textContent?.trim()) {
        // Check for nested images
        const nestedFrame = el.querySelector("draw\\:frame, draw\\:image");
        if (nestedFrame) {
          const imgHtml = processOdtImage(nestedFrame, imageMap);
          if (imgHtml) {
            html += imgHtml;
            hasContent = true;
          }
        } else {
          html += escapeText(el.textContent);
          hasContent = true;
        }
      }
    }
  }

  if (!hasContent && !html.includes("<img")) return "";
  return `<p>${html}</p>`;
}

function processOdtImage(
  el: Element,
  imageMap: Map<string, string>
): string {
  // Look for draw:image inside draw:frame
  const drawImage =
    el.tagName === "draw:image"
      ? el
      : el.querySelector("draw\\:image") || el.getElementsByTagName("draw:image")[0];

  if (drawImage) {
    const href =
      drawImage.getAttribute("xlink:href") ||
      drawImage.getAttribute("href") ||
      "";
    const blobUrl = imageMap.get(href);
    if (blobUrl) {
      return `<img src="${blobUrl}" alt="" />`;
    }
  }
  return "";
}

function processOdtList(
  list: Element,
  imageMap: Map<string, string>
): string {
  let html = "<ul>";
  const items = list.children;

  for (const item of Array.from(items)) {
    if (item.tagName === "text:list-item") {
      html += "<li>";
      for (const child of Array.from(item.children)) {
        if (child.tagName === "text:p") {
          html += processOdtParagraphInline(child, imageMap);
        } else if (child.tagName === "text:list") {
          html += processOdtList(child, imageMap);
        }
      }
      html += "</li>";
    }
  }

  html += "</ul>";
  return html;
}

function processOdtParagraphInline(
  p: Element,
  imageMap: Map<string, string>
): string {
  // Same as processOdtParagraph but without wrapping in <p>
  let html = "";
  for (const node of Array.from(p.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      html += escapeText(node.textContent || "");
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (el.tagName === "text:span") {
        html += escapeText(el.textContent || "");
      } else {
        html += escapeText(el.textContent || "");
      }
    }
  }
  return html;
}

function processOdtTable(table: Element): string {
  let html = "<table>";

  const rows = table.getElementsByTagName("table:table-row");
  for (const row of Array.from(rows)) {
    html += "<tr>";
    const cells = row.getElementsByTagName("table:table-cell");
    for (const cell of Array.from(cells)) {
      html += `<td>${escapeText(cell.textContent?.trim() || "")}</td>`;
    }
    html += "</tr>";
  }

  html += "</table>";
  return html;
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
    metadata: { format: "odt", imageCount: 0 },
  };
}
