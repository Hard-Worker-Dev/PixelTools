import { describe, expect, it } from "vitest";
import { centeredCropForRatio, clampCrop, formatBytes, getOutputMime, outputName, renderImageToTargetSize, rgbToHex, rgbToHsl, rotatedBounds } from "./image";

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

  it("normalizes RGB values into uppercase hex colors", () => {
    expect(rgbToHex(255, 16, 0)).toBe("#FF1000");
    expect(rgbToHex(-5, 400, 12.7)).toBe("#00FF0D");
  });
});
