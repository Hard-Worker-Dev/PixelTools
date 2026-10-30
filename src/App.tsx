import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import exifr from "exifr";
import {
  ArrowDownToLine, ArrowRight, Check, Copy, FileImage, Image as ImageIcon,
  LockKeyhole, Menu, RotateCcw, ShieldCheck, Sparkles, UploadCloud, X
} from "lucide-react";
import {
  centeredCropForRatio, extractImagePalette, formatBytes, outputName, readImageDimensions, renderImage, renderImageToTargetSize, rgbToHsl, sampleImageColor,
  type ImageFormat, type RenderOptions
} from "./lib/image";

type ToolId =
  | "compress" | "resize" | "crop" | "convert" | "rotate" | "flip"
  | "watermark" | "rounded" | "blur" | "grayscale" | "color"
  | "metadata" | "base64" | "metadata-cleaner";

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
  { id: "metadata-cleaner", title: "Image Metadata Cleaner", desc: "Export a fresh image copy without the source photo metadata.", icon: "⌁", tag: "Privacy" },
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
  metadata: "image-metadata-viewer", base64: "image-to-base64", "metadata-cleaner": "image-metadata-cleaner"
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
  const [compressionMode, setCompressionMode] = useState<"quality" | "target">("quality");
  const [targetSizeKb, setTargetSizeKb] = useState("200");
  const [compressionMessage, setCompressionMessage] = useState("");
  const [aspectLocked, setAspectLocked] = useState(true);
  const [resizeFitMode, setResizeFitMode] = useState<"contain" | "cover" | "stretch">("contain");
  const [cropRatio, setCropRatio] = useState("free");
  const [toolSearch, setToolSearch] = useState("");
  const [toolCategory, setToolCategory] = useState("all");
  const [resultPreview, setResultPreview] = useState("");
  const [exifData, setExifData] = useState<Record<string, unknown> | null>(null);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [format, setFormat] = useState<ImageFormat>("image/webp");
  const [rotate, setRotate] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [cropX, setCropX] = useState("0");
  const [cropY, setCropY] = useState("0");
  const [cropWidth, setCropWidth] = useState("");
  const [cropHeight, setCropHeight] = useState("");
  const [cropSelection, setCropSelection] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [watermark, setWatermark] = useState("PixelTools");
  const [watermarkColor, setWatermarkColor] = useState("#FFFFFF");
  const [watermarkPosition, setWatermarkPosition] = useState<"bottom-right" | "bottom-left" | "top-right" | "top-left" | "center">("bottom-right");
  const [jpegBackground, setJpegBackground] = useState("#FFFFFF");
  const [watermarkOpacity, setWatermarkOpacity] = useState(70);
  const [watermarkSize, setWatermarkSize] = useState(3.5);
  const [cornerRadius, setCornerRadius] = useState(32);
  const [blur, setBlur] = useState(4);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [base64Text, setBase64Text] = useState("");
  const [base64Mode, setBase64Mode] = useState<"data-url" | "raw">("data-url");
  const [sample, setSample] = useState<{ r: number; g: number; b: number; hex: string } | null>(null);
  const [palette, setPalette] = useState<Array<{ hex: string; count: number }>>([]);
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileSelectionId = useRef(0);
  const cropSelectionRef = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const cropDragging = useRef(false);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  useEffect(() => {
    return () => { if (resultPreview) URL.revokeObjectURL(resultPreview); };
  }, [resultPreview]);

  useEffect(() => {
    if (active === "base64" && file && dimensions.width > 0) {
      readAsDataUrl(file).then(setBase64Text).catch(e => setError(e instanceof Error ? e.message : "Could not encode this image."));
    }
  }, [active, file, dimensions.width]);

  const clear = () => {
    fileSelectionId.current += 1;
    setFile(null);
    setResult(null);
    setResultPreview("");
    setCompressionMessage("");
    setError("");
    setPreview("");
    setBase64Text("");
    setBase64Mode("data-url");
    setSample(null);
    setPalette([]);
    setCopied(false);
    setDimensions({ width: 0, height: 0 });
    cropSelectionRef.current = null;
    setCropSelection(null);
    setExifData(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const closeTool = () => {
    setActive(null);
    clear();
    window.history.replaceState({}, "", "/#tools");
  };

  const setCropSelectionValue = (selection: { x1: number; y1: number; x2: number; y2: number } | null) => {
    cropSelectionRef.current = selection;
    setCropSelection(selection);
  };

  const applyCropRatio = (value: string) => {
    setCropRatio(value);
    if (value === "free" || dimensions.width < 1 || dimensions.height < 1) {
      setCropX("0"); setCropY("0");
      setCropWidth(String(dimensions.width)); setCropHeight(String(dimensions.height));
      setCropSelectionValue(dimensions.width > 0 && dimensions.height > 0 ? { x1: 0, y1: 0, x2: 1, y2: 1 } : null);
      return;
    }
    const [rw, rh] = value.split(":").map(Number);
    const crop = centeredCropForRatio(dimensions.width, dimensions.height, rw / rh);
    setCropX(String(crop.x)); setCropY(String(crop.y));
    setCropWidth(String(crop.width)); setCropHeight(String(crop.height));
    setCropSelectionValue({
      x1: crop.x / dimensions.width,
      y1: crop.y / dimensions.height,
      x2: (crop.x + crop.width) / dimensions.width,
      y2: (crop.y + crop.height) / dimensions.height
    });
  };

  const syncCropSelectionFromPixels = (x: string, y: string, width: string, height: string) => {
    const values = [x, y, width, height].map(Number);
    if (dimensions.width < 1 || dimensions.height < 1 || !values.every(Number.isFinite) || values[0] < 0 || values[1] < 0 || values[2] < 1 || values[3] < 1 || values[0] + values[2] > dimensions.width || values[1] + values[3] > dimensions.height) {
      setCropSelectionValue(null);
      return;
    }
    setCropSelectionValue({
      x1: values[0] / dimensions.width,
      y1: values[1] / dimensions.height,
      x2: (values[0] + values[2]) / dimensions.width,
      y2: (values[1] + values[3]) / dimensions.height
    });
  };

  const resetOptions = () => {
    setQuality(80);
    setCompressionMode("quality");
    setTargetSizeKb("200");
    setCompressionMessage("");
    setAspectLocked(true);
    setResizeFitMode("contain");
    setCropRatio("free");
    setCropX("0");
    setCropY("0");
    setCropWidth(String(dimensions.width));
    setCropHeight(String(dimensions.height));
    setCropSelectionValue(dimensions.width > 0 && dimensions.height > 0
      ? { x1: 0, y1: 0, x2: 1, y2: 1 }
      : null);
    setFormat("image/webp");
    setRotate(0);
    setFlipX(false);
    setFlipY(false);
    setWatermark("PixelTools");
    setWatermarkColor("#FFFFFF");
    setWatermarkPosition("bottom-right");
    setWatermarkOpacity(70);
    setWatermarkSize(3.5);
    setJpegBackground("#FFFFFF");
    setCornerRadius(32);
    setBlur(4);
    setBase64Mode("data-url");
    setSample(null);
    setCopied(false);
    setResult(null);
    setResultPreview("");
    setError("");
  };

  const cropPointFromEvent = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
    };
  };

  const cropPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (active !== "crop" || dimensions.width < 1 || dimensions.height < 1) return;
    event.preventDefault();
    const point = cropPointFromEvent(event);
    cropDragging.current = true;
    if (event.currentTarget.setPointerCapture) event.currentTarget.setPointerCapture(event.pointerId);
    setCropRatio("custom");
    setCropSelectionValue({ x1: point.x, y1: point.y, x2: point.x, y2: point.y });
  };

  const cropPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!cropDragging.current) return;
    const point = cropPointFromEvent(event);
    const current = cropSelectionRef.current;
    if (!current) return;
    setCropSelectionValue({ ...current, x2: point.x, y2: point.y });
  };

  const cropPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!cropDragging.current) return;
    cropDragging.current = false;
    const point = cropPointFromEvent(event);
    const current = cropSelectionRef.current;
    if (!current) return;
    const left = Math.min(current.x1, point.x);
    const top = Math.min(current.y1, point.y);
    const right = Math.max(current.x1, point.x);
    const bottom = Math.max(current.y1, point.y);
    const x = Math.max(0, Math.min(dimensions.width - 1, Math.round(left * dimensions.width)));
    const y = Math.max(0, Math.min(dimensions.height - 1, Math.round(top * dimensions.height)));
    const width = Math.max(1, Math.min(dimensions.width - x, Math.round((right - left) * dimensions.width)));
    const height = Math.max(1, Math.min(dimensions.height - y, Math.round((bottom - top) * dimensions.height)));
    setCropX(String(x));
    setCropY(String(y));
    setCropWidth(String(width));
    setCropHeight(String(height));
    setCropSelectionValue({ x1: x / dimensions.width, y1: y / dimensions.height, x2: (x + width) / dimensions.width, y2: (y + height) / dimensions.height });
    setCropRatio("custom");
  };

  const updateResizeWidth = (value: string) => {
    setWidth(value);
    const nextWidth = Number(value);
    if (aspectLocked && Number.isInteger(nextWidth) && nextWidth > 0 && dimensions.width > 0) {
      setHeight(String(Math.max(1, Math.round(nextWidth * dimensions.height / dimensions.width))));
    }
  };

  const updateResizeHeight = (value: string) => {
    setHeight(value);
    const nextHeight = Number(value);
    if (aspectLocked && Number.isInteger(nextHeight) && nextHeight > 0 && dimensions.height > 0) {
      setWidth(String(Math.max(1, Math.round(nextHeight * dimensions.width / dimensions.height))));
    }
  };

  const chooseTool = (id: ToolId) => {
    setActive(id);
    window.history.pushState({}, "", "/?tool=" + id + "#tools");
    clear();
    setRotate(0);
    setFlipX(false);
    setFlipY(false);
    setAspectLocked(true);
    setResizeFitMode("contain");
    setCropRatio("free");
    setCropX("0");
    setCropY("0");
    setWatermark("PixelTools");
    setWatermarkColor("#FFFFFF");
    setWatermarkPosition("bottom-right");
    setWatermarkOpacity(70);
    setWatermarkSize(3.5);
    setCornerRadius(32);
    setBlur(4);
    setFormat("image/webp");
    setQuality(80);
    setCompressionMode("quality");
    setTargetSizeKb("200");
    setCompressionMessage("");
    setJpegBackground("#FFFFFF");
    setMobileMenuOpen(false);
  };

  const selectFile = (picked?: File) => {
    if (!picked) return;
    if (inputRef.current) inputRef.current.value = "";
    const supported = ["image/jpeg", "image/png", "image/webp"];
    if (!supported.includes(picked.type)) {
      clear();
      setError("Choose a JPG, PNG or WebP image. Other formats are not supported in this release.");
      return;
    }
    if (picked.size > 25 * 1024 * 1024) {
      clear();
      setError("For this release, please choose an image smaller than 25 MB.");
      return;
    }
    const selectionId = ++fileSelectionId.current;
    setFile(picked);
    setDimensions({ width: 0, height: 0 });
    setResult(null);
    setResultPreview("");
    setError("");
    setBase64Text("");
    setSample(null);
    setPalette([]);
    setPreview("");
    readImageDimensions(picked).then(({ width: imageWidth, height: imageHeight }) => {
      if (selectionId !== fileSelectionId.current) return;
      if (imageWidth > 12000 || imageHeight > 12000 || imageWidth * imageHeight > 60000000) {
        setFile(null);
        setDimensions({ width: 0, height: 0 });
        setError("This image is too large to process safely. Maximum dimensions are 12,000 px per side and 60 megapixels total.");
        return;
      }
      setDimensions({ width: imageWidth, height: imageHeight });
      setWidth(String(imageWidth));
      setHeight(String(imageHeight));
      setCropWidth(String(imageWidth));
      setCropHeight(String(imageHeight));
      setCropRatio("free");
      setCropSelectionValue({ x1: 0, y1: 0, x2: 1, y2: 1 });
      setPreview(URL.createObjectURL(picked));
    }).catch((e: unknown) => {
      if (selectionId !== fileSelectionId.current) return;
      setFile(null);
      setPreview("");
      setDimensions({ width: 0, height: 0 });
      setError(e instanceof Error ? e.message : "Could not read this image. Try exporting it as JPG, PNG or WebP.");
    });
  };

  const process = async () => {
    if (!file || !active) return;
    setBusy(true);
    setError("");
    setResult(null);
    setResultPreview("");
    setCompressionMessage("");
    try {
      const options: RenderOptions = { quality: quality / 100, format };
      switch (active) {
        case "compress":
          if (compressionMode === "target" && format === "image/png") throw new Error("Target-size compression works with JPG and WebP. Choose another format or switch back to quality mode.");
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
          options.fitMode = resizeFitMode;
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
          if (x + w > dimensions.width || y + h > dimensions.height) throw new Error("The crop must fit inside the image. Reduce its size or move it inward.");
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
          options.flipX = flipX;
          options.flipY = flipY;
          options.format = format;
          break;
        case "watermark":
          if (!watermark.trim()) throw new Error("Enter watermark text first.");
          options.watermark = watermark;
          options.watermarkOpacity = watermarkOpacity / 100;
          options.watermarkSizePercent = watermarkSize;
          options.watermarkColor = watermarkColor;
          options.watermarkPosition = watermarkPosition;
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
        case "metadata-cleaner":
          options.format = format;
          break;
        default:
          throw new Error("This tool does not need image processing.");
      }
      if (options.format === "image/jpeg") options.backgroundColor = jpegBackground;
      let blob: Blob;
      if (active === "compress" && compressionMode === "target") {
        const targetBytes = Number(targetSizeKb) * 1024;
        const compressed = await renderImageToTargetSize(file, { ...options, quality: 1 }, targetBytes);
        blob = compressed.blob;
        setCompressionMessage(compressed.targetReached
          ? "Target reached at " + Math.round(compressed.quality * 100) + "% quality."
          : "The target could not be reached at the lowest tested quality. The closest result is shown; try WebP or set a larger target.");
      } else {
        blob = await renderImage(file, options);
      }
      setResult(blob);
      setResultPreview(URL.createObjectURL(blob));
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
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const sampleColor = async (event: MouseEvent<HTMLImageElement>) => {
    if (!file) return;
    const rect = event.currentTarget.getBoundingClientRect();
    try {
      const imageRatio = dimensions.width / dimensions.height;
      const boxRatio = rect.width / rect.height;
      const renderedWidth = boxRatio > imageRatio ? rect.height * imageRatio : rect.width;
      const renderedHeight = boxRatio > imageRatio ? rect.height : rect.width / imageRatio;
      const offsetX = (rect.width - renderedWidth) / 2;
      const offsetY = (rect.height - renderedHeight) / 2;
      const x = (event.clientX - rect.left - offsetX) / renderedWidth;
      const y = (event.clientY - rect.top - offsetY) / renderedHeight;
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      setSample(await sampleImageColor(file, x, y));
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

  const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const saveMetadataReport = () => {
    if (!file) return;
    const report = { fileName: file.name, mimeType: file.type, sizeBytes: file.size, width: dimensions.width, height: dimensions.height, lastModified: new Date(file.lastModified).toISOString(), exif: exifData ?? null };
    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    downloadTextFile(baseName + "-metadata.json", JSON.stringify(report, null, 2));
  };
  const saveBase64 = () => {
    if (!base64Text || !file) return;
    const output = base64Mode === "data-url" ? base64Text : base64Text.slice(base64Text.indexOf(",") + 1);
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${file.name}.${base64Mode === "data-url" ? "data-url" : "base64"}.txt`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const toolName = tools.find(t => t.id === active)?.title ?? "";
  const base64Output = base64Mode === "data-url" ? base64Text : base64Text.slice(base64Text.indexOf(",") + 1);
  const filteredTools = tools.filter(tool => {
    const matchesSearch = (tool.title + " " + tool.desc).toLowerCase().includes(toolSearch.trim().toLowerCase());
    const id = String(tool.id);
    const category = toolCategory === "all" || (toolCategory === "optimize" && ["compress","resize","convert"].includes(id)) || (toolCategory === "edit" && ["crop","rotate","flip","watermark","rounded","blur","grayscale"].includes(id)) || (toolCategory === "inspect" && ["color","metadata","base64","metadata-cleaner"].includes(id));
    return matchesSearch && category;
  });

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
  useEffect(() => {
    if (active !== "metadata" || !file || dimensions.width < 1) return;
    let cancelled = false;
    exifr.parse(file).then(data => { if (!cancelled) setExifData((data ?? null) as Record<string, unknown> | null); })
      .catch(() => { if (!cancelled) setExifData(null); });
    return () => { cancelled = true; };
  }, [active, file, dimensions.width]);

  useEffect(() => {
    if (active !== "color" || !file || dimensions.width < 1) return;
    let cancelled = false;
    extractImagePalette(file, 6).then(colors => { if (!cancelled) setPalette(colors); })
      .catch(() => { if (!cancelled) setPalette([]); });
    return () => { cancelled = true; };
  }, [active, file, dimensions.width]);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape" && active) closeTool(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active]);

  useEffect(() => {
    const handlePopState = () => { const nextTool = getInitialTool(); setActive(nextTool); if (nextTool === null) clear(); };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const informationalTool = active === "color" || active === "metadata" || active === "base64";

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" onClick={closeTool}><span className="brand-mark"><ImageIcon size={19}/></span>pixel<span>tools</span></a>
      <nav className={mobileMenuOpen ? "open" : ""}><a href="#tools" onClick={() => setMobileMenuOpen(false)}>All tools</a><a href="#how" onClick={() => setMobileMenuOpen(false)}>How it works</a><a href="#privacy" onClick={() => setMobileMenuOpen(false)}>Privacy</a><a href="/about/">About</a><a href="/contact/">Contact</a></nav>
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
        <div className="tool-discovery">
          <label className="tool-search-label" htmlFor="tool-search">Find the right tool</label>
          <input id="tool-search" className="tool-search" type="search" placeholder="Search compressor, crop, watermark…" value={toolSearch} onChange={e => setToolSearch(e.target.value)} />
          <div className="tool-filters" role="group" aria-label="Filter image tools">
            {[
              ["all","All tools"],["optimize","Optimize"],["edit","Edit"],["inspect","Inspect & data"]
            ].map(([value,label]) => <button type="button" key={value} className={toolCategory === value ? "filter-chip active" : "filter-chip"} aria-pressed={toolCategory === value} onClick={() => setToolCategory(value)}>{label}</button>)}
          </div>
          <p className="tool-count" role="status">{filteredTools.length} tools found</p>
        </div>
        <div className="tool-grid">{filteredTools.map(tool => <button className={tool.comingSoon ? "tool-card disabled" : "tool-card"} key={tool.id} disabled={!!tool.comingSoon} onClick={() => !tool.comingSoon && chooseTool(tool.id as ToolId)}><div className="tool-card-top"><span className="tool-icon">{tool.icon}</span><span className={tool.comingSoon ? "tool-tag coming" : "tool-tag"}>{tool.tag}</span></div><h3>{tool.title}</h3><p>{tool.desc}</p><span className="tool-link">{tool.comingSoon ? "In development" : "Open tool"} {!tool.comingSoon && <ArrowRight size={15}/>}</span></button>)}</div>
        {filteredTools.length === 0 && <p className="empty-tools">No matching tools. Try another search or choose “All tools”.</p>}
      </section>
      <section className="privacy-section" id="privacy"><div className="privacy-icon"><ShieldCheck size={25}/></div><div><div className="eyebrow">YOUR PRIVACY MATTERS</div><h2>Your images are <span>yours.</span></h2><p>Working tools process your images directly in your browser. Your files are not uploaded to PixelTools servers, and there is no account to create. AI background removal and upscaling are not enabled yet.</p></div><div className="privacy-stamp"><LockKeyhole size={18}/><b>PRIVATE</b><small>By design</small></div></section>
      <section className="how-section" id="how"><div className="eyebrow">THREE SIMPLE STEPS</div><h2>From upload to <span>done.</span></h2><div className="steps"><div><b>01</b><h3>Choose a tool</h3><p>Pick the image task you want to get done.</p></div><div><b>02</b><h3>Add your image</h3><p>Drop a file or browse your device. That's it.</p></div><div><b>03</b><h3>Download & go</h3><p>Process locally and save your finished image.</p></div></div></section>
    </main>
    <footer><a className="brand" href="/"><span className="brand-mark"><ImageIcon size={17}/></span>pixel<span>tools</span></a><p>Thoughtful image tools. Free for everyone.</p><nav className="footer-links"><a href="/about/">About</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/contact/">Contact</a></nav><small>© 2026 PixelTools. Made for the web.</small></footer>

    {active && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) closeTool() }}>
      <section className="tool-modal" role="dialog" aria-modal="true" aria-label={toolName}>
        <div className="modal-head"><div><div className="eyebrow">PIXELTOOLS WORKSPACE</div><h2>{toolName}</h2><p className="modal-subtitle">{tools.find(t => t.id === active)?.desc}</p></div><button className="icon-btn" aria-label="Close tool" onClick={closeTool}><X size={20}/></button></div>
        <div className="workflow-steps" aria-label="Tool workflow"><span className={!file ? "current" : "done"}><b>1</b> Add image</span><span className={file ? "current" : ""}><b>2</b> Adjust options</span><span className={result ? "done current" : ""}><b>3</b> Download</span></div>
        {!file ? <button className="dropzone" onClick={() => inputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); selectFile(e.dataTransfer.files[0]); }}><span className="upload-icon"><UploadCloud size={28}/></span><b>Drop your image here</b><span>or click to browse files</span><small>JPG, PNG, WebP · Up to 25 MB</small></button> : <div className="workspace">
          <div className="preview-panel">
            {preview ? <div className={active === "crop" ? "preview-image-frame crop-mode" : "preview-image-frame"} onPointerDown={active === "crop" ? cropPointerDown : undefined} onPointerMove={active === "crop" ? cropPointerMove : undefined} onPointerUp={active === "crop" ? cropPointerUp : undefined} onPointerCancel={() => { cropDragging.current = false; }}><img src={preview} alt="Selected image preview" onClick={active === "color" ? sampleColor : undefined} onKeyDown={active === "color" ? async e => { if ((e.key === "Enter" || e.key === " ") && file) { e.preventDefault(); try { setSample(await sampleImageColor(file, 0.5, 0.5)); } catch { setError("Could not sample the center pixel."); } } } : undefined} tabIndex={active === "color" ? 0 : undefined} role={active === "color" ? "button" : undefined} aria-label={active === "color" ? "Sample image color. Click or press Enter to read the center pixel." : undefined} className={active === "color" ? "sample-cursor" : ""}/>{active === "crop" && cropSelection && <div className="crop-selection-overlay" aria-hidden="true" style={{left: Math.min(cropSelection.x1,cropSelection.x2)*100 + "%", top: Math.min(cropSelection.y1,cropSelection.y2)*100 + "%", width: Math.abs(cropSelection.x2-cropSelection.x1)*100 + "%", height: Math.abs(cropSelection.y2-cropSelection.y1)*100 + "%"}}/>}</div> : <p className="hint">Checking image dimensions and preparing a safe preview…</p>}
            <div className="preview-caption"><span>{file.name}</span><b>{formatBytes(file.size)}</b></div>
            {active === "color" && <small className="hint">Click anywhere on the image to sample a pixel.</small>}
          </div>
          <div className="settings-panel">
            {active === "compress" && <><label htmlFor="pixeltool-field-1">Output format</label><select id="pixeltool-field-1" className="text-input" value={format} onChange={e => { const value=e.target.value as ImageFormat; setFormat(value); if(value==="image/png") setCompressionMode("quality"); }}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select><label className="check-label target-mode-toggle" htmlFor="pixeltool-field-2"><input type="checkbox" checked={compressionMode === "target"} disabled={format === "image/png"} onChange={e => setCompressionMode(e.target.checked ? "target" : "quality")}/> Aim for a maximum file size</label>{compressionMode === "target" && format !== "image/png" ? <><label>Maximum size (KB)</label><input id="pixeltool-field-2" className="text-input" type="number" min="1" max="25600" step="1" value={targetSizeKb} onChange={e => setTargetSizeKb(e.target.value)}/><div className="quick-sizes"><span>Quick targets</span>{[50,100,200,500,1000].map(size => <button type="button" key={size} className={Number(targetSizeKb)===size ? "size-chip selected" : "size-chip"} aria-pressed={Number(targetSizeKb)===size} onClick={() => setTargetSizeKb(String(size))}>{size>=1000 ? (size/1000)+" MB" : size+" KB"}</button>)}</div><p className="hint">PixelTools tests multiple quality levels and selects the highest tested quality that stays within your target. Some detailed images cannot reach very small sizes.</p></> : format === "image/png" ? <p className="hint">PNG is lossless, so there is no quality slider and re-encoding may not reduce file size. For smaller files, switch to WebP or JPG (JPG uses the background color setting below).</p> : <><label htmlFor="pixeltool-field-3">Image quality <b>{quality}%</b></label><input id="pixeltool-field-3" type="range" min="20" max="100" value={quality} onChange={e => setQuality(Number(e.target.value))}/><div className="quick-sizes quality-presets"><span>Quick quality</span>{[["small","Smaller",65],["balanced","Balanced",80],["best","Best quality",92]].map(([id,label,value]) => <button type="button" key={id} className={quality===Number(value) ? "size-chip selected" : "size-chip"} aria-pressed={quality===Number(value)} onClick={() => setQuality(Number(value))}>{label}</button>)}</div><p className="hint">JPEG and WebP quality settings control compression.</p></>}</>}
            {active === "resize" && <><label htmlFor="pixeltool-field-4">Ready-made sizes</label><select id="pixeltool-field-4" className="text-input" defaultValue="" onChange={e => { const values: Record<string,[number,number]> = {"instagram-post":[1080,1080],"instagram-story":[1080,1920],"youtube-thumbnail":[1280,720],"facebook-cover":[820,312],"profile-picture":[400,400],"full-hd":[1920,1080]}; const picked=values[e.target.value]; if(picked){ setWidth(String(picked[0])); setHeight(String(picked[1])); setAspectLocked(false); setResizeFitMode("cover"); } }}><option value="" disabled>Choose a popular canvas size…</option><option value="instagram-post">Instagram post · 1080 × 1080</option><option value="instagram-story">Instagram / Story · 1080 × 1920</option><option value="youtube-thumbnail">YouTube thumbnail · 1280 × 720</option><option value="facebook-cover">Facebook cover · 820 × 312</option><option value="profile-picture">Profile picture · 400 × 400</option><option value="full-hd">Full HD · 1920 × 1080</option></select><label htmlFor="pixeltool-field-5">Width (pixels)</label><input id="pixeltool-field-5" className="text-input" type="number" min="1" max="12000" value={width} onChange={e => updateResizeWidth(e.target.value)}/><label htmlFor="pixeltool-field-6">Height (pixels)</label><input id="pixeltool-field-6" className="text-input" type="number" min="1" max="12000" value={height} onChange={e => updateResizeHeight(e.target.value)}/><label className="check-label ratio-lock"><input id="pixeltool-aspect-lock" type="checkbox" checked={aspectLocked} onChange={e => setAspectLocked(e.target.checked)}/> Keep original aspect ratio</label><div className="quick-sizes"><span>Scale</span>{[25,50,75,100].map(percent => <button type="button" key={percent} className="size-chip" onClick={() => { const w=Math.max(1,Math.round(dimensions.width*percent/100)); const h=Math.max(1,Math.round(dimensions.height*percent/100)); setWidth(String(w)); setHeight(String(h)); }}>{percent}%</button>)}</div><label htmlFor="pixeltool-resize-format">Export format</label><select id="pixeltool-resize-format" className="text-input" value={format} onChange={e => setFormat(e.target.value as ImageFormat)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select>{format !== "image/png" && <><label htmlFor="pixeltool-field-8">Output quality <b>{quality}%</b></label><input id="pixeltool-field-8" type="range" min="20" max="100" value={quality} onChange={e => setQuality(Number(e.target.value))}/></>}<label htmlFor="pixeltool-resize-fit">How should the image fit?</label><select id="pixeltool-resize-fit" className="text-input" value={resizeFitMode} onChange={e => setResizeFitMode(e.target.value as "contain" | "cover" | "stretch")}><option value="contain">Fit whole image · no cropping</option><option value="cover">Fill canvas · crop overflow</option><option value="stretch">Stretch · may distort proportions</option></select><p className="hint">{resizeFitMode === "contain" ? "Keeps the whole image visible. Empty canvas areas stay transparent in PNG or use your JPG background color." : resizeFitMode === "cover" ? "Fills the requested dimensions without distortion. Some edges may be cropped from the center." : "Fills the exact dimensions but may make the image look wider or taller."} Original: {dimensions.width} × {dimensions.height} px. Output is limited to 60 megapixels.</p></>}
            {active === "crop" && <><label>Crop shape</label><p className="hint">Drag directly on the image to draw a crop area, or use a preset and fine-tune the pixel values below.</p><div className="crop-ratios">{[["free","Free"],["1:1","Square"],["4:3","4:3"],["3:2","3:2"],["16:9","16:9"],["9:16","Portrait"]].map(([value,label]) => <button type="button" key={value} className={cropRatio===value ? "size-chip selected" : "size-chip"} aria-pressed={cropRatio===value} onClick={() => applyCropRatio(value)}>{label}</button>)}</div><div className="field-grid"><div><label htmlFor="pixeltool-field-9">Left (px)</label><input id="pixeltool-field-9" className="text-input" type="number" min="0" value={cropX} onChange={e => { const value=e.target.value; setCropX(value); setCropRatio("custom"); syncCropSelectionFromPixels(value,cropY,cropWidth,cropHeight); }}/></div><div><label htmlFor="pixeltool-field-10">Top (px)</label><input id="pixeltool-field-10" className="text-input" type="number" min="0" value={cropY} onChange={e => { const value=e.target.value; setCropY(value); setCropRatio("custom"); syncCropSelectionFromPixels(cropX,value,cropWidth,cropHeight); }}/></div><div><label htmlFor="pixeltool-field-11">Width (px)</label><input id="pixeltool-field-11" className="text-input" type="number" min="1" value={cropWidth} onChange={e => { const value=e.target.value; setCropWidth(value); setCropRatio("custom"); syncCropSelectionFromPixels(cropX,cropY,value,cropHeight); }}/></div><div><label htmlFor="pixeltool-field-12">Height (px)</label><input id="pixeltool-field-12" className="text-input" type="number" min="1" value={cropHeight} onChange={e => { const value=e.target.value; setCropHeight(value); setCropRatio("custom"); syncCropSelectionFromPixels(cropX,cropY,cropWidth,value); }}/></div></div><label htmlFor="pixeltool-field-13">Output format</label><select id="pixeltool-field-13" className="text-input" value={format} onChange={e => setFormat(e.target.value as ImageFormat)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select><p className="hint">Original size: {dimensions.width} × {dimensions.height} px. Crop presets automatically center the selection. You can fine-tune the left, top, width and height values below.</p></>}
            {active === "convert" && <><label htmlFor="pixeltool-field-14">Convert to</label><select id="pixeltool-field-14" className="text-input" value={format} onChange={e => setFormat(e.target.value as ImageFormat)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select>{format !== "image/png" && <><label htmlFor="pixeltool-field-15">Output quality <b>{quality}%</b></label><input id="pixeltool-field-15" type="range" min="20" max="100" value={quality} onChange={e => setQuality(Number(e.target.value))}/></>}<p className="hint">PNG and WebP preserve transparency. JPG has no transparency and uses the background color selector below.</p></>}
            {active === "rotate" && <><label htmlFor="pixeltool-field-16">Rotation angle <b>{rotate}°</b></label><input id="pixeltool-field-16" type="range" min="0" max="359" step="1" value={rotate} onChange={e => setRotate(Number(e.target.value))}/><div className="button-row"><button className="secondary-btn" onClick={() => setRotate(v => (v + 270) % 360)}><RotateCcw size={15}/> Left 90°</button><button className="secondary-btn" onClick={() => setRotate(v => (v + 90) % 360)}>Right 90° <RotateCcw size={15}/></button><button className="secondary-btn" onClick={() => setRotate(0)}>Reset</button></div><p className="hint">Rotate by any whole degree or use the quick 90° buttons. The output canvas expands to avoid cutting off the corners.</p><label htmlFor="pixeltool-field-17">Output format</label><select id="pixeltool-field-17" className="text-input" value={format} onChange={e => setFormat(e.target.value as ImageFormat)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></>}
            {active === "flip" && <><p className="settings-label">Mirror directions</p><label className="check-label"><input id="pixeltool-flip-horizontal" type="checkbox" checked={flipX} onChange={e => setFlipX(e.target.checked)}/> Horizontal · left and right</label><label className="check-label"><input id="pixeltool-flip-vertical" type="checkbox" checked={flipY} onChange={e => setFlipY(e.target.checked)}/> Vertical · top and bottom</label><div className="button-row"><button type="button" className="secondary-btn" onClick={() => { setFlipX(false); setFlipY(false); }}>Reset flips</button><button type="button" className="secondary-btn" onClick={() => { setFlipX(true); setFlipY(true); }}>Flip both</button></div><label htmlFor="pixeltool-flip-format">Output format</label><select id="pixeltool-flip-format" className="text-input" value={format} onChange={e => setFormat(e.target.value as ImageFormat)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></>}
            {active === "watermark" && <><label htmlFor="pixeltool-field-19">Watermark text</label><input id="pixeltool-field-19" className="text-input" value={watermark} maxLength={80} onChange={e => setWatermark(e.target.value)} placeholder="Enter watermark text"/><label htmlFor="pixeltool-field-20">Text color</label><input id="pixeltool-field-20" className="text-input color-input" type="color" value={watermarkColor} onChange={e => setWatermarkColor(e.target.value)}/><label htmlFor="pixeltool-field-21">Position</label><select id="pixeltool-field-21" className="text-input" value={watermarkPosition} onChange={e => setWatermarkPosition(e.target.value as typeof watermarkPosition)}><option value="bottom-right">Bottom right</option><option value="bottom-left">Bottom left</option><option value="top-right">Top right</option><option value="top-left">Top left</option><option value="center">Center</option></select><label htmlFor="pixeltool-field-22">Text size <b>{watermarkSize}% of image</b></label><input id="pixeltool-field-22" type="range" min="1" max="12" step="0.5" value={watermarkSize} onChange={e => setWatermarkSize(Number(e.target.value))}/><label htmlFor="pixeltool-field-23">Opacity <b>{watermarkOpacity}%</b></label><input id="pixeltool-field-23" type="range" min="10" max="100" value={watermarkOpacity} onChange={e => setWatermarkOpacity(Number(e.target.value))}/><label htmlFor="pixeltool-field-24">Output format</label><select id="pixeltool-field-24" className="text-input" value={format} onChange={e => setFormat(e.target.value as ImageFormat)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></>}
            {active === "rounded" && <><label htmlFor="pixeltool-field-25">Corner radius <b>{cornerRadius}px</b></label><input id="pixeltool-field-25" type="range" min="4" max="240" value={cornerRadius} onChange={e => setCornerRadius(Number(e.target.value))}/><p className="hint">The output is PNG so transparent rounded corners are preserved.</p></>}
            {active === "blur" && <><label htmlFor="pixeltool-field-26">Blur strength <b>{blur}px</b></label><input id="pixeltool-field-26" type="range" min="1" max="20" value={blur} onChange={e => setBlur(Number(e.target.value))}/><label htmlFor="pixeltool-field-27">Output format</label><select id="pixeltool-field-27" className="text-input" value={format} onChange={e => setFormat(e.target.value as ImageFormat)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></>}
            {active === "grayscale" && <><p className="hint">Convert the image to grayscale while preserving its dimensions.</p><label htmlFor="pixeltool-field-28">Output format</label><select id="pixeltool-field-28" className="text-input" value={format} onChange={e => setFormat(e.target.value as ImageFormat)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></>}
            {active === "color" && <><p className="hint">Click a pixel in the preview to sample it. The palette below is generated from the whole image.</p>{sample && <div className="sample-result"><span style={{ background: sample.hex }}></span><div><b>{sample.hex}</b><small>RGB({sample.r}, {sample.g}, {sample.b}) · HSL({rgbToHsl(sample.r, sample.g, sample.b).h}, {rgbToHsl(sample.r, sample.g, sample.b).s}%, {rgbToHsl(sample.r, sample.g, sample.b).l}%)</small></div><button className="secondary-btn" onClick={() => copyText(sample.hex)}><Copy size={14}/>{copied ? "Copied" : "Copy HEX"}</button><button className="secondary-btn" onClick={() => copyText("rgb(" + sample.r + ", " + sample.g + ", " + sample.b + ")")}><Copy size={14}/>Copy RGB</button><button className="secondary-btn" onClick={() => { const hsl = rgbToHsl(sample.r, sample.g, sample.b); copyText("hsl(" + hsl.h + ", " + hsl.s + "%, " + hsl.l + "%)"); }}><Copy size={14}/>Copy HSL</button></div>}<div className="palette-panel"><div className="palette-heading"><b>Image color palette</b><button type="button" className="secondary-btn" onClick={() => copyText(palette.map(color => color.hex).join(", "))} disabled={palette.length === 0}><Copy size={13}/> Copy all</button></div>{palette.length > 0 ? <div className="palette-grid">{palette.map(color => <button type="button" key={color.hex} className="palette-color" onClick={() => copyText(color.hex)} title={"Copy " + color.hex + " · " + color.count + " pixels"}><span style={{ background: color.hex }}></span><b>{color.hex}</b></button>)}</div> : <p className="hint">Building a palette from the image…</p>}</div></>}
            {active === "metadata-cleaner" && <><p className="hint">Create a fresh copy by decoding and re-encoding the image in your browser. This removes the source file’s embedded camera metadata and GPS tags rather than copying the original binary file.</p><label htmlFor="pixeltool-field-29">Clean copy format</label><select id="pixeltool-field-29" className="text-input" value={format} onChange={e => setFormat(e.target.value as ImageFormat)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select>{format !== "image/png" && <><label htmlFor="pixeltool-field-30">Output quality <b>{quality}%</b></label><input id="pixeltool-field-30" type="range" min="20" max="100" value={quality} onChange={e => setQuality(Number(e.target.value))}/></>}<p className="metadata-privacy">Your source file is not changed. The browser may write basic output metadata during re-encoding, but original EXIF/GPS camera tags are not copied by this workflow.</p></>}
            {active === "metadata" && <div className="metadata-list"><div><span>File name</span><b>{file.name}</b></div><div><span>Format / MIME</span><b>{file.type}</b></div><div><span>File size</span><b>{formatBytes(file.size)}</b></div><div><span>Dimensions</span><b>{dimensions.width} × {dimensions.height} px</b></div><div><span>Last modified</span><b>{new Date(file.lastModified).toLocaleString()}</b></div>{exifData && Object.entries(exifData).filter(([key,value]) => ["Make","Model","DateTimeOriginal","CreateDate","ModifyDate","LensModel","ISO","FNumber","ExposureTime","FocalLength","Orientation","Software","GPSLatitude","GPSLongitude"].includes(key) && value != null).map(([key,value]) => <div key={key}><span>{key}</span><b>{Array.isArray(value) ? value.join(", ") : value instanceof Date ? value.toLocaleString() : String(value)}</b></div>)}<p className="metadata-privacy">EXIF can contain camera details and sometimes GPS coordinates. This information is read locally and never uploaded by PixelTools. Review sensitive fields before sharing this report.</p>{!exifData && <p className="hint">No readable EXIF data was found in this image. Some formats and apps strip camera metadata.</p>}<div className="metadata-actions"><button type="button" className="secondary-btn" onClick={saveMetadataReport}><ArrowDownToLine size={14}/> Download metadata JSON</button><button type="button" className="secondary-btn" onClick={() => copyText(JSON.stringify({fileName:file.name,mimeType:file.type,sizeBytes:file.size,width:dimensions.width,height:dimensions.height,lastModified:file.lastModified,exif:exifData},null,2))}><Copy size={14}/> Copy metadata JSON</button></div></div>}
            {active === "base64" && <><label htmlFor="pixeltool-field-31">Output type</label><select id="pixeltool-field-31" className="text-input" value={base64Mode} onChange={e => setBase64Mode(e.target.value as "data-url" | "raw")}><option value="data-url">Data URL (includes MIME prefix)</option><option value="raw">Raw Base64 only</option></select><label htmlFor="pixeltool-field-32">{base64Mode === "data-url" ? "Base64 data URL" : "Raw Base64 text"}</label><textarea id="pixeltool-field-32" className="base64-output" readOnly value={base64Output} placeholder="Encoding image…" rows={8}/><div className="button-row"><button className="secondary-btn" onClick={() => copyText(base64Output)} disabled={!base64Output}><Copy size={14}/>{copied ? "Copied" : "Copy Base64"}</button><button className="secondary-btn" onClick={saveBase64} disabled={!base64Output}><ArrowDownToLine size={14}/> Save .txt</button></div><p className="hint">Data URLs include the MIME type prefix. Raw Base64 contains only the encoded payload. Both are larger than the original binary file.</p></>}
            {["crop","rotate","flip","watermark","blur","grayscale"].includes(active ?? "") && format !== "image/png" && <><label htmlFor="pixeltool-field-33">Export quality <b>{quality}%</b></label><input id="pixeltool-field-33" type="range" min="20" max="100" value={quality} onChange={e => setQuality(Number(e.target.value))}/><div className="quick-sizes quality-presets">{[["small","Smaller",65],["balanced","Balanced",80],["best","Best quality",92]].map(([id,label,value]) => <button type="button" key={id} className={quality===Number(value) ? "size-chip selected" : "size-chip"} aria-pressed={quality===Number(value)} onClick={() => setQuality(Number(value))}>{label}</button>)}</div></>}
            {format === "image/jpeg" && !["color","metadata","base64","rounded"].includes(active ?? "") && <><label htmlFor="pixeltool-field-34">JPG background color</label><input id="pixeltool-field-34" className="text-input color-input" type="color" value={jpegBackground} onChange={e => setJpegBackground(e.target.value)}/><p className="hint">Transparent areas are filled with this color when exporting to JPG.</p></>}{error && <p className="error-msg" role="alert" aria-live="polite">{error}</p>}
            <button type="button" className="change-file reset-options" onClick={resetOptions}>Reset settings to defaults</button>
            {!informationalTool && <button className="primary-btn process-btn" onClick={process} disabled={busy || !dimensions.width}>{busy ? "Processing…" : result ? "Process again" : "Process image"} <ArrowRight size={16}/></button>}
            {result && <div className="result-box" role="status" aria-live="polite"><div><Check size={17}/><b>Your image is ready</b></div>{resultPreview && <img className="result-preview" src={resultPreview} alt="Processed image preview"/>}<p className="result-sizes"><span>Original <strong>{formatBytes(file.size)}</strong></span><ArrowRight size={13}/><span>New file <strong>{formatBytes(result.size)}</strong></span></p><p className="result-savings">{result.size <= file.size ? `${Math.round((file.size-result.size)/file.size*100)}% smaller` : `${Math.round((result.size-file.size)/file.size*100)}% larger`} than original</p>{compressionMessage && <p className="hint compression-notice" role="status">{compressionMessage}</p>}<button className="download-btn" onClick={download}><ArrowDownToLine size={16}/> Download image</button></div>}
            <button className="change-file" onClick={() => inputRef.current?.click()}><RotateCcw size={13}/> Replace image</button>
          </div>
        </div>}
        {error && !file && <p className="error-msg" role="alert" aria-live="polite">{error}</p>}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => selectFile(e.target.files?.[0])}/>
        <div className="modal-foot"><LockKeyhole size={14}/> Files are processed locally in your browser <button onClick={closeTool}>Close</button></div>
      </section>
    </div>}
  </div>;
}
