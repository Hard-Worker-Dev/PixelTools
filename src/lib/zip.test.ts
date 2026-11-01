import { describe, expect, it } from "vitest";
import { createZipBlob, crc32 } from "./zip";

describe("ZIP archive utilities", () => {
  it("calculates the standard CRC-32 checksum", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("writes a readable ZIP structure with UTF-8 names and payloads", async () => {
    const archive = await createZipBlob([
      { name: "photo one.webp", data: new TextEncoder().encode("first image") },
      { name: "café.png", data: new TextEncoder().encode("second image") }
    ]);
    const bytes = new Uint8Array(await archive.arrayBuffer());
    const view = new DataView(bytes.buffer);
    expect(archive.type).toBe("application/zip");
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(new TextDecoder().decode(bytes)).toContain("photo one.webp");
    expect(new TextDecoder().decode(bytes)).toContain("café.png");
    expect(view.getUint32(bytes.length - 22, true)).toBe(0x06054b50);
    expect(view.getUint16(bytes.length - 12, true)).toBe(2);
  });

  it("rejects empty archives and duplicate filenames", async () => {
    await expect(createZipBlob([])).rejects.toThrow("Add at least one file");
    await expect(createZipBlob([
      { name: "same.png", data: new Uint8Array([1]) },
      { name: "SAME.PNG", data: new Uint8Array([2]) }
    ])).rejects.toThrow("filenames must be unique");
  });

  it("strips directory traversal from entry names", async () => {
    const archive = await createZipBlob([{ name: "../../safe.png", data: new Uint8Array([1]) }]);
    expect(new TextDecoder().decode(new Uint8Array(await archive.arrayBuffer()))).toContain("safe.png");
    expect(new TextDecoder().decode(new Uint8Array(await archive.arrayBuffer()))).not.toContain("../");
  });
});
