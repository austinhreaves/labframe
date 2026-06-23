/**
 * Convert each runtime image attachment into a data URL keyed by image id, for
 * embedding in the exported PDF. Image bytes live in IndexedDB behind object
 * URLs and are intentionally kept out of the signed answers envelope, which
 * binds the image only by its SHA-256. Per-image failure is non-fatal: a
 * missing entry renders as "No image attached" rather than aborting the export.
 */
export async function collectPdfImageData(
  images: Record<string, { objectUrl: string }>,
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Object.entries(images).map(async ([id, meta]) => {
      try {
        const blob = await fetch(meta.objectUrl).then((response) => response.blob());
        const dataUrl = await blobToDataUrl(blob);
        return [id, dataUrl] as const;
      } catch {
        return [id, undefined] as const;
      }
    }),
  );
  return Object.fromEntries(
    entries.filter((entry): entry is readonly [string, string] => entry[1] !== undefined),
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image blob'));
    reader.readAsDataURL(blob);
  });
}
