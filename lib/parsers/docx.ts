import type { ParseResult } from "./types";
import type { ImageAsset } from "@/lib/types";
import { generateId } from "@/lib/storage/db";
import { titleFromFilename } from "@/lib/utils";

/**
 * DOCX Parser — uses mammoth.js (dynamically imported) to convert
 * Word documents to clean HTML. Splits content on headings for chapters.
 */
export async function parseDocx(file: File): Promise<ParseResult> {
  const defaultTitle = titleFromFilename(file.name);
  const buffer = await file.arrayBuffer();

  // Dynamic import mammoth — only load when needed
  const mammoth = await import("mammoth");

  // Track extracted images
  const extractedImages: ImageAsset[] = [];
  const imageUrls: Map<string, string> = new Map();

  // Convert DOCX to HTML with mammoth
  const result = await mammoth.convertToHtml(
    { arrayBuffer: buffer },
    {
      // Custom image handler to extract and create blob URLs
      convertImage: mammoth.images.imgElement(async (image) => {
        try {
          const imageBuffer = await image.read();
          const mimeType = image.contentType || "image/png";
          // Convert Buffer to ArrayBuffer for Blob compatibility
          const arrayBuffer = imageBuffer.buffer.slice(
            imageBuffer.byteOffset,
            imageBuffer.byteOffset + imageBuffer.byteLength
          );
          const blob = new Blob([new Uint8Array(arrayBuffer as ArrayBuffer)], { type: mimeType });
          const blobUrl = URL.createObjectURL(blob);

          const imageId = generateId();
          extractedImages.push({
            id: imageId,
            bookId: "", // Set by file processor
            blob,
            thumbnail: null,
            mimeType,
            width: 0,
            height: 0,
            caption: null,
            altText: null,
            order: extractedImages.length,
          });

          imageUrls.set(imageId, blobUrl);

          return {
            src: blobUrl,
            alt: `Image ${extractedImages.length}`,
          };
        } catch {
          return { src: "", alt: "Image extraction failed" };
        }
      }),
      styleMap: [
        // Map common Word styles to HTML elements
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Quote'] => blockquote > p:fresh",
        "p[style-name='Block Quote'] => blockquote > p:fresh",
        "p[style-name='Intense Quote'] => blockquote > p:fresh",
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
      ],
    }
  );

  const html = result.value;

  // Log warnings if any
  if (result.messages?.length > 0) {
    console.log("[DOCX parser] Warnings:", result.messages);
  }

  // Note: image styling is handled by .reading-content img in globals.css
  // and the normalizer strips inline styles.

  // Split HTML into chapters based on h1/h2 headings
  const chapters = splitIntoChapters(html, defaultTitle);

  // Try to extract title from first heading
  const parser = new DOMParser();
  const doc = parser.parseFromString(styledHtml, "text/html");
  const firstH1 = doc.querySelector("h1");
  const title = firstH1?.textContent?.trim() || defaultTitle;

  return {
    title,
    author: "Unknown",
    chapters,
    images: extractedImages,
    coverImage: null,
    contentType: extractedImages.length > 0 ? "mixed" : "text",
    metadata: {
      format: "docx",
      imageCount: extractedImages.length,
    },
  };
}

// ─── Split content into chapters on h1/h2 boundaries ─────────────────

function splitIntoChapters(
  html: string,
  defaultTitle: string
): ParseResult["chapters"] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    `<div id="root">${html}</div>`,
    "text/html"
  );
  const root = doc.getElementById("root");
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

  const children = Array.from(root.children);

  for (const child of children) {
    const tagName = child.tagName.toLowerCase();

    if (tagName === "h1" || tagName === "h2") {
      // Save previous chapter if it has content
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

  // Save last chapter
  if (currentContent.trim()) {
    chapters.push({
      id: generateId(),
      title: currentTitle || defaultTitle,
      content: currentContent,
      imageId: null,
      order: chapters.length,
    });
  }

  // If no chapters were created, return the whole document as one chapter
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
