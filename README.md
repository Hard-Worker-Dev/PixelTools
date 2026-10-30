# PixelTools

A premium, free online image toolkit. The product focuses on practical image workflows, clear controls and browser-local processing.

## Stack
- React 18, TypeScript and Vite 8
- Canvas API, ImageBitmap and browser File APIs
- EXIF inspection with exifr
- Vitest and React Testing Library
- Cloudflare Pages with GitHub integration

## Working tools
1. Image Compressor — output format, quality slider and quality presets
2. Image Resizer — custom pixels, aspect-ratio lock, percentage scales and social presets
3. Image Cropper — exact pixel coordinates and centered aspect-ratio presets
4. Image Converter — JPG, PNG and WebP, quality controls and configurable JPG background
5. Image Rotator — arbitrary-angle rotation, quick quarter turns and reset
6. Image Flipper — horizontal and vertical mirroring
7. Image Watermark — text, color, position and opacity
8. Rounded Corners — adjustable radius with transparent PNG export
9. Image Blur — adjustable blur strength
10. Grayscale Converter — monochrome output
11. Image Color Picker — HEX, RGB and HSL sampling/copy
12. Image Metadata Viewer — file properties and readable EXIF details, including possible GPS tags
13. Image to Base64 — copy or save a data URL
14. Image Metadata Cleaner — re-encode a clean copy without copying original EXIF/GPS metadata

AI Background Remover and AI Upscaler are shown as coming soon. They are not advertised as working until a real model pipeline is integrated and tested.

## Privacy and safety
- Working image tools process files locally in the browser; selected image files are not uploaded to a PixelTools image-processing server.
- Supported inputs: JPG, PNG and WebP.
- Upload file limit: 25 MB.
- Input and output dimension guard: at most 12,000 pixels per side and 60 megapixels total.
- EXIF data can contain sensitive camera details and GPS coordinates; it is read locally in the metadata viewer.
- JPEG exports use a selectable background color because JPEG cannot preserve transparency.
- The Metadata Cleaner re-encodes pixels rather than copying the source file container. Browser encoders may write basic output metadata; do not treat this as a forensic sanitizer.

## SEO and informational pages
- Home, About, Privacy Policy, Terms, Contact and 404.
- Dedicated tool landing pages with unique titles, descriptions, canonical URLs and FAQ structured data.
- XML sitemap, robots.txt, Open Graph metadata, favicon and security headers.

## Development and verification
```bash
npm install
npm run dev
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
```

CI runs dependency auditing, TypeScript checks, unit tests, user-flow tests and a production build on pushes and pull requests to `main`.

## Cloudflare Pages
- Project: `pixeltools`
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Live project hostname: `https://pixeltools-9xe.pages.dev`

No server-side environment variables are required for the current browser-only release. If the production hostname changes, update canonical URLs, sitemap and robots.txt.

## Product policy
PixelTools is free to use. The current release has no ads, subscriptions or paid gates.
