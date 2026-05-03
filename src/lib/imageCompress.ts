// ─── Client-side image compression utility ────────────────────────────────────
// No dependencies — uses browser Canvas API only.

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024   // 10 MB input guard
const MAX_OUTPUT_CHARS = 200 * 1024          // 200 KB data-URL length guard

interface CompressOpts {
  maxSize?: number    // longest side in pixels (default 256)
  quality?: number    // JPEG quality 0–1 (default 0.7)
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to decode image.'))
    img.src = src
  })
}

function renderToJpeg(
  img: HTMLImageElement,
  srcX: number,
  srcY: number,
  srcSize: number,
  outSize: number,
  quality: number,
): string {
  const canvas = document.createElement('canvas')
  canvas.width  = outSize
  canvas.height = outSize
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable.')
  ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, outSize, outSize)
  return canvas.toDataURL('image/jpeg', quality)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compress an image File to a square JPEG data URL.
 *
 * Steps:
 *   1. Validate type and size.
 *   2. Decode with FileReader + HTMLImageElement.
 *   3. Center-crop to a square (min of width/height).
 *   4. Scale to maxSize × maxSize (no upscaling if already smaller).
 *   5. Export as JPEG at the given quality.
 *   6. If > 200 KB, retry once at quality 0.5. Throw if still too large.
 */
export async function compressImage(
  file: File,
  opts: CompressOpts = {},
): Promise<string> {
  const maxSize = opts.maxSize ?? 256
  const quality = opts.quality ?? 0.7

  // ── 1. Validate ─────────────────────────────────────────────────────────────
  if (!file.type.startsWith('image/')) {
    throw new Error('Not an image — please pick a jpg, png, or webp file.')
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('File too large — must be under 10 MB.')
  }

  // ── 2. Decode ───────────────────────────────────────────────────────────────
  const dataUrl = await readFileAsDataUrl(file)
  const img     = await loadImage(dataUrl)

  // ── 3. Center-crop to square ─────────────────────────────────────────────
  const squareSize = Math.min(img.width, img.height)
  const srcX       = Math.floor((img.width  - squareSize) / 2)
  const srcY       = Math.floor((img.height - squareSize) / 2)

  // ── 4. Output size: don't upscale ─────────────────────────────────────────
  const outSize = Math.min(squareSize, maxSize)

  // ── 5. Render to JPEG ────────────────────────────────────────────────────
  const result = renderToJpeg(img, srcX, srcY, squareSize, outSize, quality)

  // ── 6. Size check + retry ────────────────────────────────────────────────
  if (result.length <= MAX_OUTPUT_CHARS) return result

  const retry = renderToJpeg(img, srcX, srcY, squareSize, outSize, 0.5)
  if (retry.length <= MAX_OUTPUT_CHARS) return retry

  throw new Error('Image too large after compression — try a different photo.')
}
