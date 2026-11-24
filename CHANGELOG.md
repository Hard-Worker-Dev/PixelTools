# Changelog

All notable PixelTools changes are documented here.

## Unreleased — Release 1 16-tool integration
- Integrate Batch Image Converter with browser-local sequential processing, per-file results and ZIP32 export.
- Integrate Image to PDF with image ordering, A4 page orientation and browser-local PDF generation.
- Add dedicated SEO landing pages, sitemap entries, responsive workspace styling and automated UI/utility tests for both tools.
- Expand the public catalogue to 16 implemented tools while keeping two AI previews explicitly marked Coming Soon; keep the 3,000-item roadmap internal.

## Unreleased — professional product experience refresh
- Redesign the homepage hero and navigation around everyday image and PDF workflows, with direct popular-tool shortcuts and clearer browser-processing/privacy messaging.
- Replace the category dropdown with accessible, keyboard-operable category filter chips and a live available/Coming Soon tool count.
- Add concise product-benefit and FAQ sections covering local processing, pricing, supported formats and AI feature availability.
- Expand individual tool workspaces for a more comfortable preview/settings layout, hide the generic single-image workflow steps for the batch and PDF tools, and improve small-screen layouts.
- Apply a consistent, responsive visual system to informational and SEO landing pages, add skip navigation and respect reduced-motion preferences.

## Unreleased — public catalogue and trust fixes
- Keep the 3,000-entry planning inventory out of the public tool catalogue; show only implemented tools and clearly labelled Coming Soon previews.
- Show an accurate available-tool count separately from Coming Soon entries.
- Replace the homepage illustration’s invented file-size reduction with a clearly labelled illustrative workspace.
- Give the header brand link a real destination to the tool section.
- Invalidate in-flight image work when a file is replaced or a workspace is cleared, preventing stale results from appearing against a new image.
- Cancel stale Base64/EXIF reads and distinguish metadata loading from an image with no readable EXIF.

## Unreleased — release candidate 1.0.0-rc.2

### Release integration
- Combined the verified release-audit work and Cloudflare Workers preview configuration into one candidate branch.
- Corrected Dependabot configuration to avoid assigning a label that is not present in the repository.
- Recorded component CI and preview evidence separately from integrated-candidate checks; no production merge or deployment is implied.

## Release-readiness documentation

### Legal and privacy
- Reworked the public Privacy Policy for the current Pakistan-focused release, including browser-local image processing, Cloudflare technical processing, metadata sensitivity and contact-channel limitations.
- Reworked the public Terms of Use with acceptable-use requirements, user file responsibilities, output review, service limitations and Pakistan governing-law wording.
- Added a Pakistan legal review decision record. These documents remain drafts pending operator identity/contact details and qualified legal review.
- Replaced remote Google Fonts with system font stacks and removed the external font hosts from the Content Security Policy.
- Clarified that public GitHub issues are not a channel for private privacy requests or sensitive material.

### Product roadmap
- Added an explicit **Edit PDF files** entry to the PDF Tools category while keeping the category at exactly 100 planned tools.
- Expanded the Coming Soon roadmap to 30 categories with 100 planned entries each (3,000 total). The roadmap catalogue is not a claim that these tools are implemented.
- Added `TOOL_ROADMAP.md` with implementation, privacy, security, testing and rollout gates.

### Release operations
- Added a detailed manual browser/device and export acceptance matrix.
- Added an evidence-based release audit and updated CI/Cloudflare deployment evidence.
- Recorded outstanding owner-only settings, physical-device QA, Search Console and rollback gates.

## 1.0.0-rc.1 — 2026-10-30

This is a release candidate, not the final 1.0.0 release.

### Included
- 14 browser-based image utilities for compression, resizing, cropping, conversion, rotation, flipping, text/logo watermarking, rounded corners, blur, grayscale, color picking, metadata viewing, metadata cleaning and Base64 encoding.
- Local image processing for currently available tools; selected source images are not sent to a PixelTools image-processing server.
- 25 MB input file limit and 12,000-pixel-per-side / 60-megapixel dimension guards.
- Searchable tool discovery, categories and guided upload/process/download workspaces.
- Dedicated tool landing pages, sitemap, robots.txt, privacy policy, terms, contact page and 404 page.
- AI Background Remover and AI Image Upscaler remain clearly marked Coming Soon.

### Quality and security
- Automated processing workflow coverage for all 11 editing/export tools.
- Automated workflow coverage for Color Picker, Metadata Viewer and Base64 tools.
- Watermark logo dimension validation and bounded aspect-ratio rendering.
- Content Security Policy is restricted to local assets after removing the remote Google Fonts dependency.
- CI performs full and production-only dependency audits, typechecking, automated tests and a production build.

### Known release gates
- Manual testing on physical Android and iOS devices remains required.
- Browser-specific output validation, especially metadata removal and image encoder behavior, remains required.
- Google Search Console ownership verification and sitemap submission require the site owner's Google account.
- Final legal review remains the owner's responsibility.
