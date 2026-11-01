import { describe, expect, it } from "vitest";
import { buildPdfFromJpegs } from "./pdf";

const text = new TextDecoder();

describe("PDF generation utilities", () => {
  it("creates a valid one-page PDF with an embedded JPEG image", async () => {
    const pdf = buildPdfFromJpegs([{ bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), width: 640, height: 480 }]);
    const bytes = new Uint8Array(await pdf.arrayBuffer());
    const source = text.decode(bytes);
    expect(pdf.type).toBe("application/pdf");
    expect(source.startsWith("%PDF-1.4")).toBe(true);
    expect(source).toContain("/Type /Catalog");
    expect(source).toContain("/Type /Pages");
    expect(source).toContain("/Subtype /Image");
    expect(source).toContain("/Filter /DCTDecode");
    expect(source).toContain("/Count 1");
    expect(source.endsWith("%%EOF\n")).toBe(true);
    const start = source.lastIndexOf("startxref\n");
    const offset = Number(source.slice(start + 10).split("\n")[0]);
    expect(source.slice(offset, offset + 4)).toBe("xref");
  });

  it("creates one page for each supplied image and auto-selects page orientation", async () => {
    const pdf = buildPdfFromJpegs([
      { bytes: new Uint8Array([1, 2, 3]), width: 1200, height: 800 },
      { bytes: new Uint8Array([4, 5, 6]), width: 600, height: 1000 }
    ]);
    const source = text.decode(new Uint8Array(await pdf.arrayBuffer()));
    expect(source).toContain("/Count 2");
    expect(source.split("/Type /Page ").slice(1).length).toHaveLength(2);
    expect(source).toContain("/MediaBox [0 0 841.89 595.28]");
    expect(source).toContain("/MediaBox [0 0 595.28 841.89]");
  });

  it("rejects empty, excessive and invalid page data", () => {
    expect(() => buildPdfFromJpegs([])).toThrow("between 1 and 20 images");
    expect(() => buildPdfFromJpegs(Array.from({ length: 21 }, () => ({ bytes: new Uint8Array([1]), width: 1, height: 1 })))).toThrow("between 1 and 20 images");
    expect(() => buildPdfFromJpegs([{ bytes: new Uint8Array(), width: 1, height: 1 }])).toThrow("valid JPEG bytes");
    expect(() => buildPdfFromJpegs([{ bytes: new Uint8Array([1]), width: 12001, height: 1 }])).toThrow("safety limit");
  });
});
