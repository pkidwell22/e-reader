"use client";

import { useState, useCallback } from "react";
import { useLibraryStore } from "@/stores/libraryStore";
import { generateId, addImages } from "@/lib/storage/db";
import { getFileExtension } from "@/lib/utils";
import { parseFile } from "@/lib/parsers";
import type { Book, BookMetadata } from "@/lib/types";

export function useFileProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addBook = useLibraryStore((s) => s.addBook);

  const processFiles = useCallback(
    async (files: File[]) => {
      setIsProcessing(true);
      setError(null);

      try {
        for (const file of files) {
          try {
            const result = await parseFile(file);

            const metadata: BookMetadata = {
              format: result.metadata.format || getFileExtension(file.name),
              fileSize: file.size,
              uploadedAt: new Date(),
              lastReadAt: null,
              totalPages: result.metadata.totalPages || 1,
              imageCount: result.metadata.imageCount || result.images.length,
            };

            const book: Book = {
              id: generateId(),
              title: result.title,
              author: result.author,
              coverImage: result.coverImage,
              contentType: result.contentType,
              chapters: result.chapters,
              metadata,
            };

            await addBook(book);

            // Store images separately if any
            if (result.images.length > 0) {
              const imagesWithBookId = result.images.map((img) => ({
                ...img,
                bookId: book.id,
              }));
              await addImages(imagesWithBookId);
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`Failed to process ${file.name}:`, message, err);
            setError(`Failed to process "${file.name}": ${message}`);
          }
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [addBook]
  );

  const clearError = useCallback(() => setError(null), []);

  return { processFiles, isProcessing, error, clearError };
}
