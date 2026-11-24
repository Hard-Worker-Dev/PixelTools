export interface ZipEntry {
  name: string;
  data: Blob | Uint8Array;
}

const encoder = new TextEncoder();
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let value = n;
  for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
  CRC_TABLE[n] = value >>> 0;
}

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function safeEntryName(name: string): string {
  const normalized = name.replace(/\\/g, "/").split("/").pop() ?? "";
  const safe = normalized.replace(/[\u0000-\u001f<>:"|?*]/g, "_").replace(/^\.+$/, "file").trim();
  if (!safe || safe.length > 180) throw new Error("ZIP entries need a valid filename of 1–180 characters.");
  return safe;
}

function dosDateTime(date: Date): { date: number; time: number } {
  const year = Math.max(1980, date.getFullYear());
  return {
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
  };
}

function write16(view: DataView, offset: number, value: number): void { view.setUint16(offset, value, true); }
function write32(view: DataView, offset: number, value: number): void { view.setUint32(offset, value >>> 0, true); }

export async function createZipBlob(entries: ZipEntry[]): Promise<Blob> {
  if (entries.length < 1) throw new Error("Add at least one file before creating a ZIP archive.");
  if (entries.length > 65535) throw new Error("A ZIP archive cannot contain more than 65,535 files.");
  const names = new Set<string>();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;
  const timestamp = dosDateTime(new Date());

  for (const entry of entries) {
    const name = safeEntryName(entry.name);
    if (names.has(name.toLowerCase())) throw new Error("ZIP filenames must be unique: " + name);
    names.add(name.toLowerCase());
    const nameBytes = encoder.encode(name);
    const data = entry.data instanceof Blob ? new Uint8Array(await entry.data.arrayBuffer()) : entry.data;
    if (data.byteLength > 0xffffffff) throw new Error("A ZIP entry exceeds the 4 GB ZIP32 limit.");
    const checksum = crc32(data);

    const local = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(local.buffer);
    write32(localView, 0, 0x04034b50);
    write16(localView, 4, 20);
    write16(localView, 6, 0x0800);
    write16(localView, 8, 0);
    write16(localView, 10, timestamp.time);
    write16(localView, 12, timestamp.date);
    write32(localView, 14, checksum);
    write32(localView, 18, data.byteLength);
    write32(localView, 22, data.byteLength);
    write16(localView, 26, nameBytes.length);
    write16(localView, 28, 0);
    local.set(nameBytes, 30);
    localParts.push(local, data);

    const central = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(central.buffer);
    write32(centralView, 0, 0x02014b50);
    write16(centralView, 4, 20);
    write16(centralView, 6, 20);
    write16(centralView, 8, 0x0800);
    write16(centralView, 10, 0);
    write16(centralView, 12, timestamp.time);
    write16(centralView, 14, timestamp.date);
    write32(centralView, 16, checksum);
    write32(centralView, 20, data.byteLength);
    write32(centralView, 24, data.byteLength);
    write16(centralView, 28, nameBytes.length);
    write16(centralView, 30, 0);
    write16(centralView, 32, 0);
    write16(centralView, 34, 0);
    write16(centralView, 36, 0);
    write32(centralView, 38, 0);
    write32(centralView, 42, localOffset);
    central.set(nameBytes, 46);
    centralParts.push(central);
    localOffset += local.length + data.byteLength;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  write32(endView, 0, 0x06054b50);
  write16(endView, 4, 0);
  write16(endView, 6, 0);
  write16(endView, 8, entries.length);
  write16(endView, 10, entries.length);
  write32(endView, 12, centralSize);
  write32(endView, 16, localOffset);
  write16(endView, 20, 0);

  const totalSize = localOffset + centralSize + end.length;
  if (totalSize > 0xffffffff) throw new Error("The ZIP archive exceeds the 4 GB ZIP32 limit.");
  return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
}
