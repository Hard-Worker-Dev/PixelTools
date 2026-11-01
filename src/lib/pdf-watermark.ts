import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { loadPdfFile, PDF_MAX_OUTPUT_BYTES, PDF_MAX_PAGES } from "./pdf-operations";

export type PdfWatermarkOptions = {
  text: string;
  color: string;
  opacity: number;
  fontSize: number;
  rotation: number;
  position: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
};

export async function watermarkPdfFile(file: File, options: PdfWatermarkOptions): Promise<Blob> {
  const text = options.text.trim();
  if (!text) throw new Error("Enter watermark text before processing.");
  if (text.length > 120) throw new Error("Watermark text must be 120 characters or fewer.");
  if (!/^[\x20-\x7E]+$/.test(text)) throw new Error("Use basic English letters, numbers and punctuation for this watermark.");
  if (!/^#[0-9a-f]{6}$/i.test(options.color)) throw new Error("Choose a valid six-digit HEX color.");
  if (!Number.isFinite(options.opacity) || options.opacity < 0.05 || options.opacity > 1) throw new Error("Opacity must be between 5% and 100%.");
  if (!Number.isInteger(options.fontSize) || options.fontSize < 8 || options.fontSize > 96) throw new Error("Font size must be between 8 and 96 points.");
  if (!Number.isInteger(options.rotation) || options.rotation < -90 || options.rotation > 90) throw new Error("Rotation must be between -90° and 90°.");

  const pdf = await loadPdfFile(file);
  if (pdf.getPageCount() > PDF_MAX_PAGES) throw new Error("PDF Watermark supports up to 200 pages.");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const hex = options.color.slice(1);
  const tint = rgb(parseInt(hex.slice(0,2),16)/255, parseInt(hex.slice(2,4),16)/255, parseInt(hex.slice(4,6),16)/255);

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const measuredWidth = font.widthOfTextAtSize(text, options.fontSize);
    const margin = 24;
    let x = Math.max(margin, (width - measuredWidth) / 2);
    let y = Math.max(margin, (height - options.fontSize) / 2);
    if (options.position === "top-left") { x = margin; y = height - margin - options.fontSize; }
    if (options.position === "top-right") { x = Math.max(margin, width - margin - measuredWidth); y = height - margin - options.fontSize; }
    if (options.position === "bottom-left") { x = margin; y = margin; }
    if (options.position === "bottom-right") { x = Math.max(margin, width - margin - measuredWidth); y = margin; }
    if (measuredWidth > width - margin * 2) {
      const scale = (width - margin * 2) / measuredWidth;
      const fittedSize = Math.max(8, options.fontSize * scale);
      const fittedWidth = font.widthOfTextAtSize(text, fittedSize);
      x = options.position.endsWith("right") ? width - margin - fittedWidth : options.position === "center" ? (width - fittedWidth) / 2 : margin;
      page.drawText(text, { x, y, font, size: fittedSize, color: tint, opacity: options.opacity, rotate: degrees(options.rotation) });
    } else {
      page.drawText(text, { x, y, font, size: options.fontSize, color: tint, opacity: options.opacity, rotate: degrees(options.rotation) });
    }
  }

  const bytes = await pdf.save({ useObjectStreams: true });
  if (!bytes.length || bytes.length > PDF_MAX_OUTPUT_BYTES) throw new Error("Watermarked PDF output exceeds the 150 MB safety limit.");
  return new Blob([bytes], { type: "application/pdf" });
}
