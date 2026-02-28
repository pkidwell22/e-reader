
import { useState, useCallback, useRef, useEffect } from "react";
import { X, Search, ChevronUp, ChevronDown } from "lucide-react";
import { useReaderStore } from "@/stores/readerStore";
import type { Chapter } from "@/lib/types";

interface SearchPanelProps {
  chapters: Chapter[];
  onClose: () => void;
}

interface SearchMatch {
  chapterIndex: number;
  chapterTitle: string;
  text: string;
  contextBefore: string;
  contextAfter: string;
}

/**
 * In-book search panel with match navigation.
 */
export function SearchPanel({ chapters, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatch, setCurrentMatch] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const goToChapter = useReaderStore((s) => s.goToChapter);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && matches.length > 0) {
        if (e.shiftKey) {
          navigateMatch(-1);
        } else {
          navigateMatch(1);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, matches.length, currentMatch]);

  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setMatches([]);
        setCurrentMatch(0);
        return;
      }

      const results: SearchMatch[] = [];
      const lowerQuery = searchQuery.toLowerCase();

      chapters.forEach((chapter, chapterIndex) => {
        // Strip HTML tags for plain text search
        const plainText = chapter.content
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, " ");

        let startIndex = 0;
        while (startIndex < plainText.length) {
          const matchIndex = plainText
            .toLowerCase()
            .indexOf(lowerQuery, startIndex);
          if (matchIndex === -1) break;

          // Extract context
          const contextStart = Math.max(0, matchIndex - 40);
          const contextEnd = Math.min(
            plainText.length,
            matchIndex + searchQuery.length + 40
          );

          results.push({
            chapterIndex,
            chapterTitle: chapter.title,
            text: plainText.substring(
              matchIndex,
              matchIndex + searchQuery.length
            ),
            contextBefore:
              (contextStart > 0 ? "..." : "") +
              plainText.substring(contextStart, matchIndex),
            contextAfter:
              plainText.substring(
                matchIndex + searchQuery.length,
                contextEnd
              ) + (contextEnd < plainText.length ? "..." : ""),
          });

          startIndex = matchIndex + 1;
        }
      });

      setMatches(results);
      setCurrentMatch(0);

      // Navigate to first match
      if (results.length > 0) {
        goToChapter(results[0].chapterIndex);
      }
    },
    [chapters, goToChapter]
  );

  const navigateMatch = useCallback(
    (direction: 1 | -1) => {
      if (matches.length === 0) return;

      const next =
        (currentMatch + direction + matches.length) % matches.length;
      setCurrentMatch(next);
      goToChapter(matches[next].chapterIndex);
    },
    [matches, currentMatch, goToChapter]
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
        onClick={onClose}
      />

      {/* Search panel */}
      <div
        className="fixed left-0 right-0 top-0 z-50 border-b"
        style={{
          backgroundColor: "var(--bg-primary)",
          borderColor: "var(--border)",
        }}
      >
        <div className="mx-auto max-w-2xl p-4">
          {/* Search input */}
          <div className="flex items-center gap-3">
            <div
              className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2"
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              <Search
                size={16}
                strokeWidth={1.5}
                style={{ color: "var(--text-tertiary)" }}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  performSearch(e.target.value);
                }}
                placeholder="Search in book..."
                className="flex-1 bg-transparent font-sans text-sm outline-none"
                style={{ color: "var(--text-primary)" }}
              />
              {query && (
                <span
                  className="font-sans text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {matches.length > 0
                    ? `${currentMatch + 1}/${matches.length}`
                    : "0 matches"}
                </span>
              )}
            </div>

            {/* Navigation arrows */}
            {matches.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigateMatch(-1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-secondary)",
                  }}
                  aria-label="Previous match"
                >
                  <ChevronUp size={16} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => navigateMatch(1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-secondary)",
                  }}
                  aria-label="Next match"
                >
                  <ChevronDown size={16} strokeWidth={1.5} />
                </button>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              aria-label="Close search"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>

          {/* Results list */}
          {matches.length > 0 && (
            <div
              className="mt-3 max-h-60 overflow-y-auto rounded-lg"
              style={{ backgroundColor: "var(--bg-secondary)" }}
            >
              {matches.slice(0, 50).map((match, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentMatch(idx);
                    goToChapter(match.chapterIndex);
                  }}
                  className="w-full border-b px-3 py-2 text-left transition-colors last:border-b-0"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor:
                      idx === currentMatch
                        ? "var(--accent)"
                        : "transparent",
                    color:
                      idx === currentMatch
                        ? "white"
                        : "var(--text-primary)",
                  }}
                >
                  <div
                    className="font-sans text-xs font-medium"
                    style={{
                      color:
                        idx === currentMatch
                          ? "rgba(255,255,255,0.7)"
                          : "var(--text-tertiary)",
                    }}
                  >
                    {match.chapterTitle}
                  </div>
                  <div className="mt-0.5 font-sans text-sm">
                    {match.contextBefore}
                    <strong>{match.text}</strong>
                    {match.contextAfter}
                  </div>
                </button>
              ))}
              {matches.length > 50 && (
                <div
                  className="px-3 py-2 text-center font-sans text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Showing first 50 of {matches.length} matches
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
