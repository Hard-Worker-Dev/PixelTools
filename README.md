# PixelTools

> Release candidate: **1.0.0-rc.1**. The public beta is deployed; see [release readiness](RELEASE_CHECKLIST.md) for remaining manual launch checks.

A professional, free creative utility workspace for image and file workflows. The platform combines practical browser-local tools with a clearly labeled roadmap of 3,000 planned tools across 30 categories.

## Stack
- React 18, TypeScript and Vite 8
- Canvas API, ImageBitmap and browser File APIs
- PDF processing with pdf-lib and local ZIP export
- EXIF inspection with exifr
- Vitest and React Testing Library
- Cloudflare Pages with GitHub integration

## Working tools
1. Batch Image Converter — convert up to 30 JPG, PNG or WebP files in one run, with individual downloads or a locally generated ZIP archive
2. Image to PDF — combine up to 20 JPG, PNG or WebP images into an ordered A4 PDF, with automatic page orientation and local processing
3. Image Compressor — JPG/WebP quality presets and target-size search, plus PNG lossless export
4. Image Resizer — custom pixels, aspect-ratio lock, percentage scales and social presets
5. Image Cropper — exact pixel coordinates and centered aspect-ratio presets
6. Image Converter — JPG, PNG and WebP, quality controls and configurable JPG background
7. Image Rotator — arbitrary-angle rotation, quick quarter turns and reset
8. Image Flipper — horizontal and vertical mirroring
9. Image Watermark — text or transparent PNG/WebP logo, color, position, opacity and size controls
10. Rounded Corners — adjustable radius with transparent PNG export
11. Image Blur — adjustable blur strength
12. Grayscale Converter — monochrome output
13. Image Color Picker — pixel sampling, dominant color palette, HEX/RGB/HSL and copy actions
14. Image Metadata Viewer — file properties, readable EXIF details (including possible GPS tags) and JSON report export
15. Image to Base64 — copy or save raw Base64 or a full data URL
16. Image Metadata Cleaner — re-encode a clean copy without copying original EXIF/GPS metadata

### Implemented in this feature branch — manual QA pending
17. PDF Merger — combine 2–10 PDFs in a custom order, up to 200 pages
18. PDF Splitter — export selected page ranges as separate PDFs in a ZIP archive
19. PDF Rotator — rotate every page by 90°, 180° or 270°
20. PDF Page Reorder — arrange all pages in a custom sequence
21. PDF Page Extractor — export selected pages as individual PDFs in a ZIP archive
22. PDF Watermark — add adjustable text watermarks to every page, with color, opacity, font size, rotation and five placement options

AI Background Remover and AI Upscaler are shown as coming soon. They are not advertised as working until a real model pipeline is integrated and tested. The tool catalogue now contains 30 roadmap categories with 100 Coming Soon entries each (3,000 planned entries total), separate from the 16 established working tools. Six PDF tools (Merger, Splitter, Rotator, Page Reorder, Page Extractor and Watermark) are implemented in the current feature branch and remain pending independent export-reader and physical-device QA; they are not part of the production release yet. These roadmap entries are not implemented features. See [TOOL_ROADMAP.md](TOOL_ROADMAP.md).

## Privacy and safety
- Working image tools process files locally in the browser; selected image files are not uploaded to a PixelTools image-processing server.
- Supported inputs: JPG, PNG and WebP.
- Image-to-PDF accepts up to 20 pages, 25 MB per source image, 100 MB combined input and 120 megapixels combined per PDF. Output is capped at 150 MB.
- The new PDF Merger accepts 2–10 PDFs, 25 MB per file, 100 MB combined input and 200 pages; output is capped at 150 MB.
- The new PDF Splitter accepts one PDF up to 25 MB and 200 pages; its ZIP output is capped at 150 MB.
- PDF Rotator applies 90°, 180° or 270° page rotation; PDF Page Reorder rearranges up to 200 pages; PDF Page Extractor exports selected pages as separate PDFs in a ZIP. PDF Watermark adds ASCII text to every page with adjustable color, opacity (5–100%), font size (8–96 pt), rotation (-90° to 90°) and placement. PDF outputs are capped at 150 MB. Password-protected PDFs are not supported. All PDF operations run locally in the browser and remain pending manual release QA.
- Single-image tools accept up to 25 MB per file. Batch conversion accepts up to 30 images, 25 MB each and 100 MB combined.
- Input and output dimension guard: header dimensions are checked before pixel decoding; at most 12,000 pixels per side and 60 megapixels total.
- EXIF data can contain sensitive camera details and GPS coordinates; it is read locally in the metadata viewer.
- JPEG exports use a selectable background color because JPEG cannot preserve transparency.
- The Metadata Cleaner re-encodes pixels rather than copying the source file container. Browser encoders may write basic output metadata; do not treat this as a forensic sanitizer.
- The site uses system fonts and is hosted on Cloudflare Pages. Cloudflare may independently process technical request and security data. See the [Privacy Policy](https://pixeltools-9xe.pages.dev/privacy/).

## SEO and informational pages
- Home, About, Privacy Policy, Terms, Contact and 404.
- Dedicated tool landing pages with unique titles, descriptions, canonical URLs and FAQ structured data, including Batch Image Converter, Image to PDF, PDF Merger, PDF Splitter, PDF Rotator, PDF Page Reorder, PDF Page Extractor and PDF Watermark.
- XML sitemap, robots.txt, Open Graph metadata, favicon and security headers.
- Canonical URLs and sitemap entries use the Pages hostname configured for this release.

## Development and verification
```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
```

CI runs full and production-only dependency audits, TypeScript checks, image utility and rendering-pipeline unit tests, tool user-flow tests, static SEO/security contract tests and a production build on pushes to main and the active PDF feature branch, pull requests targeting main or the release-readiness branch, and manual dispatches. Successful builds are retained as 30-day GitHub Actions artifacts. The committed `package-lock.json` is installed with `npm ci` for reproducible dependency resolution.

## Cloudflare Pages
- Project: `pixeltools`
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Live project hostname: `https://pixeltools-9xe.pages.dev`

No server-side environment variables are required for the current browser-only release. If the production hostname changes, update canonical URLs, sitemap and robots.txt.

## Release and support
- Release status and manual acceptance gates: [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)
- Detailed browser/device and export acceptance matrix: [MANUAL_QA_MATRIX.md](MANUAL_QA_MATRIX.md)
- Evidence-based repository audit: [RELEASE_AUDIT.md](RELEASE_AUDIT.md)
- Pakistan legal review decisions and owner/counsel checklist: [LEGAL_REVIEW_PAKISTAN.md](LEGAL_REVIEW_PAKISTAN.md)
- User-facing changes: [CHANGELOG.md](CHANGELOG.md)
- Support and bug reports: [SUPPORT.md](SUPPORT.md)
- Security reporting: [SECURITY.md](SECURITY.md)
- Search Console and sitemap owner setup: [SEARCH_CONSOLE.md](SEARCH_CONSOLE.md)
- GitHub branch protection and repository settings: [GITHUB_SETTINGS.md](GITHUB_SETTINGS.md)
- Production rollback procedure: [ROLLBACK.md](ROLLBACK.md)

## Product policy
PixelTools is free to use. The current release has no ads, subscriptions or paid gates.
