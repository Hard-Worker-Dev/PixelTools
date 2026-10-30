import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  ArrowDownToLine, ArrowRight, Check, Copy, FileImage, Image as ImageIcon,
  LockKeyhole, Menu, RotateCcw, ShieldCheck, Sparkles, UploadCloud, X
} from "lucide-react";
import {
  formatBytes, outputName, renderImage, sampleImageColor,
  type ImageFormat, type RenderOptions
} from "./lib/image";

type ToolId =
  | "compress" | "resize" | "crop" | "convert" | "rotate" | "flip"
  | "watermark" | "rounded" | "blur" | "grayscale" | "color"
  | "metadata" | "base64";

const tools: Array<{ id: string; title: string; desc: string; icon: string; tag: string; comingSoon?: boolean }> = [
  { id: "compress", title: "Image Compressor", desc: "Reduce file size with adjustable output quality.", icon: "◈", tag: "Popular" },
  { id: "resize", title: "Image Resizer", desc: "Set precise width and height in pixels.", icon: "▧", tag: "Quick" },
  { id: "crop", title: "Image Cropper", desc: "Crop to the exact rectangle you need.", icon: "▣", tag: "Precision" },
  { id: "convert", title: "Image Converter", desc: "Convert between JPG, PNG and WebP.", icon: "⇄", tag: "3 formats" },
  { id: "rotate", title: "Image Rotator", desc: "Rotate an image in 90-degree steps.", icon: "↻", tag: "Quick" },
  { id: "flip", title: "Image Flipper", desc: "Mirror images horizontally or vertically.", icon: "⇋", tag: "Quick" },
  { id: "watermark", title: "Image Watermark", desc: "Add a custom text watermark to your image.", icon: "✎", tag: "Custom" },
  { id: "rounded", title: "Rounded Corners", desc: "Create smooth rounded image corners.", icon: "▢", tag: "Transparent PNG" },
  { id: "blur", title: "Image Blur", desc: "Apply adjustable blur to the full image.", icon: "◌", tag: "Creative" },
  { id: "grayscale", title: "Grayscale Converter", desc: "Convert an image to monochrome.", icon: "◐", tag: "One click" },
  { id: "color", title: "Image Color Picker", desc: "Click any pixel to inspect its color value.", icon: "◉", tag: "Pixel sampling" },
  { id: "metadata", title: "Image Metadata Viewer", desc: "Inspect file details, type and image dimensions.", icon: "ⓘ", tag: "File details" },
  { id: "base64", title: "Image to Base64", desc: "Create a Base64 data URL and copy it.", icon: "⌘", tag: "Developer" },
  { id: "background", title: "Background Remover", desc: "AI-powered background removal.", icon: "✧", tag: "Coming soon", comingSoon: true },
  { id: "upscaler", title: "AI Image Upscaler", desc: "Increase image resolution with an AI model.", icon: "⤢", tag: "Coming soon", comingSoon: true }
];

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read this image."));
    reader.onerror = () => reject(new Error("Could not read this image."));
    reader.readAsDataURL(file);
  });
}

const toolSlugs: Record<ToolId, string> = {
  compress: "image-compressor", resize: "image-resizer", crop: "image-cropper",
  convert: "image-converter", rotate: "image-rotator", flip: "image-flipper",
  watermark: "image-watermark", rounded: "rounded-corners", blur: "image-blur",
  grayscale: "grayscale-converter", color: "image-color-picker",
  metadata: "image-metadata-viewer", base64: "image-to-base64"
};

function getInitialTool(): ToolId | null {
  const requested = new URLSearchParams(window.location.search).get("tool");
  return tools.some(tool => tool.id === requested && !tool.comingSoon) ? requested as ToolId : null;
}

export default function App() {
  const [active, setActive] = useState<ToolId | null>(getInitialTool);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [quality, setQuality] = useState(80);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [format, setFormat] = useState<ImageFormat>("image/webp");
  const [rotate, setRotate] = useState(90);
  const [flipAxis, setFlipAxis] = useState<"horizontal" | "vertical">("horizontal");
  const [cropX, setCropX] = useState("0");
  const [cropY, setCropY] = useState("0");
  const [cropWidth, setCropWidth] = useState("");
  const [cropHeight, setCropHeight] = useState("");
  const [watermark, setWatermark] = useState("PixelTools");
  const [watermarkOpacity, setWatermarkOpacity] = useState(70);
  const [cornerRadius, setCornerRadius] = useState(32);
  const [blur, setBlur] = useState(4);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [base64Text, setBase64Text] = useState("");
  const [sample, setSample] = useState<{ r: number; g: number; b: number; hex: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  useEffect(() => {
    if (active === "base64" && file) {
      readAsDataUrl(file).then(setBase64Text).catch(e => setError(e instanceof Error ? e.message : "Could not encode this image."));
    }
  }, [active, file]);

  const clear = () => {
    setFile(null);
    setResult(null);
    setError("");
    setPreview("");
    setBase64Text("");
    setSample(null);
    setCopied(false);
    setDimensions({ width: 0, height: 0 });
    if (inputRef.current) inputRef.current.value = "";
  };

  const closeTool = () => {
    setActive(null);
    clear();
    window.history.replaceState({}, "", "/#tools");
  };

  const chooseTool = (id: ToolId) => {
    setActive(id);
    window.history.pushState({}, "", "/?tool=" + id + "#tools");
    clear();
    setRotate(90);
    setFlipAxis("horizontal");
    setCropX("0");
    setCropY("0");
    setWatermark("PixelTools");
    setWatermarkOpacity(70);
    setCornerRadius(32);
    setBlur(4);
    setMobileMenuOpen(false);
  };

  const selectFile = (picked?: File) => {
    if (!picked) return;
    const supported = ["image/jpeg", "image/png", "image/webp"];
    if (!supported.includes(picked.type)) {
      setError("Choose a JPG, PNG or WebP image. Other formats are not supported in this release.");
      return;
    }
    if (picked.size > 25 * 1024 * 1024) {
      setError("For this release, please choose an image smaller than 25 MB.");
      return;
    }
    setFile(picked);
    setResult(null);
    setError("");
    setBase64Text("");
    setSample(null);
    setPreview(URL.createObjectURL(picked));
    createImageBitmap(picked).then(bitmap => {
      setDimensions({ width: bitmap.width, height: bitmap.height });
      setWidth(String(bitmap.width));
      setHeight(String(bitmap.height));
      setCropWidth(String(bitmap.width));
      setCropHeight(String(bitmap.height));
      bitmap.close();
    }).catch(() => setError("This image could not be opened by your browser."));
  };

  const process = async () => {
    if (!file || !active) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const options: RenderOptions = { quality: quality / 100, format };
      switch (active) {
        case "compress":
          options.format = format;
          break;
        case "resize": {
          const w = Number(width);
          const h = Number(height);
          if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w > 12000 || h > 12000) {
            throw new Error("Enter whole-number dimensions between 1 and 12,000 pixels.");
          }
          options.width = w;
          options.height = h;
          break;
        }
        case "crop": {
          const x = Number(cropX);
          const y = Number(cropY);
          const w = Number(cropWidth);
          const h = Number(cropHeight);
          if (![x, y, w, h].every(Number.isInteger) || x < 0 || y < 0 || w < 1 || h < 1 || x >= dimensions.width || y >= dimensions.height) {
            throw new Error("Enter valid whole-pixel crop coordinates inside the image.");
          }
          options.crop = { x, y, width: w, height: h };
          options.format = format;
          break;
        }
        case "convert":
          options.format = format;
          break;
        case "rotate":
          options.rotate = rotate;
          options.format = format;
          break;
        case "flip":
          options.flipX = flipAxis === "horizontal";
          options.flipY = flipAxis === "vertical";
          options.format = format;
          break;
        case "watermark":
          if (!watermark.trim()) throw new Error("Enter watermark text first.");
          options.watermark = watermark;
          options.watermarkOpacity = watermarkOpacity / 100;
          options.format = format;
          break;
        case "rounded":
          options.cornerRadius = cornerRadius;
          options.format = "image/png";
          break;
        case "blur":
          options.blur = blur;
          options.format = format;
          break;
        case "grayscale":
          options.grayscale = true;
          options.format = format;
          break;
        default:
          throw new Error("This tool does not need image processing.");
      }
      setResult(await renderImage(file, options));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong while processing the image.");
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!result || !file) return;
    const mime = (result.type || format) as ImageFormat;
    const url = URL.createObjectURL(result);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = outputName(file.name, mime);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const sampleColor = async (event: MouseEvent<HTMLImageElement>) => {
    if (!file) return;
    const rect = event.currentTarget.getBoundingClientRect();
    try {
      setSample(await sampleImageColor(
        file,
        (event.clientX - rect.left) / rect.width,
        (event.clientY - rect.top) / rect.height
      ));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sample this pixel.");
    }
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Clipboard access is unavailable. Select the text and copy it manually.");
    }
  };

  const saveBase64 = () => {
    if (!base64Text || !file) return;
    const blob = new Blob([base64Text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${file.name}.base64.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const toolName = tools.find(t => t.id === active)?.title ?? "";

  useEffect(() => {
    const tool = tools.find(item => item.id === active);
    document.title = tool ? tool.title + " — Free Online Image Tool | PixelTools" : "PixelTools — Image work, made simple";
    const description = tool ? tool.desc : "Free, private image tools. Compress, resize, convert and edit images right in your browser with PixelTools.";
    let meta = document.querySelector<HTMLMetaElement>("meta[name=description]");
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
    meta.content = description;
    let canonical = document.querySelector<HTMLLinkElement>("link[rel=canonical]");
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = tool ? window.location.origin + "/tools/" + toolSlugs[active as ToolId] + "/" : window.location.origin + "/";
  }, [active]);
  const informationalTool = active === "color" || active === "metadata" || active === "base64";

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" onClick={closeTool}><span className="brand-mark"><ImageIcon size={19}/></span>pixel<span>tools</span></a>
      <nav className={mobileMenuOpen ? "open" : ""}><a href="#tools" onClick={() => setMobileMenuOpen(false)}>All tools</a><a href="#how" onClick={() => setMobileMenuOpen(false)}>How it works</a><a href="#privacy" onClick={() => setMobileMenuOpen(false)}>Privacy</a></nav>
      <a className="header-cta" href="#tools">Explore tools <ArrowRight size={15}/></a>
      <button className="mobile-menu" aria-label="Toggle menu" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(v => !v)}><Menu size={21}/></button>
    </header>
    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14}/> YOUR CREATIVE WORKFLOW, SIMPLIFIED</div>
          <h1>Image work,<br/><span>made simple.</span></h1>
          <p className="hero-lead">The little image toolkit that does a lot. Compress, resize and convert your images in a few clicks — completely free.</p>
          <div className="hero-actions"><a className="primary-btn" href="#tools">Explore image tools <ArrowRight size={17}/></a><div className="trust-note"><ShieldCheck size={17}/> Private by design</div></div>
          <div className="hero-stats"><div><strong>100%</strong><span>Free to use</span></div><div><strong>0</strong><span>Uploads to servers</span></div><div><strong>Fast</strong><span>Browser processing</span></div></div>
        </div>
        <div className="hero-art">
          <div className="art-glow"></div>
          <div className="floating-card card-back"><div className="mini-toolbar"><i></i><i></i><i></i></div><div className="abstract-image"><div className="sun"></div><div className="mountain m1"></div><div className="mountain m2"></div></div><div className="fake-lines"><i></i><i></i></div></div>
          <div className="floating-card card-front"><div className="file-row"><span className="file-icon"><FileImage size={19}/></span><div><b>summer-photo.webp</b><small>Image ready to optimize</small></div><Check size={17} className="check"/></div><div className="progress-label"><span>File size reduced</span><b>−68%</b></div><div className="progress"><i></i></div><div className="size-row"><span>2.4 MB</span><ArrowRight size={14}/><b>768 KB</b></div></div>
          <div className="sparkle s1">✳</div><div className="sparkle s2">✦</div>
        </div>
      </section>
      <section className="trust-strip"><span><LockKeyhole size={16}/> Your images stay on your device</span><span><Check size={16}/> No sign-up required</span><span><Sparkles size={16}/> Always free</span></section>
      <section className="tools-section" id="tools">
        <div className="section-heading"><div><div className="eyebrow">THE TOOLKIT</div><h2>Everything you need.<br/><span>Nothing you don't.</span></h2></div><p>Focused image utilities for everyday creative work. Choose a tool and get straight to work.</p></div>
        <div className="tool-grid">{tools.map(tool => <button className={tool.comingSoon ? "tool-card disabled" : "tool-card"} key={tool.id} disabled={!!tool.comingSoon} onClick={() => !tool.comingSoon && chooseTool(tool.id as ToolId)}><div className="tool-card-top"><span className="tool-icon">{tool.icon}</span><span className={tool.comingSoon ? "tool-tag coming" : "tool-tag"}>{tool.tag}</span></div><h3>{tool.title}</h3><p>{tool.desc}</p><span className="tool-link">{tool.comingSoon ? "In development" : "Open tool"} {!tool.comingSoon && <ArrowRight size={15}/>}</span></button>)}</div>
      </section>
      <section className="privacy-section" id="privacy"><div className="privacy-icon"><ShieldCheck size={25}/></div><div><div className="eyebrow">YOUR PRIVACY MATTERS</div><h2>Your images are <span>yours.</span></h2><p>Working tools process your images directly in your browser. Your files are not uploaded to PixelTools servers, and there is no account to create. AI background removal and upscaling are not enabled yet.</p></div><div className="privacy-stamp"><LockKeyhole size={18}/><b>PRIVATE</b><small>By design</small></div></section>
      <section className="how-section" id="how"><div className="eyebrow">THREE SIMPLE STEPS</div><h2>From upload to <span>done.</span></h2><div className="steps"><div><b>01</b><h3>Choose a tool</h3><p>Pick the image task you want to get done.</p></div><div><b>02</b><h3>Add your image</h3><p>Drop a file or browse your device. That's it.</p></div><div><b>03</b><h3>Download & go</h3><p>Process locally and save your finished image.</p></div></div></section>
    </main>
    <footer><a className="brand" href="#"><span className="brand-mark"><ImageIcon size={17}/></span>pixel<span>tools</span></a><p>Thoughtful image tools. Free for everyone.</p><small>© 2026 PixelTools. Made for the web.</small></footer>

    {active && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) closeTool() }}>
      <section className="tool-modal" role="dialog" aria-modal="true" aria-label={toolName}>
        <div className="modal-head"><div><div className="eyebrow">PIXELTOOLS WORKSPACE</div><h2>{toolName}</h2></div><button className="icon-btn" aria-label="Close tool" onClick={() => { setActive(null); clear(); }}><X size={20}/></button></div>
        {!file ? <button className="dropzone" onClick={() => inputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); selectFile(e.dataTransfer.files[0]); }}><span className="upload-icon"><UploadCloud size={28}/></span><b>Drop your image here</b><span>or click to browse files</span><small>JPG, PNG, WebP · Up to 25 MB</small></button> : <div className="workspace">
          <div className="preview-panel">
            <img src={preview} alt="Selected image preview" onClick={active === "color" ? sampleColor : undefined} className={active === "color" ? "sample-cursor" : ""}/>
            <div className="preview-caption"><span>{file.name}</span><b>{formatBytes(file.size)}</b></div>
            {active === "color" && <small className="hint">Click anywhere on the image to sample a pixel.</small>}
          </div>
          <div className="settings-panel">
            {active === "compress" && <><label>Output format</label><select className="text-input" value={format} onChange={e => setFormat(e.target.value as ImageFormat)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select><label>Image quality <b>{quality}%</b></label><input type="range" min="20" max="100" value={quality} onChange={e => setQuality(Number(e.target.value))}/><p className="hint">JPEG and WebP quality settings control compression. PNG uses lossless encoding and may not become smaller.</p></>}
            {active === "resize" && <><label>Width (px)</label><input className="text-input" type="number" min="1" max="12000" value={width} onChange={e => setWidth(e.target.value)}/><label>Height (px)</label><input className="text-input" type="number" min="1" max="12000" value={height} onChange={e => setHeight(e.target.value)}/><p className="hint">Current image: {dimensions.width} × {dimensions.height} px. Values are capped at 12,000 pixels per side.</p></>}
            {active === "crop" && <><div className="field-grid"><div><label>Left (px)</label><input className="text-input" type="number" min="0" value={cropX} onChange={e => setCropX(e.target.value)}/></div><div><label>Top (px)</label><input className="text-input" type="number" min="0" value={cropY} onChange={e => setCropY(e.target.value)}/></div><div><label>Width (px)</label><input className="text-input" type="number" min="1" value={cropWidth} onChange={e => setCropWidth(e.target.value)}/></div><div><label>Height (px)</label><input className="text-input" type="number" min="1" value={cropHeight} onChange={e => setCropHeight(e.target.value)}/></div></div><label>Output format</label><select className="text-input" value={format} onChange={e => setFormat(e.target.value as ImageFormat)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select><p className="hint">Original size: {dimensions.width} × {dimensions.height} px. Any crop values beyond the image edge are safely clamped.</p></>}
            {active === "convert" && <><label>Convert to</label><select className="text-input" value={format} onChange={e => setFormat(e.target.value as ImageFormat)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select><p className="hint">Transparent areas may become solid when converting to JPG.</p></>}
            {active === "rotate" && <><label>Rotation angle</label><div className="button-row"><button className="secondary-btn" onClick={() => setRotate(v => (v + 270) % 360)}><RotateCcw size={15}/> Left 90°</button><button className="secondary-btn" onClick={() => setRotate(v => (v + 90) % 360)}>Right 90° <RotateCcw size={15}/></button></div><p className="hint">Selected rotation: {rotate}° clockwise.</p><label>Output format</label><select className="text-input" value={format} onChange={e => setFormat(e.target.value as ImageFormat)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></>}
            {active === "flip" && <><label>Flip direction</label><select className="text-input" value={flipAxis} onChange={e => setFlipAxis(e.target.value as "horizontal" | "vertical")}><option value="horizontal">Horizontal (mirror left/right)</option><option value="vertical">Vertical (mirror top/bottom)</option></select><label>Output format</label><select className="text-input" value={format} onChange={e => setFormat(e.target.value as ImageFormat)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></>}
            {active === "watermark" && <><label>Watermark text</label><input className="text-input" value={watermark} maxLength={80} onChange={e => setWatermark(e.target.value)} placeholder="Enter watermark text"/><label>Opacity <b>{watermarkOpacity}%</b></label><input type="range" min="10" max="100" value={watermarkOpacity} onChange={e => setWatermarkOpacity(Number(e.target.value))}/><label>Output format</label><select className="text-input" value={format} onChange={e => setFormat(e.target.value as ImageFormat)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></>}
            {active === "rounded" && <><label>Corner radius <b>{cornerRadius}px</b></label><input type="range" min="4" max="240" value={cornerRadius} onChange={e => setCornerRadius(Number(e.target.value))}/><p className="hint">The output is PNG so transparent rounded corners are preserved.</p></>}
            {active === "blur" && <><label>Blur strength <b>{blur}px</b></label><input type="range" min="1" max="20" value={blur} onChange={e => setBlur(Number(e.target.value))}/><label>Output format</label><select className="text-input" value={format} onChange={e => setFormat(e.target.value as ImageFormat)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></>}
            {active === "grayscale" && <><p className="hint">Convert the image to grayscale while preserving its dimensions.</p><label>Output format</label><select className="text-input" value={format} onChange={e => setFormat(e.target.value as ImageFormat)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></>}
            {active === "color" && <>{sample ? <div className="sample-result"><span style={{ background: sample.hex }}></span><div><b>{sample.hex}</b><small>RGB({sample.r}, {sample.g}, {sample.b})</small></div><button className="secondary-btn" onClick={() => copyText(sample.hex)}><Copy size={14}/>{copied ? "Copied" : "Copy HEX"}</button></div> : <p className="hint">Click on the image preview to read the pixel color. The sample is taken from the original image, not the scaled preview.</p>}</>}
            {active === "metadata" && <div className="metadata-list"><div><span>File name</span><b>{file.name}</b></div><div><span>Format / MIME</span><b>{file.type}</b></div><div><span>File size</span><b>{formatBytes(file.size)}</b></div><div><span>Dimensions</span><b>{dimensions.width} × {dimensions.height} px</b></div><div><span>Last modified</span><b>{new Date(file.lastModified).toLocaleString()}</b></div><p className="hint">This viewer shows browser-readable file and image properties. EXIF/GPS camera metadata extraction is not included yet.</p></div>}
            {active === "base64" && <><label>Base64 data URL</label><textarea className="base64-output" readOnly value={base64Text} placeholder="Encoding image…" rows={8}/><div className="button-row"><button className="secondary-btn" onClick={() => copyText(base64Text)} disabled={!base64Text}><Copy size={14}/>{copied ? "Copied" : "Copy Base64"}</button><button className="secondary-btn" onClick={saveBase64} disabled={!base64Text}><ArrowDownToLine size={14}/> Save .txt</button></div><p className="hint">Base64 is larger than the original binary image. Avoid embedding very large images directly in HTML or CSS.</p></>}
            {error && <p className="error-msg">{error}</p>}
            {!informationalTool && <button className="primary-btn process-btn" onClick={process} disabled={busy}>{busy ? "Processing…" : result ? "Process again" : "Process image"} <ArrowRight size={16}/></button>}
            {result && <div className="result-box"><div><Check size={17}/><b>All done!</b></div><p>{formatBytes(file.size)} <ArrowRight size={13}/> <strong>{formatBytes(result.size)}</strong></p><button className="download-btn" onClick={download}><ArrowDownToLine size={16}/> Download image</button></div>}
            <button className="change-file" onClick={clear}><RotateCcw size={13}/> Choose another image</button>
          </div>
        </div>}
        {error && !file && <p className="error-msg">{error}</p>}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => selectFile(e.target.files?.[0])}/>
        <div className="modal-foot"><LockKeyhole size={14}/> Files are processed locally in your browser <button onClick={() => { setActive(null); clear(); }}>Close</button></div>
      </section>
    </div>}
  </div>;
}
