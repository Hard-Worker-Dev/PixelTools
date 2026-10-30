// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

afterEach(() => {
  cleanup();
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
  it("opens a requested tool from a shareable URL", () => {
    window.history.replaceState({}, "", "/?tool=resize#tools");
    render(<App />);
    expect(screen.getByRole("dialog", { name: "Image Resizer" })).toBeTruthy();
  });
});