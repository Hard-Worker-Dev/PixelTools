import { describe, expect, it } from "vitest";
import { buildPaletteFromPixels, centeredCropForRatio, clampCrop, formatBytes, getOutputMime, outputName, readImageDimensions, renderImageToTargetSize, rgbToHex, rgbToHsl, rotatedBounds } from "./image";

describe("image utilities", () => {
  it("formats byte sizes consistently", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1.00 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.00 MB");
    expect(formatBytes(-1)).toBe("0 B");
  });

  it("falls back to JPEG for unsupported output types", () => {
    expect(getOutputMime("image/gif")).toBe("image/jpeg");
    expect(getOutputMime("image/png")).toBe("image/png");
    expect(getOutputMime("image/webp")).toBe("image/webp");
  });

  it("creates safe output names with the right extension", () => {
    expect(outputName("holiday photo.png", "image/webp")).toBe("holiday photo-pixeltools.webp");
    expect(outputName(".png", "image/jpeg")).toBe("pixeltools-image-pixeltools.jpg");
  });

  it("clamps crop bounds inside the source image", () => {
    expect(clampCrop({ x: -4, y: 3, width: 90, height: 99 }, 50, 40)).toEqual({
      x: 0, y: 3, width: 50, height: 37
    });
  });

  it("keeps crops at least one pixel and handles out-of-range origins", () => {
    expect(clampCrop({ x: 200, y: -5, width: 0, height: 0 }, 12, 10)).toEqual({
      x: 11, y: 0, width: 1, height: 1
    });
  });

  it("centers a square crop inside a landscape image", () => {
    expect(centeredCropForRatio(1600, 900, 1)).toEqual({ x: 350, y: 0, width: 900, height: 900 });
  });

  it("centers a landscape crop inside a portrait image", () => {
    expect(centeredCropForRatio(900, 1600, 16 / 9)).toEqual({ x: 0, y: 547, width: 900, height: 506 });
  });

  it("rejects invalid crop ratios", () => {
    expect(() => centeredCropForRatio(100, 100, 0)).toThrow();
    expect(() => centeredCropForRatio(0, 100, 1)).toThrow();
  });

  it("calculates bounds for quarter-turn and arbitrary rotations", () => {
    expect(rotatedBounds(100, 50, 90)).toEqual({ width: 50, height: 100 });
    expect(rotatedBounds(100, 50, 0)).toEqual({ width: 100, height: 50 });
    expect(rotatedBounds(100, 100, 45)).toEqual({ width: 142, height: 142 });
  });

  it("rejects invalid rotation dimensions", () => {
    expect(() => rotatedBounds(0, 100, 90)).toThrow();
    expect(() => rotatedBounds(100, 100, Number.NaN)).toThrow();
  });

  it("converts RGB colors to HSL", () => {
    expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
    expect(rgbToHsl(128, 128, 128)).toEqual({ h: 0, s: 0, l: 50 });
  });

  it("requires a valid minimum target size", async () => {
    const file = new File(["sample"], "sample.webp", { type: "image/webp" });
    await expect(renderImageToTargetSize(file, { format: "image/webp" }, 512)).rejects.toThrow("Choose a target between 1 KB and 25 MB.");
  });

  it("does not offer lossy target-size mode for PNG", async () => {
    const file = new File(["sample"], "sample.png", { type: "image/png" });
    await expect(renderImageToTargetSize(file, { format: "image/png" }, 20 * 1024)).rejects.toThrow("Target-size compression is available for JPG and WebP.");
  });

  it("rejects non-image files in target-size mode", async () => {
    const file = new File(["not an image"], "notes.txt", { type: "text/plain" });
    await expect(renderImageToTargetSize(file, { format: "image/webp" }, 20 * 1024)).rejects.toThrow("Choose a valid image file.");
  });

  it("extracts the most common visible palette colors and ignores transparent pixels", () => {
    const pixels = new Uint8ClampedArray([
      255, 0, 0, 255, 250, 5, 5, 255, 0, 0, 255, 255,
      0, 0, 255, 255, 0, 0, 255, 255, 20, 20, 240, 255,
      0, 255, 0, 0
    ]);
    const palette = buildPaletteFromPixels(pixels, 3);
    expect(palette[0].hex).toBe("#1010F0");
    expect(palette[0].count).toBe(4);
    expect(palette[1].hex).toBe("#F01010");
    expect(palette[1].count).toBe(2);
    expect(palette).toHaveLength(2);
  });

  it("reads PNG dimensions without decoding image pixels", async () => {
    const buffer = new ArrayBuffer(24);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0);
    view.setUint32(16, 1920, false);
    view.setUint32(20, 1080, false);
    const file = new File([buffer], "portrait.png", { type: "image/png" });
    await expect(readImageDimensions(file)).resolves.toEqual({ width: 1920, height: 1080 });
  });

  it("reads JPEG dimensions from a start-of-frame marker", async () => {
    const buffer = new ArrayBuffer(15);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    bytes.set([0xff,0xd8,0xff,0xc0], 0);
    view.setUint16(4, 11, false);
    bytes[6] = 8;
    view.setUint16(7, 800, false);
    view.setUint16(9, 1200, false);
    const file = new File([buffer], "portrait.jpg", { type: "image/jpeg" });
    await expect(readImageDimensions(file)).resolves.toEqual({ width: 1200, height: 800 });
  });

  it("reads extended WebP canvas dimensions", async () => {
    const buffer = new ArrayBuffer(30);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    bytes.set([0x52,0x49,0x46,0x46], 0);
    view.setUint32(4, 22, true);
    bytes.set([0x57,0x45,0x42,0x50,0x56,0x50,0x38,0x58], 8);
    view.setUint32(16, 10, true);
    const widthMinusOne = 1920 - 1;
    const heightMinusOne = 1080 - 1;
    bytes[24] = widthMinusOne & 255; bytes[25] = (widthMinusOne >> 8) & 255; bytes[26] = (widthMinusOne >> 16) & 255;
    bytes[27] = heightMinusOne & 255; bytes[28] = (heightMinusOne >> 8) & 255; bytes[29] = (heightMinusOne >> 16) & 255;
    const file = new File([buffer], "portrait.webp", { type: "image/webp" });
    await expect(readImageDimensions(file)).resolves.toEqual({ width: 1920, height: 1080 });
  });

  it("rejects files whose header does not match a supported image", async () => {
    const file = new File(["not an image"], "bad.png", { type: "image/png" });
    await expect(readImageDimensions(file)).rejects.toThrow("Could not read image dimensions");
  });
  it("normalizes RGB values into uppercase hex colors", () => {
    expect(rgbToHex(255, 16, 0)).toBe("#FF1000");
    expect(rgbToHex(-5, 400, 12.7)).toBe("#00FF0D");
  });
});
