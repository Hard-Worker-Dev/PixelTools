export type ImageFormat = "image/jpeg" | "image/png" | "image/webp";

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RenderOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
  rotate?: number;
  flipX?: boolean;
  flipY?: boolean;
  grayscale?: boolean;
  crop?: CropRect;
  blur?: number;
  cornerRadius?: number;
  watermark?: string;
  watermarkOpacity?: number;
}

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

export function clampCrop(crop: CropRect, imageWidth: number, imageHeight: number): CropRect {
  const x = Math.min(imageWidth - 1, Math.max(0, Math.floor(crop.x)));
  const y = Math.min(imageHeight - 1, Math.max(0, Math.floor(crop.y)));
  const width = Math.min(imageWidth - x, Math.max(1, Math.floor(crop.width)));
  const height = Math.min(imageHeight - y, Math.max(1, Math.floor(crop.height)));
  return { x, y, width, height };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(channel => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export async function renderImage(file: File, options: RenderOptions = {}): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Choose a valid image file.");
  const bitmap = await createImageBitmap(file);
  try {
    const crop = options.crop
      ? clampCrop(options.crop, bitmap.width, bitmap.height)
      : { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
    const rotate = ((options.rotate ?? 0) % 360 + 360) % 360;
    const swaps = rotate === 90 || rotate === 270;
    const width = Math.max(1, Math.round(options.width ?? (swaps ? crop.height : crop.width)));
    const height = Math.max(1, Math.round(options.height ?? (swaps ? crop.width : crop.height)));
    if (width > 12000 || height > 12000) throw new Error("Output dimensions cannot exceed 12,000 pixels.");
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
    const blur = Math.max(0, Math.min(20, options.blur ?? 0));
    if (blur > 0) ctx.filter = `${options.grayscale ? "grayscale(1) " : ""}blur(${blur}px)`;
    if ((options.cornerRadius ?? 0) > 0) {
      const radius = Math.min(options.cornerRadius ?? 0, Math.min(width, height) / 2);
      ctx.beginPath();
      ctx.roundRect(-width / 2, -height / 2, width, height, radius);
      ctx.clip();
    }
    const drawWidth = swaps ? height : width;
    const drawHeight = swaps ? width : height;
    ctx.drawImage(bitmap, crop.x, crop.y, crop.width, crop.height, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    const watermark = options.watermark?.trim();
    if (watermark) {
      ctx.save();
      const fontSize = Math.max(14, Math.round(Math.min(width, height) * 0.035));
      ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.globalAlpha = Math.max(0.1, Math.min(1, options.watermarkOpacity ?? 0.7));
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "rgba(0,0,0,.65)";
      ctx.shadowBlur = 4;
      ctx.fillText(watermark, width - fontSize * 0.7, height - fontSize * 0.65, width * 0.86);
      ctx.restore();
    }

    // PNG is required to preserve transparent rounded corners.
    const mime = (options.cornerRadius ?? 0) > 0 ? "image/png" : getOutputMime(options.format ?? "image/jpeg");
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not export this image format.")), mime, Math.min(1, Math.max(0.1, options.quality ?? 0.85))));
  } finally {
    bitmap.close();
  }
}

export async function sampleImageColor(file: File, normalizedX: number, normalizedY: number): Promise<{ r: number; g: number; b: number; hex: string }> {
  if (!file.type.startsWith("image/")) throw new Error("Choose a valid image file.");
  const bitmap = await createImageBitmap(file);
  try {
    const x = Math.min(bitmap.width - 1, Math.max(0, Math.floor(normalizedX * bitmap.width)));
    const y = Math.min(bitmap.height - 1, Math.max(0, Math.floor(normalizedY * bitmap.height)));
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Your browser could not sample this image.");
    ctx.drawImage(bitmap, -x, -y);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return { r, g, b, hex: rgbToHex(r, g, b) };
  } finally {
    bitmap.close();
  }
}

export function outputName(name: string, mime: ImageFormat): string {
  const base = name.replace(/\.[^.]+$/, "") || "pixeltools-image";
  const ext = mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
  return `${base}-pixeltools.${ext}`;
}
