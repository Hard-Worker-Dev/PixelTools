# PixelTools Public Release Checklist

**Candidate:** 1.0.0-rc.1  
**Production hostname:** https://pixeltools-9xe.pages.dev  
**Repository:** https://github.com/Hard-Worker-Dev/PixelTools

This checklist separates automated evidence from manual acceptance. A box must only be checked when evidence exists.

## Automated checks with evidence

- [x] GitHub Actions full dependency audit passed on the release-candidate commit.
- [x] Production-only dependency audit passed on the release-candidate commit.
- [x] TypeScript typecheck passed.
- [x] Vitest suite passed.
- [x] Vite production build passed.
- [x] All 14 implemented tool workspaces have UI workflow coverage.
- [x] All 11 image editing/export tools have automated processing-to-result coverage.
- [x] Color Picker, Metadata Viewer and Base64 output workflows have automated coverage.
- [x] Static SEO, internal-link, sitemap and security-header contracts are tested.
- [x] AI tools are represented as Coming Soon; no fake AI processing is advertised.
- [x] Cloudflare Pages production deployment completed successfully for the candidate commit.

## Manual acceptance still required

- [ ] Test current Chrome and Edge on desktop with real JPG, PNG and WebP samples.
- [ ] Test Firefox on desktop with real JPG, PNG and WebP samples.
- [ ] Test Android Chrome on a physical device.
- [ ] Test iPhone Safari on a physical device.
- [ ] Test tablet viewport and touch interactions.
- [ ] Verify downloaded file contents by opening each output in a second image viewer.
- [ ] Verify JPEG background flattening and PNG/WebP transparency.
- [ ] Inspect Metadata Cleaner output with an independent EXIF reader; confirm source EXIF/GPS tags are not copied. Do not claim forensic sanitization.
- [ ] Validate memory use and behavior near the 25 MB / 60 MP limits on representative devices.
- [ ] Inspect production UI in a browser for layout, typography, console errors and CSP/network failures.
- [ ] Complete owner/legal review of Privacy Policy and Terms.
- [ ] Verify the production hostname and HTTPS from an external browser/network.
- [ ] Owner verifies the site in Google Search Console and submits the sitemap.

## Operational readiness

- [x] GitHub issue templates and support instructions are present.
- [x] Security reporting instructions are present.
- [x] GitHub Actions supports manual runs and preserves successful dist artifacts for 30 days.
- [x] A Git backup branch is created for this candidate.
- [ ] Owner verifies repository backup and release permissions in GitHub.
- [ ] Owner performs and documents a controlled rollback rehearsal before a high-traffic launch.

## Release decision

Do not label this candidate as final 1.0.0 until the manual acceptance items above are completed. Candidate 1.0.0-rc.1 is appropriate for a limited public beta with known limitations disclosed.
