import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeSanitize from "rehype-sanitize";
import type { ParseResult } from "./types";
import { generateId } from "@/lib/storage/db";
import { titleFromFilename } from "@/lib/utils";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeSanitize)
  .use(rehypeStringify);

export async function parseMarkdown(file: File): Promise<ParseResult> {
  const text = await file.text();
  const title = titleFromFilename(file.name);

  // Split on h1 or h2 headers to create chapters
  const headerRegex = /^(#{1,2})\s+(.+)$/gm;
  const headers: { level: number; title: string; index: number }[] = [];

  let match;
  while ((match = headerRegex.exec(text)) !== null) {
    headers.push({
      level: match[1].length,
      title: match[2].trim(),
      index: match.index,
    });
  }

  let chapters;

  if (headers.length > 0) {
    // Split content by headers
    chapters = await Promise.all(
      headers.map(async (header, i) => {
        const start = header.index;
        const end =
          i < headers.length - 1 ? headers[i + 1].index : text.length;
        const section = text.slice(start, end);

        const result = await processor.process(section);
        return {
          id: generateId(),
          title: header.title,
          content: String(result),
          imageId: null,
          order: i,
        };
      })
    );

    // If there's content before the first header, prepend it
    if (headers[0].index > 0) {
      const preContent = text.slice(0, headers[0].index).trim();
      if (preContent) {
        const result = await processor.process(preContent);
        chapters.unshift({
          id: generateId(),
          title: "Introduction",
          content: String(result),
          imageId: null,
          order: -1,
        });
      }
    }

    // Fix order numbers
    chapters.forEach((ch, i) => {
      ch.order = i;
    });
  } else {
    // No headers — single chapter
    const result = await processor.process(text);
    chapters = [
      {
        id: generateId(),
        title: title,
        content: String(result),
        imageId: null,
        order: 0,
      },
    ];
  }

  // Try to detect title from first h1
  const detectedTitle =
    headers.find((h) => h.level === 1)?.title || title;

  return {
    title: detectedTitle,
    author: "Unknown",
    chapters,
    images: [],
    coverImage: null,
    contentType: "text",
    metadata: {
      format: "markdown",
      imageCount: 0,
    },
  };
}
