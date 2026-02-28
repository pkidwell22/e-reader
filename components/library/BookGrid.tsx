"use client";

import { useEffect, useCallback, useState } from "react";
import { Search, Plus, ArrowUpDown, X } from "lucide-react";
import { useLibraryStore } from "@/stores/libraryStore";
import { BookCard } from "./BookCard";
import { UploadZone } from "./UploadZone";
import { useFileProcessor } from "@/lib/useFileProcessor";
import type { SortField } from "@/lib/types";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "uploadedAt", label: "Date Added" },
  { value: "lastReadAt", label: "Last Read" },
  { value: "title", label: "Title" },
  { value: "author", label: "Author" },
];

export function BookGrid() {
  const {
    isLoading,
    searchQuery,
    sortField,
    sortDirection,
    loadBooks,
    setSearchQuery,
    setSortField,
    toggleSortDirection,
    getFilteredBooks,
    deleteBook,
  } = useLibraryStore();

  const { processFiles, isProcessing, error: processingError, clearError } = useFileProcessor();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const books = getFilteredBooks();

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      setShowUploadModal(false);
      await processFiles(files);
    },
    [processFiles]
  );

  const handleOpen = useCallback((bookId: string) => {
    window.location.href = `/read/${bookId}`;
  }, []);

  const handleDelete = useCallback((bookId: string) => {
    setConfirmDelete(bookId);
  }, []);

  const confirmDeleteBook = useCallback(async () => {
    if (confirmDelete) {
      await deleteBook(confirmDelete);
      setConfirmDelete(null);
    }
  }, [confirmDelete, deleteBook]);

  // Empty state
  if (!isLoading && books.length === 0 && !searchQuery) {
    return (
      <div className="mx-auto max-w-[1280px]">
        <UploadZone onFilesSelected={handleFilesSelected} variant="full-page" />
        {isProcessing && <ProcessingIndicator />}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-6 pb-12 md:px-12">
      {/* ─── Toolbar ──────────────────────────────────────── */}
      <div className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div
          className="relative flex flex-1 items-center"
          style={{ maxWidth: "400px" }}
        >
          <Search
            size={16}
            strokeWidth={1.5}
            className="absolute left-3"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            type="text"
            placeholder="Search library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border py-2 pl-9 pr-3 font-sans text-sm outline-none transition-colors focus:border-[var(--accent)]"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3"
              style={{ color: "var(--text-tertiary)" }}
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Sort & Add */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="rounded-lg border px-3 py-2 font-sans text-sm outline-none"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={toggleSortDirection}
              className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
              aria-label={`Sort ${sortDirection === "asc" ? "ascending" : "descending"}`}
            >
              <ArrowUpDown
                size={14}
                strokeWidth={1.5}
                style={{
                  transform:
                    sortDirection === "asc" ? "scaleY(-1)" : "scaleY(1)",
                }}
              />
            </button>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex h-9 items-center gap-1.5 rounded-lg px-4 font-sans text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--accent)",
              color: "white",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "var(--accent-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "var(--accent)";
            }}
          >
            <Plus size={16} strokeWidth={1.5} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>

      {/* ─── Grid ─────────────────────────────────────────── */}
      {isLoading ? (
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: "2/3.5" }} />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <p
            className="font-sans text-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            No books match your search
          </p>
        </div>
      ) : (
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          }}
        >
          {books.map((book, index) => (
            <BookCard
              key={book.id}
              book={book}
              index={index}
              onOpen={handleOpen}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ─── Processing indicator ─────────────────────────── */}
      {isProcessing && <ProcessingIndicator />}

      {/* ─── Error toast ───────────────────────────────────── */}
      {processingError && (
        <div
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl px-5 py-3"
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            boxShadow: "var(--shadow-lg)",
            maxWidth: "480px",
          }}
        >
          <span className="font-sans text-sm" style={{ color: "#991b1b" }}>
            {processingError}
          </span>
          <button
            onClick={clearError}
            className="ml-2 font-sans text-sm font-medium"
            style={{ color: "#991b1b" }}
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* ─── Upload Modal ─────────────────────────────────── */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl p-6"
            style={{
              backgroundColor: "var(--bg-primary)",
              boxShadow: "var(--shadow-lg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="font-sans text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Add Books
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ color: "var(--text-tertiary)" }}
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <UploadZone
              onFilesSelected={handleFilesSelected}
              variant="modal"
            />
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation ──────────────────────────── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl p-6"
            style={{
              backgroundColor: "var(--bg-primary)",
              boxShadow: "var(--shadow-lg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="font-sans text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Delete Book
            </h2>
            <p
              className="mt-2 font-sans text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Are you sure? This will remove the book and all reading progress
              permanently.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border px-4 py-2 font-sans text-sm font-medium transition-colors"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBook}
                className="rounded-lg px-4 py-2 font-sans text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: "#ef4444" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProcessingIndicator() {
  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full px-5 py-3"
      style={{
        backgroundColor: "var(--bg-secondary)",
        boxShadow: "var(--shadow-lg)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
        style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
      />
      <span
        className="font-sans text-sm font-medium"
        style={{ color: "var(--text-primary)" }}
      >
        Processing...
      </span>
    </div>
  );
}
