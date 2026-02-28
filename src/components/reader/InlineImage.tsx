
import { useState } from "react";
import { ImageViewer } from "./ImageViewer";

interface InlineImageProps {
  src: string;
  alt?: string;
  caption?: string;
}

/**
 * Responsive inline image with tap-to-expand lightbox.
 * Used within reading content.
 */
export function InlineImage({ src, alt, caption }: InlineImageProps) {
  const [showViewer, setShowViewer] = useState(false);

  return (
    <>
      <figure className="my-4" style={{ maxWidth: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || ""}
          className="mx-auto block cursor-zoom-in rounded transition-opacity hover:opacity-90"
          style={{
            maxWidth: "100%",
            maxHeight: "60vh",
            objectFit: "contain",
          }}
          loading="lazy"
          onClick={() => setShowViewer(true)}
        />
        {caption && (
          <figcaption
            className="mt-2 text-center font-sans text-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            {caption}
          </figcaption>
        )}
      </figure>

      {showViewer && (
        <ImageViewer
          src={src}
          alt={alt}
          caption={caption}
          onClose={() => setShowViewer(false)}
        />
      )}
    </>
  );
}
