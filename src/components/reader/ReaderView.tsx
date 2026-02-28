
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { useReaderStore } from "@/stores/readerStore";
import { TextReader } from "./TextReader";
import { VisualReader } from "./VisualReader";
import { PageControls } from "./PageControls";
import { ReaderTopBar } from "./ReaderTopBar";
import { TOCSidebar } from "./TOCSidebar";
import { SettingsPanel } from "./SettingsPanel";
import { SearchPanel } from "./SearchPanel";
import type { Book } from "@/lib/types";

interface ReaderViewProps {
  book: Book;
}

export function ReaderView({ book }: ReaderViewProps) {
  const navigate = useNavigate();
  const controlsVisible = useReaderStore((s) => s.controlsVisible);
  const hideControls = useReaderStore((s) => s.hideControls);
  const sidebarOpen = useReaderStore((s) => s.sidebarOpen);
  const setBookId = useReaderStore((s) => s.setBookId);
  const loadReadingState = useReaderStore((s) => s.loadReadingState);
  const setIsLoading = useReaderStore((s) => s.setIsLoading);
  const currentChapter = useReaderStore((s) => s.currentChapter);
  const currentPage = useReaderStore((s) => s.currentPage);
  const totalPages = useReaderStore((s) => s.totalPages);

  const [searchOpen, setSearchOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize reader state
  useEffect(() => {
    setBookId(book.id);
    loadReadingState(book.id).then(() => {
      setIsLoading(false);
    });
  }, [book.id, setBookId, loadReadingState, setIsLoading]);

  // Auto-hide controls after 3 seconds (not when sidebar is open)
  useEffect(() => {
    if (controlsVisible && !sidebarOpen) {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        hideControls();
      }, 3000);
    }
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [controlsVisible, sidebarOpen, hideControls]);

  // Show controls on mouse move near top
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 80) {
        useReaderStore.getState().showControls();
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Announce page changes for screen readers
  useEffect(() => {
    const chapter = book.chapters[currentChapter];
    if (chapter) {
      setAnnouncement(
        `${chapter.title}, page ${currentPage + 1} of ${totalPages}`
      );
    }
  }, [currentChapter, currentPage, totalPages, book.chapters]);

  // Keyboard shortcut: Ctrl/Cmd+F for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClose = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return (
    <div
      className="relative h-screen w-screen overflow-hidden"
      style={{ backgroundColor: "var(--bg-primary)" }}
      role="application"
      aria-label={`Reading ${book.title}`}
    >
      {/* Skip to content — accessible focus target */}
      <a
        href="#reader-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[999] focus:rounded-lg focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:font-sans focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Top bar */}
      <ReaderTopBar
        title={book.title}
        chapterTitle={book.chapters[currentChapter]?.title}
        onClose={handleClose}
        onSearch={() => setSearchOpen(true)}
      />

      {/* Main content area */}
      <div id="reader-content" className="h-full w-full">
        {book.contentType === "visual" ? (
          <VisualReader chapters={book.chapters} />
        ) : (
          <TextReader chapters={book.chapters} />
        )}
      </div>

      {/* Page controls (tap zones, indicators) */}
      <PageControls chapters={book.chapters} />

      {/* TOC Sidebar */}
      {sidebarOpen === "toc" && (
        <TOCSidebar chapters={book.chapters} bookTitle={book.title} />
      )}

      {/* Settings Panel */}
      {sidebarOpen === "settings" && <SettingsPanel />}

      {/* Search Panel */}
      {searchOpen && (
        <SearchPanel
          chapters={book.chapters}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  );
}
