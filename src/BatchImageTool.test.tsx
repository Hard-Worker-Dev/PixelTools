// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BatchImageTool from "./BatchImageTool";

vi.mock("./lib/image", () => ({
  formatBytes: (bytes: number) => bytes + " B",
  outputName: (name: string, format: string) => name.replace(/\.[^.]+$/, "") + "-pixeltools." + (format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp"),
  readImageDimensions: vi.fn(async () => ({ width: 640, height: 480 })),
  renderImage: vi.fn(async (_file: File, options: { format: string }) => new Blob(["processed"], { type: options.format }))
}));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("BatchImageTool", () => {
  it("converts a selected image and offers individual and ZIP downloads", async () => {
    const user = userEvent.setup();
    const { container } = render(<BatchImageTool />);
    const file = new File(["source"], "photo.png", { type: "image/png" });
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).toBeTruthy();
    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } });
    await user.click(screen.getByRole("button", { name: "Process 1 images" }));
    expect(await screen.findByText("Batch results")).toBeTruthy();
    expect(screen.getByText("photo-pixeltools.webp")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Download all as ZIP/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Download photo-pixeltools.webp/ })).toBeTruthy();
  });

  it("rejects unsupported file types without processing them", () => {
    const { container } = render(<BatchImageTool />);
    const file = new File(["not an image"], "notes.txt", { type: "text/plain" });
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } });
    expect(screen.getByRole("alert").textContent).toContain("choose JPG, PNG or WebP");
    expect(screen.queryByRole("button", { name: /Process/ })).toBeNull();
  });
});
