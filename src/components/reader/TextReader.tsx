
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useReaderStore } from "@/stores/readerStore";
import { usePreferencesStore, getFontFamilyCSS, getPageMaxWidth } from "@/stores/preferencesStore";
import { paginateContent, clearPaginationCache } from "@/lib/pagination";
import type { Chapter } from "@/lib/types";

interface TextReaderProps {
  chapters: Chapter[];
}

export function TextReader({ chapters }: TextReaderProps) {
  const currentChapter = useReaderStore((s) => s.currentChapter);
  const currentPage = useReaderStore((s) => s.currentPage);
  const setCurrentPage = useReaderStore((s) => s.setCurrentPage);
  const setTotalPages = useReaderStore((s) => s.setTotalPages);

  const fontSize = usePreferencesStore((s) => s.fontSize);
  const lineHeight = usePreferencesStore((s) => s.lineHeight);
  const fontFamily = usePreferencesStore((s) => s.fontFamily);
  const pageWidth = usePreferencesStore((s) => s.pageWidth);

  const [pages, setPages] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const chapter = chapters[currentChapter];
  const fontFamilyCSS = useMemo(() => getFontFamilyCSS(fontFamily), [fontFamily]);
  const maxWidth = useMemo(() => getPageMaxWidth(pageWidth), [pageWidth]);

  // Paginate when chapter or settings change
  useEffect(() => {
    if (!chapter || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    // Available height = viewport height minus top/bottom padding
    const availableHeight = rect.height - 96; // 48px top + 48px bottom padding
    const availableWidth = Math.min(rect.width - 96, parseInt(maxWidth)); // padding on sides

    async function paginate() {
      const result = await paginateContent(chapter.id, chapter.content, {
        containerWidth: availableWidth,
        containerHeight: availableHeight,
        fontSize,
        lineHeight,
        fontFamily: fontFamilyCSS,
      });

      setPages(result.pages);
      setTotalPages(result.totalPages);
    }

    paginate();
  }, [chapter, fontSize, lineHeight, fontFamilyCSS, maxWidth, setTotalPages]);

  // Clear cache on settings change
  useEffect(() => {
    clearPaginationCache();
  }, [fontSize, lineHeight, fontFamily, pageWidth]);

  // Repaginate on window resize
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        clearPaginationCache();
        // Trigger re-render
        setPages([]);
      }, 300);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeout);
    };
  }, []);

  const animatePageTurn = useCallback(
    (direction: "left" | "right") => {
      if (isAnimating) return;
      setIsAnimating(true);
      setSlideDirection(direction);

      setTimeout(() => {
        if (direction === "left") {
          setCurrentPage(currentPage + 1);
        } else {
          setCurrentPage(currentPage - 1);
        }
        setSlideDirection(null);
        setIsAnimating(false);
      }, 250);
    },
    [isAnimating, currentPage, setCurrentPage]
  );

  const currentPageContent = pages[currentPage] || "";

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
    >
      {/* Page content */}
      <div
        className="reading-content transition-transform duration-250 h-full w-full overflow-hidden px-6 py-12 md:px-12"
        style={{
          maxWidth: maxWidth,
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight,
          fontFamily: fontFamilyCSS,
          transform: slideDirection
            ? `translateX(${slideDirection === "left" ? "-20px" : "20px"})`
            : "translateX(0)",
          opacity: slideDirection ? 0.5 : 1,
          transitionTimingFunction: "cubic-bezier(0.25, 0.1, 0.25, 1)",
        }}
        dangerouslySetInnerHTML={{ __html: currentPageContent }}
      />
    </div>
  );
}
