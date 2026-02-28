// ─── Pagination Engine ───────────────────────────────────────────────
// Measures content in an off-screen div and splits it into pages
// that fit within the viewport height.

interface PaginationResult {
  pages: string[];
  totalPages: number;
}

interface PaginationConfig {
  containerWidth: number;
  containerHeight: number;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
}

// Cache to avoid recalculating for the same content + config
const cache = new Map<string, PaginationResult>();

function getCacheKey(
  chapterId: string,
  config: PaginationConfig
): string {
  return `${chapterId}:${config.containerWidth}:${config.containerHeight}:${config.fontSize}:${config.lineHeight}:${config.fontFamily}`;
}

export function clearPaginationCache(): void {
  cache.clear();
}

export async function paginateContent(
  chapterId: string,
  htmlContent: string,
  config: PaginationConfig
): Promise<PaginationResult> {
  const cacheKey = getCacheKey(chapterId, config);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Create off-screen measurement container
  const measurer = document.createElement("div");
  measurer.className = "reading-content";
  measurer.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: ${config.containerWidth}px;
    font-size: ${config.fontSize}px;
    line-height: ${config.lineHeight};
    font-family: ${config.fontFamily};
    visibility: hidden;
    overflow: hidden;
  `;
  measurer.innerHTML = htmlContent;
  document.body.appendChild(measurer);

  try {
    const pageHeight = config.containerHeight;
    const pages: string[] = [];

    // Get all top-level child nodes
    const children = Array.from(measurer.childNodes);

    if (children.length === 0) {
      // No children — single page
      const result = { pages: [htmlContent], totalPages: 1 };
      cache.set(cacheKey, result);
      return result;
    }

    let currentPageContent = "";
    let currentHeight = 0;

    // Temp container to measure accumulated content
    const tempContainer = document.createElement("div");
    tempContainer.className = "reading-content";
    tempContainer.style.cssText = measurer.style.cssText;
    document.body.appendChild(tempContainer);

    for (const child of children) {
      const childHtml =
        child instanceof HTMLElement
          ? child.outerHTML
          : child.textContent || "";

      tempContainer.innerHTML = currentPageContent + childHtml;
      const newHeight = tempContainer.scrollHeight;

      if (newHeight > pageHeight && currentPageContent) {
        // This child doesn't fit — start a new page
        pages.push(currentPageContent);
        currentPageContent = childHtml;
        tempContainer.innerHTML = childHtml;
        currentHeight = tempContainer.scrollHeight;
      } else {
        currentPageContent += childHtml;
        currentHeight = newHeight;
      }
    }

    // Add remaining content
    if (currentPageContent) {
      pages.push(currentPageContent);
    }

    document.body.removeChild(tempContainer);

    // Filter out empty/near-empty pages by merging them into neighbors
    const filteredPages = removeEmptyPages(pages);

    const result = {
      pages: filteredPages.length > 0 ? filteredPages : [htmlContent],
      totalPages: Math.max(filteredPages.length, 1),
    };

    cache.set(cacheKey, result);
    return result;
  } finally {
    document.body.removeChild(measurer);
  }
}

/**
 * Remove pages that have no visible content (no text, no images).
 * Merges empty page content into the next non-empty page so nothing is lost.
 */
function removeEmptyPages(pages: string[]): string[] {
  const result: string[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    if (isPageEmpty(page)) {
      // Merge this empty page's HTML into the next page (or previous if last)
      if (i + 1 < pages.length) {
        pages[i + 1] = page + pages[i + 1];
      } else if (result.length > 0) {
        result[result.length - 1] += page;
      }
      // Skip adding this empty page
    } else {
      result.push(page);
    }
  }

  return result;
}

/**
 * Check if a page's HTML has no meaningful visible content.
 */
function isPageEmpty(html: string): boolean {
  // Quick check: if it contains img or svg tags, it's not empty
  if (html.includes("<img") || html.includes("<svg")) return false;

  // Strip all HTML tags and check for non-whitespace text
  const textOnly = html.replace(/<[^>]*>/g, "").trim();
  return textOnly.length === 0;
}
