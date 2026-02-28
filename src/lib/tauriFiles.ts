/**
 * Native file dialog integration for Tauri.
 * Falls back gracefully when running in a regular browser.
 */

/** Check if we're running inside a Tauri desktop app */
export function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

/** Open the native OS file picker and return File objects compatible with existing parsers */
export async function openNativeFileDialog(): Promise<File[]> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const { readFile } = await import("@tauri-apps/plugin-fs");

  const selected = await open({
    multiple: true,
    filters: [
      {
        name: "Books & Documents",
        extensions: [
          "pdf", "epub", "docx", "doc", "txt", "md", "markdown",
          "html", "htm", "rtf", "mobi", "azw", "azw3", "fb2",
          "odt", "cbz", "cbr",
        ],
      },
      {
        name: "All Files",
        extensions: ["*"],
      },
    ],
  });

  if (!selected) return [];

  // `selected` is string | string[] depending on `multiple`
  const paths = Array.isArray(selected) ? selected : [selected];

  const files: File[] = [];
  for (const filePath of paths) {
    try {
      const data = await readFile(filePath);
      const fileName = filePath.split(/[/\\]/).pop() || "unknown";
      const file = new File([data], fileName);
      files.push(file);
    } catch (err) {
      console.error(`Failed to read file: ${filePath}`, err);
    }
  }

  return files;
}
