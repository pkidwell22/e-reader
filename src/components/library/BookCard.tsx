
import { useState, useEffect, useMemo } from "react";
import { Trash2, MoreVertical } from "lucide-react";
import { CoverGenerator } from "./CoverGenerator";
import { getReadingState } from "@/lib/storage/db";
import type { Book } from "@/lib/types";

interface BookCardProps {
  book: Book;
  index: number;
  onOpen: (bookId: string) => void;
  onDelete: (bookId: string) => void;
}

export function BookCard({ book, index, onOpen, onDelete }: BookCardProps) {
  const [progress, setProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // Generate cover URL from blob
  useEffect(() => {
    if (book.coverImage) {
      const url = URL.createObjectURL(book.coverImage);
      setCoverUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [book.coverImage]);

  // Load reading progress
  useEffect(() => {
    async function loadProgress() {
      const state = await getReadingState(book.id);
      if (state && book.metadata.totalPages > 0) {
        const totalPages = book.metadata.totalPages;
        const currentPage = state.currentPage + 1;
        setProgress(Math.min((currentPage / totalPages) * 100, 100));
      }
    }
    loadProgress();
  }, [book.id, book.metadata.totalPages]);

  const staggerDelay = useMemo(() => `${index * 50}ms`, [index]);

  return (
    <div
      className="group relative animate-fade-in cursor-pointer"
      style={{
        animationDelay: staggerDelay,
        animationFillMode: "both",
      }}
      onClick={() => onOpen(book.id)}
      role="button"
      tabIndex={0}
      aria-label={`Open ${book.title} by ${book.author}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(book.id);
        }
      }}
    >
      {/* Card */}
      <div
        className="overflow-hidden transition-all duration-200 ease-out group-hover:-translate-y-0.5"
        style={{
          borderRadius: "6px",
          boxShadow: "var(--shadow)",
          backgroundColor: "var(--bg-secondary)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-lg)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow)";
        }}
      >
        {/* Cover */}
        <div className="relative" style={{ aspectRatio: "2/3" }}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`Cover of ${book.title}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <CoverGenerator title={book.title} author={book.author} />
          )}

          {/* Hover overlay with delete */}
          <div className="absolute inset-0 flex items-start justify-end bg-black/0 p-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
              aria-label={`Options for ${book.title}`}
            >
              <MoreVertical size={14} strokeWidth={1.5} />
            </button>
          </div>

          {/* Dropdown menu */}
          {showMenu && (
            <div
              className="absolute right-2 top-10 z-20 overflow-hidden rounded-md py-1"
              style={{
                backgroundColor: "var(--bg-primary)",
                boxShadow: "var(--shadow-lg)",
                border: "1px solid var(--border)",
                minWidth: "140px",
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete(book.id);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-red-500/10"
                style={{ color: "#ef4444" }}
              >
                <Trash2 size={14} strokeWidth={1.5} />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3
            className="font-sans text-sm font-medium leading-tight"
            style={{
              color: "var(--text-primary)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {book.title}
          </h3>
          <p
            className="mt-1 font-sans text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            {book.author}
          </p>

          {/* Progress bar */}
          {progress > 0 && (
            <div
              className="mt-2 h-[3px] w-full overflow-hidden rounded-full"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  backgroundColor: "var(--accent)",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
