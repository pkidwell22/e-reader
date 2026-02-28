"use client";

import { BookOpen, Sun, Moon, Coffee } from "lucide-react";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { BookGrid } from "@/components/library/BookGrid";
import type { Theme } from "@/lib/types";

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun size={14} /> },
  { value: "dark", label: "Dark", icon: <Moon size={14} /> },
  { value: "sepia", label: "Sepia", icon: <Coffee size={14} /> },
];

export default function LibraryPage() {
  const theme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* ─── Header ──────────────────────────────────────────── */}
      <header className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-2">
          <BookOpen
            size={24}
            strokeWidth={1.5}
            style={{ color: "var(--text-primary)" }}
          />
          <h1
            className="font-sans text-xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            E-Reader
          </h1>
        </div>

        {/* Theme Switcher */}
        <div
          className="flex items-center gap-1 rounded-full p-1"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor:
                  theme === opt.value ? "var(--bg-primary)" : "transparent",
                color:
                  theme === opt.value
                    ? "var(--text-primary)"
                    : "var(--text-tertiary)",
                boxShadow: theme === opt.value ? "var(--shadow)" : "none",
              }}
              aria-label={`Switch to ${opt.label} theme`}
              aria-pressed={theme === opt.value}
            >
              {opt.icon}
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ─── Library Content ───────────────────────────────────── */}
      <main>
        <BookGrid />
      </main>
    </div>
  );
}
