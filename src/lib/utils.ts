// ─── Hash a string to a number (deterministic) ──────────────────────
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// ─── Generate gradient colors from a string ──────────────────────────
const GRADIENT_PALETTES = [
  ["#667eea", "#764ba2"],
  ["#f093fb", "#f5576c"],
  ["#4facfe", "#00f2fe"],
  ["#43e97b", "#38f9d7"],
  ["#fa709a", "#fee140"],
  ["#a18cd1", "#fbc2eb"],
  ["#fccb90", "#d57eeb"],
  ["#e0c3fc", "#8ec5fc"],
  ["#f5576c", "#ff6a88"],
  ["#667eea", "#5fc3e4"],
  ["#c471f5", "#fa71cd"],
  ["#48c6ef", "#6f86d6"],
  ["#feada6", "#f5efef"],
  ["#a1c4fd", "#c2e9fb"],
  ["#d4fc79", "#96e6a1"],
  ["#84fab0", "#8fd3f4"],
];

export function getGradientForTitle(title: string): [string, string] {
  const index = hashString(title) % GRADIENT_PALETTES.length;
  return GRADIENT_PALETTES[index] as [string, string];
}

// ─── Format file size ────────────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Format date ─────────────────────────────────────────────────────
export function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Truncate text ───────────────────────────────────────────────────
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "\u2026";
}

// ─── Clamp a number ──────────────────────────────────────────────────
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ─── Debounce function ───────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// ─── Get file extension ──────────────────────────────────────────────
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot + 1).toLowerCase();
}

// ─── Extract title from filename ─────────────────────────────────────
export function titleFromFilename(filename: string): string {
  // Remove extension
  const lastDot = filename.lastIndexOf(".");
  const name = lastDot > 0 ? filename.slice(0, lastDot) : filename;

  // Replace underscores and hyphens with spaces, clean up
  return name
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
