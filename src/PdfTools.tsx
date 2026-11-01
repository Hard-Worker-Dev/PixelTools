import { useRef, useState } from "react";
import { ArrowDownToLine, Check, FileText, LockKeyhole, Plus, UploadCloud, X } from "lucide-react";
import { loadPdfFile, mergePdfFiles, safePdfBaseName, splitPdfFile } from "./lib/pdf-operations";
import { formatBytes } from "./lib/image";


function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
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
      if (!file.size || file.size > 25 * 1024 * 1024) { issues.push(file.name + ": each PDF must be 25 MB or smaller."); continue; }
      if (next.reduce((sum, item) => sum + item.size, 0) + file.size > 100 * 1024 * 1024) { issues.push("Combined PDF input cannot exceed 100 MB."); continue; }
      next.push(file);
    }
    setFiles(next); setResult(null); setError(issues.join(" "));
    if (input.current) input.current.value = "";
  };
  const move = (index: number, direction: -1 | 1) => {
    setFiles(current => {
      const target = index + direction; if (target < 0 || target >= current.length) return current;
      const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next;
    });
    setResult(null);
  };
  const merge = async () => {
    if (files.length < 2 || busy) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const mergedBlob = await mergePdfFiles(files);
      setResult(mergedBlob);
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
      const pdf=await loadPdfFile(picked);
      if(pdf.getPageCount()>200) throw new Error("PDF Split supports up to 200 pages per file.");
      setFile(picked);setPageCount(pdf.getPageCount());setRange("1-"+pdf.getPageCount());
    } catch(reason) {setError(reason instanceof Error?reason.message:"Could not read this PDF.");}
    if(input.current)input.current.value="";
  };
  const split = async () => {
    if(!file||!pageCount||busy)return;
    setBusy(true);setError("");setResult(null);
    try {
      const archive = await splitPdfFile(file, range);
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
    {result&&<section className="pdf-result" role="status"><div><Check size={18}/><b>Your split PDFs are ready</b><span>{formatBytes(result.size)}</span></div><p>Each requested page range is a separate PDF in the ZIP archive.</p><button type="button" className="download-btn" onClick={()=>download(result,safePdfBaseName(file?.name??"document")+"-split.zip")}><ArrowDownToLine size={16}/> Download ZIP</button></section>}
    <div className="pdf-privacy"><LockKeyhole size={14}/> Processing is local. Password-protected PDFs are not supported.</div>
  </div>;
}
