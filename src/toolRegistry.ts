export type ToolId =
  | "compress" | "resize" | "crop" | "convert" | "rotate" | "flip"
  | "watermark" | "rounded" | "blur" | "grayscale" | "color"
  | "metadata" | "base64" | "metadata-cleaner" | "batch" | "image-to-pdf"
  | "pdf-merge" | "pdf-split" | "pdf-rotate" | "pdf-reorder" | "pdf-extract" | "pdf-watermark";

export interface ToolDefinition {
  id: string; title: string; desc: string; icon: string; tag: string;
  category: string; status: "working" | "planned"; comingSoon?: boolean;
}

const coreTools: ToolDefinition[] = [
  { id: "compress", title: "Image Compressor", desc: "Reduce file size with adjustable output quality.", icon: "◈", tag: "Popular" , category: "compression", status: "working" },
  { id: "resize", title: "Image Resizer", desc: "Set precise width and height in pixels.", icon: "▧", tag: "Quick" , category: "resizing", status: "working" },
  { id: "crop", title: "Image Cropper", desc: "Crop to the exact rectangle you need.", icon: "▣", tag: "Precision" , category: "editing", status: "working" },
  { id: "convert", title: "Image Converter", desc: "Convert between JPG, PNG and WebP.", icon: "⇄", tag: "3 formats" , category: "conversion", status: "working" },
  { id: "rotate", title: "Image Rotator", desc: "Rotate an image in 90-degree steps.", icon: "↻", tag: "Quick" , category: "editing", status: "working" },
  { id: "flip", title: "Image Flipper", desc: "Mirror images horizontally or vertically.", icon: "⇋", tag: "Quick" , category: "editing", status: "working" },
  { id: "watermark", title: "Image Watermark", desc: "Add text or a transparent logo watermark with position and opacity controls.", icon: "✎", tag: "Custom" , category: "protection", status: "working" },
  { id: "rounded", title: "Rounded Corners", desc: "Create smooth rounded image corners.", icon: "▢", tag: "Transparent PNG" , category: "editing", status: "working" },
  { id: "blur", title: "Image Blur", desc: "Apply adjustable blur to the full image.", icon: "◌", tag: "Creative" , category: "effects", status: "working" },
  { id: "grayscale", title: "Grayscale Converter", desc: "Convert an image to monochrome.", icon: "◐", tag: "One click" , category: "effects", status: "working" },
  { id: "color", title: "Image Color Picker", desc: "Click any pixel to inspect its color value.", icon: "◉", tag: "Pixel sampling" , category: "analysis", status: "working" },
  { id: "metadata", title: "Image Metadata Viewer", desc: "Inspect file details, type and image dimensions.", icon: "ⓘ", tag: "File details" , category: "metadata", status: "working" },
  { id: "metadata-cleaner", title: "Image Metadata Cleaner", desc: "Export a fresh image copy without the source photo metadata.", icon: "⌁", tag: "Privacy" , category: "metadata", status: "working" },
  { id: "batch", title: "Batch Image Converter", desc: "Convert and optimize up to 30 images at once, then download them individually or as one ZIP.", icon: "▤", tag: "New" , category: "batch", status: "working" },
  { id: "image-to-pdf", title: "Image to PDF", desc: "Combine JPG, PNG or WebP images into an ordered, multi-page A4 PDF.", icon: "▧", tag: "New" , category: "pdf", status: "working" },
  { id: "pdf-merge", title: "PDF Merger", desc: "Combine multiple PDF documents in a custom order, right in your browser.", icon: "▤", tag: "New" , category: "pdf", status: "working" },
  { id: "pdf-split", title: "PDF Splitter", desc: "Extract selected page ranges into separate PDF files.", icon: "▥", tag: "New" , category: "pdf", status: "working" },
  { id: "pdf-rotate", title: "PDF Rotator", desc: "Rotate every page in a PDF clockwise or counterclockwise.", icon: "↻", tag: "New" , category: "pdf", status: "working" },
  { id: "pdf-reorder", title: "PDF Page Reorder", desc: "Change the order of individual PDF pages.", icon: "☷", tag: "New" , category: "pdf", status: "working" },
  { id: "pdf-extract", title: "PDF Page Extractor", desc: "Save selected PDF pages as separate documents in a ZIP.", icon: "▣", tag: "New" , category: "pdf", status: "working" },
  { id: "pdf-watermark", title: "PDF Watermark", desc: "Add adjustable text watermarks to every page of a PDF.", icon: "✎", tag: "New" , category: "pdf", status: "working" },
  { id: "base64", title: "Image to Base64", desc: "Create a Base64 data URL and copy it.", icon: "⌘", tag: "Developer" , category: "developer", status: "working" },
  { id: "background", title: "Background Remover", desc: "AI-powered background removal.", icon: "✧", tag: "Coming soon", comingSoon: true , category: "ai", status: "planned" },
  { id: "upscaler", title: "AI Image Upscaler", desc: "Increase image resolution with an AI model.", icon: "⤢", tag: "Coming soon", comingSoon: true , category: "ai", status: "planned" }
];

export const roadmapCategories = [
  {
    "key": "pdf",
    "label": "PDF Tools",
    "description": "PDF files, pages, forms and document workflows",
    "actions": [
      "Convert",
      "Compress",
      "Merge",
      "Split",
      "Rotate",
      "Reorder",
      "Extract",
      "Watermark",
      "Edit",
      "Protect"
    ],
    "subjects": [
      "PDF to JPG",
      "JPG to PDF",
      "PNG to PDF",
      "WebP to PDF",
      "PDF pages",
      "PDF forms",
      "PDF scans",
      "PDF reports",
      "PDF files",
      "PDF archives"
    ]
  },
  {
    "key": "design",
    "label": "Design & Graphics",
    "description": "Creative composition, layout and graphic design",
    "actions": [
      "Create",
      "Arrange",
      "Overlay",
      "Frame",
      "Border",
      "Shadow",
      "Outline",
      "Reflect",
      "Tile",
      "Stitch"
    ],
    "subjects": [
      "photo collages",
      "social graphics",
      "poster layouts",
      "flyer layouts",
      "presentation graphics",
      "brand graphics",
      "product compositions",
      "mood boards",
      "banners",
      "digital cards"
    ]
  },
  {
    "key": "social",
    "label": "Social Media",
    "description": "Platform-ready image sizing, layouts and publishing assets",
    "actions": [
      "Resize",
      "Design",
      "Crop",
      "Split",
      "Preview",
      "Compose",
      "Export",
      "Caption",
      "Arrange",
      "Optimize"
    ],
    "subjects": [
      "Instagram posts",
      "Instagram stories",
      "Facebook covers",
      "YouTube thumbnails",
      "YouTube banners",
      "TikTok covers",
      "Pinterest pins",
      "LinkedIn banners",
      "X headers",
      "social carousels"
    ]
  },
  {
    "key": "color",
    "label": "Color & Branding",
    "description": "Color conversion, palettes, contrast and brand systems",
    "actions": [
      "Convert",
      "Generate",
      "Extract",
      "Compare",
      "Audit",
      "Visualize",
      "Tune",
      "Pair",
      "Export",
      "Document"
    ],
    "subjects": [
      "HEX colors",
      "RGB colors",
      "HSL colors",
      "brand palettes",
      "image palettes",
      "gradients",
      "duotones",
      "accessible palettes",
      "color tokens",
      "brand kits"
    ]
  },
  {
    "key": "developer",
    "label": "Developer Tools",
    "description": "Image assets and utilities for software development",
    "actions": [
      "Optimize",
      "Convert",
      "Encode",
      "Decode",
      "Inspect",
      "Generate",
      "Validate",
      "Trace",
      "Package",
      "Preview"
    ],
    "subjects": [
      "SVG assets",
      "PNG assets",
      "WebP assets",
      "Base64 data",
      "data URIs",
      "favicons",
      "app icons",
      "PWA icons",
      "responsive images",
      "placeholder hashes"
    ]
  },
  {
    "key": "conversion",
    "label": "Image Conversion",
    "description": "Image format conversion and export pipelines",
    "actions": [
      "Convert",
      "Transcode",
      "Export",
      "Import",
      "Normalize",
      "Batch convert",
      "Preview",
      "Validate",
      "Package",
      "Compare"
    ],
    "subjects": [
      "JPG files",
      "PNG files",
      "WebP files",
      "AVIF files",
      "GIF files",
      "TIFF files",
      "BMP files",
      "HEIC files",
      "ICO files",
      "SVG files"
    ]
  },
  {
    "key": "compression",
    "label": "Image Compression",
    "description": "File-size reduction and quality optimization",
    "actions": [
      "Compress",
      "Optimize",
      "Minify",
      "Re-encode",
      "Downsample",
      "Quantize",
      "Compare",
      "Batch compress",
      "Tune",
      "Report"
    ],
    "subjects": [
      "JPG photos",
      "PNG graphics",
      "WebP images",
      "AVIF images",
      "GIF animations",
      "TIFF scans",
      "large images",
      "transparent images",
      "web assets",
      "image folders"
    ]
  },
  {
    "key": "resizing",
    "label": "Image Resizing",
    "description": "Dimensions, scaling, cropping and responsive variants",
    "actions": [
      "Resize",
      "Scale",
      "Crop",
      "Fit",
      "Fill",
      "Pad",
      "Extend",
      "Generate variants",
      "Batch resize",
      "Inspect"
    ],
    "subjects": [
      "portrait photos",
      "landscape photos",
      "square images",
      "product photos",
      "profile pictures",
      "thumbnails",
      "wallpapers",
      "mobile screens",
      "desktop banners",
      "print images"
    ]
  },
  {
    "key": "editing",
    "label": "Photo Editing",
    "description": "Everyday photo adjustments and retouching workflows",
    "actions": [
      "Adjust",
      "Retouch",
      "Straighten",
      "Sharpen",
      "Soften",
      "Denoise",
      "Enhance",
      "Tone",
      "Balance",
      "Prepare"
    ],
    "subjects": [
      "exposure",
      "brightness",
      "contrast",
      "saturation",
      "white balance",
      "sharpness",
      "skin tones",
      "low-light photos",
      "old photographs",
      "portrait photos"
    ]
  },
  {
    "key": "restoration",
    "label": "Photo Restoration",
    "description": "Repair, recovery and enhancement of damaged images",
    "actions": [
      "Restore",
      "Repair",
      "Recover",
      "Clean",
      "Correct",
      "Rebuild",
      "Enhance",
      "Denoise",
      "Deblur",
      "Colorize"
    ],
    "subjects": [
      "faded photos",
      "scratched photos",
      "dusty scans",
      "creased photos",
      "blurred portraits",
      "old family photos",
      "damaged scans",
      "discolored prints",
      "low-resolution photos",
      "archival images"
    ]
  },
  {
    "key": "ai",
    "label": "AI Image Tools",
    "description": "AI-assisted image understanding and creative workflows",
    "actions": [
      "Generate",
      "Enhance",
      "Remove",
      "Replace",
      "Expand",
      "Relight",
      "Retouch",
      "Segment",
      "Describe",
      "Upscale"
    ],
    "subjects": [
      "backgrounds",
      "objects",
      "portraits",
      "product photos",
      "landscapes",
      "illustrations",
      "textures",
      "scenes",
      "image captions",
      "visual variations"
    ]
  },
  {
    "key": "capture",
    "label": "Screenshots & Capture",
    "description": "Capture, annotate and prepare screen images",
    "actions": [
      "Capture",
      "Annotate",
      "Blur",
      "Highlight",
      "Frame",
      "Crop",
      "Scroll",
      "Compare",
      "Export",
      "Organize"
    ],
    "subjects": [
      "browser pages",
      "desktop screens",
      "mobile screens",
      "web components",
      "long pages",
      "app windows",
      "error messages",
      "tutorial steps",
      "design reviews",
      "bug reports"
    ]
  },
  {
    "key": "icons",
    "label": "Icons & Favicons",
    "description": "Icon creation, conversion and packaging",
    "actions": [
      "Generate",
      "Resize",
      "Convert",
      "Mask",
      "Preview",
      "Package",
      "Validate",
      "Optimize",
      "Colorize",
      "Export"
    ],
    "subjects": [
      "browser favicons",
      "iOS icons",
      "Android icons",
      "Windows icons",
      "macOS icons",
      "PWA icons",
      "app icons",
      "monochrome icons",
      "adaptive icons",
      "notification icons"
    ]
  },
  {
    "key": "vector",
    "label": "SVG & Vector",
    "description": "Vector graphics creation, cleanup and conversion",
    "actions": [
      "Optimize",
      "Trace",
      "Convert",
      "Simplify",
      "Clean",
      "Inspect",
      "Combine",
      "Split",
      "Colorize",
      "Export"
    ],
    "subjects": [
      "SVG logos",
      "SVG icons",
      "line drawings",
      "raster artwork",
      "vector paths",
      "illustrations",
      "charts",
      "diagrams",
      "web graphics",
      "print graphics"
    ]
  },
  {
    "key": "animation",
    "label": "Animation & GIF",
    "description": "Animated image creation, editing and optimization",
    "actions": [
      "Create",
      "Convert",
      "Trim",
      "Loop",
      "Reverse",
      "Resize",
      "Compress",
      "Extract frames",
      "Combine frames",
      "Preview"
    ],
    "subjects": [
      "GIF animations",
      "APNG animations",
      "animated WebP",
      "sprite sheets",
      "reaction clips",
      "product demos",
      "tutorial loops",
      "sticker animations",
      "banner animations",
      "frame sequences"
    ]
  },
  {
    "key": "typography",
    "label": "Typography & Text",
    "description": "Text overlays, typography layouts and text extraction",
    "actions": [
      "Add text to",
      "Style text on",
      "Align text on",
      "Wrap text on",
      "Outline text on",
      "Shadow text on",
      "Extract text from",
      "Translate text in",
      "Detect text in",
      "Export text from"
    ],
    "subjects": [
      "photos",
      "posters",
      "banners",
      "product labels",
      "screenshots",
      "scanned pages",
      "memes",
      "social cards",
      "documents",
      "thumbnails"
    ]
  },
  {
    "key": "protection",
    "label": "Watermark & Protection",
    "description": "Ownership marks, redaction and image protection",
    "actions": [
      "Watermark",
      "Redact",
      "Mask",
      "Stamp",
      "Fingerprint",
      "Track",
      "Protect",
      "Obscure",
      "Label",
      "Audit"
    ],
    "subjects": [
      "photos",
      "product images",
      "documents",
      "proof sheets",
      "preview images",
      "brand assets",
      "portfolio images",
      "screenshots",
      "marketing graphics",
      "download previews"
    ]
  },
  {
    "key": "metadata",
    "label": "Metadata & Privacy",
    "description": "Image metadata inspection, cleanup and privacy checks",
    "actions": [
      "Inspect",
      "Remove",
      "Edit",
      "Export",
      "Compare",
      "Validate",
      "Audit",
      "Summarize",
      "Batch clean",
      "Report"
    ],
    "subjects": [
      "EXIF metadata",
      "GPS coordinates",
      "camera details",
      "IPTC fields",
      "XMP fields",
      "ICC profiles",
      "timestamps",
      "copyright fields",
      "embedded thumbnails",
      "file properties"
    ]
  },
  {
    "key": "analysis",
    "label": "Image Analysis",
    "description": "Image properties, quality metrics and visual inspection",
    "actions": [
      "Analyze",
      "Measure",
      "Detect",
      "Compare",
      "Score",
      "Inspect",
      "Profile",
      "Summarize",
      "Validate",
      "Report"
    ],
    "subjects": [
      "dimensions",
      "aspect ratios",
      "dominant colors",
      "histograms",
      "sharpness",
      "noise levels",
      "file signatures",
      "transparency",
      "color profiles",
      "visual similarity"
    ]
  },
  {
    "key": "batch",
    "label": "Batch Processing",
    "description": "Multi-file workflows and repeatable image operations",
    "actions": [
      "Batch resize",
      "Batch convert",
      "Batch rename",
      "Batch compress",
      "Batch watermark",
      "Batch crop",
      "Batch optimize",
      "Batch export",
      "Batch inspect",
      "Batch package"
    ],
    "subjects": [
      "JPG collections",
      "PNG collections",
      "WebP collections",
      "product catalogs",
      "photo folders",
      "design exports",
      "screenshots",
      "icon libraries",
      "social assets",
      "archive folders"
    ]
  },
  {
    "key": "ecommerce",
    "label": "E-commerce Product Images",
    "description": "Product photography, catalog images and marketplace assets",
    "actions": [
      "Prepare",
      "Resize",
      "Crop",
      "Normalize",
      "Enhance",
      "Shadow",
      "Background",
      "Watermark",
      "Package",
      "Validate"
    ],
    "subjects": [
      "marketplace listings",
      "catalog photos",
      "white-background products",
      "fashion products",
      "electronics",
      "furniture",
      "jewelry",
      "food products",
      "variant photos",
      "product galleries"
    ]
  },
  {
    "key": "print",
    "label": "Print & Documents",
    "description": "Print-ready artwork, page layouts and document images",
    "actions": [
      "Prepare",
      "Bleed-check",
      "DPI-check",
      "Crop",
      "Tile",
      "Impose",
      "Convert",
      "Proof",
      "Annotate",
      "Export"
    ],
    "subjects": [
      "A4 pages",
      "A3 posters",
      "business cards",
      "brochures",
      "labels",
      "stickers",
      "photo prints",
      "book covers",
      "flyers",
      "large-format posters"
    ]
  },
  {
    "key": "web",
    "label": "Web Optimization",
    "description": "Fast-loading web image assets and delivery preparation",
    "actions": [
      "Optimize",
      "Generate",
      "Resize",
      "Compress",
      "Convert",
      "Prepare lazy-load assets for",
      "Create placeholders for",
      "Audit",
      "Package",
      "Preview"
    ],
    "subjects": [
      "hero images",
      "article images",
      "thumbnails",
      "responsive breakpoints",
      "retina displays",
      "background images",
      "Open Graph cards",
      "web galleries",
      "landing pages",
      "content libraries"
    ]
  },
  {
    "key": "accessibility",
    "label": "Accessibility",
    "description": "Accessible graphics, contrast and alternative descriptions",
    "actions": [
      "Check contrast for",
      "Generate alt text for",
      "Review readability of",
      "Simulate color vision for",
      "Add labels to",
      "Inspect text in",
      "Create accessible palettes for",
      "Audit focus visuals in",
      "Describe",
      "Validate"
    ],
    "subjects": [
      "web images",
      "infographics",
      "charts",
      "diagrams",
      "icons",
      "text overlays",
      "product graphics",
      "social posts",
      "presentations",
      "UI screenshots"
    ]
  },
  {
    "key": "qr",
    "label": "QR & Barcode",
    "description": "QR codes, barcodes and scannable visual assets",
    "actions": [
      "Generate",
      "Decode",
      "Style",
      "Validate",
      "Batch create",
      "Add logo to",
      "Export",
      "Print",
      "Inspect",
      "Compose"
    ],
    "subjects": [
      "URL QR codes",
      "Wi-Fi QR codes",
      "contact QR codes",
      "email QR codes",
      "SMS QR codes",
      "product barcodes",
      "EAN codes",
      "UPC codes",
      "Code 128 labels",
      "event QR passes"
    ]
  },
  {
    "key": "mockups",
    "label": "Mockups & Templates",
    "description": "Reusable mockups, layouts and creative templates",
    "actions": [
      "Create",
      "Customize",
      "Preview",
      "Render",
      "Export",
      "Resize",
      "Brand",
      "Arrange",
      "Annotate",
      "Package"
    ],
    "subjects": [
      "device mockups",
      "laptop mockups",
      "phone mockups",
      "tablet mockups",
      "poster templates",
      "book covers",
      "packaging mockups",
      "app screens",
      "website previews",
      "social templates"
    ]
  },
  {
    "key": "background",
    "label": "Background & Removal",
    "description": "Background editing, masking and subject isolation",
    "actions": [
      "Remove",
      "Replace",
      "Blur",
      "Extend",
      "Colorize",
      "Mask",
      "Feather",
      "Refine",
      "Preview",
      "Export"
    ],
    "subjects": [
      "photo backgrounds",
      "product backgrounds",
      "portrait backgrounds",
      "transparent backgrounds",
      "studio scenes",
      "gradient backgrounds",
      "solid backgrounds",
      "outdoor scenes",
      "profile photos",
      "catalog images"
    ]
  },
  {
    "key": "effects",
    "label": "Image Effects & Filters",
    "description": "Creative effects, filters and visual treatments",
    "actions": [
      "Apply",
      "Blend",
      "Layer",
      "Distort",
      "Stylize",
      "Tone",
      "Texture",
      "Glow",
      "Vintage",
      "Preview"
    ],
    "subjects": [
      "vintage effects",
      "film effects",
      "duotone effects",
      "grain effects",
      "glow effects",
      "vignette effects",
      "halftone effects",
      "pixel effects",
      "sketch effects",
      "cinematic looks"
    ]
  },
  {
    "key": "files",
    "label": "File Utilities",
    "description": "Image file inspection, naming and archive utilities",
    "actions": [
      "Inspect",
      "Rename",
      "Compare",
      "Deduplicate",
      "Hash",
      "Sort",
      "Group",
      "Package",
      "Extract",
      "Validate"
    ],
    "subjects": [
      "image files",
      "photo folders",
      "asset libraries",
      "download batches",
      "camera imports",
      "design exports",
      "archive contents",
      "duplicate sets",
      "large files",
      "mixed formats"
    ]
  },
  {
    "key": "creative",
    "label": "Creative Assets",
    "description": "Creative image assets for makers, teams and campaigns",
    "actions": [
      "Generate",
      "Compose",
      "Arrange",
      "Customize",
      "Remix",
      "Export",
      "Preview",
      "Brand",
      "Package",
      "Adapt"
    ],
    "subjects": [
      "stickers",
      "avatars",
      "patterns",
      "textures",
      "wallpapers",
      "mood boards",
      "infographics",
      "event graphics",
      "campaign visuals",
      "presentation covers"
    ]
  }
] as const;

export const roadmapTools: ToolDefinition[] = roadmapCategories.flatMap(group =>
  group.actions.flatMap((action, actionIndex) =>
    group.subjects.map((subject, subjectIndex) => ({
      id: group.key + "-" + (actionIndex + 1) + "-" + (subjectIndex + 1),
      title: action + " " + subject,
      desc: action + " for " + subject + " with browser-based preview and export options.",
      icon: "✧", tag: "Coming soon", comingSoon: true, category: group.key, status: "planned" as const
    }))
  )
);

if (roadmapCategories.length !== 30 || roadmapTools.length !== 3000 ||
    roadmapCategories.some(group => group.actions.length * group.subjects.length !== 100)) {
  throw new Error("Roadmap must contain exactly 100 tools in each of 30 categories.");
}

export const tools: ToolDefinition[] = [...coreTools, ...roadmapTools];
export const workingTools = coreTools.filter(tool => tool.status === "working");
export const plannedTools = tools.filter(tool => tool.status === "planned");
export const toolCategoryCounts: Record<string, number> = Object.fromEntries(
  roadmapCategories.map(group => [group.key, tools.filter(tool => tool.category === group.key).length])
);
export const toolCounts = {
  working: workingTools.length, planned: plannedTools.length, total: tools.length,
  categories: roadmapCategories.length, roadmap: roadmapTools.length
};
