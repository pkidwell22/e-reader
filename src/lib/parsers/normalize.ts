/**
 * Content Normalization Layer
 *
 * Takes raw HTML from any parser and produces clean, semantic HTML.
 * Strips inline styles, classes, and IDs. Converts non-semantic markup
 * (styled spans, nested divs) to semantic equivalents. Removes empty
 * elements and wraps orphan text nodes.
 *
 * The goal: let `.reading-content` CSS in globals.css be the single
 * source of truth for all visual presentation.
 */

// ─── Tag Classification ──────────────────────────────────────────────

const BLOCK_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "blockquote", "pre",
  "ul", "ol", "li",
  "figure", "figcaption",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  "hr", "br",
  "div", "section", "article", "aside", "nav", "header", "footer",
]);

const INLINE_TAGS = new Set([
  "strong", "b", "em", "i", "u", "s", "del", "ins",
  "code", "a", "img",
  "sup", "sub", "mark", "abbr", "span",
]);

const SELF_CLOSING_TAGS = new Set(["br", "hr", "img"]);

const SEMANTIC_WRAPPERS = new Set([
  "section", "article", "aside", "nav", "header", "footer",
]);

// Tags whose content should not be modified (whitespace-sensitive)
const PRESERVE_CONTENT_TAGS = new Set(["pre", "code", "svg"]);

// Allowed tags — everything else gets unwrapped or removed
const ALLOWED_TAGS = new Set([
  ...BLOCK_TAGS,
  ...INLINE_TAGS,
  "strong", "em", "del", "ins",
  "figure", "figcaption",
  "svg",
]);

// Attributes to preserve per tag — everything else is stripped
const PRESERVED_ATTRS: Record<string, string[]> = {
  a: ["href", "title"],
  img: ["src", "alt", "title"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
  col: ["span"],
};

// ─── Fast-Path Detection ─────────────────────────────────────────────

/**
 * Quick check: if HTML has none of the patterns that need normalization,
 * return true to skip the expensive DOM parsing. This makes normalization
 * essentially free for clean input (markdown, txt parser output).
 */
function isLikelyClean(html: string): boolean {
  return (
    !html.includes(" style=") &&
    !html.includes(" class=") &&
    !html.includes(" id=") &&
    !html.includes("<div") &&
    !html.includes("<span") &&
    !html.includes("<DIV") &&
    !html.includes("<SPAN")
  );
}

// ─── Main Normalization Function ─────────────────────────────────────

/**
 * Normalize raw HTML content from any parser into clean, semantic HTML.
 *
 * Designed to be idempotent: running it twice produces the same output.
 * For already-clean input, the fast-path returns instantly.
 */
export function normalizeContent(html: string): string {
  if (!html || !html.trim()) return "";

  // Fast path — skip DOM parsing for clean input
  if (isLikelyClean(html)) return html;

  // Parse into a DOM tree
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    `<body>${html}</body>`,
    "text/html"
  );
  const body = doc.body;
  if (!body) return html;

  // Phase 1: Bottom-up — convert styles to semantics, strip attributes
  walkBottomUp(body);

  // Phase 2: Top-down — remove empties, collapse nesting
  walkTopDown(body);

  // Phase 3: Wrap orphan text/inline nodes at top level
  wrapOrphans(body);

  return body.innerHTML;
}

// ─── Phase 1: Bottom-Up Traversal ────────────────────────────────────

function walkBottomUp(root: Element): void {
  // Collect all elements first (bottom-up = process children before parents)
  const elements = Array.from(root.querySelectorAll("*")).reverse();

  for (const el of elements) {
    const tag = el.tagName.toLowerCase();

    // Skip SVG subtrees entirely — their attributes are structural
    if (tag === "svg" || el.closest("svg")) continue;

    // Skip pre/code internals — whitespace is significant
    if (tag !== "pre" && tag !== "code" && el.closest("pre")) continue;

    // 1. Convert styled spans/divs to semantic elements
    if (tag === "span" || tag === "div" || tag === "font") {
      convertStyledElement(el);
      continue; // convertStyledElement handles attribute stripping
    }

    // 2. Normalize b → strong, i → em
    if (tag === "b") {
      replaceTag(el, "strong");
      stripAttrs(el, "strong");
      continue;
    }
    if (tag === "i") {
      replaceTag(el, "em");
      stripAttrs(el, "em");
      continue;
    }

    // 3. Unwrap semantic container wrappers (section, article, etc.)
    if (SEMANTIC_WRAPPERS.has(tag)) {
      unwrapElement(el);
      continue;
    }

    // 4. Strip disallowed tags (keep children)
    if (!ALLOWED_TAGS.has(tag) && !SELF_CLOSING_TAGS.has(tag)) {
      unwrapElement(el);
      continue;
    }

    // 5. Strip attributes on allowed tags
    stripAttrs(el, tag);
  }
}

/**
 * Convert a styled span/div/font into semantic elements based on its
 * inline style, then unwrap any remaining non-semantic wrapper.
 */
function convertStyledElement(el: Element): void {
  const style = el.getAttribute("style") || "";
  const tag = el.tagName.toLowerCase();
  const styleLower = style.toLowerCase();

  // Detect semantic styles
  const isBold =
    styleLower.includes("font-weight") &&
    (styleLower.includes("bold") ||
      styleLower.includes("700") ||
      styleLower.includes("800") ||
      styleLower.includes("900"));
  const isItalic = styleLower.includes("font-style") && styleLower.includes("italic");
  const isUnderline =
    styleLower.includes("text-decoration") && styleLower.includes("underline");
  const isStrikethrough =
    styleLower.includes("text-decoration") && styleLower.includes("line-through");

  // Check for <font> face/size attributes (legacy HTML)
  // Just unwrap these — our CSS handles fonts

  // Build nested semantic wrappers from inside out
  if (isBold || isItalic || isUnderline || isStrikethrough) {
    let innermost: Element = el;

    if (isStrikethrough) {
      innermost = wrapChildrenIn(innermost, "del");
    }
    if (isUnderline) {
      innermost = wrapChildrenIn(innermost, "u");
    }
    if (isItalic) {
      innermost = wrapChildrenIn(innermost, "em");
    }
    if (isBold) {
      innermost = wrapChildrenIn(innermost, "strong");
    }

    // Now unwrap the original span/div shell
    unwrapElement(el);
    return;
  }

  // No semantic styles detected
  if (tag === "div") {
    // If div has only inline content, convert to <p>
    if (hasOnlyInlineContent(el)) {
      replaceTag(el, "p");
      stripAttrs(el, "p");
    } else {
      // Block-level children — just unwrap the div
      unwrapElement(el);
    }
  } else {
    // Span or font with no semantic purpose — unwrap
    unwrapElement(el);
  }
}

// ─── Phase 2: Top-Down Cleanup ───────────────────────────────────────

function walkTopDown(root: Element): void {
  // Multiple passes until stable (usually 1-2 passes)
  let changed = true;
  let passes = 0;

  while (changed && passes < 5) {
    changed = false;
    passes++;

    const elements = Array.from(root.querySelectorAll("*"));

    for (const el of elements) {
      // Skip if already removed from DOM
      if (!el.parentNode) continue;

      const tag = el.tagName.toLowerCase();

      // Skip SVG subtrees
      if (tag === "svg" || el.closest("svg")) continue;

      // 1. Remove empty elements
      if (isEmptyElement(el)) {
        el.remove();
        changed = true;
        continue;
      }

      // 2. Collapse redundant nesting:
      //    <div><p>text</p></div> → <p>text</p>
      //    <p><p>text</p></p> → <p>text</p>
      if ((tag === "div" || tag === "p") && el.children.length === 1) {
        const child = el.children[0];
        const childTag = child.tagName.toLowerCase();
        if (BLOCK_TAGS.has(childTag) && childTag !== "br" && childTag !== "hr") {
          // Check there's no meaningful text outside the child
          const textOutside = getDirectTextContent(el).trim();
          if (!textOutside) {
            el.replaceWith(child);
            changed = true;
            continue;
          }
        }
      }

      // 3. Unwrap remaining divs and attributeless spans
      if (tag === "div") {
        unwrapElement(el);
        changed = true;
        continue;
      }

      if (tag === "span" && el.attributes.length === 0) {
        unwrapElement(el);
        changed = true;
        continue;
      }
    }
  }
}

// ─── Phase 3: Orphan Text/Inline Wrapping ────────────────────────────

function wrapOrphans(root: Element): void {
  const children = Array.from(root.childNodes);
  let currentGroup: Node[] = [];

  function flushGroup() {
    if (currentGroup.length === 0) return;

    // Check if group has any non-whitespace content
    const hasContent = currentGroup.some((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent?.trim() !== "";
      }
      return true;
    });

    if (hasContent) {
      const p = root.ownerDocument.createElement("p");
      // Insert p before the first node in the group
      root.insertBefore(p, currentGroup[0]);
      for (const node of currentGroup) {
        p.appendChild(node);
      }
    }

    currentGroup = [];
  }

  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) {
      // Text nodes are always orphans at top level
      currentGroup.push(child);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tag = el.tagName.toLowerCase();

      if (INLINE_TAGS.has(tag)) {
        // Inline element at top level — add to group
        currentGroup.push(child);
      } else {
        // Block element — flush any accumulated inline group
        flushGroup();
      }
    }
  }

  // Flush any remaining group
  flushGroup();
}

// ─── Utility Functions ───────────────────────────────────────────────

/**
 * Strip all attributes from an element except those in the allowlist.
 * Never reads or copies data URI values — just skips the `src` attribute.
 */
function stripAttrs(el: Element, tag: string): void {
  const allowed = PRESERVED_ATTRS[tag] || [];
  const toRemove: string[] = [];

  for (let i = 0; i < el.attributes.length; i++) {
    const name = el.attributes[i].name;
    if (!allowed.includes(name)) {
      toRemove.push(name);
    }
  }

  for (const name of toRemove) {
    el.removeAttribute(name);
  }
}

/**
 * Replace an element's tag while preserving its children and attributes.
 */
function replaceTag(el: Element, newTag: string): void {
  const doc = el.ownerDocument;
  const newEl = doc.createElement(newTag);

  // Move children
  while (el.firstChild) {
    newEl.appendChild(el.firstChild);
  }

  // Copy allowed attributes
  const allowed = PRESERVED_ATTRS[newTag] || [];
  for (const attr of allowed) {
    const val = el.getAttribute(attr);
    if (val !== null) {
      newEl.setAttribute(attr, val);
    }
  }

  el.replaceWith(newEl);
}

/**
 * Unwrap an element — replace it with its children.
 */
function unwrapElement(el: Element): void {
  const parent = el.parentNode;
  if (!parent) return;

  while (el.firstChild) {
    parent.insertBefore(el.firstChild, el);
  }
  el.remove();
}

/**
 * Wrap an element's children in a new semantic tag.
 * Returns the new wrapper element.
 */
function wrapChildrenIn(el: Element, tag: string): Element {
  const doc = el.ownerDocument;
  const wrapper = doc.createElement(tag);

  while (el.firstChild) {
    wrapper.appendChild(el.firstChild);
  }

  el.appendChild(wrapper);
  return wrapper;
}

/**
 * Check if an element contains only inline content
 * (text nodes + inline elements, no block elements).
 */
function hasOnlyInlineContent(el: Element): boolean {
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const childTag = (child as Element).tagName.toLowerCase();
      if (BLOCK_TAGS.has(childTag) && childTag !== "br") {
        return false;
      }
    }
  }
  return true;
}

/**
 * Check if an element is empty (no meaningful content).
 */
function isEmptyElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase();

  // Self-closing tags are never "empty"
  if (SELF_CLOSING_TAGS.has(tag)) return false;

  // Elements that contain images/media are not empty
  if (el.querySelector("img, svg, br, hr, video, audio, canvas")) return false;

  // Check for non-whitespace text content
  if (el.textContent?.trim()) return false;

  return true;
}

/**
 * Get text content directly owned by an element (not from children).
 */
function getDirectTextContent(el: Element): string {
  let text = "";
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent || "";
    }
  }
  return text;
}
