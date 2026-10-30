import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderImage, renderImageToTargetSize } from "./image";

describe("browser image rendering pipeline", () => {
  let bitmap: ImageBitmap;
  let context: CanvasRenderingContext2D;
  let fillRect: ReturnType<typeof vi.fn>;
  let drawImage: ReturnType<typeof vi.fn>;
  let rotate: ReturnType<typeof vi.fn>;
  let scale: ReturnType<typeof vi.fn>;
  let close: ReturnType<typeof vi.fn>;
  let roundRect: ReturnType<typeof vi.fn>;
  let fillText: ReturnType<typeof vi.fn>;
  let getContextSpy: ReturnType<typeof vi.spyOn>;
  let toBlobSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    close = vi.fn();
    bitmap = { width: 200, height: 100, close } as unknown as ImageBitmap;
    fillRect = vi.fn();
    drawImage = vi.fn();
    rotate = vi.fn();
    scale = vi.fn();
    roundRect = vi.fn();
    fillText = vi.fn();
    context = {
      fillStyle: "#000000", filter: "none", globalAlpha: 1, font: "", textAlign: "left",
      textBaseline: "alphabetic", shadowColor: "", shadowBlur: 0,
      save: vi.fn(), restore: vi.fn(), fillRect, drawImage, rotate, scale,
      translate: vi.fn(), beginPath: vi.fn(), roundRect, moveTo: vi.fn(), lineTo: vi.fn(),
      arcTo: vi.fn(), closePath: vi.fn(), clip: vi.fn(), fillText
    } as unknown as CanvasRenderingContext2D;
    vi.stubGlobal("createImageBitmap", vi.fn(async () => bitmap));
    getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => context);
    toBlobSpy = vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback, type) => {
      callback(new Blob(["rendered"], { type: type ?? "image/png" }));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("applies crop and rotation transforms and exports the selected JPEG type", async () => {
    const file = new File(["source"], "source.jpg", { type: "image/jpeg" });
    const output = await renderImage(file, {
      crop: { x: 10, y: 20, width: 80, height: 50 },
      rotate: 90,
      format: "image/jpeg",
      backgroundColor: "#F0E0D0"
    });
    expect(output.type).toBe("image/jpeg");
    expect(fillRect).toHaveBeenCalledWith(0, 0, 50, 80);
    expect(context.translate).toHaveBeenCalledWith(25, 40);
    expect(rotate).toHaveBeenCalledWith(Math.PI / 2);
    expect(drawImage).toHaveBeenCalledWith(bitmap, 10, 20, 80, 50, -40, -25, 80, 50);
    expect(close).toHaveBeenCalledOnce();
    expect(getContextSpy).toHaveBeenCalledOnce();
    expect(toBlobSpy).toHaveBeenCalledOnce();
  });

  it("forces PNG output and clips the canvas for rounded corners", async () => {
    const file = new File(["source"], "source.jpg", { type: "image/jpeg" });
    const output = await renderImage(file, { format: "image/jpeg", cornerRadius: 24 });
    expect(output.type).toBe("image/png");
    expect(context.beginPath).toHaveBeenCalledOnce();
    expect(roundRect).toHaveBeenCalledWith(0, 0, 200, 100, 24);
    expect(context.clip).toHaveBeenCalledOnce();
    expect(fillRect).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();
  });

  it("adds a positioned watermark using the requested text color, size and opacity", async () => {
    const file = new File(["source"], "source.webp", { type: "image/webp" });
    await renderImage(file, {
      format: "image/webp", watermark: "PixelTools", watermarkColor: "#112233",
      watermarkPosition: "top-left", watermarkOpacity: 0.4, watermarkSizePercent: 6
    });
    expect(fillText).toHaveBeenCalledWith("PixelTools", 12, 12, 172);
    expect(context.fillStyle).toBe("#112233");
    expect(context.globalAlpha).toBe(0.4);
    expect(context.textAlign).toBe("left");
    expect(context.textBaseline).toBe("top");
    expect(context.font).toContain("8px");
    expect(close).toHaveBeenCalledOnce();
  });

  it("finds the highest tested quality that stays within the requested file size", async () => {
    toBlobSpy.mockImplementation((callback, type, quality) => {
      const size = Math.max(1, Math.round((quality ?? 1) * 10000));
      callback(new Blob([new Uint8Array(size)], { type: type ?? "image/webp" }));
    });
    const file = new File(["source"], "source.webp", { type: "image/webp" });
    const target = 6 * 1024;
    const result = await renderImageToTargetSize(file, { format: "image/webp", quality: 1 }, target);
    expect(result.targetReached).toBe(true);
    expect(result.blob.size).toBeLessThanOrEqual(target);
    expect(result.quality).toBeGreaterThan(0.55);
    expect(result.quality).toBeLessThanOrEqual(0.6144);
  });

  it("returns the closest tested output and explains when the target is impossible", async () => {
    toBlobSpy.mockImplementation((callback, type, quality) => {
      const size = Math.max(1, Math.round((quality ?? 1) * 10000));
      callback(new Blob([new Uint8Array(size)], { type: type ?? "image/webp" }));
    });
    const file = new File(["source"], "source.webp", { type: "image/webp" });
    const result = await renderImageToTargetSize(file, { format: "image/webp", quality: 1 }, 1024);
    expect(result.targetReached).toBe(false);
    expect(result.blob.size).toBeGreaterThan(1024);
    expect(result.quality).toBeGreaterThan(0.1);
  });
  it("closes the bitmap if output dimensions exceed the safety limit", async () => {
    bitmap = { width: 10000, height: 10000, close } as unknown as ImageBitmap;
    vi.mocked(createImageBitmap).mockResolvedValue(bitmap);
    const file = new File(["source"], "large.png", { type: "image/png" });
    await expect(renderImage(file)).rejects.toThrow("60 megapixels total");
    expect(close).toHaveBeenCalledOnce();
    expect(getContextSpy).not.toHaveBeenCalled();
  });

  it("rejects non-image files before asking the browser to decode them", async () => {
    const file = new File(["not an image"], "notes.txt", { type: "text/plain" });
    await expect(renderImage(file)).rejects.toThrow("Choose a valid image file.");
    expect(createImageBitmap).not.toHaveBeenCalled();
  });
});