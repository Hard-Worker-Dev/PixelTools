import { useRef, useState } from "react";
import { ArrowDownToLine, Check, FileText, LockKeyhole, Plus, UploadCloud, X, RotateCw, ListOrdered, Files, Stamp } from "lucide-react";
import { loadPdfFile, mergePdfFiles, safePdfBaseName, splitPdfFile } from "./lib/pdf-operations";
import { extractPdfPages, reorderPdfPages, rotatePdfFile } from "./lib/pdf-page-operations";
import { watermarkPdfFile, type PdfWatermarkOptions } from "./lib/pdf-watermark";
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


function PdfSingleFilePicker({ file, onChoose, onRemove, busy, multiple = false }: {
  file: File | null; onChoose: (file: File | null) => void; onRemove: () => void; busy: boolean; multiple?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  return <>
    <input ref={input} hidden type="file" accept="application/pdf,.pdf" multiple={multiple} onChange={e => { const picked=e.target.files?.[0] ?? null; e.target.value=""; onChoose(picked); }}/>
    {!file ? <button type="button" className="pdf-dropzone" onClick={() => input.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();onChoose(e.dataTransfer.files[0]??null);}}>
      <UploadCloud size={29}/><b>Drop a PDF here or browse</b><span>PDF only · Up to 25 MB · Maximum 200 pages</span>
    </button> : <div className="pdf-file-list">
      <div className="pdf-list-head"><b>Selected document</b><button type="button" className="change-file" disabled={busy} onClick={onRemove}>Remove PDF</button></div>
      <div className="pdf-file-row"><span className="pdf-file-icon"><FileText size={17}/></span><div><b>{file.name}</b><small>{formatBytes(file.size)}</small></div></div>
    </div>}
  </>;
}

export function PdfRotateTool() {
  const [file,setFile]=useState<File|null>(null);
  const [pages,setPages]=useState<number|null>(null);
  const [turns,setTurns]=useState("1");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState<Blob|null>(null);
  const choose=async(picked:File|null)=>{if(!picked)return;setError("");setResult(null);try{const pdf=await loadPdfFile(picked);if(pdf.getPageCount()>200)throw new Error("PDF Rotate supports up to 200 pages.");setFile(picked);setPages(pdf.getPageCount());}catch(reason){setFile(null);setPages(null);setError(reason instanceof Error?reason.message:"Could not read this PDF.");}};
  const rotate=async()=>{if(!file||busy)return;setBusy(true);setError("");setResult(null);try{setResult(await rotatePdfFile(file,Number(turns)));}catch(reason){setError(reason instanceof Error?reason.message:"Could not rotate this PDF.");}finally{setBusy(false);}};
  return <div className="pdf-workspace">
    <div className="pdf-intro"><span><RotateCw size={21}/></span><div><b>Rotate every page in your PDF</b><p>Rotate pages clockwise or counterclockwise in 90-degree steps. The source file stays on your device.</p></div></div>
    <PdfSingleFilePicker file={file} onChoose={choose} onRemove={()=>{setFile(null);setPages(null);setResult(null);setError("");}} busy={busy}/>
    {file&&<div className="pdf-quality"><label htmlFor="pdf-rotation">Rotation direction <b>{pages} pages</b></label><select id="pdf-rotation" className="text-input" value={turns} disabled={busy} onChange={e=>{setTurns(e.target.value);setResult(null);}}><option value="1">90° clockwise</option><option value="2">180°</option><option value="3">270° clockwise</option><option value="-1">90° counterclockwise</option></select><p>All pages receive the same rotation. Existing page rotation is preserved and adjusted.</p></div>}
    {file&&<button type="button" className="primary-btn process-btn" disabled={busy} onClick={rotate}>{busy?"Rotating PDF…":"Rotate PDF"}</button>}
    {error&&<p className="error-msg" role="alert">{error}</p>}
    {result&&<section className="pdf-result" role="status"><div><Check size={18}/><b>Your rotated PDF is ready</b><span>{formatBytes(result.size)}</span></div><button type="button" className="download-btn" onClick={()=>download(result,safePdfBaseName(file?.name??"document")+"-rotated.pdf")}><ArrowDownToLine size={16}/> Download rotated PDF</button></section>}
    <div className="pdf-privacy"><LockKeyhole size={14}/> Local processing · Password-protected PDFs are not supported.</div>
  </div>;
}

export function PdfReorderTool() {
  const [file,setFile]=useState<File|null>(null);
  const [order,setOrder]=useState<number[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState<Blob|null>(null);
  const choose=async(picked:File|null)=>{if(!picked)return;setError("");setResult(null);try{const pdf=await loadPdfFile(picked);const count=pdf.getPageCount();if(count>200)throw new Error("PDF Page Reorder supports up to 200 pages.");setFile(picked);setOrder(Array.from({length:count},(_,i)=>i));}catch(reason){setFile(null);setOrder([]);setError(reason instanceof Error?reason.message:"Could not read this PDF.");}};
  const move=(index:number,direction:-1|1)=>{setOrder(current=>{const next=[...current],target=index+direction;if(target<0||target>=next.length)return current;[next[index],next[target]]=[next[target],next[index]];return next;});setResult(null);};
  const process=async()=>{if(!file||busy)return;setBusy(true);setError("");setResult(null);try{setResult(await reorderPdfPages(file,order));}catch(reason){setError(reason instanceof Error?reason.message:"Could not reorder these pages.");}finally{setBusy(false);}};
  return <div className="pdf-workspace">
    <div className="pdf-intro"><span><ListOrdered size={21}/></span><div><b>Arrange pages in a new order</b><p>Move individual pages up or down. The exported PDF follows the order displayed below.</p></div></div>
    <PdfSingleFilePicker file={file} onChoose={choose} onRemove={()=>{setFile(null);setOrder([]);setResult(null);setError("");}} busy={busy}/>
    {file&&<div className="pdf-file-list"><div className="pdf-list-head"><b>{order.length} pages · Current export order</b><span className="pdf-page-number">1 → {order.length}</span></div>{order.map((page,index)=><div className="pdf-file-row" key={page}><span className="pdf-page-number">{index+1}</span><span className="pdf-file-icon"><FileText size={17}/></span><div><b>Original page {page+1}</b><small>Will appear as page {index+1}</small></div><div className="pdf-reorder"><button type="button" aria-label={"Move page "+(page+1)+" up"} disabled={busy||index===0} onClick={()=>move(index,-1)}>↑</button><button type="button" aria-label={"Move page "+(page+1)+" down"} disabled={busy||index===order.length-1} onClick={()=>move(index,1)}>↓</button></div></div>)}</div>}
    {file&&<button type="button" className="primary-btn process-btn" disabled={busy} onClick={process}>{busy?"Reordering pages…":"Export reordered PDF"}</button>}
    {error&&<p className="error-msg" role="alert">{error}</p>}
    {result&&<section className="pdf-result" role="status"><div><Check size={18}/><b>Your reordered PDF is ready</b><span>{formatBytes(result.size)}</span></div><button type="button" className="download-btn" onClick={()=>download(result,safePdfBaseName(file?.name??"document")+"-reordered.pdf")}><ArrowDownToLine size={16}/> Download reordered PDF</button></section>}
    <div className="pdf-privacy"><LockKeyhole size={14}/> Local processing · Password-protected PDFs are not supported.</div>
  </div>;
}

export function PdfExtractTool() {
  const [file,setFile]=useState<File|null>(null);
  const [pageCount,setPageCount]=useState(0);
  const [selected,setSelected]=useState<number[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState<Blob|null>(null);
  const choose=async(picked:File|null)=>{if(!picked)return;setError("");setResult(null);try{const pdf=await loadPdfFile(picked);const count=pdf.getPageCount();if(count>200)throw new Error("PDF Page Extract supports up to 200 pages.");setFile(picked);setPageCount(count);setSelected(Array.from({length:count},(_,i)=>i));}catch(reason){setFile(null);setPageCount(0);setSelected([]);setError(reason instanceof Error?reason.message:"Could not read this PDF.");}};
  const toggle=(page:number)=>{setSelected(current=>current.includes(page)?current.filter(item=>item!==page):[...current,page].sort((a,b)=>a-b));setResult(null);};
  const extract=async()=>{if(!file||!selected.length||busy)return;setBusy(true);setError("");setResult(null);try{setResult(await extractPdfPages(file,selected));}catch(reason){setError(reason instanceof Error?reason.message:"Could not extract these pages.");}finally{setBusy(false);}};
  return <div className="pdf-workspace">
    <div className="pdf-intro"><span><Files size={21}/></span><div><b>Save selected pages as separate PDFs</b><p>Select the pages you need. Each selected page becomes its own PDF inside one ZIP download.</p></div></div>
    <PdfSingleFilePicker file={file} onChoose={choose} onRemove={()=>{setFile(null);setPageCount(0);setSelected([]);setResult(null);setError("");}} busy={busy}/>
    {file&&<div className="pdf-quality"><label>Pages to extract <b>{selected.length} of {pageCount} selected</b></label><div className="pdf-page-actions"><button type="button" className="change-file" disabled={busy||selected.length===pageCount} onClick={()=>{setSelected(Array.from({length:pageCount},(_,i)=>i));setResult(null);}}>Select all</button><button type="button" className="change-file" disabled={busy||!selected.length} onClick={()=>{setSelected([]);setResult(null);}}>Clear selection</button></div><div className="pdf-extract-grid">{Array.from({length:pageCount},(_,page)=><label className="pdf-extract-page" key={page}><input type="checkbox" checked={selected.includes(page)} disabled={busy} onChange={()=>toggle(page)}/><span>Page {page+1}</span></label>)}</div></div>}
    {file&&<button type="button" className="primary-btn process-btn" disabled={busy||!selected.length} onClick={extract}>{busy?"Extracting pages…":"Extract "+selected.length+" pages"}</button>}
    {error&&<p className="error-msg" role="alert">{error}</p>}
    {result&&<section className="pdf-result" role="status"><div><Check size={18}/><b>Your extracted pages are ready</b><span>{formatBytes(result.size)}</span></div><p>Each selected page is an individual PDF in the ZIP archive.</p><button type="button" className="download-btn" onClick={()=>download(result,safePdfBaseName(file?.name??"document")+"-extracted-pages.zip")}><ArrowDownToLine size={16}/> Download ZIP</button></section>}
    <div className="pdf-privacy"><LockKeyhole size={14}/> Local processing · Password-protected PDFs are not supported.</div>
  </div>;
}

export function PdfWatermarkTool() {
  const [file,setFile]=useState<File|null>(null);
  const [pages,setPages]=useState(0);
  const [text,setText]=useState("CONFIDENTIAL");
  const [color,setColor]=useState("#555555");
  const [opacity,setOpacity]=useState(35);
  const [fontSize,setFontSize]=useState(28);
  const [rotation,setRotation]=useState(-30);
  const [position,setPosition]=useState<PdfWatermarkOptions["position"]>("center");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState<Blob|null>(null);
  const choose=async(picked:File|null)=>{
    if(!picked)return;
    setError("");setResult(null);
    try{const pdf=await loadPdfFile(picked);if(pdf.getPageCount()>200)throw new Error("PDF Watermark supports up to 200 pages.");setFile(picked);setPages(pdf.getPageCount());}
    catch(reason){setFile(null);setPages(0);setError(reason instanceof Error?reason.message:"Could not read this PDF.");}
  };
  const remove=()=>{setFile(null);setPages(0);setResult(null);setError("");};
  const process=async()=>{
    if(!file||busy)return;
    setBusy(true);setError("");setResult(null);
    try{setResult(await watermarkPdfFile(file,{text,color,opacity:opacity/100,fontSize,rotation,position}));}
    catch(reason){setError(reason instanceof Error?reason.message:"Could not add a watermark to this PDF.");}
    finally{setBusy(false);}
  };
  return <div className="pdf-workspace">
    <div className="pdf-intro"><span><Stamp size={21}/></span><div><b>Stamp every page with custom text</b><p>Add a subtle draft label, ownership notice or confidentiality mark. The original document stays unchanged.</p></div></div>
    <PdfSingleFilePicker file={file} onChoose={choose} onRemove={remove} busy={busy}/>
    {file&&<>
      <div className="pdf-quality">
        <label htmlFor="pdf-watermark-text">Watermark text <b>{text.length}/120</b></label>
        <input id="pdf-watermark-text" className="text-input" value={text} maxLength={120} disabled={busy} onChange={e=>{setText(e.target.value);setResult(null);}} placeholder="e.g. CONFIDENTIAL"/>
        <p>Basic English letters, numbers and punctuation are supported. The watermark is added to all {pages} pages.</p>
      </div>
      <div className="pdf-watermark-options">
        <div className="pdf-quality"><label htmlFor="pdf-watermark-color">Text color</label><input id="pdf-watermark-color" type="color" value={color} disabled={busy} onChange={e=>{setColor(e.target.value);setResult(null);}}/></div>
        <div className="pdf-quality"><label htmlFor="pdf-watermark-opacity">Opacity <b>{opacity}%</b></label><input id="pdf-watermark-opacity" type="range" min="5" max="100" step="5" value={opacity} disabled={busy} onChange={e=>{setOpacity(Number(e.target.value));setResult(null);}}/></div>
        <div className="pdf-quality"><label htmlFor="pdf-watermark-size">Font size <b>{fontSize} pt</b></label><input id="pdf-watermark-size" type="range" min="8" max="96" step="1" value={fontSize} disabled={busy} onChange={e=>{setFontSize(Number(e.target.value));setResult(null);}}/></div>
        <div className="pdf-quality"><label htmlFor="pdf-watermark-rotation">Rotation <b>{rotation}°</b></label><input id="pdf-watermark-rotation" type="range" min="-90" max="90" step="5" value={rotation} disabled={busy} onChange={e=>{setRotation(Number(e.target.value));setResult(null);}}/></div>
      </div>
      <div className="pdf-quality"><label htmlFor="pdf-watermark-position">Position</label><select id="pdf-watermark-position" className="text-input" value={position} disabled={busy} onChange={e=>{setPosition(e.target.value as PdfWatermarkOptions["position"]);setResult(null);}}><option value="center">Center</option><option value="top-left">Top left</option><option value="top-right">Top right</option><option value="bottom-left">Bottom left</option><option value="bottom-right">Bottom right</option></select><p>Watermark placement is calculated separately for each page size.</p></div>
      <button type="button" className="primary-btn process-btn" disabled={busy||!text.trim()} onClick={process}>{busy?"Adding watermark…":"Add watermark to PDF"}</button>
    </>}
    {error&&<p className="error-msg" role="alert">{error}</p>}
    {result&&<section className="pdf-result" role="status"><div><Check size={18}/><b>Your watermarked PDF is ready</b><span>{formatBytes(result.size)}</span></div><p>Text watermark added to all {pages} pages.</p><button type="button" className="download-btn" onClick={()=>download(result,safePdfBaseName(file?.name??"document")+"-watermarked.pdf")}><ArrowDownToLine size={16}/> Download watermarked PDF</button></section>}
    <div className="pdf-privacy"><LockKeyhole size={14}/> Local processing · Password-protected PDFs are not supported.</div>
  </div>;
}
