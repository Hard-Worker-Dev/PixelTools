import { describe, expect, it } from "vitest";
import { centeredCropForRatio, clampCrop, formatBytes, getOutputMime, outputName, rgbToHex } from "./image";

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

  it("normalizes RGB values into uppercase hex colors", () => {
    expect(rgbToHex(255, 16, 0)).toBe("#FF1000");
    expect(rgbToHex(-5, 400, 12.7)).toBe("#00FF0D");
  });
});
