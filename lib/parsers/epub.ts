import type { ParseResult } from "./types";
import type { ImageAsset } from "@/lib/types";
import { generateId } from "@/lib/storage/db";
import { titleFromFilename } from "@/lib/utils";
import JSZip from "jszip";

/**
 * EPUB Parser — unzips EPUB container, parses OPF spine,
 * extracts chapter HTML + images + metadata.
 *
 * Uses JSZip directly instead of epubjs for more control
 * and better client-side compatibility.
 */
export async function parseEpub(file: File): Promise<ParseResult> {
  const defaultTitle = titleFromFilename(file.name);
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  // 1. Find container.xml to locate the OPF file
  const containerXml = await zip.file("META-INF/container.xml")?.async("string");
  if (!containerXml) {
    throw new Error("Invalid EPUB: missing META-INF/container.xml");
  }

  const parser = new DOMParser();
  const containerDoc = parser.parseFromString(containerXml, "application/xml");
  const rootfileEl = containerDoc.getElementsByTagName("rootfile")[0];
  const rootfilePath = rootfileEl?.getAttribute("full-path") || "";

  if (!rootfilePath) {
    throw new Error("Invalid EPUB: no rootfile found in container.xml");
  }

  // 2. Parse the OPF (Open Packaging Format) file
  const opfContent = await zip.file(rootfilePath)?.async("string");
  if (!opfContent) {
    throw new Error(`Invalid EPUB: OPF file not found at ${rootfilePath}`);
  }

  const opfDoc = parser.parseFromString(opfContent, "application/xml");
  const opfDir = rootfilePath.includes("/")
    ? rootfilePath.substring(0, rootfilePath.lastIndexOf("/") + 1)
    : "";

  // 3. Extract metadata
  const title =
    getMetaText(opfDoc, "dc:title") ||
    getMetaText(opfDoc, "title") ||
    defaultTitle;
  const author =
    getMetaText(opfDoc, "dc:creator") ||
    getMetaText(opfDoc, "creator") ||
    "Unknown";

  // 4. Build manifest (id → href mapping)
  // Use getElementsByTagName for better XML namespace compatibility
  const manifest: Map<string, { href: string; mediaType: string }> = new Map();
  const manifestItems = opfDoc.getElementsByTagName("item");
  for (let i = 0; i < manifestItems.length; i++) {
    const item = manifestItems[i];
    const id = item.getAttribute("id") || "";
    const href = item.getAttribute("href") || "";
    const mediaType = item.getAttribute("media-type") || "";
    if (id && href) {
      manifest.set(id, { href, mediaType });
    }
  }

  // 5. Read spine order
  const spineItems: string[] = [];
  const spineElements = opfDoc.getElementsByTagName("itemref");
  for (let i = 0; i < spineElements.length; i++) {
    const idref = spineElements[i].getAttribute("idref") || "";
    if (idref) spineItems.push(idref);
  }

  // 6. Extract images from manifest
  // Use data URIs instead of blob URLs so images persist in IndexedDB storage.
  // Blob URLs are ephemeral and die when the page session ends.
  const imageMap: Map<string, string> = new Map(); // original path → data URI
  const images: ImageAsset[] = [];
  let coverImage: Blob | null = null;

  // Find cover image ID
  let coverId = "";
  const metaElements = opfDoc.getElementsByTagName("meta");
  for (let i = 0; i < metaElements.length; i++) {
    if (metaElements[i].getAttribute("name") === "cover") {
      coverId = metaElements[i].getAttribute("content") || "";
      break;
    }
  }

  for (const [id, entry] of manifest) {
    if (entry.mediaType.startsWith("image/")) {
      const imagePath = resolveHref(opfDir, entry.href);
      const imageFile = zip.file(imagePath);
      if (!imageFile) continue;

      try {
        const imageBlob = await imageFile.async("blob");
        const typedBlob = new Blob([imageBlob], { type: entry.mediaType });

        // Store as cover if it matches
        if (id === coverId && !coverImage) {
          coverImage = typedBlob;
        }

        // Convert to base64 data URI for persistent inline embedding
        const base64 = await imageFile.async("base64");
        const dataUri = `data:${entry.mediaType};base64,${base64}`;

        imageMap.set(entry.href, dataUri);
        // Also map with various path patterns EPUB files might use
        imageMap.set(imagePath, dataUri);
        imageMap.set(decodeURIComponent(entry.href), dataUri);
        imageMap.set(entry.href.replace(/^\.\.\//, ""), dataUri);
        // Map by filename only as a last-resort fallback
        const filename = entry.href.split("/").pop();
        if (filename) imageMap.set(filename, dataUri);

        const imageId = generateId();
        images.push({
          id: imageId,
          bookId: "", // Will be set by the file processor
          blob: typedBlob,
          thumbnail: null,
          mimeType: entry.mediaType,
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

  // 7. Extract TOC (if NCX or nav document exists)
  const tocMap = await extractToc(zip, opfDoc, opfDir, manifest);

  // 8. Process spine items into chapters
  // Many EPUBs (especially from Internet Archive/Project Gutenberg) split the
  // book into hundreds of small XHTML files. We merge consecutive spine items
  // that lack their own TOC entry into the previous chapter.
  const chapters: ParseResult["chapters"] = [];

  // Determine if this EPUB needs merging: if there are many more spine items
  // than TOC entries, we should merge items without TOC entries into the
  // preceding chapter.
  const shouldMerge = spineItems.length > tocMap.size * 2 && tocMap.size > 0;

  for (let i = 0; i < spineItems.length; i++) {
    const itemId = spineItems[i];
    const manifestEntry = manifest.get(itemId);
    if (!manifestEntry) continue;

    const chapterPath = resolveHref(opfDir, manifestEntry.href);
    const chapterFile = zip.file(chapterPath);
    if (!chapterFile) continue;

    let html: string;
    try {
      html = await chapterFile.async("string");
    } catch {
      continue;
    }

    // Extract body content from XHTML/HTML
    const bodyHtml = extractBodyHtml(parser, html, manifestEntry.href, imageMap, opfDir);
    if (!bodyHtml) continue;

    // Determine if this spine item starts a new chapter
    const tocTitle = tocMap.get(manifestEntry.href);
    const headingTitle = extractTitleFromHtml(parser, html);

    if (shouldMerge && !tocTitle && !headingTitle && chapters.length > 0) {
      // No TOC entry and no heading — merge into previous chapter
      chapters[chapters.length - 1].content += bodyHtml;
    } else {
      // Starts a new chapter
      const chapterTitle =
        tocTitle || headingTitle || `Chapter ${chapters.length + 1}`;

      chapters.push({
        id: generateId(),
        title: chapterTitle,
        content: bodyHtml,
        imageId: null,
        order: chapters.length,
      });
    }
  }

  // 9. Strip running page headers from OCR-converted EPUBs
  stripRunningHeaders(chapters, title);

  // If no chapters extracted, create a fallback
  if (chapters.length === 0) {
    chapters.push({
      id: generateId(),
      title: title,
      content: `<div style="text-align:center;padding:4rem 2rem;">
        <p style="font-size:1.25rem;margin-bottom:1rem;">Could not extract content from this EPUB.</p>
        <p style="color:var(--text-secondary);">The file may be DRM-protected or use an unsupported format.</p>
      </div>`,
      imageId: null,
      order: 0,
    });
  }

  return {
    title,
    author,
    chapters,
    images,
    coverImage,
    contentType: images.length > 0 ? "mixed" : "text",
    metadata: {
      format: "epub",
      imageCount: images.length,
    },
  };
}

// ─── Helper Functions ──────────────────────────────────────────────────

function getMetaText(doc: Document, tagName: string): string | null {
  // Use getElementsByTagName — querySelector can't handle namespaced tags
  // like "dc:title" because CSS treats ":" as a pseudo-class selector
  const el = doc.getElementsByTagName(tagName)[0];
  return el?.textContent?.trim() || null;
}

function resolveHref(opfDir: string, href: string): string {
  // Decode URI components
  const decoded = decodeURIComponent(href);

  // If href starts with /, it's absolute within the zip
  if (decoded.startsWith("/")) return decoded.slice(1);

  // Resolve relative paths
  const parts = (opfDir + decoded).split("/");
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === "..") {
      resolved.pop();
    } else if (part !== "." && part !== "") {
      resolved.push(part);
    }
  }
  return resolved.join("/");
}

/**
 * Parse a spine item's XHTML/HTML and return the processed body innerHTML.
 * Returns null if the content is empty.
 */
function extractBodyHtml(
  parser: DOMParser,
  html: string,
  href: string,
  imageMap: Map<string, string>,
  opfDir: string
): string | null {
  // Try XHTML first
  const doc = parser.parseFromString(html, "application/xhtml+xml");

  let body: Element | null;
  if (doc.querySelector("parsererror")) {
    // Fallback to HTML parser
    const fallbackDoc = parser.parseFromString(html, "text/html");
    body = fallbackDoc.body;
  } else {
    body = doc.querySelector("body");
  }

  if (!body) return null;

  // Skip if completely empty (no text, no images)
  if (!body.textContent?.trim() && body.querySelectorAll("img, svg, image").length === 0) {
    return null;
  }

  processChapterBody(body, href, imageMap, opfDir);
  return body.innerHTML;
}

/**
 * Try to extract a heading title from HTML without full body processing.
 */
function extractTitleFromHtml(
  parser: DOMParser,
  html: string
): string | null {
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;
  if (!body) return null;
  return extractTitleFromBody(body);
}

function processChapterBody(
  body: Element,
  chapterHref: string,
  imageMap: Map<string, string>,
  opfDir: string
): void {
  // Replace image src with data URIs from imageMap
  const imgs = body.querySelectorAll("img");
  imgs.forEach((img) => {
    const src = img.getAttribute("src");
    if (!src) return;

    // Try various path resolutions
    const chapterDir = chapterHref.includes("/")
      ? chapterHref.substring(0, chapterHref.lastIndexOf("/") + 1)
      : "";

    const decodedSrc = decodeURIComponent(src);
    const resolvedFromChapter = resolveHref(opfDir + chapterDir, src);
    const resolvedFromOpf = resolveHref(opfDir, src);

    // Try many path patterns — EPUBs reference images in varied ways
    const srcFilename = src.split("/").pop() || "";
    const dataUri =
      imageMap.get(src) ||
      imageMap.get(decodedSrc) ||
      imageMap.get(resolvedFromChapter) ||
      imageMap.get(resolvedFromOpf) ||
      imageMap.get(src.replace(/^\.\.\//, "")) ||
      imageMap.get(decodedSrc.replace(/^\.\.\//, "")) ||
      imageMap.get(srcFilename);

    if (dataUri) {
      img.setAttribute("src", dataUri);
    }

    // Note: responsive image styling is handled by .reading-content img
    // in globals.css and the normalizer strips any inline styles.
  });

  // Remove scripts
  const scripts = body.querySelectorAll("script");
  scripts.forEach((s) => s.remove());

  // Remove style tags (we use our own styles)
  const styles = body.querySelectorAll("style");
  styles.forEach((s) => s.remove());

  // Remove link tags
  const links = body.querySelectorAll("link");
  links.forEach((l) => l.remove());

  // Clean up SVG images
  const svgImages = body.querySelectorAll("svg image");
  svgImages.forEach((img) => {
    const href =
      img.getAttribute("xlink:href") || img.getAttribute("href");
    if (href && imageMap.has(href)) {
      img.setAttribute("xlink:href", imageMap.get(href)!);
      img.setAttribute("href", imageMap.get(href)!);
    }
  });
}

function extractTitleFromBody(body: Element): string | null {
  // Try h1, h2, h3 in order
  for (const tag of ["h1", "h2", "h3"]) {
    const heading = body.querySelector(tag);
    if (heading?.textContent?.trim()) {
      return heading.textContent.trim();
    }
  }
  // Try title-like class
  const titleEl = body.querySelector(
    '[class*="title"], [class*="chapter"], [class*="heading"]'
  );
  if (titleEl?.textContent?.trim()) {
    return titleEl.textContent.trim();
  }
  return null;
}

async function extractToc(
  zip: JSZip,
  opfDoc: Document,
  opfDir: string,
  manifest: Map<string, { href: string; mediaType: string }>
): Promise<Map<string, string>> {
  const tocMap = new Map<string, string>();

  // Try NCX TOC first
  const spineEl = opfDoc.getElementsByTagName("spine")[0];
  const ncxId = spineEl?.getAttribute("toc") || "ncx";
  const ncxEntry = manifest.get(ncxId);

  if (ncxEntry) {
    const ncxPath = resolveHref(opfDir, ncxEntry.href);
    const ncxContent = await zip.file(ncxPath)?.async("string");
    if (ncxContent) {
      const parser = new DOMParser();
      const ncxDoc = parser.parseFromString(ncxContent, "application/xml");
      const navPoints = ncxDoc.getElementsByTagName("navPoint");
      for (let i = 0; i < navPoints.length; i++) {
        const np = navPoints[i];
        // Get navLabel > text content
        const navLabels = np.getElementsByTagName("navLabel");
        const textEl = navLabels[0]?.getElementsByTagName("text")[0];
        const label = textEl?.textContent?.trim();
        // Get content src
        const contentEl = np.getElementsByTagName("content")[0];
        const src = contentEl?.getAttribute("src");
        if (label && src) {
          // Strip fragment
          const baseHref = src.split("#")[0];
          if (!tocMap.has(baseHref)) {
            tocMap.set(baseHref, label);
          }
        }
      }
    }
  }

  // Try EPUB3 nav document
  // Look for nav element with epub:type="toc"
  for (const [, entry] of manifest) {
    if (entry.mediaType !== "application/xhtml+xml") continue;
    const path = resolveHref(opfDir, entry.href);
    const content = await zip.file(path)?.async("string");
    if (!content) continue;
    // Check for toc marker in raw HTML (covers epub:type="toc" and variations)
    if (!content.includes("toc") && !content.includes("TOC")) continue;

    const navParser = new DOMParser();
    const navDoc = navParser.parseFromString(content, "application/xhtml+xml");

    // Check for parse errors — fall back to HTML parser
    if (navDoc.querySelector("parsererror")) {
      continue;
    }

    // Find nav elements and check for epub:type="toc"
    const navElements = navDoc.getElementsByTagName("nav");
    let navEl: Element | null = null;
    for (let i = 0; i < navElements.length; i++) {
      const epubType = navElements[i].getAttributeNS("http://www.idpf.org/2007/ops", "type") ||
        navElements[i].getAttribute("epub:type");
      if (epubType === "toc") {
        navEl = navElements[i];
        break;
      }
    }
    // Fallback: use first nav element if only one exists
    if (!navEl && navElements.length === 1) {
      navEl = navElements[0];
    }
    if (!navEl) continue;

    const links = navEl.getElementsByTagName("a");
    for (let i = 0; i < links.length; i++) {
      const a = links[i];
      const href = a.getAttribute("href");
      const label = a.textContent?.trim();
      if (href && label) {
        const baseHref = href.split("#")[0];
        if (!tocMap.has(baseHref)) {
          tocMap.set(baseHref, label);
        }
      }
    }
    break;
  }

  return tocMap;
}

/**
 * Strip running page headers/footers that were baked into the text content
 * during PDF-to-EPUB conversion. These are common in scanned/OCR books from
 * Project Gutenberg, Internet Archive, etc.
 *
 * Pattern examples:
 *   Even pages: "10 WUTHERING HEIGHTS es IE She flung..."
 *   Odd pages:  "...my speedy en WUTHERING HEIGHTS - 3 trance, or..."
 */
function stripRunningHeaders(
  chapters: ParseResult["chapters"],
  bookTitle: string
): void {
  // Build an escaped regex-safe version of the title in uppercase
  const upperTitle = bookTitle.toUpperCase();
  const escapedTitle = upperTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Allow flexible whitespace in the title (e.g. "WUTHERING  HEIGHTS")
  const titlePattern = escapedTitle.replace(/\s+/g, "\\s+");

  // Don't bother if the title is very short (too many false positives)
  if (upperTitle.length < 6) return;

  // First, check if this book actually has running headers by counting matches
  let totalMatches = 0;
  const sampleText = chapters.map((c) => c.content).join(" ");
  const testRegex = new RegExp(titlePattern, "gi");
  let m;
  while ((m = testRegex.exec(sampleText)) !== null) {
    totalMatches++;
    if (totalMatches > 20) break; // Definitely has running headers
  }

  // If fewer than 10 occurrences, it's probably legitimate mentions, not headers
  if (totalMatches < 10) return;

  // Build patterns for even-page and odd-page headers
  // Even pages: [page#] TITLE [0-5 chars OCR noise]
  // The OCR noise after the title can be followed by uppercase or lowercase text
  const evenPageRegex = new RegExp(
    `\\b\\d{1,4}\\s+${titlePattern}\\s*[a-zA-Z]{0,5}\\s`,
    "g"
  );
  // Odd pages: TITLE [-–—~] [page#]
  const oddPageRegex = new RegExp(
    `${titlePattern}\\s*[-–—~]+\\s*\\d{1,4}\\b`,
    "g"
  );

  for (const chapter of chapters) {
    let content = chapter.content;
    content = content.replace(evenPageRegex, " ");
    content = content.replace(oddPageRegex, " ");
    // Clean up any double/triple spaces left behind
    content = content.replace(/  +/g, " ");
    chapter.content = content;
  }
}
