
import { useEffect, useRef, useCallback } from "react";
import { useReaderStore } from "@/stores/readerStore";
import type { Chapter } from "@/lib/types";

interface PageControlsProps {
  chapters: Chapter[];
}

export function PageControls({ chapters }: PageControlsProps) {
  const currentChapter = useReaderStore((s) => s.currentChapter);
  const currentPage = useReaderStore((s) => s.currentPage);
  const totalPages = useReaderStore((s) => s.totalPages);
  const nextPage = useReaderStore((s) => s.nextPage);
  const prevPage = useReaderStore((s) => s.prevPage);
  const goToChapter = useReaderStore((s) => s.goToChapter);
  const toggleControls = useReaderStore((s) => s.toggleControls);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Navigate to next/previous with chapter boundaries
  const handleNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      nextPage();
    } else if (currentChapter < chapters.length - 1) {
      goToChapter(currentChapter + 1);
    }
  }, [currentPage, totalPages, currentChapter, chapters.length, nextPage, goToChapter]);

  const handlePrev = useCallback(() => {
    if (currentPage > 0) {
      prevPage();
    } else if (currentChapter > 0) {
      goToChapter(currentChapter - 1);
    }
  }, [currentPage, currentChapter, prevPage, goToChapter]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if focus is on an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          handleNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrev();
          break;
        case "Escape":
          useReaderStore.getState().setSidebarOpen(null);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  // Touch/swipe navigation
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;

      // Only count horizontal swipes (more horizontal than vertical)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX < 0) {
          handleNext(); // Swipe left = next
        } else {
          handlePrev(); // Swipe right = prev
        }
      }

      touchStartRef.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleNext, handlePrev]);

  // Calculate overall progress weighted by chapter content length
  // A 500K-char chapter gets a proportionally larger share of the bar
  // than a 1K-char chapter, so progress reflects actual reading position.
  let overallProgress = 0;
  if (chapters.length > 0) {
    const chapterLengths = chapters.map((ch) => ch.content.length);
    const totalLength = chapterLengths.reduce((sum, len) => sum + len, 0);

    if (totalLength > 0) {
      // Sum of all fully-read chapters before the current one
      const completedLength = chapterLengths
        .slice(0, currentChapter)
        .reduce((sum, len) => sum + len, 0);

      // Fraction through the current chapter (by pages)
      const currentChapterFraction =
        totalPages > 0 ? (currentPage + 1) / totalPages : 0;
      const currentChapterLength = chapterLengths[currentChapter] || 0;

      overallProgress = Math.min(
        ((completedLength + currentChapterLength * currentChapterFraction) /
          totalLength) *
          100,
        100
      );
    }
  }

  return (
    <>
      {/* Invisible tap zones */}
      <div className="absolute inset-0 z-10 flex">
        {/* Left 30% — previous */}
        <div
          className="h-full cursor-w-resize"
          style={{ width: "30%" }}
          onClick={handlePrev}
          aria-label="Previous page"
          role="button"
          tabIndex={-1}
        />
        {/* Center 40% — toggle controls */}
        <div
          className="h-full cursor-pointer"
          style={{ width: "40%" }}
          onClick={toggleControls}
          aria-label="Toggle controls"
          role="button"
          tabIndex={-1}
        />
        {/* Right 30% — next */}
        <div
          className="h-full cursor-e-resize"
          style={{ width: "30%" }}
          onClick={handleNext}
          aria-label="Next page"
          role="button"
          tabIndex={-1}
        />
      </div>

      {/* Page indicator — bottom center */}
      <div
        className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 font-sans text-xs"
        style={{ color: "var(--text-tertiary)", fontSize: "13px" }}
      >
        Page {currentPage + 1} of {totalPages} · {Math.round(overallProgress)}%
      </div>

      {/* Progress bar — bottom of viewport */}
      <div
        className="absolute bottom-0 left-0 z-20 h-[2px] w-full"
        style={{ backgroundColor: "var(--bg-tertiary)" }}
      >
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${overallProgress}%`,
            backgroundColor: "var(--accent)",
          }}
        />
      </div>
    </>
  );
}
