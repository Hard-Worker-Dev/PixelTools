# PixelTools Release Readiness Audit

**Audited:** 2026-11-01  
**Baseline branch:** `main`  
**Baseline commit:** `d861c44b86cbe5f99c8323d1bac4622132b68235`  
**Working branch:** `work/release-readiness-audit`

This audit records repository evidence only. A checked item requires reproducible evidence; repository documentation is not a substitute for live-device or production verification.

## Repository and build baseline

- [x] Repository is accessible and writable by the connected GitHub account.
- [x] Existing React 18, TypeScript and Vite application retained; no replacement project created.
- [x] Fourteen implemented image tools are present in the application; AI Background Remover and AI Upscaler remain explicitly marked Coming Soon.
- [x] Automated unit, rendering, UI workflow and static-site contract tests are present.
- [x] CI workflow includes dependency audits, TypeScript checks, Vitest and a production build.
- [x] Latest observed CI run (#156, commit `d861c44`) completed successfully on 2026-10-30.
- [x] Release, support, security, rollback and Search Console instructions are present.

## Findings requiring action

### P0 — Repository protection

- [ ] Protect `main` with pull requests and required CI status checks. The GitHub branch metadata currently reports `protected: false` and branch protection disabled.
- [ ] Confirm repository backup and release permissions with the owner.

### P1 — Real-browser and export acceptance

- [ ] Run the 14 tool workflows with real JPG, PNG and WebP samples in current Chrome and Edge.
- [ ] Repeat in Firefox desktop.
- [ ] Test Android Chrome on a physical device.
- [ ] Test iPhone Safari on a physical device.
- [ ] Test tablet viewport, touch interactions, keyboard navigation and focus restoration.
- [ ] Open each downloaded image in an independent viewer and verify file type, dimensions and visual output.
- [ ] Verify JPEG flattening and PNG/WebP transparency.
- [ ] Independently inspect Metadata Cleaner output for source EXIF/GPS tag removal; do not describe it as a forensic sanitizer.
- [ ] Exercise files near the 25 MB and 60 MP limits on representative devices.
- [ ] Inspect browser console, CSP and network errors on the live production site.

### P1 — Owner/legal and production checks

- [ ] Owner/legal reviewer approves the Privacy Policy and Terms for the actual operating jurisdiction and hosting arrangements.
- [ ] Verify production hostname, HTTPS and effective response headers from an external browser/network.
- [ ] Owner verifies Google Search Console property and submits the sitemap.
- [ ] Perform and document a controlled Cloudflare Pages rollback rehearsal in a planned window.

### P2 — Release hygiene

- [ ] After all acceptance gates pass, publish release notes and create a version tag for the final 1.0.0 release.
- [ ] Keep AI features marked Coming Soon until a real model pipeline is integrated, privacy-reviewed and tested.

## Notes and constraints

- The README documents the production hostname as `https://pixeltools-9xe.pages.dev`; this audit has not independently verified its live availability or TLS behavior.
- A successful GitHub CI run verifies the checks in that workflow only. It does not prove physical-device behavior, independent export correctness, legal approval, Search Console ownership or a successful rollback rehearsal.
- Do not merge this audit branch or promote the release candidate to final 1.0.0 solely on the basis of repository checks.
