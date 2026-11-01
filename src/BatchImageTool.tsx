import { useRef, useState } from "react";
import { ArrowDownToLine, Check, FileImage, LockKeyhole, Plus, RefreshCw, ShieldCheck, Trash2, UploadCloud, X } from "lucide-react";
import { formatBytes, outputName, readImageDimensions, renderImage, type ImageFormat } from "./lib/image";
import { createZipBlob } from "./lib/zip";

const MAX_FILES = 30;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
const MAX_ARCHIVE_BYTES = 150 * 1024 * 1024;
const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface CompletedFile { source: File; output: Blob; outputName: string; }
interface FailedFile { name: string; reason: string; }

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export default function BatchImageTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<ImageFormat>("image/webp");
  const [quality, setQuality] = useState(82);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState<CompletedFile[]>([]);
  const [failed, setFailed] = useState<FailedFile[]>([]);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRequested = useRef(false);

  const addFiles = (picked: FileList | File[]) => {
    const incoming = Array.from(picked);
    const next = [...files];
    const issues: string[] = [];
    for (const file of incoming) {
      if (!SUPPORTED_TYPES.includes(file.type)) { issues.push(file.name + ": choose JPG, PNG or WebP."); continue; }
      if (file.size > MAX_FILE_BYTES) { issues.push(file.name + ": exceeds the 25 MB per-file limit."); continue; }
      if (next.some(item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) continue;
      if (next.length >= MAX_FILES) { issues.push("A maximum of 30 images can be processed at once."); break; }
      const total = next.reduce((sum, item) => sum + item.size, 0) + file.size;
      if (total > MAX_TOTAL_BYTES) { issues.push("The combined source files cannot exceed 100 MB."); continue; }
      next.push(file);
    }
    setFiles(next);
    setCompleted([]);
    setFailed([]);
    setProgress(0);
    setError(issues.join(" "));
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles(current => current.filter((_, itemIndex) => itemIndex !== index));
    setCompleted([]);
    setFailed([]);
    setProgress(0);
  };

  const processAll = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setError("");
    setCompleted([]);
    setFailed([]);
    setProgress(0);
    cancelRequested.current = false;
    const success: CompletedFile[] = [];
    const failures: FailedFile[] = [];
    for (let index = 0; index < files.length; index += 1) {
      if (cancelRequested.current) break;
      const file = files[index];
      try {
        const dimensions = await readImageDimensions(file);
        if (dimensions.width > 12000 || dimensions.height > 12000 || dimensions.width * dimensions.height > 60000000) {
          throw new Error("Image exceeds the 12,000 px per-side or 60 megapixel safety limit.");
        }
        const output = await renderImage(file, { format, quality: quality / 100, backgroundColor: "#FFFFFF" });
        success.push({ source: file, output, outputName: outputName(file.name, format) });
      } catch (reason) {
        failures.push({ name: file.name, reason: reason instanceof Error ? reason.message : "Could not process this image." });
      }
      setProgress(Math.round(((index + 1) / files.length) * 100));
      setCompleted([...success]);
      setFailed([...failures]);
    }
    setBusy(false);
    if (cancelRequested.current) setError("Processing stopped. Completed images remain available to download.");
    else if (success.length === 0) setError("No images could be processed. Check the file types and try again.");
  };

  const downloadZip = async () => {
    if (!completed.length) return;
    try {
      const totalOutputBytes = completed.reduce((sum, item) => sum + item.output.size, 0);
      if (totalOutputBytes > MAX_ARCHIVE_BYTES) throw new Error("The combined output is larger than 150 MB. Download the completed files individually to avoid high browser memory use.");
      const counts = new Map<string, number>();
      const entries = completed.map(item => {
        const count = (counts.get(item.outputName.toLowerCase()) ?? 0) + 1;
        counts.set(item.outputName.toLowerCase(), count);
        const dot = item.outputName.lastIndexOf(".");
        const uniqueName = count === 1 ? item.outputName : item.outputName.slice(0, dot) + "-" + count + item.outputName.slice(dot);
        return { name: uniqueName, data: item.output };
      });
      const archive = await createZipBlob(entries);
      triggerDownload(archive, "pixeltools-batch-export.zip");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create the ZIP archive.");
    }
  };

  const clearAll = () => {
    if (busy) return;
    setFiles([]);
    setCompleted([]);
    setFailed([]);
    setProgress(0);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return <div className="batch-workspace">
    <div className="batch-intro"><span className="batch-intro-icon"><FileImage size={20}/></span><div><b>Process a whole image set in one go</b><p>Resize-free format conversion and optimization, with a ZIP download at the end. Files stay on this device.</p></div></div>
    <div className="batch-toolbar"><div><label htmlFor="batch-format">Output format</label><select id="batch-format" className="text-input" value={format} disabled={busy} onChange={event => { setFormat(event.target.value as ImageFormat); setCompleted([]); }}><option value="image/webp">WebP · smaller files</option><option value="image/jpeg">JPG · broad compatibility</option><option value="image/png">PNG · lossless</option></select></div><div><label htmlFor="batch-quality">Quality <b>{format === "image/png" ? "Lossless" : quality + "%"}</b></label><input id="batch-quality" type="range" min="20" max="100" value={quality} disabled={busy || format === "image/png"} onChange={event => { setQuality(Number(event.target.value)); setCompleted([]); }}/></div></div>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={event => { if (event.target.files) addFiles(event.target.files); }}/>
    {files.length === 0 ? <button type="button" className="batch-dropzone" onClick={() => inputRef.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); addFiles(event.dataTransfer.files); }}><UploadCloud size={28}/><b>Drop images here or browse</b><span>JPG, PNG, WebP · Up to 30 files · 25 MB each · 100 MB total</span></button> : <div className="batch-file-list"><div className="batch-list-head"><b>{files.length} image{files.length === 1 ? "" : "s"} selected</b><div className="batch-list-actions"><button type="button" className="change-file" disabled={busy || files.length >= MAX_FILES} onClick={() => inputRef.current?.click()}><Plus size={13}/> Add more</button><button type="button" className="change-file" disabled={busy} onClick={clearAll}>Clear all</button></div></div>{files.map((file, index) => <div className="batch-file-row" key={file.name + "-" + file.lastModified + "-" + index}><span className="batch-file-icon"><FileImage size={17}/></span><div><b>{file.name}</b><small>{formatBytes(file.size)}</small></div>{completed.some(item => item.source === file) && <Check className="batch-success" size={17}/>}<button type="button" className="batch-remove" aria-label={"Remove " + file.name} disabled={busy} onClick={() => removeFile(index)}><X size={15}/></button></div>)}</div>}
    {files.length > 0 && <div className="batch-actions"><button type="button" className="primary-btn process-btn" disabled={busy} onClick={processAll}>{busy ? "Processing " + progress + "%" : completed.length ? "Process again" : "Process " + files.length + " images"}</button><span>{formatBytes(files.reduce((sum, file) => sum + file.size, 0))} source data</span>{busy && <button type="button" className="secondary-btn" onClick={() => { cancelRequested.current = true; }}>Stop</button>}</div>}
    {busy && <div className="batch-progress" role="status" aria-live="polite"><div><span>Processing images locally</span><b>{progress}%</b></div><div className="batch-progress-track"><i style={{ width: progress + "%" }}/></div></div>}
    {error && <p className="error-msg" role="alert">{error}</p>}
    {(completed.length > 0 || failed.length > 0) && <section className="batch-results" aria-live="polite"><div className="batch-result-title"><ShieldCheck size={18}/><b>Batch results</b><span>{completed.length} ready · {failed.length} failed</span></div>{completed.length > 0 && <><p className="batch-result-copy">{completed.length} image{completed.length === 1 ? "" : "s"} converted successfully. Download individual files or collect them into one ZIP archive.</p><div className="batch-output-list">{completed.map((item, index) => <div key={item.source.name + "-" + index}><span><Check size={14}/>{item.outputName}</span><small>{formatBytes(item.output.size)}</small><button type="button" onClick={() => triggerDownload(item.output, item.outputName)} aria-label={"Download " + item.outputName}><ArrowDownToLine size={15}/></button></div>)}</div><button type="button" className="download-btn batch-download" onClick={downloadZip}><ArrowDownToLine size={16}/> Download all as ZIP</button></>}{failed.map((item, index) => <p className="batch-failure" key={item.name + "-" + index}><b>{item.name}:</b> {item.reason}</p>)}</section>}
    <div className="batch-footnote"><LockKeyhole size={14}/> All image decoding, conversion and ZIP packaging happen locally in this browser.</div>
  </div>;
}
