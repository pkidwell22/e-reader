
import { List, Settings2, Search, ArrowLeft } from "lucide-react";
import { useReaderStore } from "@/stores/readerStore";
import { truncate } from "@/lib/utils";

interface ReaderTopBarProps {
  title: string;
  chapterTitle?: string;
  onClose: () => void;
  onSearch?: () => void;
}

export function ReaderTopBar({ title, chapterTitle, onClose, onSearch }: ReaderTopBarProps) {
  const controlsVisible = useReaderStore((s) => s.controlsVisible);
  const sidebarOpen = useReaderStore((s) => s.sidebarOpen);
  const setSidebarOpen = useReaderStore((s) => s.setSidebarOpen);

  return (
    <div
      className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-4 py-3 transition-all duration-150 md:px-6"
      style={{
        opacity: controlsVisible || sidebarOpen ? 1 : 0,
        pointerEvents: controlsVisible || sidebarOpen ? "auto" : "none",
        backgroundColor: "var(--bg-primary)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Left: TOC + Back */}
      <div className="flex items-center gap-2">
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Back to library"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <button
          onClick={() =>
            setSidebarOpen(sidebarOpen === "toc" ? null : "toc")
          }
          className="flex h-9 items-center gap-1.5 rounded-lg px-3 font-sans text-sm font-medium transition-colors"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Table of contents"
        >
          <List size={16} strokeWidth={1.5} />
          <span className="hidden md:inline">Contents</span>
        </button>
      </div>

      {/* Center: Book title + Chapter */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-0">
        <span
          className="font-sans text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          {truncate(title, 36)}
        </span>
        {chapterTitle && (
          <span
            className="font-sans text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            {truncate(chapterTitle, 44)}
          </span>
        )}
      </div>

      {/* Right: Search + Settings */}
      <div className="flex items-center gap-2">
        {onSearch && (
          <button
            onClick={onSearch}
            className="flex h-9 items-center gap-1.5 rounded-lg px-3 font-sans text-sm font-medium transition-colors"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Search in book"
          >
            <Search size={16} strokeWidth={1.5} />
            <span className="hidden md:inline">Search</span>
          </button>
        )}
        <button
          onClick={() =>
            setSidebarOpen(sidebarOpen === "settings" ? null : "settings")
          }
          className="flex h-9 items-center gap-1.5 rounded-lg px-3 font-sans text-sm font-medium transition-colors"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Reading settings"
        >
          <Settings2 size={16} strokeWidth={1.5} />
          <span className="hidden md:inline">Settings</span>
        </button>
      </div>
    </div>
  );
}
