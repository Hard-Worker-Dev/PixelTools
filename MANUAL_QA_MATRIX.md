# PixelTools Manual QA and Export Acceptance Matrix

**Release candidate:** 1.0.0-rc.1  
**Production hostname:** https://pixeltools-9xe.pages.dev  
**Purpose:** Repeatable manual acceptance for browser engines and physical devices. Record browser version, OS/device, sample file hash, output file hash, dimensions, MIME type and tester/date for each run.

## Test environment matrix

| Environment | Required coverage | Evidence |
|---|---|---|
| Chrome desktop (current stable) | All 22 feature-branch tools; JPG, PNG, WebP, image-to-PDF, PDF merge/split/rotate/reorder/extract/watermark and ZIP exports | Browser/version, OS, screenshots, output files |
| Edge desktop (current stable) | All 22 feature-branch tools; JPG, PNG, WebP, PDF merge/split/rotate/reorder/extract/watermark | Browser/version, OS, output files |
| Firefox desktop (current stable) | All 22 feature-branch tools; JPG, PNG, WebP, PDF merge/split/rotate/reorder/extract/watermark | Browser/version, OS, output files |
| Android Chrome, physical device | Upload, tool controls, download/share, orientation | Device model, Android version, screenshots |
| iPhone Safari, physical device | Upload, tool controls, download/share, orientation | Device model, iOS version, screenshots |
| Tablet viewport and touch | Navigation, dialogs, crop gestures, controls | Viewport dimensions, device/browser |

Do not mark an environment complete based only on responsive emulation in desktop DevTools.

## Common test assets

Prepare lawful, non-sensitive sample images and keep originals unchanged:

- Small RGB JPEG with EXIF camera/date metadata and GPS test tags.
- PNG with transparent background and semi-transparent edges.
- WebP with transparency.
- Large landscape and portrait photographs with different aspect ratios.
- High-resolution image near (but not exceeding) 60 megapixels.
- File near the 25 MB upload limit.
- Invalid text file renamed with an image extension.
- Corrupt/truncated JPG, PNG and WebP samples.

Record SHA-256 hashes for source and output assets. Never use private user photographs as public test fixtures.

## Per-tool acceptance

| Tool | Primary workflow | Output acceptance |
|---|---|---|
| Image Compressor | Run quality presets and target-size mode on JPG/WebP; run PNG lossless path | Correct extension and MIME; output opens; target size message is accurate; compare visual artifacts |
| Image Resizer | Set exact dimensions; test aspect lock, contain, cover and stretch | Exact pixel dimensions; contain/cover do not distort; stretch only when selected |
| Image Cropper | Drag selection; enter pixel coordinates; use aspect presets | Output dimensions match crop rectangle; no out-of-bounds pixels |
| Image Converter | Convert each supported input to JPG, PNG and WebP | Correct output MIME/extension; transparency preserved by PNG/WebP; JPG background is selected color |
| Image Rotator | Quarter turns and arbitrary angles | Correct orientation and output bounds; no clipped corners |
| Image Flipper | Horizontal and vertical flip independently and together | Pixel orientation matches expected mirror |
| Image Watermark | Text and transparent logo; all positions, sizes and opacity values | Logo/text visible, correctly placed and scaled; source remains unchanged |
| Rounded Corners | Minimum, middle and maximum radius | PNG output has transparent rounded corners; corner pixels are transparent |
| Image Blur | Minimum, middle and maximum blur | Blur strength changes monotonically; dimensions remain correct |
| Grayscale Converter | Process RGB and transparent source | Neutral grayscale; alpha/transparency retained |
| Image Color Picker | Sample known solid-color pixels and inspect palette | HEX/RGB/HSL values match reference pixels; transparent pixels are ignored |
| Image Metadata Viewer | Inspect EXIF-bearing and metadata-free images | File details and available EXIF fields are accurate; GPS is clearly treated as sensitive |
| Image to Base64 | Generate data URL and raw Base64; copy and save | Decoding output reproduces source bytes; data URL prefix only appears in data-URL mode |
| Image Metadata Cleaner | Re-encode EXIF-bearing source to each supported output format | Independent EXIF inspection confirms source EXIF/GPS tags are not copied; document any encoder-added generic metadata |
| Batch Image Converter | Process mixed JPG/PNG/WebP sets; test all output formats, add/remove files, stop control and ZIP export | Each output opens and has correct MIME/extension; ZIP passes independent archive integrity test; duplicate output names are unique; failed files are reported |
| Image to PDF | Create one- and multi-page PDFs; reorder pages; test portrait/landscape images, PNG transparency and quality settings | PDF opens in an independent reader; page count and page order match; A4 page orientation and image fit are correct; transparent pixels render on white |
| PDF Merger | Merge 2–10 PDFs; reorder source files; test page/file limits | Independent reader opens output; page count, dimensions and source order are correct |
| PDF Splitter | Extract single pages and multiple ranges; test overlapping/invalid ranges | ZIP passes external integrity check; every PDF opens and contains exactly its requested pages |
| PDF Rotator | Rotate 90°, 180°, 270° and counterclockwise; test pre-rotated pages | Independent reader confirms effective orientation; existing rotations are preserved and adjusted |
| PDF Page Reorder | Move first/middle/last pages; export custom sequences | Independent reader confirms every original page appears once in requested order |
| PDF Page Extractor | Select all, none, one, multiple and non-contiguous pages | ZIP passes external integrity check; every extracted PDF opens and matches the selected source page |
| PDF Watermark | Test all five positions, 5–100% opacity, 8–96 pt size, -90° to 90° rotation, different page sizes and long text | Independent reader confirms text on every page, correct placement/opacity/rotation, original page dimensions and unchanged source file |

## Download and file integrity checks

For every export path:

1. Verify download filename and extension.
2. Verify the actual file signature/MIME using an independent local file inspector; do not trust the extension alone.
3. Open the downloaded file in a second image viewer (not the PixelTools preview).
4. Verify dimensions against the selected operation.
5. Compare transparency against the source where applicable.
6. Confirm the original source file's SHA-256 hash is unchanged.
7. Confirm failed operations do not create a misleading download.
8. Confirm repeated downloads do not produce stale output from a previous file or tool.
9. Confirm browser download behavior on mobile Safari and Android Chrome.
10. Record visual quality and any color-profile differences.

For Base64, decode the saved result and compare its SHA-256 with the original input file.

## Negative and boundary tests

- Reject unsupported MIME types even when the filename has a supported extension.
- Reject malformed/truncated image headers before pixel decoding.
- Reject dimensions above 12,000 pixels on either side or 60 megapixels total for single-image processing.
- Batch converter: test 30 files, 31 files, 25 MB per-file boundary, 100 MB combined input, malformed image, one failed file among valid files, stop control and ZIP output over 150 MB.
- Image to PDF: test 20 pages, 21 pages, 25 MB per-file boundary, 100 MB combined input, 120 megapixels combined, 150 MB output boundary, corrupted image and page reordering.
- PDF tools: test 200-page and 201-page PDFs, 25 MB input boundary, 150 MB output boundary, corrupted/password-protected files, empty and duplicate page selections, invalid page permutations, and page rotations including already-rotated pages. PDF Watermark: test empty/non-ASCII/overlong text, invalid HEX colors and boundary opacity/font-size/rotation values.
- Test files at 25 MB and just over 25 MB.
- Test crop values at zero, negative, fractional, and beyond image bounds.
- Test invalid/empty target-size values and impossible compression targets.
- Test rapid file replacement while an image is loading; stale async results must not overwrite the latest selection.
- Test closing the tool during processing and reopening another tool.
- Test keyboard navigation, Escape behavior, focus return, visible focus, labels and screen-reader names.
- Test narrow viewport, landscape/portrait changes, browser zoom and touch gestures.

## Evidence record template

Copy one record per environment and attach non-sensitive sample files or screenshots:

- Date/time:
- Tester:
- Browser/version:
- OS/device:
- Viewport:
- Tool and scenario:
- Input filename / SHA-256:
- Output filename / SHA-256:
- Expected MIME / actual MIME:
- Expected dimensions / actual dimensions:
- Visual result:
- Console/network errors:
- Pass / Fail / Blocked:
- Issue URL and reproduction notes:

## Release gate

The manual gate passes only when every required environment and all 21 feature-branch tool workflows have recorded evidence, all export integrity checks pass, and blocking defects are fixed and retested. AI Background Remover and AI Upscaler are intentionally excluded from working-tool acceptance while marked Coming Soon.


## PDF merge and split acceptance cases

- Merge two or more valid PDFs and independently open the output in a desktop PDF reader; confirm page count and ordering.
- Reorder source PDFs before merging; verify the merged page order matches the displayed sequence.
- Split a PDF using single pages and multiple ranges (for example `1-3, 5, 8-10`); validate each ZIP entry with an archive integrity checker and open every extracted PDF.
- Reject overlapping, malformed, reversed and out-of-bounds page ranges without generating an output.
- Reject damaged, unsupported and password-protected PDFs with a clear message.
- Exercise per-file, combined-input, page-count and output-size limits, plus small and large valid PDFs.
- Verify mobile upload/download behavior in physical Android Chrome and iPhone Safari; desktop viewport emulation alone is insufficient.
