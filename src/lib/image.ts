export type ImageFormat = "image/jpeg" | "image/png" | "image/webp";

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit++; }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unit]}`;
}

export function getOutputMime(format: string): ImageFormat {
  if (format === "image/png" || format === "image/webp") return format;
  return "image/jpeg";
}

export async function renderImage(
  file: File,
  options: { width?: number; height?: number; quality?: number; format?: ImageFormat; rotate?: number; flipX?: boolean; flipY?: boolean; grayscale?: boolean } = {}
): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Choose a valid image file.");
  const bitmap = await createImageBitmap(file);
  try {
    const rotate = options.rotate ?? 0;
    const swaps = Math.abs(rotate % 180) === 90;
    const width = Math.max(1, Math.round(options.width ?? (swaps ? bitmap.height : bitmap.width)));
    const height = Math.max(1, Math.round(options.height ?? (swaps ? bitmap.width : bitmap.height)));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not start image processing.");
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(options.flipX ? -1 : 1, options.flipY ? -1 : 1);
    if (options.grayscale) ctx.filter = "grayscale(1)";
    const drawWidth = swaps ? height : width;
    const drawHeight = swaps ? width : height;
    ctx.drawImage(bitmap, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
    const mime = getOutputMime(options.format ?? "image/jpeg");
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not export this image format.")), mime, Math.min(1, Math.max(0.1, options.quality ?? 0.85))));
  } finally {
    bitmap.close();
  }
}

export function outputName(name: string, mime: ImageFormat): string {
  const base = name.replace(/\.[^.]+$/, "") || "pixeltools-image";
  const ext = mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
  return `${base}-pixeltools.${ext}`;
}