# PixelTools Public Release Checklist

**Candidate:** 1.0.0-rc.1  
**Production hostname:** https://pixeltools-9xe.pages.dev  
**Repository:** https://github.com/Hard-Worker-Dev/PixelTools  
**Legal jurisdiction selected by owner:** Pakistan

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
- [x] Cloudflare Pages production deployment completed successfully for the current main candidate (see audit for exact deployment evidence).

## Legal documents — draft prepared, approval pending

- [x] Pakistan-focused Privacy Policy draft updated to describe browser-local processing, Cloudflare technical processing, metadata sensitivity and current contact limitations.
- [x] Pakistan-focused Terms of Use draft updated with lawful-use rules, user file responsibilities, output verification, service limitations and governing-law wording.
- [x] Legal review decision record added in `LEGAL_REVIEW_PAKISTAN.md`.
- [ ] **Deferred for this pass — still a launch blocker:** owner supplies the contracting operator's legal name/status, service address and a monitored private privacy contact route. Do not publish guessed details or treat this as waived.
- [ ] Pakistan-qualified legal reviewer confirms current federal/provincial law, consumer rights, enforceability and the final policy/terms wording.
- [ ] Confirm current hosting logs, retention, subprocessors, international processing and Google Fonts configuration against the actual production setup.
- [ ] Recheck Gazette/parliamentary status of proposed data-protection legislation immediately before launch.
- [ ] Do not describe these drafts as lawyer-approved or legally compliant until the above review is documented.

## Expanded tool roadmap

- [x] Added five new catalogue categories with 15 planned entries each (75 total); all are disabled and labelled Coming Soon.
- [ ] Implement and test roadmap tools in small batches; do not count planned entries as working tools. See `TOOL_ROADMAP.md`.

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
- [ ] Verify the production hostname, HTTPS and effective response headers from an external browser/network.

## Operational readiness

- [x] GitHub issue templates and support instructions are present.
- [x] Security reporting instructions are present.
- [x] GitHub Actions supports manual runs and preserves successful dist artifacts for 30 days.
- [x] `package-lock.json` is committed and CI uses `npm ci` for reproducible dependency installation.
- [x] A Git backup branch is created for this candidate.
- [ ] Owner verifies repository backup and release permissions in GitHub.
- [ ] Protect `main` with PR requirement, required CI check, conversation resolution, and force-push/deletion restrictions.
- [ ] Owner verifies the site in Google Search Console and submits the sitemap.
- [ ] Owner performs and documents a controlled rollback rehearsal before a high-traffic launch (the production site has not been deliberately rolled back).

## Release decision

The legal documents are drafts, not legal approval. Do not label this candidate final 1.0.0 until all manual acceptance, owner configuration and legal review gates are complete. Candidate 1.0.0-rc.1 remains suitable only for a limited public beta with known limitations disclosed.
