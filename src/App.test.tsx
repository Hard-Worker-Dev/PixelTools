// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

describe("PixelTools ease-of-use workflows", () => {
  it("lets a visitor search for an image tool", async () => {
    const user = userEvent.setup();
    render(<App />);
    const search = screen.getByRole("searchbox", { name: "Find the right tool" });
    await user.type(search, "cropper");
    expect(screen.getByRole("button", { name: /Image Cropper/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Image Compressor/ })).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("1 tools found");
  });

  it("filters the toolkit by category and explains empty results", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("button", { name: /Image Cropper/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Image Compressor/ })).toBeNull();
    await user.type(screen.getByRole("searchbox", { name: "Find the right tool" }), "not-a-real-tool");
    expect(screen.getByText(/No matching tools/)).toBeTruthy();
  });

  it("opens a tool workspace and closes it with Escape", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Image Cropper/ }));
    expect(screen.getByRole("dialog", { name: "Image Cropper" })).toBeTruthy();
    expect(screen.getByText(/Add image/)).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the metadata cleaner tool workspace", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Image Metadata Cleaner/ }));
    expect(screen.getByRole("dialog", { name: "Image Metadata Cleaner" })).toBeTruthy();
    expect(screen.getByText(/Drop your image here/i)).toBeTruthy();
    expect(screen.getByText(/JPG, PNG, WebP/i)).toBeTruthy();
  });

  it("opens the upload workflow for every implemented image tool", () => {
    render(<App />);
    const titles = [
      "Image Compressor", "Image Resizer", "Image Cropper", "Image Converter",
      "Image Rotator", "Image Flipper", "Image Watermark", "Rounded Corners",
      "Image Blur", "Grayscale Converter", "Image Color Picker",
      "Image Metadata Viewer", "Image to Base64", "Image Metadata Cleaner"
    ];
    for (const title of titles) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(title) }));
      expect(screen.getByRole("dialog", { name: title })).toBeTruthy();
      expect(screen.getByText(/Drop your image here/i)).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Close tool" }));
    }
  }, 15000);
  it("uses accessible output labels and explains the PNG lossless mode", async () => {
    const buffer = new ArrayBuffer(24);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0);
    view.setUint32(16, 640, false);
    view.setUint32(20, 480, false);
    const image = new File([buffer], "sample.png", { type: "image/png" });
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Image Compressor/ }));
    const fileInput = container.querySelector<HTMLInputElement>("input[type=file]");
    fireEvent.change(fileInput as HTMLInputElement, { target: { files: [image] } });
    await screen.findByAltText("Selected image preview");
    const outputFormat = screen.getByLabelText("Output format");
    expect(outputFormat).toBeTruthy();
    fireEvent.change(outputFormat, { target: { value: "image/png" } });
    expect(screen.getByText(/PNG is lossless/i)).toBeTruthy();
    expect(screen.queryByLabelText(/Image quality/i)).toBeNull();
  });
  it("rejects an oversized image from its header before browser pixel decoding", async () => {
    const decode = vi.fn();
    vi.stubGlobal("createImageBitmap", decode);
    const buffer = new ArrayBuffer(24);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0);
    view.setUint32(16, 12001, false);
    view.setUint32(20, 1000, false);
    const largePng = new File([buffer], "oversized.png", { type: "image/png" });
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Image Compressor/ }));
    const fileInput = document.querySelector<HTMLInputElement>("input[type=file]");
    expect(fileInput).toBeTruthy();
    fireEvent.change(fileInput as HTMLInputElement, { target: { files: [largePng] } });
    expect(await screen.findByText(/This image is too large to process safely/i)).toBeTruthy();
    expect(decode).not.toHaveBeenCalled();
  });
  it("resets the tool URL when the close button is used", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Image Compressor/ }));
    expect(window.location.search).toContain("tool=compress");
    fireEvent.click(screen.getByRole("button", { name: "Close tool" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(window.location.search).toBe("");
  });
  it("closes and clears the workspace when browser history leaves a tool URL", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Image Compressor/ }));
    expect(screen.getByRole("dialog", { name: "Image Compressor" })).toBeTruthy();
    window.history.replaceState({}, "", "/");
    fireEvent(window, new PopStateEvent("popstate"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("updates precise crop coordinates when a user drags across the preview", async () => {
    const buffer = new ArrayBuffer(24);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0);
    view.setUint32(16, 1000, false);
    view.setUint32(20, 500, false);
    const image = new File([buffer], "crop-source.png", { type: "image/png" });
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Image Cropper/ }));
    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
    fireEvent.change(fileInput as HTMLInputElement, { target: { files: [image] } });
    await screen.findByAltText("Selected image preview");
    const frame = container.querySelector<HTMLDivElement>(".preview-image-frame");
    expect(frame).toBeTruthy();
    vi.spyOn(frame as HTMLDivElement, "getBoundingClientRect").mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100,
      toJSON: () => ({})
    } as DOMRect);
    fireEvent.pointerDown(frame as HTMLDivElement, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(frame as HTMLDivElement, { pointerId: 1, clientX: 60, clientY: 70 });
    fireEvent.pointerUp(frame as HTMLDivElement, { pointerId: 1, clientX: 60, clientY: 70 });
    const cropFields = Array.from(container.querySelectorAll<HTMLInputElement>(".field-grid input"));
    expect(cropFields.map(field => field.value)).toEqual(["100", "50", "500", "300"]);
  });
  it("opens a requested tool from a shareable URL", () => {
    window.history.replaceState({}, "", "/?tool=resize#tools");
    render(<App />);
    expect(screen.getByRole("dialog", { name: "Image Resizer" })).toBeTruthy();
  });

  it("offers safe resize fit choices and reset restores the original dimensions", async () => {
    const buffer = new ArrayBuffer(24);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0);
    view.setUint32(16, 1200, false);
    view.setUint32(20, 800, false);
    const image = new File([buffer], "resize-source.png", { type: "image/png" });
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Image Resizer/ }));
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    fireEvent.change(input as HTMLInputElement, { target: { files: [image] } });
    await screen.findByAltText("Selected image preview");
    const fit = screen.getByLabelText("How should the image fit?");
    expect((fit as HTMLSelectElement).value).toBe("contain");
    fireEvent.change(fit, { target: { value: "stretch" } });
    const width = screen.getByLabelText("Width (pixels)");
    fireEvent.change(width, { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset settings to defaults" }));
    expect((screen.getByLabelText("Width (pixels)") as HTMLInputElement).value).toBe("1200");
    expect((screen.getByLabelText("Height (pixels)") as HTMLInputElement).value).toBe("800");
    expect((screen.getByLabelText("How should the image fit?") as HTMLSelectElement).value).toBe("contain");
  });

  it("provides a labeled checkbox for aspect ratio and no dangling form labels", async () => {
    const buffer = new ArrayBuffer(24);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0);
    view.setUint32(16, 640, false);
    view.setUint32(20, 480, false);
    const image = new File([buffer], "flip-source.png", { type: "image/png" });
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Image Resizer/ }));
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    fireEvent.change(input as HTMLInputElement, { target: { files: [image] } });
    await screen.findByAltText("Selected image preview");
    expect(screen.getByLabelText("Keep original aspect ratio")).toBeTruthy();
    const ids = Array.from(container.querySelectorAll<HTMLElement>("[id]")).map(element => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    const labels = Array.from(container.querySelectorAll<HTMLLabelElement>("label[for]"));
    for (const label of labels) expect(ids).toContain(label.htmlFor);
  });


  it("lets users upload and configure a transparent logo watermark", async () => {
    const buffer = new ArrayBuffer(24);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0);
    view.setUint32(16, 640, false);
    view.setUint32(20, 480, false);
    const source = new File([buffer], "photo.png", { type: "image/png" });
    const logo = new File([buffer], "brand-mark.png", { type: "image/png" });
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Image Watermark/ }));
    const sourceInput = container.querySelector<HTMLInputElement>('input[accept="image/jpeg,image/png,image/webp"]');
    fireEvent.change(sourceInput as HTMLInputElement, { target: { files: [source] } });
    await screen.findByAltText("Selected image preview");
    fireEvent.change(screen.getByLabelText("Watermark type"), { target: { value: "image" } });
    fireEvent.click(screen.getByRole("button", { name: /Choose transparent PNG/ }));
    const logoInput = container.querySelector<HTMLInputElement>('input[accept="image/png,image/webp"]');
    expect(logoInput).toBeTruthy();
    fireEvent.change(logoInput as HTMLInputElement, { target: { files: [logo] } });
    expect(await screen.findByAltText("Selected watermark logo")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Change logo: brand-mark.png/ })).toBeTruthy();
    expect(screen.getByLabelText(/Logo width/)).toBeTruthy();
    expect(screen.getByLabelText("Position")).toBeTruthy();
    expect(screen.getByLabelText(/Opacity/)).toBeTruthy();
  });


  it("keeps every working tool workspace form control labeled and IDs unique", async () => {
    const buffer = new ArrayBuffer(24);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0);
    view.setUint32(16, 640, false);
    view.setUint32(20, 480, false);
    const image = new File([buffer], "accessibility-source.png", { type: "image/png" });
    const { container } = render(<App />);
    const titles = [
      "Image Compressor", "Image Resizer", "Image Cropper", "Image Converter",
      "Image Rotator", "Image Flipper", "Image Watermark", "Rounded Corners",
      "Image Blur", "Grayscale Converter", "Image Color Picker",
      "Image Metadata Viewer", "Image to Base64", "Image Metadata Cleaner"
    ];
    for (const title of titles) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(title) }));
      const fileInput = container.querySelector<HTMLInputElement>('input[accept="image/jpeg,image/png,image/webp"]');
      fireEvent.change(fileInput as HTMLInputElement, { target: { files: [image] } });
      await screen.findByAltText("Selected image preview");
      const ids = Array.from(container.querySelectorAll<HTMLElement>("[id]")).map(element => element.id);
      expect(new Set(ids).size, title + " must not contain duplicate IDs").toBe(ids.length);
      const labels = Array.from(container.querySelectorAll<HTMLLabelElement>("label[for]"));
      for (const label of labels) {
        expect(ids, title + " label " + label.htmlFor).toContain(label.htmlFor);
      }
      fireEvent.click(screen.getByRole("button", { name: "Close tool" }));
    }
  }, 20000);

  it("traps modal keyboard focus and restores page scrolling after close", async () => {
    const user = userEvent.setup();
    render(<App />);
    const openButton = screen.getByRole("button", { name: /Image Compressor/ });
    await user.click(openButton);
    const closeButton = screen.getByRole("button", { name: "Close tool" });
    expect(document.activeElement).toBe(closeButton);
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close" }));
    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(openButton);
  });

  it("rejects a watermark logo whose header dimensions exceed the safe limit", async () => {
    const sourceBuffer = new ArrayBuffer(24);
    const sourceBytes = new Uint8Array(sourceBuffer);
    const sourceView = new DataView(sourceBuffer);
    sourceBytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0);
    sourceView.setUint32(16, 640, false);
    sourceView.setUint32(20, 480, false);
    const source = new File([sourceBuffer], "photo.png", { type: "image/png" });

    const logoBuffer = new ArrayBuffer(24);
    const logoBytes = new Uint8Array(logoBuffer);
    const logoView = new DataView(logoBuffer);
    logoBytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0);
    logoView.setUint32(16, 12001, false);
    logoView.setUint32(20, 100, false);
    const oversizedLogo = new File([logoBuffer], "oversized-logo.png", { type: "image/png" });

    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Image Watermark/ }));
    const sourceInput = container.querySelector<HTMLInputElement>('input[accept="image/jpeg,image/png,image/webp"]');
    fireEvent.change(sourceInput as HTMLInputElement, { target: { files: [source] } });
    await screen.findByAltText("Selected image preview");
    fireEvent.change(screen.getByLabelText("Watermark type"), { target: { value: "image" } });
    fireEvent.click(screen.getByRole("button", { name: /Choose transparent PNG/ }));
    const logoInput = container.querySelector<HTMLInputElement>('input[accept="image/png,image/webp"]');
    fireEvent.change(logoInput as HTMLInputElement, { target: { files: [oversizedLogo] } });
    expect(await screen.findByText(/Logo dimensions exceed the safe limit/i)).toBeTruthy();
    expect(screen.queryByAltText("Selected watermark logo")).toBeNull();
  });

  it("runs the processing and export flow for every image-editing tool", async () => {
    const context = {
      fillStyle: "#000000", filter: "none", globalAlpha: 1, font: "", textAlign: "left",
      textBaseline: "alphabetic", shadowColor: "", shadowBlur: 0,
      save: vi.fn(), restore: vi.fn(), fillRect: vi.fn(), drawImage: vi.fn(),
      translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(), beginPath: vi.fn(),
      roundRect: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), arcTo: vi.fn(),
      closePath: vi.fn(), clip: vi.fn(), fillText: vi.fn()
    } as unknown as CanvasRenderingContext2D;
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({
      width: 640, height: 480, close: vi.fn()
    } as unknown as ImageBitmap)));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => context);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback, type) => {
      callback(new Blob(["processed-image"], { type: type ?? "image/png" }));
    });

    const buffer = new ArrayBuffer(24);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0);
    view.setUint32(16, 640, false);
    view.setUint32(20, 480, false);
    const source = new File([buffer], "smoke-test.png", { type: "image/png" });
    const toolNames = [
      "Image Compressor", "Image Resizer", "Image Cropper", "Image Converter",
      "Image Rotator", "Image Flipper", "Image Watermark", "Rounded Corners",
      "Image Blur", "Grayscale Converter", "Image Metadata Cleaner"
    ];

    const { container } = render(<App />);
    for (const name of toolNames) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(name) }));
      const upload = container.querySelector<HTMLInputElement>('input[accept="image/jpeg,image/png,image/webp"]');
      expect(upload, name + " should provide an image input").toBeTruthy();
      fireEvent.change(upload as HTMLInputElement, { target: { files: [source] } });
      await screen.findByAltText("Selected image preview");
      fireEvent.click(screen.getByRole("button", { name: /Process image|Process again/ }));
      expect(await screen.findByText("Your image is ready"), name + " should produce an exported result").toBeTruthy();
      expect(screen.getByAltText("Processed image preview")).toBeTruthy();
      expect(screen.getByRole("button", { name: /Download image/ })).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Close tool" }));
    }
  }, 30000);

});