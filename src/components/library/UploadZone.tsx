
import { useState, useCallback, useRef } from "react";
import { Upload } from "lucide-react";
import { isTauri, openNativeFileDialog } from "@/lib/tauriFiles";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  variant: "full-page" | "modal";
}

const ACCEPTED_EXTENSIONS =
  ".pdf,.epub,.docx,.doc,.txt,.md,.markdown,.mdx,.html,.htm,.xhtml,.rtf,.mobi,.azw,.azw3,.fb2,.odt,.cbz,.cbr,.svg,.jpg,.jpeg,.png,.gif,.webp,.avif,.bmp,.tiff,.tif,.tex,.latex,.rst,.org,.csv,.json,.xml,.yaml,.yml,.toml,.py,.js,.ts,.go,.rs,.java,.c,.cpp,.rb,.swift";

export function UploadZone({ onFilesSelected, variant }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onFilesSelected(files);
      }
      // Reset input so same file can be selected again
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [onFilesSelected]
  );

  // Use native OS file dialog in Tauri, fall back to HTML input in browser
  const handleBrowse = useCallback(
    async (e: React.MouseEvent) => {
      if (isTauri()) {
        e.preventDefault();
        const files = await openNativeFileDialog();
        if (files.length > 0) {
          onFilesSelected(files);
        }
      }
      // In browser, the <label> click naturally triggers the hidden <input>
    },
    [onFilesSelected]
  );

  if (variant === "full-page") {
    return (
      <div
        className="flex min-h-[calc(100vh-88px)] items-center justify-center px-6 md:px-12"
      >
        <label
          htmlFor="file-upload-full"
          onClick={handleBrowse}
          className="group flex cursor-pointer flex-col items-center justify-center gap-6 rounded-xl border-2 border-dashed p-16 transition-all duration-200 md:p-24"
          style={{
            borderColor: isDragOver ? "var(--accent)" : "var(--border)",
            backgroundColor: isDragOver ? "var(--bg-secondary)" : "transparent",
            maxWidth: "640px",
            width: "100%",
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <Upload
              size={24}
              strokeWidth={1.5}
              style={{ color: "var(--text-tertiary)" }}
            />
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <p
              className="font-sans text-lg font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Drop files here to start reading
            </p>
            <p
              className="font-sans text-sm"
              style={{ color: "var(--text-tertiary)" }}
            >
              PDF, EPUB, DOCX, Markdown, TXT, HTML, and 20+ more formats
            </p>
          </div>

          <span
            className="font-sans text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            Browse files
          </span>

          <input
            ref={inputRef}
            id="file-upload-full"
            type="file"
            className="hidden"
            multiple
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleFileChange}
          />
        </label>
      </div>
    );
  }

  // Modal variant — compact
  return (
    <label
      htmlFor="file-upload-modal"
      onClick={handleBrowse}
      className="group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-10 transition-all duration-200"
      style={{
        borderColor: isDragOver ? "var(--accent)" : "var(--border)",
        backgroundColor: isDragOver ? "var(--bg-secondary)" : "transparent",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Upload
        size={20}
        strokeWidth={1.5}
        style={{ color: "var(--text-tertiary)" }}
      />
      <div className="flex flex-col items-center gap-1 text-center">
        <p
          className="font-sans text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          Drop files or click to browse
        </p>
        <p
          className="font-sans text-xs"
          style={{ color: "var(--text-tertiary)" }}
        >
          20+ formats supported
        </p>
      </div>

      <input
        ref={inputRef}
        id="file-upload-modal"
        type="file"
        className="hidden"
        multiple
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleFileChange}
      />
    </label>
  );
}
