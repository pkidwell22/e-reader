import DOMPurify from "dompurify";
import type { ParseResult } from "./types";
import { generateId } from "@/lib/storage/db";
import { titleFromFilename } from "@/lib/utils";

export async function parseHtml(file: File): Promise<ParseResult> {
  const text = await file.text();
  const title = titleFromFilename(file.name);

  // Parse with DOMParser
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");

  // Extract title
  const docTitle =
    doc.querySelector("title")?.textContent?.trim() || title;

  // Extract author from meta tags
  const authorMeta =
    doc.querySelector('meta[name="author"]')?.getAttribute("content") ||
    doc.querySelector('meta[name="Author"]')?.getAttribute("content") ||
    "Unknown";

  // Sanitize the body content
  const bodyHtml = doc.body?.innerHTML || text;
  const cleanHtml = DOMPurify.sanitize(bodyHtml, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "strong", "b", "em", "i", "u", "s", "del", "ins",
      "blockquote", "pre", "code",
      "ul", "ol", "li",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
      "figure", "figcaption",
      "div", "span", "section", "article",
      "sup", "sub", "mark", "abbr",
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "class", "id",
      "width", "height", "colspan", "rowspan",
    ],
    ALLOW_DATA_ATTR: false,
  });

  // Try to split on h1/h2 headings
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = cleanHtml;

  const headings = tempDiv.querySelectorAll("h1, h2");

  if (headings.length > 1) {
    const chapters = [];
    let currentContent = "";
    let currentTitle = docTitle;
    let order = 0;

    // Collect content before first heading
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode();
    let reachedFirstHeading = false;

    while (node) {
      if (node === headings[0]) {
        reachedFirstHeading = true;
        if (currentContent.trim()) {
          chapters.push({
            id: generateId(),
            title: "Introduction",
            content: currentContent,
            imageId: null,
            order: order++,
          });
          currentContent = "";
        }
        currentTitle = (node as HTMLElement).textContent?.trim() || `Chapter ${order + 1}`;
      }
      if (!reachedFirstHeading && node.parentElement === tempDiv) {
        currentContent += (node as HTMLElement).outerHTML;
      }
      node = walker.nextNode();
    }

    // Split by headings
    headings.forEach((heading, i) => {
      // Get content between this heading and the next
      let content = heading.outerHTML;
      let sibling = heading.nextElementSibling;
      const nextHeading = headings[i + 1];

      while (sibling && sibling !== nextHeading) {
        content += sibling.outerHTML;
        sibling = sibling.nextElementSibling;
      }

      chapters.push({
        id: generateId(),
        title: heading.textContent?.trim() || `Chapter ${order + 1}`,
        content,
        imageId: null,
        order: order++,
      });
    });

    return {
      title: docTitle,
      author: authorMeta,
      chapters,
      images: [],
      coverImage: null,
      contentType: "text",
      metadata: {
        format: "html",
        imageCount: 0,
      },
    };
  }

  // Single chapter
  return {
    title: docTitle,
    author: authorMeta,
    chapters: [
      {
        id: generateId(),
        title: docTitle,
        content: cleanHtml,
        imageId: null,
        order: 0,
      },
    ],
    images: [],
    coverImage: null,
    contentType: "text",
    metadata: {
      format: "html",
      imageCount: 0,
    },
  };
}
