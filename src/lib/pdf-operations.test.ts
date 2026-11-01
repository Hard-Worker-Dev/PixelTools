// @vitest-environment node
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { mergePdfFiles, parsePdfPageRanges, splitPdfFile } from "./pdf-operations";

function readStoredZip(bytes: Uint8Array): Array<{name:string;bytes:Uint8Array}> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();
  const entries: Array<{name:string;bytes:Uint8Array}> = [];
  let offset = 0;
  while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    const compressedSize = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > bytes.length) throw new Error("Invalid stored ZIP entry length.");
    entries.push({ name: decoder.decode(bytes.subarray(nameStart, nameStart + nameLength)), bytes: bytes.slice(dataStart, dataEnd) });
    offset = dataEnd;
  }
  return entries;
}

async function makePdf(name: string, pages: number): Promise<File> {
  const doc = await PDFDocument.create();
  for (let index = 0; index < pages; index += 1) doc.addPage([300 + index, 400]);
  return new File([await doc.save()], name, { type: "application/pdf" });
}

describe("PDF merge and split operations", () => {
  it("merges source PDFs in the supplied order and preserves their pages", async () => {
    const first = await makePdf("first.pdf", 2);
    const second = await makePdf("second.pdf", 1);
    const merged = await mergePdfFiles([first, second]);
    const parsed = await PDFDocument.load(await merged.arrayBuffer());
    expect(merged.type).toBe("application/pdf");
    expect(parsed.getPageCount()).toBe(3);
    expect(parsed.getPage(0).getWidth()).toBe(300);
    expect(parsed.getPage(1).getWidth()).toBe(301);
    expect(parsed.getPage(2).getWidth()).toBe(300);
  });

  it("splits requested ranges into separate PDFs inside a ZIP archive", async () => {
    const source = await makePdf("report.pdf", 5);
    const archive = await splitPdfFile(source, "1-2, 4-5");
    const bytes = new Uint8Array(await archive.arrayBuffer());
    expect(archive.type).toBe("application/zip");
    expect(new DataView(bytes.buffer).getUint32(0, true)).toBe(0x04034b50);
    const entries = readStoredZip(bytes);
    expect(entries.map(entry => entry.name)).toEqual(["report-pages-1-2.pdf", "report-pages-4-5.pdf"]);
    const first = await PDFDocument.load(entries[0].bytes);
    const second = await PDFDocument.load(entries[1].bytes);
    expect(first.getPageCount()).toBe(2);
    expect(second.getPageCount()).toBe(2);
  });

  it("parses single pages and ordered ranges", () => {
    expect(parsePdfPageRanges("1-3, 5, 8-9", 10)).toEqual([
      { start: 1, end: 3 }, { start: 5, end: 5 }, { start: 8, end: 9 }
    ]);
  });

  it("rejects malformed, out-of-bounds and overlapping page ranges", () => {
    expect(() => parsePdfPageRanges("", 5)).toThrow("Enter at least one");
    expect(() => parsePdfPageRanges("2-1", 5)).toThrow("between 1 and 5");
    expect(() => parsePdfPageRanges("1-6", 5)).toThrow("between 1 and 5");
    expect(() => parsePdfPageRanges("1-3, 3-4", 5)).toThrow("appears more than once");
    expect(() => parsePdfPageRanges("1;2", 5)).toThrow("Use page numbers");
  });

  it("rejects unsupported and oversized merge inputs", async () => {
    const image = new File(["not pdf"], "image.png", { type: "image/png" });
    await expect(mergePdfFiles([image, image])).rejects.toThrow("choose a PDF");
    await expect(mergePdfFiles([await makePdf("one.pdf", 1)])).rejects.toThrow("between 2 and 10");
  });

  it("rejects corrupted PDF bytes with a safe user-facing error", async () => {
    const corrupt = new File(["not a PDF"], "broken.pdf", { type: "application/pdf" });
    await expect(mergePdfFiles([corrupt, await makePdf("valid.pdf", 1)])).rejects.toThrow("damaged, unsupported or password-protected");
  });
});
