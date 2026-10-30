# PixelTools

A premium, completely free image toolkit for the web. The first release focuses on practical image workflows with private, in-browser processing.

## Stack
- React 18 + TypeScript + Vite
- Canvas API and browser ImageBitmap for local image processing
- Vitest for utility tests
- Cloudflare Pages static deployment

## Current working tools
- Image compressor (JPEG quality control; PNG lossless export)
- Image resizer (custom width and height)
- Image converter (JPG, PNG, WebP)
- Quick edits (rotate, flip, grayscale)

All image processing happens in the user's browser. Files are not sent to a PixelTools server.

## Development
```bash
npm install
npm run dev
npm run typecheck
npm test
npm run build
```

## Cloudflare Pages
- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

No server-side environment variables are required for this release. Update the sitemap canonical host and metadata when the final production domain is confirmed.

## Scope notes
AI background removal and upscaling are not advertised as available until a real model pipeline has been integrated and tested. The project is free for users; no ads, subscriptions, or paid gates are included.
