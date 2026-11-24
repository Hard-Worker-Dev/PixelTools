# Changelog

All notable PixelTools changes are documented here.

## Unreleased — release-readiness documentation

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
