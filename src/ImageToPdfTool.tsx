import { useRef, useState } from "react";
import { ArrowDownToLine, ArrowDown, ArrowUp, Check, FileImage, LockKeyhole, Plus, ShieldCheck, Trash2, UploadCloud, X } from "lucide-react";
import { formatBytes } from "./lib/image";
import { createPdfFromImages } from "./lib/pdf";

const MAX_FILES = 20;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function downloadPdf(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "pixeltools-images.pdf";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export default function ImageToPdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(90);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (picked: FileList | File[]) => {
    const next = [...files];
    const issues: string[] = [];
    for (const file of Array.from(picked)) {
      if (!SUPPORTED_TYPES.includes(file.type)) { issues.push(file.name + ": choose JPG, PNG or WebP."); continue; }
      if (file.size > MAX_FILE_BYTES) { issues.push(file.name + ": exceeds the 25 MB per-file limit."); continue; }
      if (next.some(item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) continue;
      if (next.length >= MAX_FILES) { issues.push("A maximum of 20 images can be added to one PDF."); break; }
      if (next.reduce((sum, item) => sum + item.size, 0) + file.size > MAX_TOTAL_BYTES) { issues.push("The combined source images cannot exceed 100 MB."); continue; }
      next.push(file);
    }
    setFiles(next);
    setResult(null);
    setProgress(0);
    setError(issues.join(" "));
    if (inputRef.current) inputRef.current.value = "";
  };

  const moveFile = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= files.length) return;
    setFiles(current => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setResult(null);
  };

  const removeFile = (index: number) => {
    setFiles(current => current.filter((_, itemIndex) => itemIndex !== index));
    setResult(null);
    setProgress(0);
  };

  const createPdf = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setError("");
    setResult(null);
    setProgress(0);
    try {
      const pdf = await createPdfFromImages(files, quality / 100, completed => {
        setProgress(Math.round((completed / files.length) * 100));
      });
      if (pdf.type !== "application/pdf" || pdf.size < 100) throw new Error("The generated PDF did not pass the basic output check.");
      setResult(pdf);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create the PDF. Try different images or a smaller batch.");
    } finally {
      setBusy(false);
    }
  };

  const clearAll = () => {
    if (busy) return;
    setFiles([]);
    setResult(null);
    setProgress(0);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return <div className="pdf-workspace">
    <div className="pdf-intro"><span><FileImage size={21}/></span><div><b>Turn images into a clean, multi-page PDF</b><p>Add JPG, PNG or WebP images, arrange their page order, then export one PDF. Everything is processed on your device.</p></div></div>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={event => { if (event.target.files) addFiles(event.target.files); }}/>
    {files.length === 0 ? <button type="button" className="pdf-dropzone" onClick={() => inputRef.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); addFiles(event.dataTransfer.files); }}><UploadCloud size={29}/><b>Drop images here or browse</b><span>JPG, PNG, WebP · Up to 20 pages · 25 MB each · 100 MB total</span></button> : <div className="pdf-file-list"><div className="pdf-list-head"><b>{files.length} page{files.length === 1 ? "" : "s"} · Drag order using the arrow controls</b><div><button type="button" className="change-file" disabled={busy || files.length >= MAX_FILES} onClick={() => inputRef.current?.click()}><Plus size={13}/> Add images</button><button type="button" className="change-file" disabled={busy} onClick={clearAll}>Clear all</button></div></div>{files.map((file, index) => <div className="pdf-file-row" key={file.name + "-" + file.lastModified + "-" + index}><span className="pdf-page-number">{index + 1}</span><span className="pdf-file-icon"><FileImage size={17}/></span><div><b>{file.name}</b><small>{formatBytes(file.size)} · {file.type.replace("image/","").toUpperCase()}</small></div><div className="pdf-reorder"><button type="button" aria-label={"Move " + file.name + " up"} disabled={busy || index === 0} onClick={() => moveFile(index, -1)}><ArrowUp size={14}/></button><button type="button" aria-label={"Move " + file.name + " down"} disabled={busy || index === files.length - 1} onClick={() => moveFile(index, 1)}><ArrowDown size={14}/></button></div><button type="button" className="pdf-remove" aria-label={"Remove " + file.name} disabled={busy} onClick={() => removeFile(index)}><X size={15}/></button></div>)}</div>}
    <div className="pdf-quality"><label htmlFor="pdf-quality">Image quality <b>{quality}%</b></label><input id="pdf-quality" type="range" min="50" max="100" value={quality} disabled={busy} onChange={event => { setQuality(Number(event.target.value)); setResult(null); }}/><p>Higher quality keeps photos sharper but creates a larger PDF. Each page automatically uses A4 portrait or landscape to fit its image with margins.</p></div>
    {files.length > 0 && <button type="button" className="primary-btn process-btn" disabled={busy} onClick={createPdf}>{busy ? "Creating PDF · " + progress + "%" : result ? "Create PDF again" : "Create PDF · " + files.length + " page" + (files.length === 1 ? "" : "s")}</button>}
    {busy && <div className="pdf-progress" role="status" aria-live="polite"><div><span>Preparing PDF pages locally</span><b>{progress}%</b></div><div><i style={{ width: progress + "%" }}/></div></div>}
    {error && <p className="error-msg" role="alert">{error}</p>}
    {result && <section className="pdf-result" role="status" aria-live="polite"><div><Check size={18}/><b>Your PDF is ready</b><span>{files.length} pages · {formatBytes(result.size)}</span></div><p>All pages are in the order shown above. Your source images remain unchanged.</p><button type="button" className="download-btn" onClick={() => downloadPdf(result)}><ArrowDownToLine size={16}/> Download PDF</button></section>}
    <div className="pdf-privacy"><LockKeyhole size={14}/> Images are converted locally in your browser. No uploads or account required.</div>
  </div>;
}
