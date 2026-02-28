import type { ParseResult } from "./types";
import type { ImageAsset } from "@/lib/types";
import { generateId } from "@/lib/storage/db";
import { titleFromFilename } from "@/lib/utils";
import JSZip from "jszip";

/**
 * CBZ (Comic Book ZIP) Parser — extracts images from a ZIP archive.
 * Each image becomes a chapter in visual reading mode.
 * Uses natural sort for correct page ordering.
 */
export async function parseCbz(file: File): Promise<ParseResult> {
  const title = titleFromFilename(file.name);
  const buffer = await file.arrayBuffer();

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    return createFallback(title, "Could not open this CBZ file — invalid ZIP archive.");
  }

  // Collect all image files with natural sort
  const imageEntries: { path: string; file: JSZip.JSZipObject }[] = [];

  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;
    if (isImageFile(relativePath)) {
      imageEntries.push({ path: relativePath, file: zipEntry });
    }
  });

  // Natural sort for correct page ordering (page1, page2, ..., page10, page11)
  imageEntries.sort((a, b) => naturalSort(a.path, b.path));

  if (imageEntries.length === 0) {
    return createFallback(title, "No images found in this CBZ file.");
  }

  // Extract images and create chapters
  const chapters: ParseResult["chapters"] = [];
  const images: ImageAsset[] = [];
  let coverImage: Blob | null = null;

  for (let i = 0; i < imageEntries.length; i++) {
    const entry = imageEntries[i];
    try {
      const blob = await entry.file.async("blob");
      const mimeType = getMimeType(entry.path);
      const typedBlob = new Blob([blob], { type: mimeType });
      const blobUrl = URL.createObjectURL(typedBlob);

      // First image is the cover
      if (i === 0) {
        coverImage = typedBlob;
      }

      const imageId = generateId();
      images.push({
        id: imageId,
        bookId: "",
        blob: typedBlob,
        thumbnail: null,
        mimeType,
        width: 0,
        height: 0,
        caption: null,
        altText: `Page ${i + 1}`,
        order: i,
      });

      // Each image is a chapter
      chapters.push({
        id: generateId(),
        title: `Page ${i + 1}`,
        content: `<div style="display:flex;align-items:center;justify-content:center;min-height:80vh;">
          <img src="${blobUrl}" alt="Page ${i + 1}" style="max-width:100%;max-height:90vh;object-fit:contain;" />
        </div>`,
        imageId,
        order: i,
      });
    } catch {
      // Skip failed images
    }
  }

  return {
    title,
    author: "Unknown",
    chapters,
    images,
    coverImage,
    contentType: "visual",
    metadata: {
      format: "cbz",
      imageCount: images.length,
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────

const IMAGE_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "gif", "webp", "avif", "bmp", "tiff", "tif",
]);

function isImageFile(path: string): boolean {
  // Skip hidden files and __MACOSX
  if (path.startsWith("__MACOSX") || path.startsWith(".")) return false;
  const fileName = path.split("/").pop() || "";
  if (fileName.startsWith(".")) return false;

  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return IMAGE_EXTENSIONS.has(ext);
}

function getMimeType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "png": return "image/png";
    case "gif": return "image/gif";
    case "webp": return "image/webp";
    case "avif": return "image/avif";
    case "bmp": return "image/bmp";
    case "tiff":
    case "tif": return "image/tiff";
    default: return "image/jpeg";
  }
}

/**
 * Natural sort: handles numeric portions correctly.
 * "page2" < "page10" (unlike lexicographic sort)
 */
function naturalSort(a: string, b: string): number {
  const re = /(\d+)|(\D+)/g;
  const aParts = a.toLowerCase().match(re) || [];
  const bParts = b.toLowerCase().match(re) || [];

  for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
    const aPart = aParts[i];
    const bPart = bParts[i];

    const aNum = parseInt(aPart);
    const bNum = parseInt(bPart);

    if (!isNaN(aNum) && !isNaN(bNum)) {
      if (aNum !== bNum) return aNum - bNum;
    } else {
      if (aPart !== bPart) return aPart.localeCompare(bPart);
    }
  }

  return aParts.length - bParts.length;
}

function createFallback(title: string, message: string): ParseResult {
  return {
    title,
    author: "Unknown",
    chapters: [
      {
        id: generateId(),
        title,
        content: `<div style="text-align:center;padding:4rem 2rem;">
          <p style="font-size:1.25rem;margin-bottom:1rem;">${message}</p>
        </div>`,
        imageId: null,
        order: 0,
      },
    ],
    images: [],
    coverImage: null,
    contentType: "visual",
    metadata: { format: "cbz", imageCount: 0 },
  };
}
