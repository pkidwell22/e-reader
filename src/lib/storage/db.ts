import Dexie, { type EntityTable } from "dexie";
import type { Book, ImageAsset, ReadingState, Bookmark, Highlight } from "@/lib/types";

// ─── Database Schema ─────────────────────────────────────────────────

const db = new Dexie("e-reader-db") as Dexie & {
  books: EntityTable<Book, "id">;
  images: EntityTable<ImageAsset, "id">;
  readingStates: EntityTable<ReadingState, "bookId">;
  bookmarks: EntityTable<Bookmark, "id">;
  highlights: EntityTable<Highlight, "id">;
};

db.version(1).stores({
  books: "id, title, author, metadata.uploadedAt, metadata.lastReadAt",
  images: "id, bookId, order",
  readingStates: "bookId",
  bookmarks: "id, bookId, chapterId",
  highlights: "id, bookId, chapterId",
});

// ─── Book Operations ─────────────────────────────────────────────────

export async function addBook(book: Book): Promise<string> {
  return db.books.add(book);
}

export async function getBook(id: string): Promise<Book | undefined> {
  return db.books.get(id);
}

export async function getAllBooks(): Promise<Book[]> {
  return db.books.toArray();
}

export async function updateBook(
  id: string,
  changes: Partial<Book>
): Promise<number> {
  return db.books.update(id, changes);
}

export async function deleteBook(id: string): Promise<void> {
  await db.transaction("rw", [db.books, db.images, db.readingStates, db.bookmarks, db.highlights], async () => {
    await db.books.delete(id);
    await db.images.where("bookId").equals(id).delete();
    await db.readingStates.delete(id);
    await db.bookmarks.where("bookId").equals(id).delete();
    await db.highlights.where("bookId").equals(id).delete();
  });
}

// ─── Image Operations ────────────────────────────────────────────────

export async function addImages(images: ImageAsset[]): Promise<void> {
  await db.images.bulkAdd(images);
}

export async function getImage(id: string): Promise<ImageAsset | undefined> {
  return db.images.get(id);
}

export async function getBookImages(bookId: string): Promise<ImageAsset[]> {
  return db.images.where("bookId").equals(bookId).sortBy("order");
}

// ─── Reading State Operations ────────────────────────────────────────

export async function getReadingState(
  bookId: string
): Promise<ReadingState | undefined> {
  return db.readingStates.get(bookId);
}

export async function saveReadingState(state: ReadingState): Promise<void> {
  await db.readingStates.put(state);
}

// ─── Bookmark Operations ─────────────────────────────────────────────

export async function addBookmark(bookmark: Bookmark): Promise<string> {
  return db.bookmarks.add(bookmark);
}

export async function getBookBookmarks(bookId: string): Promise<Bookmark[]> {
  return db.bookmarks.where("bookId").equals(bookId).toArray();
}

export async function deleteBookmark(id: string): Promise<void> {
  await db.bookmarks.delete(id);
}

// ─── Highlight Operations ────────────────────────────────────────────

export async function addHighlight(highlight: Highlight): Promise<string> {
  return db.highlights.add(highlight);
}

export async function getBookHighlights(bookId: string): Promise<Highlight[]> {
  return db.highlights.where("bookId").equals(bookId).toArray();
}

export async function deleteHighlight(id: string): Promise<void> {
  await db.highlights.delete(id);
}

// ─── Utility ─────────────────────────────────────────────────────────

export function generateId(): string {
  return crypto.randomUUID();
}

export { db };
