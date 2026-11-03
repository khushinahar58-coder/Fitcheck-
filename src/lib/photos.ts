// Phone photos are 2–6 MB each, and the whole closet lives in localStorage (~5 MB per site).
// Shrinking each photo before it is stored keeps a piece to roughly 100–250 KB.

const MAX_EDGE_PX = 1200;
const JPEG_QUALITY = 0.8;

// Leave headroom under the browser's localStorage limit (about 5 million characters in Chrome).
const STORAGE_BUDGET_CHARS = 4_500_000;

export class PhotoError extends Error {}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new PhotoError("We couldn't read that photo. Try a JPG or PNG."));
    };
    img.src = url;
  });
}

/** Downscale a photo so its longest edge is at most 1200 px, and re-encode it as a JPEG data URL. */
export async function shrinkPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new PhotoError("That file isn't a photo. Try a JPG or PNG.");
  }
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new PhotoError("We couldn't process that photo. Try another one.");
  // JPEG has no transparency, so paint a white background for PNGs with transparent areas.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

function storedChars(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) total += key.length + (localStorage.getItem(key)?.length ?? 0);
  }
  return total;
}

/** True if a photo of this size still fits in this browser's storage. */
export function hasRoomFor(dataUrl: string): boolean {
  return storedChars() + dataUrl.length <= STORAGE_BUDGET_CHARS;
}
