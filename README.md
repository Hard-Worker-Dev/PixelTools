# PixelTools

> Release candidate: **1.0.0-rc.1**. The public beta is deployed; see [release readiness](RELEASE_CHECKLIST.md) for remaining manual launch checks.

A premium, free online image toolkit. The product focuses on practical image workflows, clear controls and browser-local processing.

## Stack
- React 18, TypeScript and Vite 8
- Canvas API, ImageBitmap and browser File APIs
- EXIF inspection with exifr
- Vitest and React Testing Library
- Cloudflare Pages with GitHub integration

## Working tools
1. Image Compressor — JPG/WebP quality presets and target-size search, plus PNG lossless export
2. Image Resizer — custom pixels, aspect-ratio lock, percentage scales and social presets
3. Image Cropper — exact pixel coordinates and centered aspect-ratio presets
4. Image Converter — JPG, PNG and WebP, quality controls and configurable JPG background
5. Image Rotator — arbitrary-angle rotation, quick quarter turns and reset
6. Image Flipper — horizontal and vertical mirroring
7. Image Watermark — text or transparent PNG/WebP logo, color, position, opacity and size controls
8. Rounded Corners — adjustable radius with transparent PNG export
9. Image Blur — adjustable blur strength
10. Grayscale Converter — monochrome output
11. Image Color Picker — pixel sampling, dominant color palette, HEX/RGB/HSL and copy actions
12. Image Metadata Viewer — file properties, readable EXIF details (including possible GPS tags) and JSON report export
13. Image to Base64 — copy or save raw Base64 or a full data URL
14. Image Metadata Cleaner — re-encode a clean copy without copying original EXIF/GPS metadata

AI Background Remover and AI Upscaler are shown as coming soon. They are not advertised as working until a real model pipeline is integrated and tested.

## Privacy and safety
- Working image tools process files locally in the browser; selected image files are not uploaded to a PixelTools image-processing server.
- Supported inputs: JPG, PNG and WebP.
- Upload file limit: 25 MB.
- Input and output dimension guard: header dimensions are checked before pixel decoding; at most 12,000 pixels per side and 60 megapixels total.
- EXIF data can contain sensitive camera details and GPS coordinates; it is read locally in the metadata viewer.
- JPEG exports use a selectable background color because JPEG cannot preserve transparency.
- The Metadata Cleaner re-encodes pixels rather than copying the source file container. Browser encoders may write basic output metadata; do not treat this as a forensic sanitizer.

## SEO and informational pages
- Home, About, Privacy Policy, Terms, Contact and 404.
- Dedicated tool landing pages with unique titles, descriptions, canonical URLs and FAQ structured data.
- XML sitemap, robots.txt, Open Graph metadata, favicon and security headers.
- Canonical URLs and sitemap entries use the verified Pages hostname.

## Development and verification
```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
```

CI runs full and production-only dependency audits, TypeScript checks, image utility and rendering-pipeline unit tests, tool user-flow tests, static SEO/security contract tests and a production build on pushes, pull requests and manual dispatches to main. Successful builds are retained as 30-day GitHub Actions artifacts. The committed `package-lock.json` is installed with `npm ci` for reproducible dependency resolution.

## Cloudflare Pages
- Project: `pixeltools`
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Live project hostname: `https://pixeltools-9xe.pages.dev`

No server-side environment variables are required for the current browser-only release. If the production hostname changes, update canonical URLs, sitemap and robots.txt.

## Release and support
- Release status and manual acceptance gates: [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)
- User-facing changes: [CHANGELOG.md](CHANGELOG.md)
- Support and bug reports: [SUPPORT.md](SUPPORT.md)
- Security reporting: [SECURITY.md](SECURITY.md)

## Product policy
PixelTools is free to use. The current release has no ads, subscriptions or paid gates.
