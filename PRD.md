# Product Requirements Document: E-Reader

## 1. Overview

### 1.1 Product Summary

A web-based e-reader application that allows users to upload documents in any common format and converts them into a beautifully rendered, book-like reading experience. The product prioritizes aesthetics, readability, and a distraction-free environment that makes digital reading feel as close to a physical book as possible.

### 1.2 Problem Statement

Existing e-reader tools are either locked to proprietary ecosystems (Kindle, Kobo), require specific file formats, or present content in plain, utilitarian interfaces. Users who have documents in formats like PDF, DOCX, TXT, HTML, or Markdown have no single tool that accepts all of these and renders them in a polished, enjoyable reading experience.

### 1.3 Target Users

- Avid readers who collect documents, articles, and books in various digital formats
- Students and researchers who want a comfortable way to read papers and notes
- Writers who want to preview their work in a book-like format
- Anyone who prefers a calm, aesthetic reading environment over cluttered document viewers

### 1.4 Success Metrics

| Metric | Target |
|---|---|
| Supported upload formats | 20+ formats at launch |
| File-to-ebook conversion time | < 5 seconds for files under 10 MB |
| Average reading session length | > 15 minutes |
| User retention (7-day) | > 40% |
| Lighthouse performance score | > 90 |

---

## 2. User Stories

### 2.1 Core User Stories

1. **As a user**, I want to upload a file in any common format so that I can read it as an ebook without manual conversion.
2. **As a user**, I want the reading interface to feel like a real book so that I enjoy spending time reading on screen.
3. **As a user**, I want to pick up where I left off so that I don't lose my place between sessions.
4. **As a user**, I want to customize fonts, sizing, and themes so that the reading experience suits my preferences.
5. **As a user**, I want to manage a personal library of uploaded books so that I can organize and return to my content.

### 2.2 Secondary User Stories

6. **As a user**, I want to upload images or illustrated documents and view them beautifully within the reader so that I have one place for all my visual and text content.
7. **As a user**, I want to tap any illustration in a book to see it full-screen so that I can examine details without leaving the reading flow.
8. **As a user**, I want to upload a folder of images and have them combined into a single viewable album so that I can flip through them like a book.
9. **As a user**, I want to search within a book so that I can find specific passages quickly.
10. **As a user**, I want to highlight text and add notes so that I can annotate what I read.
11. **As a user**, I want to navigate via a table of contents so that I can jump between chapters or sections.
12. **As a user**, I want to read on my phone, tablet, or desktop so that I can use whichever device is convenient.
13. **As a user**, I want a dark mode and sepia mode so that I can read comfortably in any lighting condition.

---

## 3. Functional Requirements

### 3.1 File Upload & Conversion

| ID | Requirement | Priority |
|---|---|---|
| F-1 | Accept file uploads via drag-and-drop and file picker | P0 |
| F-2 | Support all common document and ebook formats (see Format Support Matrix below) | P0 |
| F-3 | Automatically detect file format via extension, MIME type, and magic byte fallback | P0 |
| F-4 | Parse uploaded files and extract text content, chapter structure, and embedded images | P0 |
| F-5 | Detect and preserve document structure (headings, paragraphs, lists, block quotes, images, tables, code blocks) | P0 |
| F-6 | Display a progress indicator during conversion | P1 |
| F-7 | Show clear error messages if a file cannot be processed, with suggestions (e.g., "Try converting to PDF first") | P1 |
| F-8 | Support files up to 50 MB | P0 |
| F-9 | Support batch upload of multiple files at once | P2 |
| F-10 | For any truly unrecognized format, attempt plain-text extraction as a last resort before showing an error | P1 |

#### Format Support Matrix

Formats are grouped into tiers by priority.

**Tier 1 — P0 (Must-have at launch)**

| Format | Extensions | Notes |
|---|---|---|
| PDF | `.pdf` | Text-based PDFs; image-only PDFs show a message suggesting OCR |
| EPUB | `.epub` | The standard ebook format |
| Microsoft Word | `.docx`, `.doc` | `.docx` via client-side parsing; `.doc` (legacy binary) via best-effort conversion |
| Plain Text | `.txt` | Direct rendering, detect UTF-8/UTF-16 encoding |
| Markdown | `.md`, `.markdown`, `.mdx` | Full CommonMark + GFM support (tables, task lists, footnotes) |
| HTML | `.html`, `.htm`, `.xhtml` | Sanitized rendering; strip scripts, preserve structure |
| Rich Text Format | `.rtf` | Common export format from many editors |

**Tier 2 — P0 (Must-have at launch)**

| Format | Extensions | Notes |
|---|---|---|
| MOBI | `.mobi` | Legacy Kindle format |
| AZW / AZW3 | `.azw`, `.azw3` | Kindle format (DRM-free only) |
| FB2 | `.fb2`, `.fb2.zip` | FictionBook format, popular in Eastern Europe |
| ODT | `.odt` | OpenDocument Text (LibreOffice, Google Docs export) |
| CBZ / CBR | `.cbz`, `.cbr` | Comic book archives (ZIP/RAR of images) — render as full-page images |
| **Images** | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif`, `.bmp`, `.tiff`, `.tif` | Single images open as a one-page visual book; multiple images uploaded together are combined into an image album/gallery book |
| **SVG** | `.svg` | Scalable vector graphics rendered inline; respects theme colors where possible |

**Tier 3 — P1 (Should-have)**

| Format | Extensions | Notes |
|---|---|---|
| LaTeX | `.tex`, `.latex` | Render mathematical notation; strip preamble/macros, focus on body content |
| reStructuredText | `.rst` | Common in Python/technical docs |
| Org Mode | `.org` | Emacs org-mode files |
| DjVu | `.djvu` | Scanned document format — render embedded images/text layers |
| XPS | `.xps`, `.oxps` | Microsoft's fixed-layout format |
| CSV | `.csv` | Render as formatted tables |
| JSON | `.json` | Pretty-print with syntax highlighting |
| XML | `.xml` | Pretty-print with syntax highlighting; detect known schemas (DocBook, TEI) |

**Tier 4 — P2 (Nice-to-have)**

| Format | Extensions | Notes |
|---|---|---|
| Pages | `.pages` | Apple Pages (extract from ZIP container) |
| Google Docs | `.gdoc` | Exported as HTML or DOCX from Google Drive |
| PPTX | `.pptx` | Extract text and speaker notes from presentations |
| OpenDocument Presentation | `.odp` | Extract text content from slides |
| YAML | `.yaml`, `.yml` | Pretty-print with syntax highlighting |
| TOML | `.toml` | Pretty-print with syntax highlighting |
| Source Code | `.py`, `.js`, `.ts`, `.go`, `.rs`, `.java`, `.c`, `.cpp`, `.rb`, `.swift`, etc. | Render with syntax highlighting as a readable document |

### 3.2 Image & Illustration Handling

| ID | Requirement | Priority |
|---|---|---|
| I-1 | Accept standalone image uploads (JPG, PNG, GIF, WebP, AVIF, BMP, TIFF, SVG) and render them as visual books | P0 |
| I-2 | When multiple images are uploaded together (batch), combine them into a single ordered image-book with one image per page | P0 |
| I-3 | Preserve embedded illustrations and figures from document formats (EPUB, DOCX, PDF, HTML, FB2, ODT) at their original position in the text flow | P0 |
| I-4 | Render inline images responsively — scale to fit the reading area width while maintaining aspect ratio; never upscale beyond native resolution | P0 |
| I-5 | Support a full-page image viewing mode: tap/click any image to expand it to fill the viewport with a dark backdrop overlay | P0 |
| I-6 | In full-page image view, support pinch-to-zoom on touch devices and scroll-wheel zoom on desktop (up to 3x native resolution) | P1 |
| I-7 | In full-page image view, support panning via drag when zoomed in | P1 |
| I-8 | Render animated GIFs with playback; provide a pause/play toggle | P1 |
| I-9 | For image-only books (CBZ, CBR, uploaded image albums), use a dedicated visual reader mode: full-bleed images, no text margins, swipe/arrow to navigate between pages | P0 |
| I-10 | In visual reader mode, support both single-page and two-page spread layouts (toggle via settings) | P1 |
| I-11 | Preserve image captions and alt text from source documents; display captions below images in a subtle, smaller font | P0 |
| I-12 | Lazy-load images that are off-screen; preload the next 2 pages of images for smooth navigation | P0 |
| I-13 | Generate thumbnails for image-heavy books to use as cover art in the library | P0 |
| I-14 | Support SVG illustrations with proper scaling; sanitize SVG content to strip embedded scripts | P0 |
| I-15 | For documents with figures/illustrations, auto-generate a "List of Figures" in the TOC sidebar if 5+ images are present | P2 |

### 3.3 Reading Interface

| ID | Requirement | Priority |
|---|---|---|
| R-1 | Paginated reading view with smooth page-turn animations | P0 |
| R-2 | Optional scroll-based continuous reading mode | P1 |
| R-3 | Render content with proper typographic hierarchy (headings, body, captions) | P0 |
| R-4 | Display embedded images and illustrations inline within text flow, scaled to reading area width (see 3.2 for full image spec) | P0 |
| R-5 | Show current page number and total page count | P0 |
| R-6 | Show a progress bar or percentage indicating reading progress | P1 |
| R-7 | Keyboard navigation: arrow keys or spacebar to turn pages | P0 |
| R-8 | Touch/swipe navigation for mobile devices | P0 |
| R-9 | Full-screen reading mode that hides all browser chrome and UI controls | P1 |
| R-10 | Automatically switch between text reader mode and visual reader mode based on content type | P0 |

### 3.5 Customization & Themes

| ID | Requirement | Priority |
|---|---|---|
| C-1 | Light, dark, and sepia color themes | P0 |
| C-2 | Font family selection (minimum: serif, sans-serif, monospace, dyslexia-friendly) | P0 |
| C-3 | Adjustable font size (range: 12px to 32px) | P0 |
| C-4 | Adjustable line height and margin width | P1 |
| C-5 | Persist user preferences across sessions via local storage | P0 |
| C-6 | Adjustable page width (narrow, medium, wide) | P1 |

### 3.6 Library Management

| ID | Requirement | Priority |
|---|---|---|
| L-1 | Display all uploaded books in a library grid with cover thumbnails | P0 |
| L-2 | Auto-generate cover art from the book title and author if no cover image is embedded | P0 |
| L-3 | Allow users to sort library by title, author, date added, or last read | P1 |
| L-4 | Allow users to search the library by title or author | P1 |
| L-5 | Allow users to delete books from their library | P0 |
| L-6 | Show reading progress on each book's library card | P1 |
| L-7 | Support organizing books into user-created shelves or collections | P2 |

### 3.7 Reading State & Bookmarks

| ID | Requirement | Priority |
|---|---|---|
| B-1 | Automatically save current reading position on page change | P0 |
| B-2 | Restore reading position when reopening a book | P0 |
| B-3 | Allow users to create named bookmarks at any position | P1 |
| B-4 | Display a list of bookmarks for quick navigation | P1 |

### 3.8 Annotations

| ID | Requirement | Priority |
|---|---|---|
| A-1 | Allow users to highlight text in multiple colors | P1 |
| A-2 | Allow users to attach notes to highlighted passages | P1 |
| A-3 | Display all highlights and notes in a dedicated panel | P2 |
| A-4 | Allow export of highlights and notes as plain text or Markdown | P2 |

### 3.9 Table of Contents & Navigation

| ID | Requirement | Priority |
|---|---|---|
| N-1 | Auto-generate a table of contents from document headings | P0 |
| N-2 | Display TOC in a slide-out sidebar panel | P0 |
| N-3 | Allow clicking any TOC entry to jump to that section | P0 |
| N-4 | In-book text search with result count and navigation between matches | P1 |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement |
|---|---|
| NF-1 | Initial page load under 2 seconds on a 4G connection |
| NF-2 | File conversion completes in under 5 seconds for files up to 10 MB |
| NF-3 | Page turns render in under 100ms with no visible jank |
| NF-4 | Application works offline once a book has been loaded (service worker caching) |
| NF-5 | Memory usage stays below 200 MB even for large documents |

### 4.2 Accessibility

| ID | Requirement |
|---|---|
| NF-6 | Full keyboard navigation throughout the application |
| NF-7 | Screen reader compatible with proper ARIA labels and semantic HTML |
| NF-8 | Minimum WCAG 2.1 AA contrast ratios across all themes |
| NF-9 | Dyslexia-friendly font option (e.g., OpenDyslexic) |
| NF-10 | Respect user's OS-level reduced motion preferences |

### 4.3 Security & Privacy

| ID | Requirement |
|---|---|
| NF-11 | All file processing happens client-side; no files are uploaded to a server |
| NF-12 | All user data (library, preferences, reading state) is stored in browser local storage or IndexedDB |
| NF-13 | No user tracking or analytics beyond anonymous, aggregate usage metrics (opt-in only) |
| NF-14 | Content Security Policy headers to prevent XSS |

### 4.4 Compatibility

| ID | Requirement |
|---|---|
| NF-15 | Works on latest two versions of Chrome, Firefox, Safari, and Edge |
| NF-16 | Responsive design: mobile (320px+), tablet (768px+), desktop (1024px+) |
| NF-17 | Progressive Web App (PWA) with installable home screen support |

---

## 5. Frontend Design Specification

### 5.1 Design Philosophy

Strip everything back to what matters: the content. The interface should feel like it isn't there — just you and the book. Every element earns its place by serving the reading experience. If it doesn't help you read, it doesn't exist.

**Three words:** Quiet. Sharp. Invisible.

### 5.2 Design Principles

1. **Zero-chrome reading.** During reading, the UI is gone. No toolbars, no headers, no floating buttons. The page is the interface. Controls reveal only on hover (desktop) or tap (mobile), then fade away after 2 seconds of inactivity.
2. **Razor-sharp hierarchy.** At any moment, the user's eye should know exactly where to go. One focal element per view. No competing visual weights.
3. **Precise whitespace.** Every gap is deliberate. Spacing follows a strict 4px base grid (4, 8, 12, 16, 24, 32, 48, 64, 96). Nothing is "about right" — it's exact.
4. **Warm minimalism.** Minimal does not mean cold. Subtle warmth in the color palette, gentle radius on corners (6px), and soft shadows that barely whisper depth. No hard edges. No sterile whites.
5. **Motion with purpose.** Every animation communicates a state change. Nothing decorative. Easing is always `cubic-bezier(0.25, 0.1, 0.25, 1)` — fast in, gentle out. If the user has `prefers-reduced-motion`, all transitions snap instantly.

### 5.3 Color System

Each theme is a complete system with semantic tokens. Components reference tokens, never raw hex values.

**Light Theme**

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#FAFAF7` | Page background, reading surface |
| `--bg-secondary` | `#F3F2EE` | Sidebar background, card hover |
| `--bg-tertiary` | `#EAEAE5` | Input backgrounds, dividers |
| `--text-primary` | `#1A1A1A` | Body text, headings |
| `--text-secondary` | `#6B6B6B` | Captions, metadata, timestamps |
| `--text-tertiary` | `#9B9B9B` | Placeholders, disabled text |
| `--accent` | `#4A6FA5` | Interactive elements, links, progress bars |
| `--accent-hover` | `#3D5D8A` | Hovered interactive elements |
| `--border` | `#E5E5E0` | Card borders, subtle dividers |
| `--shadow` | `0 1px 3px rgba(0,0,0,0.04)` | Cards, elevated surfaces |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.08)` | Modals, image lightbox backdrop |

**Dark Theme**

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#141419` | Page background |
| `--bg-secondary` | `#1C1C24` | Sidebar, cards |
| `--bg-tertiary` | `#262630` | Inputs, dividers |
| `--text-primary` | `#E8E8ED` | Body text |
| `--text-secondary` | `#8E8E9A` | Captions, metadata |
| `--text-tertiary` | `#5C5C6A` | Placeholders |
| `--accent` | `#7CA1D4` | Interactive elements |
| `--accent-hover` | `#9BB5DF` | Hover state |
| `--border` | `#2A2A36` | Borders |
| `--shadow` | `0 1px 3px rgba(0,0,0,0.3)` | Cards |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.5)` | Modals |

**Sepia Theme**

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#F5ECD7` | Page background |
| `--bg-secondary` | `#EDE3CA` | Sidebar, cards |
| `--bg-tertiary` | `#E2D8BD` | Inputs, dividers |
| `--text-primary` | `#3D3226` | Body text |
| `--text-secondary` | `#7A6B56` | Captions, metadata |
| `--text-tertiary` | `#A89880` | Placeholders |
| `--accent` | `#8B6F4E` | Interactive elements |
| `--accent-hover` | `#735A3D` | Hover state |
| `--border` | `#DDD2B9` | Borders |
| `--shadow` | `0 1px 3px rgba(60,40,10,0.06)` | Cards |
| `--shadow-lg` | `0 8px 32px rgba(60,40,10,0.12)` | Modals |

### 5.4 Typography

**Font Stack**

| Role | Font | Fallback | Weight |
|---|---|---|---|
| Body (default) | Literata | Georgia, serif | 400 (regular), 700 (bold) |
| Body (sans) | Bricolage Grotesque | system-ui, sans-serif | 400, 600 |
| Headings | Bricolage Grotesque | system-ui, sans-serif | 600 (semibold), 700 (bold) |
| UI elements (buttons, labels, nav) | Bricolage Grotesque | system-ui, sans-serif | 400, 500 |
| Monospace | JetBrains Mono | Menlo, monospace | 400 |
| Dyslexia | OpenDyslexic | Comic Sans MS, cursive | 400 |

> **Note on Bricolage Grotesque:** A variable-weight grotesque with distinctive optical sizing and a warm, slightly quirky character. It gives the UI personality without competing with the reading content. Available on Google Fonts. Load weights 400, 500, 600, and 700. Use `font-variation-settings` for fine-tuned weight control.

**Type Scale (default 18px base)**

| Element | Font | Size | Weight | Line Height | Letter Spacing | Color |
|---|---|---|---|---|---|---|
| Body | Literata | 18px (1.125rem) | 400 | 1.75 | 0 | `--text-primary` |
| H1 | Bricolage Grotesque | 32px (2rem) | 700 | 1.25 | -0.02em | `--text-primary` |
| H2 | Bricolage Grotesque | 24px (1.5rem) | 600 | 1.3 | -0.01em | `--text-primary` |
| H3 | Bricolage Grotesque | 20px (1.25rem) | 600 | 1.4 | 0 | `--text-primary` |
| Caption / Image caption | Bricolage Grotesque | 14px (0.875rem) | 400 | 1.5 | 0.01em | `--text-secondary` |
| Metadata (library cards) | Bricolage Grotesque | 13px (0.8125rem) | 400 | 1.4 | 0.01em | `--text-tertiary` |
| UI buttons / labels | Bricolage Grotesque | 14px (0.875rem) | 500 | 1.4 | 0.01em | `--text-primary` |
| Code | JetBrains Mono | 15px (0.9375rem) | 400 | 1.6 | 0 | `--text-primary` |

**Optimal Reading Metrics**
- Characters per line: 60-70 (enforced via `max-width`)
- Paragraph spacing: `1em` (one blank line between paragraphs)
- First-line indent: None (use paragraph spacing instead for screen readability)
- Hyphenation: `hyphens: auto` with `overflow-wrap: break-word`

### 5.5 Spacing & Grid System

**Base Unit:** 4px

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4px | Tight gaps (icon to label) |
| `--space-2` | 8px | Related element spacing |
| `--space-3` | 12px | List item padding |
| `--space-4` | 16px | Card internal padding |
| `--space-6` | 24px | Section gaps |
| `--space-8` | 32px | Component gaps |
| `--space-12` | 48px | Page vertical padding |
| `--space-16` | 64px | Major section breaks |
| `--space-24` | 96px | Hero / empty state spacing |

**Layout Grid**

| Context | Max Width | Horizontal Padding |
|---|---|---|
| Reading area (text) | 680px | 24px (mobile), 48px (desktop) |
| Reading area (visual) | 100vw (full bleed) | 0 |
| Library grid | 1280px | 24px (mobile), 48px (desktop) |
| Sidebar panels | 320px | 16px |
| Settings panels | 400px | 24px |

### 5.6 Component Specifications

#### Library View

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │  Search...                              [+] Add │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐   │
│   │          │  │          │  │          │  │      │   │
│   │  Cover   │  │  Cover   │  │  Cover   │  │ Cover│   │
│   │  Image   │  │  Image   │  │  Image   │  │ Image│   │
│   │          │  │          │  │          │  │      │   │
│   ├──────────┤  ├──────────┤  ├──────────┤  ├──────┤   │
│   │Title     │  │Title     │  │Title     │  │Title │   │
│   │Author    │  │Author    │  │Author    │  │Author│   │
│   │━━━━━━━░░░│  │━━━━━░░░░░│  │━━░░░░░░░░│  │━━━━━━│   │
│   └──────────┘  └──────────┘  └──────────┘  └──────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- **Book cards:** Aspect ratio 2:3 (book proportions). `border-radius: 6px`. On hover: translate Y -2px + `shadow-lg` transition (200ms). No heavy borders — just the subtle `--shadow` by default.
- **Cover thumbnails:** Fill the card top. If no cover exists, generate one with a gradient background (seeded from the title hash for consistency) + title text centered in the card.
- **Progress bar:** Thin line (3px) at the bottom of each card. `--accent` color for the filled portion, `--bg-tertiary` for the track. No text labels on the bar itself.
- **Upload zone:** When no books exist, the entire library is a single large drop zone with a dashed `--border` outline, a subtle upload icon (24px, `--text-tertiary`), and a single line of text: "Drop files here to start reading." When books exist, the `[+]` button in the search bar triggers a modal or file picker.
- **Grid:** CSS Grid. `grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))`. Gap: 24px. Cards resize fluidly — no fixed breakpoints for column count.
- **Empty state:** Centered vertically and horizontally. Icon + text + a subtle "Browse files" text button below. No heavy CTAs.

#### Reader View — Text Mode

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│                                                         │
│         Chapter 3: The Silent Garden                    │
│                                                         │
│         The morning light filtered through the          │
│         canopy in thin, golden threads. She             │
│         stood at the edge of the clearing,              │
│         notebook in hand, tracing the outline           │
│         of the oldest oak.                              │
│                                                         │
│         ┌───────────────────────────────────┐           │
│         │                                   │           │
│         │         [illustration]             │           │
│         │                                   │           │
│         └───────────────────────────────────┘           │
│         Fig. 3 — The oak at dawn                        │
│                                                         │
│         Beneath its roots, the soil was dark            │
│         and rich...                                     │
│                                                         │
│                                                         │
│                          12 / 340          ━━━━━░░░░    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- **Chrome-free by default.** No top bar, no sidebar, no buttons visible. Just the text, centered, breathing.
- **Control reveal:** On hover over the top 80px of the viewport (desktop), a minimal top bar fades in (150ms) with: `[☰ TOC]` left, book title center (truncated, `--text-secondary`, 14px), `[Aa Settings] [✕ Close]` right. On mobile, tap anywhere to toggle.
- **Page indicator:** Bottom center, very small (13px, `--text-tertiary`). Format: `12 / 340`. A thin progress bar (2px, `--accent`) sits at the absolute bottom of the viewport, full width.
- **Page turn areas:** Invisible tap zones. Left 30% of viewport = previous page. Right 30% = next page. Center 40% = toggle controls. On desktop, arrow keys and spacebar work. Swipe on mobile.
- **Inline images:** Scale to 100% of the reading area width. `border-radius: 4px`. Below the image, a caption in `--text-secondary` at 14px, italic. Tap/click to open the full-screen image viewer.
- **Image lightbox:** Dark backdrop (`rgba(0,0,0,0.92)`). Image centered and scaled to fit. Close on tap outside, `Esc` key, or X button (top right, 32px, `--text-secondary`). Zoom via scroll wheel or pinch. Pan by dragging when zoomed.

#### Reader View — Visual Mode (Comics / Image Albums)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│                                                         │
│              ┌─────────────────────────┐                │
│              │                         │                │
│              │                         │                │
│              │     [full-page image]   │                │
│              │                         │                │
│              │                         │                │
│              │                         │                │
│              └─────────────────────────┘                │
│                                                         │
│                         3 / 24                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- **Full-bleed option:** Image fills the viewport edge-to-edge with black letterboxing (`--bg-primary` in dark, `#000` for visual reader). Aspect ratio preserved.
- **Contained option (default):** Small padding (16px) around the image so it doesn't touch the screen edges. The image has `border-radius: 4px` and the subtle `--shadow`.
- **Two-page spread:** On landscape tablets and desktops wider than 1024px, offer a side-by-side view. Two images sit next to each other with an 8px gutter, simulating an open book.
- **Navigation:** Identical to text mode (tap zones, swipe, arrow keys). Page indicator at bottom center.

#### Sidebar (TOC / Settings)

- Slides in from the left (TOC) or right (Settings). Width: 320px. Backdrop: `rgba(0,0,0,0.3)`. Tap backdrop to close.
- Internal padding: 24px. Section labels in `--text-tertiary` at 12px, uppercase, letter-spacing 0.05em.
- TOC entries: 16px, `--text-secondary`. Active chapter: `--text-primary` + a 2px `--accent` left border.
- Settings controls: clean sliders (thin track, round thumb), segmented controls for theme switching (three pills: Light / Dark / Sepia), dropdown selects for fonts.

### 5.7 Motion & Transitions

| Interaction | Animation | Duration | Easing |
|---|---|---|---|
| Page turn | Horizontal slide (translateX) | 250ms | `cubic-bezier(0.25, 0.1, 0.25, 1)` |
| Page turn (scroll mode) | Smooth scroll | native | native |
| Controls fade in/out | Opacity 0 → 1 / 1 → 0 | 150ms | ease-out |
| Sidebar open | TranslateX(-100% → 0) + backdrop fade | 250ms | `cubic-bezier(0.25, 0.1, 0.25, 1)` |
| Sidebar close | TranslateX(0 → -100%) + backdrop fade | 200ms | ease-in |
| Theme switch | All color tokens crossfade | 300ms | ease |
| Card hover (library) | TranslateY(0 → -2px) + shadow transition | 200ms | ease-out |
| Image lightbox open | Scale(0.95 → 1) + opacity fade + backdrop | 200ms | `cubic-bezier(0.25, 0.1, 0.25, 1)` |
| Image lightbox close | Scale(1 → 0.95) + opacity fade | 150ms | ease-in |
| Upload progress | Width animation on progress bar | continuous | linear |
| Book card appear (library load) | Opacity 0 → 1 + translateY(8px → 0), staggered 50ms per card | 300ms | ease-out |

All animations are disabled when `prefers-reduced-motion: reduce` is active. Transitions snap instantly (duration: 0ms).

### 5.8 Iconography

- Use a single icon set: Lucide Icons (open source, consistent stroke weight)
- Stroke width: 1.5px
- Size: 20px default, 16px in tight contexts, 24px for primary actions
- Color: `--text-secondary` by default, `--text-primary` on hover
- No filled icons — outlines only, for a lighter visual weight
- Key icons: `BookOpen` (library), `ChevronLeft`/`ChevronRight` (page turn), `Settings2` (settings), `List` (TOC), `Search`, `Upload`, `X` (close), `ZoomIn`, `Maximize2` (full-screen), `Bookmark`, `Highlighter`

### 5.9 Responsive Behavior

| Breakpoint | Width | Layout Changes |
|---|---|---|
| Mobile | < 640px | Single column library. Full-width reading area. Bottom progress bar only. Touch-first navigation. Sidebar becomes full-screen overlay. Settings panel slides up from bottom as a sheet. |
| Tablet | 640px – 1024px | 2-3 column library grid. Reading area with 32px horizontal padding. Sidebar overlays content. Two-page spread available in landscape. |
| Desktop | > 1024px | 4-5 column library grid. Reading area with 48px+ horizontal padding. Sidebar pushes content (doesn't overlay). Hover-based control reveal. Two-page spread for visual reader. |

### 5.10 Image-Specific Design Details

- **Inline images in text:** Always have 24px vertical margin above and below. Never break mid-image across pages — if an image doesn't fit on the current page, push it to the next page.
- **Image captions:** Centered below the image. `--text-secondary`, 14px, italic. Max-width matches the image width, not the reading area.
- **Generated covers for image albums:** Use the first image of the album as the cover, with a subtle overlay gradient at the bottom for the title text.
- **Image loading placeholder:** A soft pulsing rectangle (`--bg-tertiary` → `--bg-secondary`, 1.5s loop) at the correct aspect ratio. No layout shift when the image loads.
- **Broken image fallback:** A rounded rectangle in `--bg-tertiary` with a centered broken-image icon (Lucide `ImageOff`, 32px, `--text-tertiary`) and small text: "Image could not be loaded."

---

## 6. Technical Architecture

### 6.1 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (React) with App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State management | Zustand |
| Storage | IndexedDB (via Dexie.js) for books; localStorage for preferences |
| File parsing | Client-side libraries (see 6.2) |
| PWA | next-pwa or Workbox |
| Deployment | Vercel |

### 6.2 File Parsing Libraries

**Tier 1 & 2 — Core Formats**

| Format | Library | Notes |
|---|---|---|
| EPUB | epub.js or @nichealpham/epub-parser | Standard ebook parsing |
| PDF | pdf.js (Mozilla) | Text extraction + page rendering |
| DOCX | mammoth.js | Converts to clean HTML |
| DOC (legacy) | mammoth.js (limited) or server-side fallback via LibreOffice WASM | Binary format; best-effort |
| Markdown | unified / remark / rehype with remark-gfm | Full GFM support |
| TXT | Native (TextDecoder) | Detect encoding via charset detection |
| HTML / XHTML | DOMParser (native) + DOMPurify | Sanitize and preserve structure |
| RTF | rtf-parser or rtf.js | Common word processor export |
| MOBI | mobi.js or custom parser | Legacy Kindle |
| AZW / AZW3 | kf8-parser or custom (DRM-free only) | Kindle KF8 container |
| FB2 | Custom XML parser (DOMParser) | Simple XML schema |
| ODT | JSZip + custom XML extractor | OpenDocument is a ZIP of XML files |
| CBZ | JSZip (extract images) | ZIP archive of sequential images |
| CBR | libunrar.js or unrar-wasm | RAR archive of sequential images |

**Tier 3 — Extended Formats**

| Format | Library | Notes |
|---|---|---|
| LaTeX | KaTeX (math rendering) + custom body extractor | Parse `\begin{document}` body; render math blocks |
| reStructuredText | Custom parser or rst2html (compiled to WASM) | Convert to HTML then render |
| Org Mode | orga or custom parser | Convert org syntax to HTML |
| DjVu | djvu.js or djvulibre (WASM) | Extract text layer + render pages as images |
| XPS | JSZip + custom XAML parser | XPS is a ZIP of XAML pages |
| CSV | PapaParse | Parse then render as styled HTML tables |
| JSON | Native JSON.parse + custom pretty-printer | Syntax highlighting via Prism.js or Shiki |
| XML | DOMParser (native) + custom pretty-printer | Detect DocBook/TEI schemas for structured rendering |

**Tier 4 — Nice-to-Have Formats**

| Format | Library | Notes |
|---|---|---|
| Pages | JSZip + custom extractor | Apple Pages is a ZIP container with protobuf/IWA files |
| PPTX / ODP | JSZip + custom XML extractor | Extract slide text and speaker notes |
| YAML / TOML | js-yaml / @iarna/toml + pretty-printer | Syntax highlighted rendering |
| Source Code | Shiki or Prism.js | Language auto-detection + syntax highlighting |

**Image Formats**

| Format | Library | Notes |
|---|---|---|
| JPG / PNG / WebP / AVIF / BMP | Native `<img>` + createImageBitmap | Decode via browser; generate thumbnails with OffscreenCanvas |
| GIF (animated) | Native `<img>` for display; gifuct-js for frame control | Pause/play toggle for animations |
| TIFF | UTIF.js or tiff.js | Decode to canvas, convert to displayable format |
| SVG | Native inline rendering + DOMPurify | Sanitize to strip scripts/event handlers |

**Shared Utilities**

| Utility | Library | Purpose |
|---|---|---|
| Archive extraction | JSZip, libunrar.js | Unpack ZIP/RAR-based formats |
| HTML sanitization | DOMPurify | Prevent XSS from user-uploaded HTML and SVGs |
| Encoding detection | jschardet or TextDecoder with fallback | Handle non-UTF-8 text files |
| Syntax highlighting | Shiki or Prism.js | Code blocks, source code, config files |
| Math rendering | KaTeX | LaTeX math expressions in any format |
| Image processing | OffscreenCanvas / createImageBitmap | Thumbnail generation, resizing, EXIF orientation correction |
| EXIF parsing | exifr | Extract orientation, camera data, and embedded thumbnails |

### 6.3 Data Model

```
Book {
  id: string (UUID)
  title: string
  author: string
  coverImage: Blob | null
  contentType: "text" | "visual" | "mixed"   // determines which reader mode to use
  content: Chapter[]
  images: ImageAsset[]                        // all images stored as blobs
  metadata: {
    format: string
    fileSize: number
    uploadedAt: Date
    lastReadAt: Date
    totalPages: number
    imageCount: number
  }
}

Chapter {
  id: string
  title: string
  content: string (sanitized HTML)            // for text chapters
  imageId: string | null                      // for visual-only chapters (one full-page image)
  order: number
}

ImageAsset {
  id: string
  bookId: string
  blob: Blob
  thumbnail: Blob                             // pre-generated small thumbnail for library/TOC
  mimeType: string
  width: number
  height: number
  caption: string | null
  altText: string | null
  order: number                               // position within the book (for image albums)
}

ReadingState {
  bookId: string
  currentChapter: number
  currentPage: number
  scrollPosition: number
  lastUpdated: Date
}

Bookmark {
  id: string
  bookId: string
  chapterId: string
  position: number
  label: string
  createdAt: Date
}

Highlight {
  id: string
  bookId: string
  chapterId: string
  startOffset: number
  endOffset: number
  color: string
  note: string | null
  createdAt: Date
}

UserPreferences {
  theme: "light" | "dark" | "sepia"
  fontFamily: string
  fontSize: number
  lineHeight: number
  pageWidth: "narrow" | "medium" | "wide"
  readingMode: "paginated" | "scroll"
}
```

### 6.4 Application Structure

```
/
├── app/
│   ├── layout.tsx              # Root layout with theme provider
│   ├── page.tsx                # Library view (home)
│   └── read/[bookId]/
│       └── page.tsx            # Reader view
├── components/
│   ├── library/
│   │   ├── BookCard.tsx        # Individual book in library grid
│   │   ├── BookGrid.tsx        # Library grid layout
│   │   ├── CoverGenerator.tsx  # Auto-generated cover art
│   │   └── UploadZone.tsx      # Drag-and-drop upload area
│   ├── reader/
│   │   ├── ReaderView.tsx      # Main reading area (routes to text or visual mode)
│   │   ├── TextReader.tsx      # Text-based paginated/scroll reader
│   │   ├── VisualReader.tsx    # Full-bleed image reader (comics, albums, image books)
│   │   ├── PageRenderer.tsx    # Content pagination and rendering
│   │   ├── PageControls.tsx    # Navigation arrows, progress bar
│   │   ├── ImageViewer.tsx     # Full-screen image lightbox with zoom/pan
│   │   ├── InlineImage.tsx     # Responsive inline image with caption + tap-to-expand
│   │   ├── SpreadToggle.tsx    # Single page vs two-page spread control
│   │   ├── TOCSidebar.tsx      # Table of contents panel
│   │   ├── SettingsPanel.tsx   # Theme, font, and layout controls
│   │   ├── SearchPanel.tsx     # In-book search
│   │   └── AnnotationPanel.tsx # Highlights and notes
│   └── ui/
│       ├── ThemeProvider.tsx
│       ├── Modal.tsx
│       └── Tooltip.tsx
├── lib/
│   ├── parsers/
│   │   ├── index.ts            # Parser router (format detection + dispatch)
│   │   ├── types.ts            # Shared ParseResult interface
│   │   ├── detect.ts           # Format detection (extension, MIME, magic bytes)
│   │   ├── epub.ts             # EPUB parser
│   │   ├── pdf.ts              # PDF parser (pdf.js)
│   │   ├── docx.ts             # DOCX/DOC parser (mammoth.js)
│   │   ├── markdown.ts         # Markdown/MDX parser (unified)
│   │   ├── txt.ts              # Plain text with encoding detection
│   │   ├── html.ts             # HTML/XHTML parser + sanitizer
│   │   ├── rtf.ts              # RTF parser
│   │   ├── mobi.ts             # MOBI parser
│   │   ├── azw.ts              # AZW/AZW3 Kindle parser
│   │   ├── fb2.ts              # FictionBook parser
│   │   ├── odt.ts              # OpenDocument Text parser
│   │   ├── cbz.ts              # Comic book ZIP archive parser
│   │   ├── cbr.ts              # Comic book RAR archive parser
│   │   ├── latex.ts            # LaTeX body + math parser
│   │   ├── rst.ts              # reStructuredText parser
│   │   ├── org.ts              # Org Mode parser
│   │   ├── djvu.ts             # DjVu parser
│   │   ├── xps.ts              # XPS/OXPS parser
│   │   ├── csv.ts              # CSV to table parser
│   │   ├── code.ts             # Source code + config (JSON, YAML, TOML, XML, etc.)
│   │   ├── presentations.ts    # PPTX/ODP text extractor
│   │   ├── pages.ts            # Apple Pages extractor
│   │   ├── image.ts            # Single image + batch image album parser
│   │   ├── svg.ts              # SVG parser + sanitizer
│   │   └── fallback.ts         # Last-resort plain-text extraction
│   ├── storage/
│   │   ├── db.ts               # Dexie.js IndexedDB setup
│   │   └── preferences.ts      # localStorage helpers
│   ├── pagination.ts           # Content-to-page splitting logic
│   ├── sanitize.ts             # HTML sanitization (DOMPurify wrapper)
│   ├── encoding.ts             # Character encoding detection
│   └── images/
│       ├── thumbnails.ts       # Thumbnail generation via OffscreenCanvas
│       ├── exif.ts             # EXIF parsing and orientation correction
│       └── zoom.ts             # Pinch-to-zoom and scroll-wheel zoom logic
├── stores/
│   ├── libraryStore.ts         # Zustand store for library state
│   ├── readerStore.ts          # Zustand store for reader state
│   └── preferencesStore.ts     # Zustand store for user preferences
└── public/
    ├── fonts/                  # Self-hosted web fonts
    └── manifest.json           # PWA manifest
```

---

## 7. Conversion Pipeline

The conversion pipeline transforms any supported input format into a normalized internal representation.

```
Upload -> Detect Format -> Parse -> Normalize -> Store -> Render

1. DETECT FORMAT
   - Check file extension against the Format Support Matrix
   - Verify MIME type matches expected type for the extension
   - Fall back to magic byte detection for ambiguous or extensionless files
     (e.g., ZIP magic bytes -> inspect contents for EPUB, DOCX, ODT, Pages, PPTX, CBZ, XPS)
   - Detect image MIME types (image/jpeg, image/png, image/gif, image/webp, image/svg+xml, etc.)
   - If format is completely unrecognized, attempt plain-text extraction (fallback parser)

2. PARSE
   - Route to the appropriate format-specific parser (see 6.2)
   - Each parser implements a shared ParseResult interface:
     { title, author, contentType, chapters[], images[], coverImage?, metadata }
   - Extract: raw text, structure (headings/chapters), images, tables, code blocks, metadata
   - For archive-based formats (EPUB, DOCX, ODT, CBZ, PPTX, etc.), unzip first then parse inner content
   - For image-heavy formats (CBZ, CBR, DjVu), create one chapter per page/image
   - For standalone images: create a single-page visual book; read EXIF data for orientation
   - For batch image uploads: create an ordered image album book with one chapter per image

3. PROCESS IMAGES
   - Correct EXIF orientation (rotate/flip as needed)
   - Generate thumbnail for each image (240px wide, JPEG quality 80)
   - Calculate and store native dimensions (width x height)
   - Sanitize SVG content (strip scripts, event handlers, external references)
   - For animated GIFs, preserve all frames
   - Store each image as an ImageAsset blob in IndexedDB

4. NORMALIZE
   - Convert parsed output to a uniform Chapter[] structure
   - Set contentType: "text" (documents), "visual" (image-only), or "mixed" (documents with illustrations)
   - Each chapter contains sanitized HTML content and/or an imageId reference
   - Preserve semantic elements: headings, paragraphs, lists, tables, blockquotes, code blocks, inline images
   - Inline images are referenced by imageId and rendered via the InlineImage component
   - Render math expressions via KaTeX where detected
   - Apply syntax highlighting to code blocks and source code files
   - Extract or infer title and author from metadata, filename, EXIF, or first heading
   - Generate cover image from first page/image if none is embedded

5. STORE
   - Write Book record, Chapter records, and ImageAsset records to IndexedDB
   - Store image blobs and their thumbnails separately for efficient lazy-loading
   - Record the original format and contentType for display in library metadata

6. RENDER
   - Route to the appropriate reader mode based on contentType:
     - "text" -> TextReader (paginated or scroll)
     - "visual" -> VisualReader (full-bleed image pages)
     - "mixed" -> TextReader with InlineImage components embedded in flow
   - Paginate normalized HTML into pages based on viewport size
   - Apply user's theme and typography preferences
   - Lazy-load images; preload next 2 pages
   - Display in the reading interface
```

---

## 8. Pages & Routes

| Route | View | Description |
|---|---|---|
| `/` | Library | Grid of uploaded books with upload button |
| `/read/[bookId]` | Reader | Full reading interface for a specific book |

Both views are client-rendered. No server-side data fetching is required since all data lives in IndexedDB.

---

## 9. Edge Cases & Error Handling

| Scenario | Handling |
|---|---|
| Corrupted or unreadable file | Show a friendly error with the detected format and suggest re-exporting the file |
| Password-protected PDF | Prompt the user to enter the password; show error if decryption fails |
| DRM-protected ebook (EPUB, AZW, MOBI) | Inform the user that DRM-protected files cannot be opened and suggest using a DRM-free version |
| Very large file (> 50 MB) | Reject with a message explaining the size limit |
| File with no text content (e.g., image-only PDF) | Inform the user that OCR is not supported and suggest using an OCR tool first |
| Unrecognized format | Attempt plain-text fallback extraction; if that also fails, list supported formats and suggest conversion tools |
| ZIP file containing multiple documents | Ask the user which file to import, or offer to import all as separate books |
| Archive-based format fails to unzip | Show error suggesting the file may be corrupted; suggest re-downloading or re-exporting |
| Non-UTF-8 encoded text file | Auto-detect encoding (ISO-8859-1, Windows-1252, Shift-JIS, etc.) and convert to UTF-8 |
| Extremely long single-chapter document | Auto-split into virtual chapters at logical break points (headings, page breaks, or every N paragraphs) |
| Browser storage quota exceeded | Warn the user and suggest deleting unused books |
| Empty file | Show a message indicating the file appears to be empty |
| Malformed HTML/Markdown/XML | Use lenient parsing; render what is recoverable and log warnings |
| LaTeX with missing packages or macros | Render body text and math; skip unknown macros with a warning |
| Comic archive with inconsistent image sizes | Normalize display to fit viewport; allow pinch-to-zoom |
| Very high resolution image (> 8000px) | Downscale on import to a max dimension of 4096px to prevent memory issues; keep original for zoom |
| Corrupted or unreadable image file | Show a placeholder with a broken-image icon and a message; do not block the rest of the book |
| EXIF-rotated image | Auto-correct orientation during the image processing step |
| SVG with embedded scripts or external references | Sanitize via DOMPurify; strip all scripts, event handlers, and external `<use>` references |
| Animated GIF that is very large (> 10 MB) | Warn user about memory usage; still allow import but disable auto-play by default |
| Batch upload of 100+ images | Show a progress bar; process in chunks to avoid UI freeze; use Web Workers if available |
| Mixed content book with tiny inline images (< 50px) | Render at native size without stretching; do not trigger lightbox on tap |
| TIFF with multiple pages/layers | Extract each page as a separate image in the album |
| Source code file with no extension | Attempt language detection via content heuristics |
| Missing fonts | Fall back to system font stack gracefully |
| Offline access | Serve cached assets via service worker; books already in IndexedDB remain readable |

---

## 10. Future Considerations (Post-MVP)

These features are explicitly out of scope for the initial release but are noted for future planning.

- **Cloud sync**: Optional account creation to sync library and reading state across devices
- **OCR support**: Optical character recognition for image-based PDFs
- **Text-to-speech**: Built-in TTS with adjustable speed and voice
- **Social features**: Share highlights or reading lists with others
- **Import from URL**: Paste a web article URL and convert it to ebook format
- **OPDS catalog support**: Browse and download from public ebook catalogs
- **Custom CSS themes**: Let users write or import their own reading themes
- **Export to EPUB**: Convert any uploaded format into a downloadable EPUB file
- **Reading statistics**: Track pages read, time spent, and reading streaks
- **Multi-language support**: UI localization and right-to-left text rendering

---

## 11. Launch Checklist

**Format & Parsing**
- [ ] All Tier 1 and Tier 2 file formats (16 formats including images) parse and render correctly
- [ ] Format auto-detection works for files with missing or incorrect extensions
- [ ] Plain-text fallback parser handles unrecognized formats gracefully
- [ ] Standalone image uploads (JPG, PNG, GIF, WebP, SVG, TIFF) render as visual books
- [ ] Batch image uploads combine into an ordered image album
- [ ] EXIF orientation is auto-corrected on import
- [ ] SVG files are sanitized and render correctly across all themes

**Reader**
- [ ] Paginated and scroll reading modes functional
- [ ] Text reader mode renders documents with correct typography
- [ ] Visual reader mode renders image-only content (comics, albums) full-bleed
- [ ] Mixed-content books show inline images in text flow with captions
- [ ] Image lightbox opens on tap/click with zoom and pan support
- [ ] Two-page spread toggle works for visual reader on wide viewports
- [ ] Animated GIFs play with pause/play toggle
- [ ] Images lazy-load with next-2-page preloading and skeleton placeholders
- [ ] Keyboard and touch/swipe navigation working in both reader modes

**Design & UI**
- [ ] All three themes (light, dark, sepia) implemented with full semantic token system
- [ ] Theme switch crossfades smoothly (300ms)
- [ ] Font selection and size adjustment working
- [ ] Spacing follows 4px grid system consistently
- [ ] Controls auto-hide during reading and reveal on hover/tap
- [ ] Library grid displays uploaded books with generated or extracted covers
- [ ] Book cards have correct 2:3 aspect ratio, hover lift, and progress bars
- [ ] Upload zone works as full-page drop zone (empty state) and modal (with books)
- [ ] Sidebar slides in/out with backdrop, correct width (320px)
- [ ] Lucide icons used consistently at correct sizes and stroke width
- [ ] All animations disabled when `prefers-reduced-motion` is active

**Infrastructure**
- [ ] Reading position persists across sessions
- [ ] Table of contents generation and navigation working
- [ ] Responsive layout tested: mobile (< 640px), tablet (640-1024px), desktop (> 1024px)
- [ ] PWA installable with offline support
- [ ] Lighthouse performance score > 90
- [ ] WCAG 2.1 AA accessibility audit passed
- [ ] Cross-browser testing on Chrome, Firefox, Safari, Edge
- [ ] Error handling for all edge cases (including image-specific) verified
- [ ] IndexedDB stores books, chapters, and image assets without exceeding quota on 500 MB of content
