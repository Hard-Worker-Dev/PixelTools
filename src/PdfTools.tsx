import { useRef, useState } from "react";
import { ArrowDownToLine, Check, FileText, LockKeyhole, Plus, UploadCloud, X } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { createZipBlob } from "./lib/zip";
import { formatBytes } from "./lib/image";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
const MAX_PAGES = 200;
const MAX_OUTPUT_BYTES = 150 * 1024 * 1024;

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function safeBaseName(name: string) {
  return name.replace(/\.pdf$/i, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "document";
}
async function loadPdf(file: File) {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) throw new Error(file.name + ": choose a PDF file.");
  if (!file.size || file.size > MAX_FILE_BYTES) throw new Error(file.name + ": each PDF must be between 1 byte and 25 MB.");
  try {
    const pdf = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
    if (pdf.getPageCount() < 1) throw new Error("The PDF has no pages.");
    return pdf;
  } catch (error) {
    if (error instanceof Error && /encrypted|password/i.test(error.message)) throw new Error(file.name + ": password-protected PDFs are not supported.");
    if (error instanceof Error && /no pages/i.test(error.message)) throw error;
    throw new Error(file.name + ": this PDF is damaged, unsupported or password-protected.");
  }
}

export function PdfMergeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const addFiles = (picked: FileList | File[]) => {
    const next = [...files]; const issues: string[] = [];
    for (const file of Array.from(picked)) {
      if (next.some(item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) continue;
      if (next.length >= 10) { issues.push("A maximum of 10 PDFs can be merged at once."); break; }
      if (!file.size || file.size > MAX_FILE_BYTES) { issues.push(file.name + ": each PDF must be 25 MB or smaller."); continue; }
      if (next.reduce((sum, item) => sum + item.size, 0) + file.size > MAX_TOTAL_BYTES) { issues.push("Combined PDF input cannot exceed 100 MB."); continue; }
      next.push(file);
    }
    setFiles(next); setResult(null); setError(issues.join(" "));
    if (input.current) input.current.value = "";
  };
  const move = (index: number, direction: -1 | 1) => setFiles(current => {
    const target = index + direction; if (target < 0 || target >= current.length) return current;
    const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next;
  });
  const merge = async () => {
    if (files.length < 2 || busy) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const merged = await PDFDocument.create();
      let totalPages = 0;
      for (const file of files) {
        const source = await loadPdf(file);
        totalPages += source.getPageCount();
        if (totalPages > MAX_PAGES) throw new Error("Merged documents are limited to 200 pages.");
        const pages = await merged.copyPages(source, source.getPageIndices());
        pages.forEach(page => merged.addPage(page));
      }
      const bytes = await merged.save({ useObjectStreams: true });
      if (!bytes.length || bytes.length > MAX_OUTPUT_BYTES) throw new Error("The merged PDF is empty or exceeds the 150 MB output limit.");
      setResult(new Blob([bytes], { type: "application/pdf" }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not merge these PDF files."); }
    finally { setBusy(false); }
  };
  return <div className="pdf-workspace">
    <div className="pdf-intro"><span><FileText size={21}/></span><div><b>Combine documents in your chosen order</b><p>Add up to 10 PDF files, arrange them, and merge them locally in your browser. Files are never uploaded.</p></div></div>
    <input ref={input} hidden type="file" accept="application/pdf,.pdf" multiple onChange={e => e.target.files && addFiles(e.target.files)}/>
    {files.length === 0 ? <button type="button" className="pdf-dropzone" onClick={() => input.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}><UploadCloud size={29}/><b>Drop PDF files here or browse</b><span>PDF only · Up to 10 files · 25 MB each · 100 MB total</span></button> : <div className="pdf-file-list">
      <div className="pdf-list-head"><b>{files.length} PDF files · First file becomes the first section</b><div><button className="change-file" type="button" disabled={busy || files.length >= 10} onClick={() => input.current?.click()}><Plus size={13}/> Add PDFs</button><button className="change-file" type="button" disabled={busy} onClick={() => {setFiles([]);setResult(null);setError("");}}>Clear all</button></div></div>
      {files.map((file,index)=><div className="pdf-file-row" key={file.name+"-"+file.lastModified}><span className="pdf-page-number">{index+1}</span><span className="pdf-file-icon"><FileText size={17}/></span><div><b>{file.name}</b><small>{formatBytes(file.size)}</small></div><div className="pdf-reorder"><button type="button" aria-label={"Move "+file.name+" up"} disabled={busy||index===0} onClick={()=>move(index,-1)}>↑</button><button type="button" aria-label={"Move "+file.name+" down"} disabled={busy||index===files.length-1} onClick={()=>move(index,1)}>↓</button></div><button type="button" className="pdf-remove" aria-label={"Remove "+file.name} disabled={busy} onClick={()=>{setFiles(current=>current.filter((_,i)=>i!==index));setResult(null);}}><X size={15}/></button></div>)}
    </div>}
    {files.length>0&&<button type="button" className="primary-btn process-btn" disabled={busy||files.length<2} onClick={merge}>{busy?"Merging PDFs…":result?"Merge again":"Merge "+files.length+" PDFs"}</button>}
    {error&&<p className="error-msg" role="alert">{error}</p>}
    {result&&<section className="pdf-result" role="status"><div><Check size={18}/><b>Your merged PDF is ready</b><span>{formatBytes(result.size)}</span></div><p>All pages are combined in the order shown above.</p><button className="download-btn" type="button" onClick={()=>download(result,"pixeltools-merged.pdf")}><ArrowDownToLine size={16}/> Download merged PDF</button></section>}
    <div className="pdf-privacy"><LockKeyhole size={14}/> PDF processing stays on this device. Password-protected files are not supported.</div>
  </div>;
}

function parseRanges(value: string, pageCount: number): Array<{start:number;end:number}> {
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

export function PdfSplitTool() {
  const [file,setFile] = useState<File|null>(null);
  const [range,setRange] = useState("");
  const [pageCount,setPageCount] = useState<number|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [result,setResult] = useState<Blob|null>(null);
  const input = useRef<HTMLInputElement>(null);
  const choose = async (picked: File|null) => {
    if (!picked) return;
    setFile(null);setPageCount(null);setResult(null);setError("");
    try {
      const pdf=await loadPdf(picked);
      if(pdf.getPageCount()>MAX_PAGES) throw new Error("PDF Split supports up to 200 pages per file.");
      setFile(picked);setPageCount(pdf.getPageCount());setRange("1-"+pdf.getPageCount());
    } catch(reason) {setError(reason instanceof Error?reason.message:"Could not read this PDF.");}
    if(input.current)input.current.value="";
  };
  const split = async () => {
    if(!file||!pageCount||busy)return;
    setBusy(true);setError("");setResult(null);
    try {
      const source=await loadPdf(file);
      const ranges=parseRanges(range,pageCount);
      const entries=[];
      for(let i=0;i<ranges.length;i++){
        const {start,end}=ranges[i];
        const output=await PDFDocument.create();
        const pages=await output.copyPages(source,Array.from({length:end-start+1},(_,index)=>start-1+index));
        pages.forEach(page=>output.addPage(page));
        const bytes=await output.save({useObjectStreams:true});
        if(!bytes.length)throw new Error("A selected page range produced an empty PDF.");
        entries.push({name:safeBaseName(file.name)+"-pages-"+start+(end===start?"":"-"+end)+".pdf",data:new Uint8Array(bytes)});
      }
      const total=entries.reduce((sum,item)=>sum+item.data.byteLength,0);
      if(total>MAX_OUTPUT_BYTES)throw new Error("Split output exceeds the 150 MB safety limit.");
      const archive=await createZipBlob(entries);
      if(archive.size>MAX_OUTPUT_BYTES)throw new Error("ZIP output exceeds the 150 MB safety limit.");
      setResult(archive);
    }catch(reason){setError(reason instanceof Error?reason.message:"Could not split this PDF.");}
    finally{setBusy(false);}
  };
  return <div className="pdf-workspace">
    <div className="pdf-intro"><span><FileText size={21}/></span><div><b>Extract page ranges into separate PDFs</b><p>Enter page numbers or ranges. Each comma-separated range becomes its own PDF inside a ZIP archive.</p></div></div>
    <input ref={input} hidden type="file" accept="application/pdf,.pdf" onChange={e=>choose(e.target.files?.[0]??null)}/>
    {!file?<button type="button" className="pdf-dropzone" onClick={()=>input.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();choose(e.dataTransfer.files[0]??null);}}><UploadCloud size={29}/><b>Drop a PDF here or browse</b><span>PDF only · Up to 25 MB · Maximum 200 pages</span></button>:<div className="pdf-file-list"><div className="pdf-list-head"><b>Selected document</b><button type="button" className="change-file" disabled={busy} onClick={()=>{setFile(null);setPageCount(null);setResult(null);setError("");}}>Remove PDF</button></div><div className="pdf-file-row"><span className="pdf-file-icon"><FileText size={17}/></span><div><b>{file.name}</b><small>{pageCount} pages · {formatBytes(file.size)}</small></div></div></div>}
    {file&&<div className="pdf-quality"><label htmlFor="pdf-page-ranges">Page ranges <b>{pageCount} total pages</b></label><input id="pdf-page-ranges" className="text-input" value={range} disabled={busy} onChange={e=>{setRange(e.target.value);setResult(null);}} placeholder="e.g. 1-3, 5, 8-10"/><p>Example: 1-3, 5, 8-10 creates three separate PDFs. Page numbers start at 1. Repeated or overlapping pages are not allowed.</p></div>}
    {file&&<button type="button" className="primary-btn process-btn" disabled={busy} onClick={split}>{busy?"Splitting PDF…":result?"Split again":"Split into PDFs"}</button>}
    {error&&<p className="error-msg" role="alert">{error}</p>}
    {result&&<section className="pdf-result" role="status"><div><Check size={18}/><b>Your split PDFs are ready</b><span>{formatBytes(result.size)}</span></div><p>Each requested page range is a separate PDF in the ZIP archive.</p><button type="button" className="download-btn" onClick={()=>download(result,safeBaseName(file?.name??"document")+"-split.zip")}><ArrowDownToLine size={16}/> Download ZIP</button></section>}
    <div className="pdf-privacy"><LockKeyhole size={14}/> Processing is local. Password-protected PDFs are not supported.</div>
  </div>;
}
