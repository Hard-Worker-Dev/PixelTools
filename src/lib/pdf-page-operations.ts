import { PDFDocument, degrees } from "pdf-lib";
import { createZipBlob } from "./zip";
import { loadPdfFile, safePdfBaseName, PDF_MAX_OUTPUT_BYTES, PDF_MAX_PAGES } from "./pdf-operations";

async function savePdf(document: PDFDocument, label: string): Promise<Blob> {
  const bytes = await document.save({ useObjectStreams: true });
  if (!bytes.length || bytes.length > PDF_MAX_OUTPUT_BYTES) throw new Error(label + " output exceeds the 150 MB safety limit.");
  return new Blob([bytes], { type: "application/pdf" });
}

export async function rotatePdfFile(file: File, quarterTurns: number): Promise<Blob> {
  if (!Number.isInteger(quarterTurns) || quarterTurns < -3 || quarterTurns > 3 || quarterTurns === 0) {
    throw new Error("Choose a rotation from 90° to 270° clockwise or counterclockwise.");
  }
  const source = await loadPdfFile(file);
  if (source.getPageCount() > PDF_MAX_PAGES) throw new Error("PDF Rotate supports up to 200 pages.");
  const delta = quarterTurns * 90;
  for (const page of source.getPages()) {
    const current = page.getRotation().angle;
    page.setRotation(degrees(((current + delta) % 360 + 360) % 360));
  }
  return savePdf(source, "Rotated PDF");
}

export async function reorderPdfPages(file: File, pageOrder: number[]): Promise<Blob> {
  const source = await loadPdfFile(file);
  const count = source.getPageCount();
  if (count > PDF_MAX_PAGES) throw new Error("PDF Page Reorder supports up to 200 pages.");
  if (pageOrder.length !== count || new Set(pageOrder).size !== count || pageOrder.some(page => !Number.isInteger(page) || page < 0 || page >= count)) {
    throw new Error("Page order must contain every page exactly once.");
  }
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, pageOrder);
  pages.forEach(page => output.addPage(page));
  return savePdf(output, "Reordered PDF");
}

export async function extractPdfPages(file: File, selectedPages: number[]): Promise<Blob> {
  const source = await loadPdfFile(file);
  const count = source.getPageCount();
  if (count > PDF_MAX_PAGES) throw new Error("PDF Page Extract supports up to 200 pages.");
  const pages = [...new Set(selectedPages)].sort((a,b)=>a-b);
  if (!pages.length || pages.some(page => !Number.isInteger(page) || page < 0 || page >= count)) {
    throw new Error("Select at least one valid page to extract.");
  }
  const base = safePdfBaseName(file.name);
  const entries: Array<{name:string;data:Uint8Array}> = [];
  for (const pageIndex of pages) {
    const output = await PDFDocument.create();
    const [page] = await output.copyPages(source, [pageIndex]);
    output.addPage(page);
    const bytes = await output.save({useObjectStreams:true});
    if (!bytes.length) throw new Error("A selected page produced an empty PDF.");
    entries.push({name:base+"-page-"+(pageIndex+1)+".pdf",data:bytes});
  }
  const total = entries.reduce((sum,entry)=>sum+entry.data.byteLength,0);
  if (total > PDF_MAX_OUTPUT_BYTES) throw new Error("Extracted PDFs exceed the 150 MB safety limit.");
  const archive = await createZipBlob(entries);
  if (archive.size > PDF_MAX_OUTPUT_BYTES) throw new Error("ZIP output exceeds the 150 MB safety limit.");
  return archive;
}
