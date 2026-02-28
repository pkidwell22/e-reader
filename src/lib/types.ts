// ─── Core Data Models ────────────────────────────────────────────────

export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: Blob | null;
  contentType: ContentType;
  chapters: Chapter[];
  metadata: BookMetadata;
}

export type ContentType = "text" | "visual" | "mixed";

export interface Chapter {
  id: string;
  title: string;
  content: string; // sanitized HTML for text chapters
  imageId: string | null; // for visual-only chapters (one full-page image)
  order: number;
}

export interface ImageAsset {
  id: string;
  bookId: string;
  blob: Blob;
  thumbnail: Blob | null;
  mimeType: string;
  width: number;
  height: number;
  caption: string | null;
  altText: string | null;
  order: number;
}

export interface BookMetadata {
  format: string;
  fileSize: number;
  uploadedAt: Date;
  lastReadAt: Date | null;
  totalPages: number;
  imageCount: number;
}

export interface ReadingState {
  bookId: string;
  currentChapter: number;
  currentPage: number;
  scrollPosition: number;
  lastUpdated: Date;
}

export interface Bookmark {
  id: string;
  bookId: string;
  chapterId: string;
  position: number;
  label: string;
  createdAt: Date;
}

export interface Highlight {
  id: string;
  bookId: string;
  chapterId: string;
  startOffset: number;
  endOffset: number;
  color: HighlightColor;
  note: string | null;
  createdAt: Date;
}

export type HighlightColor = "yellow" | "green" | "blue" | "pink" | "orange";

// ─── User Preferences ────────────────────────────────────────────────

export type Theme = "light" | "dark" | "sepia";
export type FontFamily = "literata" | "bricolage" | "jetbrains" | "opendyslexic";
export type PageWidth = "narrow" | "medium" | "wide";
export type ReadingMode = "paginated" | "scroll";
export type SortField = "title" | "author" | "uploadedAt" | "lastReadAt";
export type SortDirection = "asc" | "desc";

export interface UserPreferences {
  theme: Theme;
  fontFamily: FontFamily;
  fontSize: number; // 12–32
  lineHeight: number; // 1.4–2.2
  pageWidth: PageWidth;
  readingMode: ReadingMode;
}

// ─── Parser Types ────────────────────────────────────────────────────

export interface ParseResult {
  title: string;
  author: string;
  chapters: Chapter[];
  images: ImageAsset[];
  coverImage: Blob | null;
  contentType: ContentType;
  metadata: Partial<BookMetadata>;
}

export type ParserFunction = (
  file: File,
  content: ArrayBuffer
) => Promise<ParseResult>;

// ─── Format Detection ────────────────────────────────────────────────

export type FormatTier = 1 | 2 | 3 | 4;

export interface FormatInfo {
  name: string;
  extensions: string[];
  mimeTypes: string[];
  tier: FormatTier;
  parser: string; // module name
}
