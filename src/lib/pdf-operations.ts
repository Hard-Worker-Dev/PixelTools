import { PDFDocument } from "pdf-lib";
import { createZipBlob } from "./zip";

export const PDF_MAX_FILE_BYTES = 25 * 1024 * 1024;
export const PDF_MAX_TOTAL_BYTES = 100 * 1024 * 1024;
export const PDF_MAX_PAGES = 200;
export const PDF_MAX_OUTPUT_BYTES = 150 * 1024 * 1024;

export function safePdfBaseName(name: string): string {
  return name.replace(/\.pdf$/i, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "document";
}

export async function loadPdfFile(file: File): Promise<PDFDocument> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) throw new Error(file.name + ": choose a PDF file.");
  if (!file.size || file.size > PDF_MAX_FILE_BYTES) throw new Error(file.name + ": each PDF must be between 1 byte and 25 MB.");
  try {
    const pdf = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
    if (pdf.getPageCount() < 1) throw new Error("The PDF has no pages.");
    return pdf;
  } catch (error) {
    if (error instanceof Error && /no pages/i.test(error.message)) throw error;
    if (error instanceof Error && /encrypted|password/i.test(error.message)) throw new Error(file.name + ": password-protected PDFs are not supported.");
    throw new Error(file.name + ": this PDF is damaged, unsupported or password-protected.");
  }
}

export async function mergePdfFiles(files: File[]): Promise<Blob> {
  if (files.length < 2 || files.length > 10) throw new Error("Choose between 2 and 10 PDF files to merge.");
  if (files.reduce((sum,file)=>sum+file.size,0)>PDF_MAX_TOTAL_BYTES) throw new Error("Combined PDF input cannot exceed 100 MB.");
  const merged = await PDFDocument.create();
  let totalPages = 0;
  for (const file of files) {
    const source = await loadPdfFile(file);
    totalPages += source.getPageCount();
    if (totalPages > PDF_MAX_PAGES) throw new Error("Merged documents are limited to 200 pages.");
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach(page => merged.addPage(page));
  }
  const bytes = await merged.save({ useObjectStreams: true });
  if (!bytes.length || bytes.length > PDF_MAX_OUTPUT_BYTES) throw new Error("The merged PDF is empty or exceeds the 150 MB output limit.");
  return new Blob([bytes], { type: "application/pdf" });
}

export function parsePdfPageRanges(value: string, pageCount: number): Array<{start:number;end:number}> {
  const parts = value.split(",").map(part=>part.trim()).filter(Boolean);
  if (!parts.length) throw new Error("Enter at least one page number or range, such as 1-3, 5.");
  const ranges: Array<{start:number;end:number}> = [];
  const used = new Set<number>();
  for (const part of parts) {
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part);
    if (!match) throw new Error("Use page numbers and ranges separated by commas, for example 1-3, 5, 8-10.");
    const start = Number(match[1]), end = Number(match[2] ?? match[1]);
    if (start < 1 || end < start || end > pageCount) throw new Error("Page ranges must be between 1 and " + pageCount + ".");
    for (let page=start;page<=end;page++) {
      if (used.has(page)) throw new Error("Page " + page + " appears more than once. Remove overlapping ranges.");
      used.add(page);
    }
    ranges.push({start,end});
  }
  return ranges;
}

export async function splitPdfFile(file: File, rangeText: string): Promise<Blob> {
  const source = await loadPdfFile(file);
  const pageCount = source.getPageCount();
  if (pageCount > PDF_MAX_PAGES) throw new Error("PDF Split supports up to 200 pages per file.");
  const ranges = parsePdfPageRanges(rangeText, pageCount);
  const entries: Array<{name:string;data:Uint8Array}> = [];
  for (const {start,end} of ranges) {
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, Array.from({length:end-start+1},(_,index)=>start-1+index));
    pages.forEach(page=>output.addPage(page));
    const bytes = await output.save({useObjectStreams:true});
    if (!bytes.length) throw new Error("A selected page range produced an empty PDF.");
    entries.push({name:safePdfBaseName(file.name)+"-pages-"+start+(end===start?"":"-"+end)+".pdf",data:bytes});
  }
  const total = entries.reduce((sum,item)=>sum+item.data.byteLength,0);
  if (total > PDF_MAX_OUTPUT_BYTES) throw new Error("Split output exceeds the 150 MB safety limit.");
  const archive = await createZipBlob(entries);
  if (archive.size > PDF_MAX_OUTPUT_BYTES) throw new Error("ZIP output exceeds the 150 MB safety limit.");
  return archive;
}
