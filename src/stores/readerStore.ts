import { create } from "zustand";
import { saveReadingState, getReadingState } from "@/lib/storage/db";
import type { ReadingState } from "@/lib/types";

interface ReaderState {
  bookId: string | null;
  currentChapter: number;
  currentPage: number;
  totalPages: number;
  controlsVisible: boolean;
  sidebarOpen: "toc" | "settings" | null;
  isLoading: boolean;

  // Actions
  setBookId: (id: string) => void;
  setCurrentChapter: (chapter: number) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToChapter: (chapter: number) => void;
  toggleControls: () => void;
  showControls: () => void;
  hideControls: () => void;
  setSidebarOpen: (sidebar: "toc" | "settings" | null) => void;
  setIsLoading: (loading: boolean) => void;

  // Persistence
  loadReadingState: (bookId: string) => Promise<void>;
  saveState: () => Promise<void>;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useReaderStore = create<ReaderState>((set, get) => ({
  bookId: null,
  currentChapter: 0,
  currentPage: 0,
  totalPages: 1,
  controlsVisible: false,
  sidebarOpen: null,
  isLoading: true,

  setBookId: (id) => set({ bookId: id }),

  setCurrentChapter: (chapter) => {
    set({ currentChapter: chapter, currentPage: 0 });
    get().saveState();
  },

  setCurrentPage: (page) => {
    set({ currentPage: page });
    get().saveState();
  },

  setTotalPages: (total) => set({ totalPages: total }),

  nextPage: () => {
    const { currentPage, totalPages } = get();
    if (currentPage < totalPages - 1) {
      set({ currentPage: currentPage + 1 });
      get().saveState();
    }
  },

  prevPage: () => {
    const { currentPage } = get();
    if (currentPage > 0) {
      set({ currentPage: currentPage - 1 });
      get().saveState();
    }
  },

  goToChapter: (chapter) => {
    set({ currentChapter: chapter, currentPage: 0 });
    get().saveState();
  },

  toggleControls: () =>
    set((state) => ({ controlsVisible: !state.controlsVisible })),
  showControls: () => set({ controlsVisible: true }),
  hideControls: () => set({ controlsVisible: false }),

  setSidebarOpen: (sidebar) => set({ sidebarOpen: sidebar }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  loadReadingState: async (bookId: string) => {
    const state = await getReadingState(bookId);
    if (state) {
      set({
        currentChapter: state.currentChapter,
        currentPage: state.currentPage,
      });
    }
  },

  saveState: async () => {
    // Debounce saves to 500ms
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      const { bookId, currentChapter, currentPage } = get();
      if (!bookId) return;

      const state: ReadingState = {
        bookId,
        currentChapter,
        currentPage,
        scrollPosition: 0,
        lastUpdated: new Date(),
      };

      try {
        await saveReadingState(state);
      } catch (error) {
        console.error("Failed to save reading state:", error);
      }
    }, 500);
  },
}));
