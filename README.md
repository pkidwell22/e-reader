# E-Reader

A web-based e-reader that lets you upload documents in any common format and read them in a beautifully rendered, book-like interface. Everything runs client-side — no server uploads, no accounts, no tracking.

## Features

- **30+ supported formats** — EPUB, PDF, DOCX, TXT, Markdown, HTML, RTF, MOBI, AZW/AZW3, FB2, ODT, CBZ, images, code files, and more
- **Book-like reading experience** — paginated layout with smart page breaks, auto-hiding controls, and distraction-free design
- **Personal library** — upload via drag-and-drop or file picker, search and sort your collection, track reading progress
- **Reading customization** — 3 themes (light, dark, sepia), 4 font families (including OpenDyslexic), adjustable font size, line height, and page width
- **Navigation** — table of contents sidebar, in-book text search (Ctrl/Cmd+F), keyboard and touch/swipe support
- **Persistent state** — reading position, preferences, and library stored locally in IndexedDB and localStorage
- **Responsive** — works on desktop, tablet, and phone
- **Accessible** — keyboard navigation, screen reader announcements, semantic HTML, WCAG-compliant contrast

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19 + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- [Zustand](https://zustand-demo.pmnd.rs/) for state management
- [Dexie](https://dexie.org/) (IndexedDB) for client-side storage
- [PDF.js](https://mozilla.github.io/pdf.js/) for PDF parsing
- [EPUB.js](https://github.com/futurepress/epub.js) for EPUB parsing
- [Mammoth](https://github.com/mwilliamson/mammoth.js) for DOCX conversion
- [JSZip](https://stuk.github.io/jszip/) for ZIP-based formats (EPUB, ODT, CBZ)
- [Unified](https://unifiedjs.com/) (remark/rehype) for Markdown processing
- [DOMPurify](https://github.com/cure53/DOMPurify) for HTML sanitization
- [Lucide](https://lucide.dev/) for icons

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Format Support

| Tier | Formats |
|---|---|
| E-books | EPUB, MOBI, AZW, AZW3, FB2 |
| Documents | PDF, DOCX, ODT, RTF, TXT |
| Markup | Markdown (.md, .mdx), HTML, XHTML |
| Data | JSON, CSV, XML, YAML |
| Comics | CBZ |
| Images | JPG, PNG, GIF, WebP, AVIF, BMP, TIFF, SVG |
| Code | Python, JavaScript, TypeScript, Go, Rust, Java, C/C++, Ruby, Swift, and more |

Format detection uses file extension, MIME type, and magic byte signatures. Unrecognized formats fall back to plain-text extraction.

## Project Structure

```
app/
  page.tsx                  # Library view
  read/[bookId]/page.tsx    # Reader view
components/
  library/                  # BookCard, BookGrid, UploadZone, CoverGenerator
  reader/                   # TextReader, VisualReader, ReaderTopBar, PageControls,
                            # SettingsPanel, TOCSidebar, SearchPanel, ImageViewer
  ui/                       # ThemeProvider
lib/
  parsers/                  # Format-specific parsers + detection + normalization
  storage/db.ts             # Dexie database schema & operations
  pagination.ts             # Page layout engine
  useFileProcessor.ts       # File upload/processing hook
stores/
  libraryStore.ts           # Books, search, sort state
  readerStore.ts            # Chapter, page, navigation state
  preferencesStore.ts       # Theme, font, layout preferences (persisted)
```
