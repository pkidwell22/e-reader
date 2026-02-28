import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Theme,
  FontFamily,
  PageWidth,
  ReadingMode,
  UserPreferences,
} from "@/lib/types";

interface PreferencesState extends UserPreferences {
  // Actions
  setTheme: (theme: Theme) => void;
  setFontFamily: (font: FontFamily) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setPageWidth: (width: PageWidth) => void;
  setReadingMode: (mode: ReadingMode) => void;
  resetToDefaults: () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "light",
  fontFamily: "literata",
  fontSize: 18,
  lineHeight: 1.75,
  pageWidth: "medium",
  readingMode: "paginated",
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,

      setTheme: (theme) => set({ theme }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setFontSize: (size) =>
        set({ fontSize: Math.min(32, Math.max(12, size)) }),
      setLineHeight: (height) =>
        set({ lineHeight: Math.min(2.2, Math.max(1.4, height)) }),
      setPageWidth: (pageWidth) => set({ pageWidth }),
      setReadingMode: (readingMode) => set({ readingMode }),
      resetToDefaults: () => set(DEFAULT_PREFERENCES),
    }),
    {
      name: "e-reader-preferences",
    }
  )
);

// ─── Helper: Get max-width value from PageWidth ──────────────────────
export function getPageMaxWidth(pageWidth: PageWidth): string {
  switch (pageWidth) {
    case "narrow":
      return "560px";
    case "medium":
      return "680px";
    case "wide":
      return "800px";
  }
}

// ─── Helper: Get font family CSS value from FontFamily ───────────────
export function getFontFamilyCSS(fontFamily: FontFamily): string {
  switch (fontFamily) {
    case "literata":
      return '"Literata", Georgia, serif';
    case "bricolage":
      return '"Bricolage Grotesque", system-ui, sans-serif';
    case "jetbrains":
      return '"JetBrains Mono", Menlo, monospace';
    case "opendyslexic":
      return '"OpenDyslexic", "Comic Sans MS", cursive';
  }
}
