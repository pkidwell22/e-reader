"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getBook } from "@/lib/storage/db";
import { ReaderView } from "@/components/reader/ReaderView";
import type { Book } from "@/lib/types";

export default function ReadPage() {
  const params = useParams();
  const bookId = params.bookId as string;

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadBook() {
      try {
        const data = await getBook(bookId);
        if (data) {
          setBook(data);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadBook();
  }, [bookId]);

  if (loading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{
              borderColor: "var(--accent)",
              borderTopColor: "transparent",
            }}
          />
          <span
            className="font-sans text-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            Loading...
          </span>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div
        className="flex h-screen flex-col items-center justify-center gap-4"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <p
          className="font-sans text-lg font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          Book not found
        </p>
        <a
          href="/"
          className="font-sans text-sm font-medium"
          style={{ color: "var(--accent)" }}
        >
          Back to Library
        </a>
      </div>
    );
  }

  return <ReaderView book={book} />;
}
