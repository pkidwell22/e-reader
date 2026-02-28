"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useReaderStore } from "@/stores/readerStore";
import type { Chapter } from "@/lib/types";
import { ImageViewer } from "./ImageViewer";

interface VisualReaderProps {
  chapters: Chapter[];
}

/**
 * Full-bleed image reader for visual content (comics, image galleries).
 * Shows one image per page with contained/full-bleed viewing.
 */
export function VisualReader({ chapters }: VisualReaderProps) {
  const currentChapter = useReaderStore((s) => s.currentChapter);
  const setTotalPages = useReaderStore((s) => s.setTotalPages);
  const [showLightbox, setShowLightbox] = useState(false);

  const chapter = chapters[currentChapter];
  const containerRef = useRef<HTMLDivElement>(null);

  // Each chapter is one "page" in visual mode
  useEffect(() => {
    setTotalPages(1);
  }, [currentChapter, setTotalPages]);

  // Extract image src from chapter content
  const extractImageSrc = useCallback((): string | null => {
    if (!chapter?.content) return null;
    const match = chapter.content.match(/src="([^"]+)"/);
    return match ? match[1] : null;
  }, [chapter]);

  const imageSrc = extractImageSrc();

  if (!chapter) return null;

  // If chapter has an image, show it full-bleed
  if (imageSrc) {
    return (
      <div
        ref={containerRef}
        className="flex h-full w-full items-center justify-center overflow-hidden"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={chapter.title}
          className="cursor-zoom-in select-none"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
          }}
          onClick={() => setShowLightbox(true)}
          draggable={false}
        />

        {showLightbox && (
          <ImageViewer
            src={imageSrc}
            alt={chapter.title}
            onClose={() => setShowLightbox(false)}
          />
        )}
      </div>
    );
  }

  // Fallback: render as HTML content
  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center overflow-auto p-12"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div
        className="reading-content"
        style={{ maxWidth: "680px" }}
        dangerouslySetInnerHTML={{ __html: chapter.content }}
      />
    </div>
  );
}
