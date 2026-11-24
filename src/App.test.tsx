// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import exifr from "exifr";

vi.mock("exifr", () => ({ default: { parse: vi.fn().mockResolvedValue(undefined) } }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

describe("PixelTools ease-of-use workflows", () => {
  it("offers popular one-click shortcuts that open the matching workspace", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("heading", { name: "Image to PDF" }).closest("button")!);
    expect(screen.getByRole("dialog", { name: "Image to PDF" })).toBeTruthy();
  });

  it("explains privacy, pricing and honest AI feature status on the homepage", () => {
    render(<App />);
    expect(screen.getByText(/selected images are processed in your browser/i)).toBeTruthy();
    expect(screen.getByText(/no account, subscription or paywall/i)).toBeTruthy();
    expect(screen.getByText(/marked Coming Soon/i)).toBeTruthy();
  });

  it("lets a visitor search for an image tool", async () => {
    const user = userEvent.setup();
    render(<App />);
    const search = screen.getByRole("searchbox", { name: "What would you like to do?" });
    await user.type(search, "cropper");
    expect(screen.getByRole("button", { name: /Image Cropper/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Image Compressor/ })).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("1 available tool");
  });

  it("discards an in-flight processing result when the selected file is replaced", async () => {
    let resolveBitmap!: (bitmap: ImageBitmap) => void;
    const pendingBitmap = new Promise<ImageBitmap>(resolve => { resolveBitmap = resolve; });
    const bitmapFactory = vi.fn(() => pendingBitmap);
    vi.stubGlobal("createImageBitmap", bitmapFactory);
    const context = {
      fillStyle: "#000000", filter: "none", globalAlpha: 1, font: "", textAlign: "left",
      textBaseline: "alphabetic", shadowColor: "", shadowBlur: 0,
      save: vi.fn(), restore: vi.fn(), fillRect: vi.fn(), drawImage: vi.fn(),
      translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(), beginPath: vi.fn(),
      roundRect: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), arcTo: vi.fn(),
      closePath: vi.fn(), clip: vi.fn(), fillText: vi.fn()
    } as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => context);
    let finishExport!: () => void;
    const exportFinished = new Promise<void>(resolve => { finishExport = resolve; });
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback, type) => {
      callback(new Blob(["processed-image"], { type: type ?? "image/png" }));
      finishExport();
    });

    const buffer = new ArrayBuffer(24);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0);
    view.setUint32(16, 640, false);
    view.setUint32(20, 480, false);
    const first = new File([buffer], "first.png", { type: "image/png" });
    const second = new File([buffer], "second.png", { type: "image/png" });
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Image Compressor/ }));
    const upload = container.querySelector<HTMLInputElement>('input[accept="image/jpeg,image/png,image/webp"]');
    fireEvent.change(upload as HTMLInputElement, { target: { files: [first] } });
    await screen.findByAltText("Selected image preview");
    fireEvent.click(screen.getByRole("button", { name: /Process image/ }));
    expect(bitmapFactory).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Replace image/ }));
    fireEvent.change(upload as HTMLInputElement, { target: { files: [second] } });
    await screen.findByText("second.png");
    expect(screen.queryByText("Your image is ready")).toBeNull();

    await act(async () => {
      resolveBitmap({ width: 640, height: 480, close: vi.fn() } as unknown as ImageBitmap);
      await exportFinished;
      await new Promise(resolve => window.setTimeout(resolve, 0));
    });
    expect(screen.queryByText("Your image is ready")).toBeNull();
  });

  it("keeps roadmap ideas out of the public catalogue and distinguishes upcoming tools", () => {
    render(<App />);
    expect(screen.getByRole("status").textContent).toContain("16 available tools");
    expect(screen.getByRole("status").textContent).toContain("2 coming soon");
    expect(screen.queryByRole("button", { name: /PDF to JPG/i })).toBeNull();
    expect(screen.getByRole("group", { name: "Filter tools by category" }).querySelectorAll("button")).toHaveLength(6);
  });

  it("labels the homepage illustration and does not present invented processing results", () => {
    render(<App />);
    expect(screen.getByText("Illustrative preview")).toBeTruthy();
    expect(screen.queryByText(/−68%|768 KB|2\.4 MB/)).toBeNull();
    expect(screen.getAllByRole("link", { name: /pixeltools/i })[0].getAttribute("href")).toBe("/#tools");
  });

  it("opens the browser-local batch image conversion workspace", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Batch Image Converter/ }));
    expect(screen.getByRole("dialog", { name: "Batch Image Converter" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Drop images here or browse/ })).toBeTruthy();
  });

  it("opens Image to PDF from its direct tool URL", () => {
    window.history.replaceState({}, "", "/?tool=image-to-pdf");
    render(<App />);
    expect(screen.getByRole("dialog", { name: "Image to PDF" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Drop images here or browse/ })).toBeTruthy();
  });

  it("filters the toolkit by category and explains empty results", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("button", { name: /Image Cropper/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Image Compressor/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Edit" }).getAttribute("aria-pressed")).toBe("true");
    await user.type(screen.getByRole("searchbox", { name: "What would you like to do?" }), "not-a-real-tool");
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
      fireEvent.click(screen.getByRole("heading", { name: title }).closest("button")!);
      expect(screen.getByRole("dialog", { name: title })).toBeTruthy();
      expect(screen.getByText(/Drop your image here/i)).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Close tool" }));
    }
  }, 45000);
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
      fireEvent.click(screen.getByRole("heading", { name: title }).closest("button")!);
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
  }, 60000);

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
      fireEvent.click(screen.getByRole("heading", { name }).closest("button")!);
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

  it("hides GPS metadata by default and omits it from copied reports until opted in", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    vi.mocked(exifr.parse).mockResolvedValueOnce({
      Make: "PixelTools Test Camera",
      GPSLatitude: 37.7749,
      GPSLongitude: -122.4194,
      GPSAltitude: 12
    } as Awaited<ReturnType<typeof exifr.parse>>);
    const context = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([255, 0, 0, 255]) }))
    } as unknown as CanvasRenderingContext2D;
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({
      width: 640, height: 480, close: vi.fn()
    } as unknown as ImageBitmap)));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => context);
    const buffer = new ArrayBuffer(24);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0);
    view.setUint32(16, 640, false);
    view.setUint32(20, 480, false);
    const file = new File([buffer], "gps-photo.png", { type: "image/png" });
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Image Metadata Viewer/ }));
    const upload = container.querySelector<HTMLInputElement>('input[accept="image/jpeg,image/png,image/webp"]');
    fireEvent.change(upload as HTMLInputElement, { target: { files: [file] } });
    expect(await screen.findByText("PixelTools Test Camera")).toBeTruthy();
    expect(screen.queryByText("37.7749")).toBeNull();
    expect(screen.queryByText("-122.4194")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Copy metadata JSON" }));
    await act(async () => { await Promise.resolve(); });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).not.toContain("GPSLatitude");
    expect(writeText.mock.calls[0][0]).not.toContain("GPSLongitude");

    fireEvent.click(screen.getByRole("checkbox", { name: /Include GPS coordinates/ }));
    expect(await screen.findByText("37.7749")).toBeTruthy();
    expect(screen.getByText("-122.4194")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Copy metadata JSON" }));
    await act(async () => { await Promise.resolve(); });
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(writeText.mock.calls[1][0]).toContain("GPSLatitude");
    expect(writeText.mock.calls[1][0]).toContain("37.7749");
  });

  it("verifies the output UI for color sampling, metadata inspection and Base64 encoding", async () => {
    const pixelData = new Uint8ClampedArray([255, 0, 0, 255]);
    const context = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({ data: pixelData }))
    } as unknown as CanvasRenderingContext2D;
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({
      width: 640, height: 480, close: vi.fn()
    } as unknown as ImageBitmap)));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => context);

    const buffer = new ArrayBuffer(24);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0);
    view.setUint32(16, 640, false);
    view.setUint32(20, 480, false);
    const source = new File([buffer], "inspection-source.png", { type: "image/png" });
    const { container } = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Image Metadata Viewer/ }));
    let upload = container.querySelector<HTMLInputElement>('input[accept="image/jpeg,image/png,image/webp"]');
    fireEvent.change(upload as HTMLInputElement, { target: { files: [source] } });
    await screen.findByAltText("Selected image preview");
    expect(await screen.findByText("640 × 480 px")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Download metadata JSON/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close tool" }));

    fireEvent.click(screen.getByRole("button", { name: /Image to Base64/ }));
    upload = container.querySelector<HTMLInputElement>('input[accept="image/jpeg,image/png,image/webp"]');
    fireEvent.change(upload as HTMLInputElement, { target: { files: [source] } });
    await screen.findByAltText("Selected image preview");
    const dataUrl = await screen.findByLabelText("Base64 data URL") as HTMLTextAreaElement;
    expect(dataUrl.value.startsWith("data:image/png;base64,")).toBe(true);
    fireEvent.change(screen.getByLabelText("Output type"), { target: { value: "raw" } });
    const rawBase64 = screen.getByLabelText("Raw Base64 text") as HTMLTextAreaElement;
    expect(rawBase64.value).not.toContain(",");
    fireEvent.click(screen.getByRole("button", { name: "Close tool" }));

    fireEvent.click(screen.getByRole("button", { name: /Image Color Picker/ }));
    upload = container.querySelector<HTMLInputElement>('input[accept="image/jpeg,image/png,image/webp"]');
    fireEvent.change(upload as HTMLInputElement, { target: { files: [source] } });
    const preview = await screen.findByAltText("Selected image preview") as HTMLImageElement;
    expect(await screen.findByText("#F01010")).toBeTruthy();
    vi.spyOn(preview, "getBoundingClientRect").mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 640, bottom: 480,
      width: 640, height: 480, toJSON: () => ({})
    } as DOMRect);
    fireEvent.click(preview, { clientX: 10, clientY: 10 });
    expect(await screen.findByText("#FF0000")).toBeTruthy();
  }, 30000);

  it("keeps both AI tools disabled and clearly marked as Coming Soon", () => {
    render(<App />);
    const background = screen.getByRole("button", { name: /Background Remover/i }) as HTMLButtonElement;
    const upscaler = screen.getByRole("button", { name: /AI Image Upscaler/i }) as HTMLButtonElement;
    expect(background.disabled).toBe(true);
    expect(upscaler.disabled).toBe(true);
    expect(background.textContent).toMatch(/Coming soon/i);
    expect(upscaler.textContent).toMatch(/Coming soon/i);
  });

  it("downloads the processed image with an extension matching the exported MIME type", async () => {
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
      callback(new Blob(["verified-output"], { type: type ?? "image/png" }));
    });
    const createdBlobs: Blob[] = [];
    vi.spyOn(URL, "createObjectURL").mockImplementation(blob => {
      createdBlobs.push(blob as Blob);
      return "blob:pixeltools-test-" + createdBlobs.length;
    });
    const downloadedNames: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      downloadedNames.push(this.download);
    });

    const buffer = new ArrayBuffer(24);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0);
    view.setUint32(16, 640, false);
    view.setUint32(20, 480, false);
    const source = new File([buffer], "source.png", { type: "image/png" });
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("heading", { name: "Image Converter" }).closest("button")!);
    const upload = container.querySelector<HTMLInputElement>('input[accept="image/jpeg,image/png,image/webp"]');
    fireEvent.change(upload as HTMLInputElement, { target: { files: [source] } });
    await screen.findByAltText("Selected image preview");
    fireEvent.change(screen.getByLabelText("Convert to"), { target: { value: "image/jpeg" } });
    fireEvent.click(screen.getByRole("button", { name: /Process image/ }));
    expect(await screen.findByText("Your image is ready")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Download image/ }));
    expect(downloadedNames).toEqual(["source-pixeltools.jpg"]);
    expect(createdBlobs.at(-1)?.type).toBe("image/jpeg");
    expect(createdBlobs.at(-1)?.size).toBeGreaterThan(0);
  }, 20000);

});