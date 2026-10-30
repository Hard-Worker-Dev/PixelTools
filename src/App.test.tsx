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
});