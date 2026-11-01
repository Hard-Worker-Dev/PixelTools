# PixelTools Platform Implementation Plan

## Product promise
PixelTools is a professional, browser-first creative utility workspace. The catalogue target is 30 categories and 3,000 tool concepts. A tool is only called **Working** after its complete user workflow, validation, output, accessibility, privacy behavior, and automated/manual QA are verified.

## Current verified baseline
- 16 browser-based tools are implemented in the current application, including a batch image converter with local ZIP export and Image to PDF.
- 3,000 additional catalogue entries are roadmap items, not functional features.
- AI Background Remover and AI Upscaler are not enabled.
- The professional visual refresh is being developed on `work/platform-3000-professional-ui`.
- CI now includes `work/release-readiness-audit` as a pull-request target so this stacked feature PR can run the repository's standard verification workflow.
- Production must not be changed until the user explicitly authorizes release.

## Delivery sequence

### Completed in this implementation branch
- Professional brand and responsive UI refresh.
- Browser-local batch image conversion for JPG, PNG and WebP, with per-file results and ZIP export.
- Image-to-PDF generation for up to 20 JPG/PNG/WebP pages, including user-controlled page order, automatic A4 orientation and local JPEG embedding.
- ZIP32 writer and unit tests for CRC-32, central-directory structure, UTF-8 filenames, duplicate names and path traversal safety.

1. **Platform foundation** — brand system, responsive shell, category navigation, searchable catalogue, tool detail routes, consistent empty/loading/error/success states, keyboard accessibility, analytics-free privacy defaults.
2. **Core image suite** — preserve and harden the existing 14 single-image tools; expand batch workflows, comparison, presets, and verified export handling. The first batch image converter is implemented.
3. **PDF suite** — Image to PDF is implemented. Next implement PDF merge, split, reorder, rotate, extract, annotate/edit, watermark and protect workflows with a tested PDF parser/writer. Never expose unsupported actions as working.
4. **Creative and social suite** — canvas-based design, platform presets, text/layout controls, reusable templates and deterministic exports.
5. **Developer and web suite** — SVG utilities, favicon/app icon generation, metadata, Base64, responsive image preparation, QR/barcode and color workflows.
6. **Advanced suites** — batch processing, accessibility, print preparation, restoration and AI only after their model/provider, privacy, cost and abuse controls are explicitly designed.
7. **Release hardening** — automated unit/integration tests, browser matrix, mobile device QA, export integrity, performance, security/privacy/legal review, rollback rehearsal and production sign-off.

## Definition of done for every tool
- Clear input contract and supported file types / size limits.
- Real processing implementation; no placeholder success and no dead controls.
- Validation before processing, actionable errors, cancellation/reset behavior.
- Preview where appropriate and downloadable output with correct MIME type and filename.
- Edge-case tests, malformed/oversized input tests, and output integrity checks.
- Keyboard/screen-reader support and responsive layout.
- Privacy statement matches actual data flow; no hidden uploads.
- Tool status remains **Planned** until all applicable checks pass.

## Status language
- **Working** — implemented and verified.
- **Beta** — implemented with a clearly disclosed limitation and active QA.
- **Planned** — catalogue entry only; not available for production use.
