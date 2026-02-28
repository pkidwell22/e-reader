import type { Chapter, ImageAsset, ContentType, BookMetadata } from "@/lib/types";

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
