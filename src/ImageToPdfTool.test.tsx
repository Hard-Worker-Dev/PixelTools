// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ImageToPdfTool from "./ImageToPdfTool";

vi.mock("./lib/image", () => ({ formatBytes: (bytes: number) => bytes + " B" }));
vi.mock("./lib/pdf", () => ({
  createPdfFromImages: vi.fn(async (_files: File[], _quality: number, progress?: (done: number, total: number) => void) => {
    progress?.(1, 1);
    return new Blob(["%PDF-1.4 test"], { type: "application/pdf" });
  })
}));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("ImageToPdfTool", () => {
  it("creates a multi-page PDF from selected images and exposes a download", async () => {
    const user = userEvent.setup();
    const { container } = render(<ImageToPdfTool />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    const files = [
      new File(["jpg"], "first.jpg", { type: "image/jpeg" }),
      new File(["png"], "second.png", { type: "image/png" })
    ];
    fireEvent.change(input as HTMLInputElement, { target: { files } });
    expect(screen.getByText(/2 pages/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Create PDF · 2 pages/ }));
    expect(await screen.findByText("Your PDF is ready")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Download PDF/ })).toBeTruthy();
  });

  it("lets the user change page order before export", () => {
    const { container } = render(<ImageToPdfTool />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    fireEvent.change(input as HTMLInputElement, { target: { files: [
      new File(["a"], "first.jpg", { type: "image/jpeg" }),
      new File(["b"], "second.jpg", { type: "image/jpeg" })
    ] } });
    fireEvent.click(screen.getByRole("button", { name: "Move second.jpg up" }));
    const rows = Array.from(container.querySelectorAll(".pdf-file-row"));
    expect(rows[0].textContent).toContain("second.jpg");
    expect(rows[1].textContent).toContain("first.jpg");
  });

  it("rejects unsupported formats before PDF generation", () => {
    const { container } = render(<ImageToPdfTool />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    fireEvent.change(input as HTMLInputElement, { target: { files: [new File(["text"], "notes.txt", { type: "text/plain" })] } });
    expect(screen.getByRole("alert").textContent).toContain("choose JPG, PNG or WebP");
    expect(screen.queryByRole("button", { name: /Create PDF/ })).toBeNull();
  });
});
