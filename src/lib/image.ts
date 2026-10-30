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
  watermarkSizePercent?: number;
  watermarkPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center";
  watermarkColor?: string;
  backgroundColor?: string;
}


export interface ImageDimensions {
  width: number;
  height: number;
}

export async function readImageDimensions(file: File): Promise<ImageDimensions> {
  const bytes = new Uint8Array(await file.slice(0, 1024 * 1024).arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (offset: number, length: number) => String.fromCharCode(...bytes.subarray(offset, offset + length));
  const dimensions = (width: number, height: number): ImageDimensions => {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) throw new Error("The image header contains invalid dimensions.");
    return { width, height };
  };

  if (file.type === "image/png" && bytes.length >= 24 && ascii(0, 8) === "\u0089PNG\r\n\u001a\n") {
    return dimensions(view.getUint32(16, false), view.getUint32(20, false));
  }

  if (file.type === "image/jpeg" && bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    const sof = new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
    let offset = 2;
    while (offset + 4 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
      if (offset >= bytes.length) break;
      const marker = bytes[offset++];
      if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) break;
      const length = view.getUint16(offset, false);
      if (length < 2 || offset + length > bytes.length) break;
      if (sof.has(marker) && length >= 7) {
        return dimensions(view.getUint16(offset + 5, false), view.getUint16(offset + 3, false));
      }
      offset += length;
    }
  }

  if (file.type === "image/webp" && bytes.length >= 30 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const kind = ascii(offset, 4);
      const chunkLength = view.getUint32(offset + 4, true);
      const data = offset + 8;
      if (data + chunkLength > bytes.length) break;
      if (kind === "VP8X" && chunkLength >= 10) {
        const width = 1 + bytes[data + 4] + (bytes[data + 5] << 8) + (bytes[data + 6] << 16);
        const height = 1 + bytes[data + 7] + (bytes[data + 8] << 8) + (bytes[data + 9] << 16);
        return dimensions(width, height);
      }
      if (kind === "VP8L" && chunkLength >= 5 && bytes[data] === 0x2f) {
        const b1 = bytes[data + 1], b2 = bytes[data + 2], b3 = bytes[data + 3], b4 = bytes[data + 4];
        const width = 1 + (b1 & 0x3f) + ((b2 & 0x3f) << 6);
        const height = 1 + ((b2 >> 6) & 0x03) + (b3 << 2) + ((b4 & 0x0f) << 10);
        return dimensions(width, height);
      }
      if (kind === "VP8 " && chunkLength >= 10 && bytes[data + 3] === 0x9d && bytes[data + 4] === 0x01 && bytes[data + 5] === 0x2a) {
        return dimensions(view.getUint16(data + 6, true) & 0x3fff, view.getUint16(data + 8, true) & 0x3fff);
      }
      offset += 8 + chunkLength + (chunkLength & 1);
    }
  }
  throw new Error("Could not read image dimensions from this file. Re-export it as a valid JPG, PNG or WebP image and try again.");
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

export function centeredCropForRatio(imageWidth: number, imageHeight: number, ratio: number): CropRect {
  if (!Number.isFinite(ratio) || ratio <= 0 || imageWidth < 1 || imageHeight < 1) {
    throw new Error("A valid image size and aspect ratio are required.");
  }
  const imageRatio = imageWidth / imageHeight;
  if (imageRatio > ratio) {
    const width = Math.max(1, Math.floor(imageHeight * ratio));
    return { x: Math.floor((imageWidth - width) / 2), y: 0, width, height: imageHeight };
  }
  const height = Math.max(1, Math.floor(imageWidth / ratio));
  return { x: 0, y: Math.floor((imageHeight - height) / 2), width: imageWidth, height };
}

export function rotatedBounds(width: number, height: number, degrees: number): { width: number; height: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1 || !Number.isFinite(degrees)) {
    throw new Error("Valid dimensions and a finite rotation angle are required.");
  }
  const radians = ((degrees % 360) * Math.PI) / 180;
  const rawCos = Math.abs(Math.cos(radians));
  const rawSin = Math.abs(Math.sin(radians));
  const cos = rawCos < 1e-10 ? 0 : rawCos;
  const sin = rawSin < 1e-10 ? 0 : rawSin;
  return {
    width: Math.max(1, Math.ceil(width * cos + height * sin - 1e-10)),
    height: Math.max(1, Math.ceil(width * sin + height * cos - 1e-10))
  };
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const red = Math.max(0, Math.min(255, r)) / 255;
  const green = Math.max(0, Math.min(255, g)) / 255;
  const blue = Math.max(0, Math.min(255, b)) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let h = 0;
  const l = (max + min) / 2;
  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === red) h = ((green - blue) / delta) % 6;
    else if (max === green) h = (blue - red) / delta + 2;
    else h = (red - green) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(channel => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export async function renderImage(file: File, options: RenderOptions = {}): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Choose a valid image file.");
  const bitmap = await createImageBitmap(file);
  try {
    const crop = options.crop ? clampCrop(options.crop, bitmap.width, bitmap.height) : { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
    const rotate = ((options.rotate ?? 0) % 360 + 360) % 360;
    const bounds = rotatedBounds(crop.width, crop.height, rotate);
    const width = Math.max(1, Math.round(options.width ?? bounds.width));
    const height = Math.max(1, Math.round(options.height ?? bounds.height));
    if (width > 12000 || height > 12000 || width * height > 60000000) throw new Error("Output cannot exceed 12,000 pixels per side or 60 megapixels total.");
    const mime = (options.cornerRadius ?? 0) > 0 ? "image/png" : getOutputMime(options.format ?? "image/jpeg");
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not start image processing.");
    if (mime === "image/jpeg") {
      ctx.fillStyle = options.backgroundColor ?? "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.save();
    if ((options.cornerRadius ?? 0) > 0) {
      const radius = Math.min(options.cornerRadius ?? 0, Math.min(width, height) / 2);
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, radius);
      ctx.clip();
    }
    const scaleX = width / bounds.width;
    const scaleY = height / bounds.height;
    ctx.translate(width / 2, height / 2);
    ctx.scale(scaleX, scaleY);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(options.flipX ? -1 : 1, options.flipY ? -1 : 1);
    const blur = Math.max(0, Math.min(20, options.blur ?? 0));
    const filters = [options.grayscale ? "grayscale(1)" : "", blur > 0 ? "blur(" + blur + "px)" : ""].filter(Boolean);
    if (filters.length) ctx.filter = filters.join(" ");
    ctx.drawImage(bitmap, crop.x, crop.y, crop.width, crop.height, -crop.width / 2, -crop.height / 2, crop.width, crop.height);
    ctx.restore();
    const watermark = options.watermark?.trim();
    if (watermark) {
      ctx.save();
      const fontSize = Math.max(8, Math.round(Math.min(width, height) * ((options.watermarkSizePercent ?? 3.5) / 100)));
      const margin = Math.max(12, Math.round(fontSize * 0.7));
      const position = options.watermarkPosition ?? "bottom-right";
      const align = position.endsWith("left") ? "left" : position.endsWith("right") ? "right" : "center";
      const x = position.endsWith("left") ? margin : position.endsWith("right") ? width - margin : width / 2;
      const y = position.startsWith("top") ? margin : position === "center" ? height / 2 : height - margin;
      ctx.font = "600 " + fontSize + "px system-ui, sans-serif";
      ctx.textAlign = align;
      ctx.textBaseline = position.startsWith("top") ? "top" : position === "center" ? "middle" : "bottom";
      ctx.globalAlpha = Math.max(0.1, Math.min(1, options.watermarkOpacity ?? 0.7));
      ctx.fillStyle = options.watermarkColor ?? "#FFFFFF";
      ctx.shadowColor = options.watermarkColor === "#FFFFFF" ? "rgba(0,0,0,.65)" : "rgba(255,255,255,.45)";
      ctx.shadowBlur = 4;
      ctx.fillText(watermark, x, y, width * 0.86);
      ctx.restore();
    }
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not export this image format.")), mime, Math.min(1, Math.max(0.1, options.quality ?? 0.85))));
  } finally {
    bitmap.close();
  }
}

export interface TargetCompressionResult {
  blob: Blob;
  quality: number;
  targetReached: boolean;
}

export async function renderImageToTargetSize(file: File, options: RenderOptions, targetBytes: number, iterations = 6): Promise<TargetCompressionResult> {
  if (!file.type.startsWith("image/")) throw new Error("Choose a valid image file.");
  if (!Number.isFinite(targetBytes) || targetBytes < 1024 || targetBytes > 25 * 1024 * 1024) {
    throw new Error("Choose a target between 1 KB and 25 MB.");
  }
  const mime = getOutputMime(options.format ?? "image/webp");
  if (mime === "image/png") throw new Error("Target-size compression is available for JPG and WebP. PNG uses lossless encoding.");
  const steps = Math.max(3, Math.min(8, Math.floor(iterations)));
  let low = 0.1;
  let high = Math.min(1, Math.max(0.1, options.quality ?? 0.92));
  let bestAny: TargetCompressionResult | null = null;
  let bestWithin: TargetCompressionResult | null = null;
  for (let index = 0; index < steps; index += 1) {
    const quality = index === 0 ? high : (low + high) / 2;
    const blob = await renderImage(file, { ...options, format: mime, quality });
    const result = { blob, quality, targetReached: blob.size <= targetBytes };
    if (!bestAny || blob.size < bestAny.blob.size) bestAny = result;
    if (result.targetReached) {
      if (!bestWithin || quality > bestWithin.quality) bestWithin = result;
      low = quality;
    } else {
      high = quality;
    }
    if (bestWithin && bestWithin.blob.size <= targetBytes && high - low < 0.015) break;
  }
  return bestWithin ?? bestAny ?? { blob: await renderImage(file, { ...options, format: mime, quality: 0.1 }), quality: 0.1, targetReached: false };
}


export interface PaletteColor {
  hex: string;
  count: number;
}

export function buildPaletteFromPixels(pixels: Uint8ClampedArray, maxColors = 5): PaletteColor[] {
  const counts = new Map<string, number>();
  for (let index = 0; index + 3 < pixels.length; index += 4) {
    if (pixels[index + 3] < 128) continue;
    const quantize = (channel: number) => Math.min(255, Math.floor(channel / 32) * 32 + 16);
    const hex = rgbToHex(quantize(pixels[index]), quantize(pixels[index + 1]), quantize(pixels[index + 2]));
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  return Array.from(counts, ([hex, count]) => ({ hex, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.max(1, Math.min(12, Math.floor(maxColors))));
}

export async function extractImagePalette(file: File, maxColors = 5): Promise<PaletteColor[]> {
  if (!file.type.startsWith("image/")) throw new Error("Choose a valid image file.");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 64 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Your browser could not extract a color palette.");
    ctx.drawImage(bitmap, 0, 0, width, height);
    return buildPaletteFromPixels(ctx.getImageData(0, 0, width, height).data, maxColors);
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
