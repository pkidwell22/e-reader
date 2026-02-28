
import { useState, useRef, useCallback, useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import {
  type ZoomState,
  DEFAULT_ZOOM,
  zoomIn,
  zoomOut,
  resetZoom,
  handleWheelZoom,
  handlePan,
} from "@/lib/images/zoom";

interface ImageViewerProps {
  src: string;
  alt?: string;
  caption?: string;
  onClose: () => void;
}

/**
 * Lightbox image viewer with zoom/pan support.
 * Dark backdrop, controls at top, close on Esc/outside click.
 */
export function ImageViewer({ src, alt, caption, onClose }: ImageViewerProps) {
  const [zoom, setZoom] = useState<ZoomState>(DEFAULT_ZOOM);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPanRef = useRef<{ x: number; y: number } | null>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setZoom(zoomIn);
      if (e.key === "-") setZoom(zoomOut);
      if (e.key === "0") setZoom(resetZoom());
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setZoom((z) => handleWheelZoom(z, e.deltaY, e.clientX, e.clientY, rect));
    },
    []
  );

  // Pan via mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    lastPanRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !lastPanRef.current) return;
      const dx = e.clientX - lastPanRef.current.x;
      const dy = e.clientY - lastPanRef.current.y;
      lastPanRef.current = { x: e.clientX, y: e.clientY };
      setZoom((z) => handlePan(z, dx, dy));
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    lastPanRef.current = null;
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.92)" }}
    >
      {/* Controls bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(zoomIn)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Zoom in"
          >
            <ZoomIn size={18} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setZoom(zoomOut)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Zoom out"
          >
            <ZoomOut size={18} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setZoom(resetZoom())}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Reset zoom"
          >
            <RotateCcw size={18} strokeWidth={1.5} />
          </button>
          <span className="ml-2 font-sans text-sm text-white/50">
            {Math.round(zoom.scale * 100)}%
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close image viewer"
        >
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Image area */}
      <div
        ref={containerRef}
        className="flex flex-1 items-center justify-center overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          // Close on backdrop click (not on image)
          if (e.target === e.currentTarget) onClose();
        }}
        style={{ cursor: isDragging ? "grabbing" : zoom.scale > 1 ? "grab" : "default" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || ""}
          className="select-none transition-transform duration-150"
          style={{
            maxWidth: "90vw",
            maxHeight: "85vh",
            objectFit: "contain",
            transform: `translate(${zoom.translateX}px, ${zoom.translateY}px) scale(${zoom.scale})`,
            borderRadius: "4px",
          }}
          draggable={false}
        />
      </div>

      {/* Caption */}
      {caption && (
        <div className="px-4 py-3 text-center font-sans text-sm text-white/60">
          {caption}
        </div>
      )}
    </div>
  );
}
