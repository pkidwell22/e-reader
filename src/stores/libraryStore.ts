import { create } from "zustand";
import type { Book, SortField, SortDirection } from "@/lib/types";
import * as db from "@/lib/storage/db";

interface LibraryState {
  books: Book[];
  isLoading: boolean;
  searchQuery: string;
  sortField: SortField;
  sortDirection: SortDirection;
  isUploadModalOpen: boolean;

  // Actions
  loadBooks: () => Promise<void>;
  addBook: (book: Book) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  updateBook: (id: string, changes: Partial<Book>) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSortField: (field: SortField) => void;
  setSortDirection: (dir: SortDirection) => void;
  toggleSortDirection: () => void;
  setUploadModalOpen: (open: boolean) => void;

  // Computed
  getFilteredBooks: () => Book[];
}

function sortBooks(
  books: Book[],
  field: SortField,
  direction: SortDirection
): Book[] {
  const sorted = [...books].sort((a, b) => {
    switch (field) {
      case "title":
        return a.title.localeCompare(b.title);
      case "author":
        return a.author.localeCompare(b.author);
      case "uploadedAt":
        return (
          new Date(a.metadata.uploadedAt).getTime() -
          new Date(b.metadata.uploadedAt).getTime()
        );
      case "lastReadAt": {
        const aTime = a.metadata.lastReadAt
          ? new Date(a.metadata.lastReadAt).getTime()
          : 0;
        const bTime = b.metadata.lastReadAt
          ? new Date(b.metadata.lastReadAt).getTime()
          : 0;
        return aTime - bTime;
      }
      default:
        return 0;
    }
  });
  return direction === "desc" ? sorted.reverse() : sorted;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  isLoading: true,
  searchQuery: "",
  sortField: "uploadedAt",
  sortDirection: "desc",
  isUploadModalOpen: false,

  loadBooks: async () => {
    set({ isLoading: true });
    try {
      const books = await db.getAllBooks();
      set({ books, isLoading: false });
    } catch (error) {
      console.error("Failed to load books:", error);
      set({ isLoading: false });
    }
  },

  addBook: async (book) => {
    await db.addBook(book);
    set((state) => ({ books: [...state.books, book] }));
  },

  deleteBook: async (id) => {
    await db.deleteBook(id);
    set((state) => ({ books: state.books.filter((b) => b.id !== id) }));
  },

  updateBook: async (id, changes) => {
    await db.updateBook(id, changes);
    set((state) => ({
      books: state.books.map((b) => (b.id === id ? { ...b, ...changes } : b)),
    }));
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortField: (field) => set({ sortField: field }),
  setSortDirection: (dir) => set({ sortDirection: dir }),
  toggleSortDirection: () =>
    set((state) => ({
      sortDirection: state.sortDirection === "asc" ? "desc" : "asc",
    })),
  setUploadModalOpen: (open) => set({ isUploadModalOpen: open }),

  getFilteredBooks: () => {
    const { books, searchQuery, sortField, sortDirection } = get();
    const query = searchQuery.toLowerCase().trim();

    const filtered = query
      ? books.filter(
          (b) =>
            b.title.toLowerCase().includes(query) ||
            b.author.toLowerCase().includes(query)
        )
      : books;

    return sortBooks(filtered, sortField, sortDirection);
  },
}));
