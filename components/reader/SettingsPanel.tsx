"use client";

import { X, Sun, Moon, Coffee, Minus, Plus } from "lucide-react";
import { usePreferencesStore, getPageMaxWidth } from "@/stores/preferencesStore";
import { useReaderStore } from "@/stores/readerStore";
import { clearPaginationCache } from "@/lib/pagination";
import type { Theme, FontFamily, PageWidth } from "@/lib/types";

const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun size={14} /> },
  { value: "dark", label: "Dark", icon: <Moon size={14} /> },
  { value: "sepia", label: "Sepia", icon: <Coffee size={14} /> },
];

const FONTS: { value: FontFamily; label: string; preview: string }[] = [
  { value: "literata", label: "Literata", preview: "Serif" },
  { value: "bricolage", label: "Bricolage", preview: "Sans" },
  { value: "jetbrains", label: "JetBrains", preview: "Mono" },
  { value: "opendyslexic", label: "OpenDyslexic", preview: "A11y" },
];

const PAGE_WIDTHS: { value: PageWidth; label: string }[] = [
  { value: "narrow", label: "Narrow" },
  { value: "medium", label: "Medium" },
  { value: "wide", label: "Wide" },
];

export function SettingsPanel() {
  const setSidebarOpen = useReaderStore((s) => s.setSidebarOpen);

  const theme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const fontFamily = usePreferencesStore((s) => s.fontFamily);
  const setFontFamily = usePreferencesStore((s) => s.setFontFamily);
  const fontSize = usePreferencesStore((s) => s.fontSize);
  const setFontSize = usePreferencesStore((s) => s.setFontSize);
  const lineHeight = usePreferencesStore((s) => s.lineHeight);
  const setLineHeight = usePreferencesStore((s) => s.setLineHeight);
  const pageWidth = usePreferencesStore((s) => s.pageWidth);
  const setPageWidth = usePreferencesStore((s) => s.setPageWidth);

  const handleSettingChange = () => {
    clearPaginationCache();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
        onClick={() => setSidebarOpen(null)}
      />

      {/* Panel */}
      <aside
        className="fixed bottom-0 right-0 top-0 z-50 w-[320px] overflow-y-auto"
        style={{
          backgroundColor: "var(--bg-primary)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <span
              className="font-sans text-xs font-medium uppercase tracking-wider"
              style={{
                color: "var(--text-tertiary)",
                letterSpacing: "0.05em",
              }}
            >
              Reading Settings
            </span>
            <button
              onClick={() => setSidebarOpen(null)}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              aria-label="Close settings"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>

          {/* ─── Theme ─────────────────────────────── */}
          <Section label="Theme">
            <div className="flex gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    setTheme(t.value);
                    handleSettingChange();
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 font-sans text-sm font-medium transition-all"
                  style={{
                    backgroundColor:
                      theme === t.value
                        ? "var(--accent)"
                        : "var(--bg-secondary)",
                    color:
                      theme === t.value ? "white" : "var(--text-secondary)",
                  }}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </Section>

          {/* ─── Font Family ───────────────────────── */}
          <Section label="Font">
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => {
                    setFontFamily(f.value);
                    handleSettingChange();
                  }}
                  className="flex flex-col items-center gap-0.5 rounded-lg py-3 font-sans text-sm transition-all"
                  style={{
                    backgroundColor:
                      fontFamily === f.value
                        ? "var(--accent)"
                        : "var(--bg-secondary)",
                    color:
                      fontFamily === f.value
                        ? "white"
                        : "var(--text-secondary)",
                  }}
                >
                  <span className="font-medium">{f.label}</span>
                  <span className="text-xs opacity-70">{f.preview}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* ─── Font Size ─────────────────────────── */}
          <Section label={`Size: ${fontSize}px`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setFontSize(fontSize - 1);
                  handleSettingChange();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                }}
                disabled={fontSize <= 12}
                aria-label="Decrease font size"
              >
                <Minus size={14} strokeWidth={1.5} />
              </button>
              <input
                type="range"
                min={12}
                max={32}
                step={1}
                value={fontSize}
                onChange={(e) => {
                  setFontSize(parseInt(e.target.value));
                  handleSettingChange();
                }}
                className="flex-1 accent-[var(--accent)]"
                style={{ accentColor: "var(--accent)" }}
              />
              <button
                onClick={() => {
                  setFontSize(fontSize + 1);
                  handleSettingChange();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                }}
                disabled={fontSize >= 32}
                aria-label="Increase font size"
              >
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </div>
          </Section>

          {/* ─── Line Height ───────────────────────── */}
          <Section label={`Line Height: ${lineHeight.toFixed(1)}`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setLineHeight(lineHeight - 0.1);
                  handleSettingChange();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                }}
                disabled={lineHeight <= 1.4}
                aria-label="Decrease line height"
              >
                <Minus size={14} strokeWidth={1.5} />
              </button>
              <input
                type="range"
                min={1.4}
                max={2.2}
                step={0.1}
                value={lineHeight}
                onChange={(e) => {
                  setLineHeight(parseFloat(e.target.value));
                  handleSettingChange();
                }}
                className="flex-1"
                style={{ accentColor: "var(--accent)" }}
              />
              <button
                onClick={() => {
                  setLineHeight(lineHeight + 0.1);
                  handleSettingChange();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                }}
                disabled={lineHeight >= 2.2}
                aria-label="Increase line height"
              >
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </div>
          </Section>

          {/* ─── Page Width ────────────────────────── */}
          <Section label="Page Width">
            <div className="flex gap-2">
              {PAGE_WIDTHS.map((w) => (
                <button
                  key={w.value}
                  onClick={() => {
                    setPageWidth(w.value);
                    handleSettingChange();
                  }}
                  className="flex flex-1 items-center justify-center rounded-lg py-2.5 font-sans text-sm font-medium transition-all"
                  style={{
                    backgroundColor:
                      pageWidth === w.value
                        ? "var(--accent)"
                        : "var(--bg-secondary)",
                    color:
                      pageWidth === w.value
                        ? "white"
                        : "var(--text-secondary)",
                  }}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </Section>
        </div>
      </aside>
    </>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <label
        className="mb-2 block font-sans text-sm font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
