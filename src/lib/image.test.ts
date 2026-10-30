import { describe, expect, it } from "vitest";
import { formatBytes, getOutputMime, outputName } from "./image";

describe("image utilities", () => {
  it("formats byte sizes consistently", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1.00 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.00 MB");
  });
  it("falls back to JPEG for unsupported output types", () => {
    expect(getOutputMime("image/gif")).toBe("image/jpeg");
    expect(getOutputMime("image/png")).toBe("image/png");
  });
  it("creates safe output names with the right extension", () => {
    expect(outputName("holiday photo.png", "image/webp")).toBe("holiday photo-pixeltools.webp");
  });
});