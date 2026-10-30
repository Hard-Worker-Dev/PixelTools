import { useRef, useState } from "react";
import { ArrowDownToLine, ArrowRight, Check, ChevronDown, FileImage, Image as ImageIcon, LockKeyhole, Menu, RotateCcw, ShieldCheck, Sparkles, UploadCloud, X } from "lucide-react";
import { formatBytes, outputName, renderImage, type ImageFormat } from "./lib/image";

type ToolId = "compress" | "resize" | "convert" | "edit";
const tools = [
  { id: "compress" as const, title: "Image Compressor", desc: "Shrink image file sizes without the hassle.", icon: "◈", tag: "Popular" },
  { id: "resize" as const, title: "Image Resizer", desc: "Get the exact dimensions you need.", icon: "▧", tag: "Quick" },
  { id: "convert" as const, title: "Image Converter", desc: "Convert JPG, PNG and WebP in seconds.", icon: "⇄", tag: "3 formats" },
  { id: "edit" as const, title: "Quick Image Edits", desc: "Rotate, flip or make an image grayscale.", icon: "✳", tag: "Easy" }
];

export default function App() {
  const [active, setActive] = useState<ToolId | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [quality, setQuality] = useState(80);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [format, setFormat] = useState<ImageFormat>("image/webp");
  const [rotate, setRotate] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [grayscale, setGrayscale] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const clear = () => {
    setFile(null); setResult(null); setError(""); setPreview("");
    if (inputRef.current) inputRef.current.value = "";
  };
  const chooseTool = (id: ToolId) => { setActive(id); clear(); setRotate(0); setFlipX(false); setFlipY(false); setGrayscale(false); };
  const selectFile = (picked?: File) => {
    if (!picked) return;
    if (!picked.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (picked.size > 25 * 1024 * 1024) { setError("For this first release, please choose an image smaller than 25 MB."); return; }
    setFile(picked); setResult(null); setError("");
    setPreview(URL.createObjectURL(picked));
    createImageBitmap(picked).then(bitmap => { setWidth(String(bitmap.width)); setHeight(String(bitmap.height)); bitmap.close(); }).catch(() => setError("This image could not be opened by your browser."));
  };
  const process = async () => {
    if (!file || !active) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const opts: Parameters<typeof renderImage>[1] = { quality: quality / 100, format };
      if (active === "resize") { opts.width = Number(width); opts.height = Number(height); if (!opts.width || !opts.height || opts.width < 1 || opts.height < 1 || opts.width > 12000 || opts.height > 12000) throw new Error("Enter dimensions between 1 and 12,000 pixels."); }
      if (active === "compress") opts.format = file.type === "image/png" ? "image/png" : "image/jpeg";
      if (active === "edit") { opts.rotate = rotate; opts.flipX = flipX; opts.flipY = flipY; opts.grayscale = grayscale; }
      setResult(await renderImage(file, opts));
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong while processing the image."); }
    finally { setBusy(false); }
  };
  const download = () => {
    if (!result || !file) return;
    const mime = (result.type || format) as ImageFormat;
    const url = URL.createObjectURL(result);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = outputName(file.name, mime); anchor.click();
    URL.revokeObjectURL(url);
  };
  const toolName = tools.find(t => t.id === active)?.title ?? "";

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#" onClick={() => { setActive(null); clear(); }}><span className="brand-mark"><ImageIcon size={19}/></span>pixel<span>tools</span></a><nav><a href="#tools">All tools</a><a href="#how">How it works</a><a href="#privacy">Privacy</a></nav><a className="header-cta" href="#tools">Explore tools <ArrowRight size={15}/></a><button className="mobile-menu" aria-label="Open menu"><Menu size={21}/></button></header>
    <main>
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><Sparkles size={14}/> YOUR CREATIVE WORKFLOW, SIMPLIFIED</div><h1>Image work,<br/><span>made simple.</span></h1><p className="hero-lead">The little image toolkit that does a lot. Compress, resize and convert your images in a few clicks — completely free.</p><div className="hero-actions"><a className="primary-btn" href="#tools">Explore image tools <ArrowRight size={17}/></a><div className="trust-note"><ShieldCheck size={17}/> Private by design</div></div><div className="hero-stats"><div><strong>100%</strong><span>Free to use</span></div><div><strong>0</strong><span>Uploads to servers</span></div><div><strong>Fast</strong><span>Browser processing</span></div></div></div>
        <div className="hero-art"><div className="art-glow"></div><div className="floating-card card-back"><div className="mini-toolbar"><i></i><i></i><i></i></div><div className="abstract-image"><div className="sun"></div><div className="mountain m1"></div><div className="mountain m2"></div></div><div className="fake-lines"><i></i><i></i></div></div><div className="floating-card card-front"><div className="file-row"><span className="file-icon"><FileImage size={19}/></span><div><b>summer-photo.webp</b><small>Image ready to optimize</small></div><Check size={17} className="check"/></div><div className="progress-label"><span>File size reduced</span><b>−68%</b></div><div className="progress"><i></i></div><div className="size-row"><span>2.4 MB</span><ArrowRight size={14}/><b>768 KB</b></div></div><div className="sparkle s1">✳</div><div className="sparkle s2">✦</div></div>
      </section>
      <section className="trust-strip"><span><LockKeyhole size={16}/> Your images stay on your device</span><span><Check size={16}/> No sign-up required</span><span><Sparkles size={16}/> Always free</span></section>
      <section className="tools-section" id="tools"><div className="section-heading"><div><div className="eyebrow">THE TOOLKIT</div><h2>Everything you need.<br/><span>Nothing you don't.</span></h2></div><p>Simple, focused tools for everyday image tasks. Pick a tool and get straight to work.</p></div>
        <div className="tool-grid">{tools.map(tool => <button className="tool-card" key={tool.id} onClick={() => chooseTool(tool.id)}><div className="tool-card-top"><span className="tool-icon">{tool.icon}</span><span className="tool-tag">{tool.tag}</span></div><h3>{tool.title}</h3><p>{tool.desc}</p><span className="tool-link">Open tool <ArrowRight size={15}/></span></button>)}</div>
      </section>
      <section className="privacy-section" id="privacy"><div className="privacy-icon"><ShieldCheck size={25}/></div><div><div className="eyebrow">YOUR PRIVACY MATTERS</div><h2>Your images are <span>yours.</span></h2><p>PixelTools processes your images directly in your browser. Your files aren't uploaded to our servers, and there's no account to create. Your work stays yours.</p></div><div className="privacy-stamp"><LockKeyhole size={18}/><b>PRIVATE</b><small>By design</small></div></section>
      <section className="how-section" id="how"><div className="eyebrow">THREE SIMPLE STEPS</div><h2>From upload to <span>done.</span></h2><div className="steps"><div><b>01</b><h3>Choose a tool</h3><p>Pick the image task you want to get done.</p></div><div><b>02</b><h3>Add your image</h3><p>Drop a file or browse your device. That's it.</p></div><div><b>03</b><h3>Download & go</h3><p>Process locally and save your finished image.</p></div></div></section>
    </main>
    <footer><a className="brand" href="#"><span className="brand-mark"><ImageIcon size={17}/></span>pixel<span>tools</span></a><p>Thoughtful image tools. Free for everyone.</p><small>© 2026 PixelTools. Made for the web.</small></footer>
    {active && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) { setActive(null); clear(); } }}><section className="tool-modal" role="dialog" aria-modal="true" aria-label={toolName}><div className="modal-head"><div><div className="eyebrow">PIXELTOOLS WORKSPACE</div><h2>{toolName}</h2></div><button className="icon-btn" aria-label="Close tool" onClick={() => { setActive(null); clear(); }}><X size={20}/></button></div>
      {!file ? <button className="dropzone" onClick={() => inputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); selectFile(e.dataTransfer.files[0]); }}><span className="upload-icon"><UploadCloud size={28}/></span><b>Drop your image here</b><span>or click to browse files</span><small>JPG, PNG, WebP · Up to 25 MB</small></button> : <div className="workspace"><div className="preview-panel"><img src={preview} alt="Selected image preview"/><div className="preview-caption"><span>{file.name}</span><b>{formatBytes(file.size)}</b></div></div><div className="settings-panel">
        {active === "compress" && <><label>Image quality <b>{quality}%</b></label><input type="range" min="20" max="100" value={quality} onChange={e => setQuality(Number(e.target.value))}/><p className="hint">Lower quality usually means a smaller file. PNG files are exported losslessly.</p></>}
        {active === "resize" && <><label>Width (px)</label><input className="text-input" type="number" min="1" max="12000" value={width} onChange={e => setWidth(e.target.value)}/><label>Height (px)</label><input className="text-input" type="number" min="1" max="12000" value={height} onChange={e => setHeight(e.target.value)}/></>}
        {active === "convert" && <><label>Convert to</label><select className="text-input" value={format} onChange={e => setFormat(e.target.value as ImageFormat)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select><p className="hint">Transparent areas may become solid when converting to JPG.</p></>}
        {active === "edit" && <><label>Rotate</label><div className="button-row"><button className="secondary-btn" onClick={() => setRotate(v => (v + 270) % 360)}><RotateCcw size={15}/> Left</button><button className="secondary-btn" onClick={() => setRotate(v => (v + 90) % 360)}>Right <RotateCcw size={15}/></button></div><label className="check-label"><input type="checkbox" checked={flipX} onChange={e => setFlipX(e.target.checked)}/> Flip horizontally</label><label className="check-label"><input type="checkbox" checked={flipY} onChange={e => setFlipY(e.target.checked)}/> Flip vertically</label><label className="check-label"><input type="checkbox" checked={grayscale} onChange={e => setGrayscale(e.target.checked)}/> Grayscale</label></>}
        {error && <p className="error-msg">{error}</p>}
        <button className="primary-btn process-btn" onClick={process} disabled={busy}>{busy ? "Processing…" : result ? "Process again" : "Process image"} <ArrowRight size={16}/></button>
        {result && <div className="result-box"><div><Check size={17}/><b>All done!</b></div><p>{formatBytes(file.size)} <ArrowRight size={13}/> <strong>{formatBytes(result.size)}</strong></p><button className="download-btn" onClick={download}><ArrowDownToLine size={16}/> Download image</button></div>}
        <button className="change-file" onClick={() => { clear(); }}> <RotateCcw size={13}/> Choose another image</button>
      </div></div>}
      {error && !file && <p className="error-msg">{error}</p>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={e => selectFile(e.target.files?.[0])}/>
      <div className="modal-foot"><LockKeyhole size={14}/> Files are processed locally in your browser <button onClick={() => { setActive(null); clear(); }}>Close</button></div>
    </section></div>}
  </div>;
}