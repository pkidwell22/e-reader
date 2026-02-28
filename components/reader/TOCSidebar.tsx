"use client";

import { X } from "lucide-react";
import { useReaderStore } from "@/stores/readerStore";
import type { Chapter } from "@/lib/types";

interface TOCSidebarProps {
  chapters: Chapter[];
  bookTitle: string;
}

export function TOCSidebar({ chapters, bookTitle }: TOCSidebarProps) {
  const currentChapter = useReaderStore((s) => s.currentChapter);
  const goToChapter = useReaderStore((s) => s.goToChapter);
  const setSidebarOpen = useReaderStore((s) => s.setSidebarOpen);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-200"
        style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
        onClick={() => setSidebarOpen(null)}
      />

      {/* Sidebar */}
      <aside
        className="fixed bottom-0 left-0 top-0 z-50 w-[320px] overflow-y-auto"
        style={{
          backgroundColor: "var(--bg-primary)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="mb-2 flex items-center justify-between">
            <span
              className="font-sans text-xs font-medium uppercase tracking-wider"
              style={{
                color: "var(--text-tertiary)",
                letterSpacing: "0.05em",
              }}
            >
              Table of Contents
            </span>
            <button
              onClick={() => setSidebarOpen(null)}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              aria-label="Close table of contents"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>

          {/* Book title */}
          <h2
            className="mb-6 font-sans text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {bookTitle}
          </h2>

          {/* Chapter list */}
          <nav className="flex flex-col gap-0.5" role="navigation" aria-label="Table of contents">
            {chapters.map((chapter, i) => {
              const isActive = i === currentChapter;
              return (
                <button
                  key={chapter.id}
                  onClick={() => {
                    goToChapter(i);
                    setSidebarOpen(null);
                  }}
                  className="group flex items-start rounded-md px-3 py-2.5 text-left font-sans text-sm transition-all duration-150"
                  style={{
                    color: isActive
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                    backgroundColor: isActive
                      ? "var(--bg-secondary)"
                      : "transparent",
                    borderLeft: isActive
                      ? "2px solid var(--accent)"
                      : "2px solid transparent",
                    fontWeight: isActive ? 500 : 400,
                  }}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span
                    className="mr-3 mt-px font-mono text-xs"
                    style={{ color: "var(--text-tertiary)", minWidth: "20px" }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1">{chapter.title}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
