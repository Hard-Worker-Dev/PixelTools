# PixelTools — Expanded Tool Roadmap

**Status:** Catalogue and discovery UI added; all 75 entries are intentionally marked **Coming soon**. They are not implemented, enabled or release-tested yet.

The five new categories below add 15 planned tools each (75 total). The current 14 working image tools remain unchanged. AI Background Remover and AI Image Upscaler also remain Coming Soon.

## PDF Tools — 15 planned tools

1. PDF to JPG
2. JPG to PDF
3. PNG to PDF
4. WebP to PDF
5. PDF Compressor
6. PDF Merger
7. PDF Splitter
8. PDF Page Rotator
9. PDF Page Reorder
10. PDF Page Extractor
11. PDF Watermark
12. PDF Unlock Checker
13. PDF Metadata Viewer
14. PDF Metadata Cleaner
15. PDF Page Numbers

## Design & Graphics — 15 planned tools

1. Image Collage Maker
2. Photo Border Maker
3. Image Frame Maker
4. Meme Generator
5. Image Overlay
6. Image Background Color
7. Image Shadow
8. Image Outline
9. Image Reflection
10. Image Tiler
11. Seamless Pattern Maker
12. Photo Contact Sheet
13. Image Splitter
14. Image Stitcher
15. Perspective Corrector

## Social Media — 15 planned tools

1. Instagram Post Resizer
2. Instagram Story Resizer
3. Facebook Cover Maker
4. YouTube Thumbnail Maker
5. YouTube Banner Maker
6. TikTok Cover Maker
7. Pinterest Pin Resizer
8. LinkedIn Banner Maker
9. X Header Maker
10. Open Graph Image Maker
11. Social Media Image Presets
12. Profile Picture Cropper
13. QR Code Poster Maker
14. Social Carousel Splitter
15. Social Media Safe Area Checker

## Color & Branding — 15 planned tools

1. HEX to RGB Converter
2. RGB to HEX Converter
3. HEX to HSL Converter
4. Color Palette Generator
5. Image Palette Extractor
6. Gradient Generator
7. Gradient Palette Explorer
8. Contrast Checker
9. Accessible Palette Checker
10. Color Blindness Simulator
11. Duotone Generator
12. Color Tint & Shade Generator
13. Brand Kit Builder
14. CSS Color Formatter
15. Palette Exporter

## Developer Tools — 15 planned tools

1. SVG Optimizer
2. SVG to PNG
3. PNG to SVG Trace
4. Image to Data URI
5. Base64 to Image
6. Image URL Inspector
7. Favicon Generator
8. App Icon Generator
9. PWA Icon Pack Generator
10. Responsive Image Srcset Generator
11. Blurhash Generator
12. LQIP Generator
13. Image Checksum Tool
14. Image Dimension Analyzer
15. CSS Image Crop Preview

## Implementation and release gates

- [ ] Implement each tool as a real workflow; do not remove its Coming Soon state before it works.
- [ ] Define supported input formats, file-size/pixel limits, output formats and browser compatibility for each tool.
- [ ] Prefer browser-local processing. Any cloud processing, external API, analytics or storage requires a privacy/security review and updated public disclosures before activation.
- [ ] Add unit tests for core transformations and edge cases.
- [ ] Add UI workflow tests for upload/input, controls, errors, output preview and download.
- [ ] Verify output files independently, including transparency, dimensions, metadata and file signatures where applicable.
- [ ] Add dedicated SEO landing pages, canonical URLs, sitemap entries and accessible descriptions only when each tool is implemented.
- [ ] Run desktop, mobile and physical-device QA for every new workflow.
- [ ] Update Privacy Policy, Terms, support and security documentation if a new data flow or capability is introduced.
- [ ] Release tools in small, tested batches rather than enabling all 75 at once.

## Scope notes

PDF workflows need a separately reviewed PDF parsing/rendering/export stack and must not be represented as image-only canvas transformations. SVG, URL inspection, tracing, and external-resource features need dedicated input sanitization, origin/CORS and content-security review. Tools involving remote URLs must not bypass browser same-origin protections or proxy arbitrary URLs through an unreviewed backend.
