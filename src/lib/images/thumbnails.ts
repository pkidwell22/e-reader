/**
 * Image thumbnail generation using OffscreenCanvas.
 * Creates 240px-wide JPEG thumbnails for book covers and inline images.
 */

const THUMBNAIL_WIDTH = 240;
const THUMBNAIL_QUALITY = 0.8;

export async function generateThumbnail(
  blob: Blob,
  maxWidth: number = THUMBNAIL_WIDTH
): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(blob);
    const aspectRatio = bitmap.height / bitmap.width;
    const width = Math.min(maxWidth, bitmap.width);
    const height = Math.round(width * aspectRatio);

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    return await canvas.convertToBlob({
      type: "image/jpeg",
      quality: THUMBNAIL_QUALITY,
    });
  } catch {
    return null;
  }
}

/**
 * Get image dimensions from a Blob.
 */
export async function getImageDimensions(
  blob: Blob
): Promise<{ width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(blob);
    const { width, height } = bitmap;
    bitmap.close();
    return { width, height };
  } catch {
    return { width: 0, height: 0 };
  }
}
