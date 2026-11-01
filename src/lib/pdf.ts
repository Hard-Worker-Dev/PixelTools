export interface PdfImagePage {
  bytes: Uint8Array;
  width: number;
  height: number;
}

const encoder = new TextEncoder();

function ascii(value: string): Uint8Array { return encoder.encode(value); }

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}

function pdfNumber(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function validatePage(page: PdfImagePage): void {
  if (!page.bytes.length || !Number.isInteger(page.width) || !Number.isInteger(page.height) || page.width < 1 || page.height < 1) {
    throw new Error("Each PDF page needs valid JPEG bytes and positive integer dimensions.");
  }
  if (page.width > 12000 || page.height > 12000 || page.width * page.height > 60000000) {
    throw new Error("An image exceeds the 12,000 px per-side or 60 megapixel safety limit.");
  }
}

export function buildPdfFromJpegs(pages: PdfImagePage[]): Blob {
  if (pages.length < 1 || pages.length > 20) throw new Error("Choose between 1 and 20 images to create a PDF.");
  pages.forEach(validatePage);
  const pageIds = pages.map((_, index) => 3 + index);
  const imageIds = pages.map((_, index) => 3 + pages.length + index);
  const contentIds = pages.map((_, index) => 3 + pages.length * 2 + index);
  const objectCount = 2 + pages.length * 3;
  const objects = new Map<number, Uint8Array>();

  objects.set(1, ascii("<< /Type /Catalog /Pages 2 0 R >>"));
  objects.set(2, ascii("<< /Type /Pages /Kids [" + pageIds.map(id => id + " 0 R").join(" ") + "] /Count " + pages.length + " >>"));

  pages.forEach((page, index) => {
    const landscape = page.width > page.height;
    const pageWidth = landscape ? 841.89 : 595.28;
    const pageHeight = landscape ? 595.28 : 841.89;
    const margin = 24;
    const scale = Math.min((pageWidth - margin * 2) / page.width, (pageHeight - margin * 2) / page.height);
    const drawWidth = page.width * scale;
    const drawHeight = page.height * scale;
    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;
    const content = "q\n" + pdfNumber(drawWidth) + " 0 0 " + pdfNumber(drawHeight) + " " + pdfNumber(x) + " " + pdfNumber(y) + " cm\n/Im0 Do\nQ\n";
    const contentBytes = ascii(content);
    const pageObject = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + pdfNumber(pageWidth) + " " + pdfNumber(pageHeight) + "] /Resources << /XObject << /Im0 " + imageIds[index] + " 0 R >> >> /Contents " + contentIds[index] + " 0 R >>";
    objects.set(pageIds[index], ascii(pageObject));
    objects.set(imageIds[index], concat([
      ascii("<< /Type /XObject /Subtype /Image /Width " + page.width + " /Height " + page.height + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + page.bytes.length + " >>\nstream\n"),
      page.bytes,
      ascii("\nendstream")
    ]));
    objects.set(contentIds[index], concat([
      ascii("<< /Length " + contentBytes.length + " >>\nstream\n"),
      contentBytes,
      ascii("endstream")
    ]));
  });

  const header = new Uint8Array([0x25,0x50,0x44,0x46,0x2d,0x31,0x2e,0x34,0x0a,0x25,0xe2,0xe3,0xcf,0xd3,0x0a]);
  const parts: Uint8Array[] = [header];
  const offsets = new Array<number>(objectCount + 1).fill(0);
  let cursor = header.length;
  for (let id = 1; id <= objectCount; id += 1) {
    const body = objects.get(id);
    if (!body) throw new Error("Could not assemble the PDF page tree.");
    const object = concat([ascii(id + " 0 obj\n"), body, ascii("\nendobj\n")]);
    offsets[id] = cursor;
    parts.push(object);
    cursor += object.length;
  }

  const xrefOffset = cursor;
  let xref = "xref\n0 " + (objectCount + 1) + "\n0000000000 65535 f \n";
  for (let id = 1; id <= objectCount; id += 1) xref += String(offsets[id]).padStart(10, "0") + " 00000 n \n";
  xref += "trailer\n<< /Size " + (objectCount + 1) + " /Root 1 0 R >>\nstartxref\n" + xrefOffset + "\n%%EOF\n";
  parts.push(ascii(xref));
  return new Blob(parts, { type: "application/pdf" });
}

export async function createPdfFromImages(
  files: File[],
  quality = 0.9,
  onProgress?: (completed: number, total: number) => void
): Promise<Blob> {
  if (files.length < 1 || files.length > 20) throw new Error("Choose between 1 and 20 images to create a PDF.");
  const supported = ["image/jpeg", "image/png", "image/webp"];
  let totalBytes = 0;
  for (const file of files) {
    if (!supported.includes(file.type)) throw new Error(file.name + ": choose a JPG, PNG or WebP image.");
    if (file.size > 25 * 1024 * 1024) throw new Error(file.name + ": exceeds the 25 MB per-file limit.");
    totalBytes += file.size;
  }
  if (totalBytes > 100 * 1024 * 1024) throw new Error("The combined source images cannot exceed 100 MB.");

  const pages: PdfImagePage[] = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const bitmap = await createImageBitmap(file);
    try {
      if (bitmap.width > 12000 || bitmap.height > 12000 || bitmap.width * bitmap.height > 60000000) {
        throw new Error(file.name + ": image exceeds the 12,000 px per-side or 60 megapixel safety limit.");
      }
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not start image processing.");
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0);
      const jpeg = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error(file.name + ": could not encode this image as JPEG.")), "image/jpeg", Math.max(0.5, Math.min(1, quality)));
      });
      pages.push({ bytes: new Uint8Array(await jpeg.arrayBuffer()), width: bitmap.width, height: bitmap.height });
    } finally {
      bitmap.close();
    }
    onProgress?.(index + 1, files.length);
  }
  return buildPdfFromJpegs(pages);
}
