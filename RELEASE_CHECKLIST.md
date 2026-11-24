# PixelTools Public Release Checklist

**Candidate:** 1.0.0-rc.2 (16-tool integration in review; not final)  
**Release branch:** `release/v1.0.0-rc.2-2026-11-24`  
**Production hostname:** https://pixeltools-9xe.pages.dev  
**Repository:** https://github.com/Hard-Worker-Dev/PixelTools  
**Legal jurisdiction selected by owner:** Pakistan

This checklist separates automated evidence from manual acceptance. A box must only be checked when evidence exists. The integrated release branch must pass its own CI and preview checks; successful checks on component branches are supporting evidence, not a substitute.

## Automated checks with evidence

- [x] Component PR #11 test-fix commit `0527519e4129edfcfaafbca7112bb6916b37d07a`: GitHub Actions run `45378405269` completed successfully. Full audit, production-only audit, TypeScript, Vitest, production build and artifact upload all passed.
- [x] Component PR #20 commit `15174a8cf7814dfefef339cf7046a66fafc87a4f`: GitHub Actions run `45377493862` completed successfully.
- [x] PR #20 Cloudflare Pages preview succeeded: https://685db8a9.pixeltools-9xe.pages.dev
- [x] PR #20 Cloudflare Workers Build preview succeeded: https://4cb05fc3-pixeltools.zerotohero125crore.workers.dev
- [x] Integrated release branch CI passed on commit `684762b693d47c5d0cdbd62b1cf38eac47e89aa7`: GitHub Actions run `45380279699` passed both dependency audits, TypeScript, Vitest, production build and artifact upload.
- [x] Integrated release branch Cloudflare Pages preview succeeded on commit `684762b693d47c5d0cdbd62b1cf38eac47e89aa7`: https://48f740c0.pixeltools-9xe.pages.dev
- [x] Integrated release branch Cloudflare Workers preview succeeded on the same commit: https://217d7b66-pixeltools.zerotohero125crore.workers.dev
- [x] Automated coverage for the original 14 image-tool workspaces is retained.
- [x] Batch Image Converter and Image to PDF workspace tests and ZIP/PDF structure tests are included in the integrated candidate.
- [ ] Fresh integrated CI must pass on the final candidate commit before automated release checks are accepted.
- [ ] Independently verify downloaded image files, ZIP archive integrity and generated PDF content in external readers before production promotion.
- [x] Static SEO, internal-link, sitemap and security-header contracts are included in the test suite. Reconfirm on the integrated branch.
- [x] AI tools and roadmap entries are explicitly labelled Coming Soon; they are not represented as implemented functionality.
- [x] The currently deployed production baseline is `main` commit `d861c44b86cbe5f99c8323d1bac4622132b68235`. It is not the integrated release candidate and has not been changed by this work.

## Legal documents — draft prepared, approval pending

- [x] Pakistan-focused Privacy Policy draft updated to describe browser-local processing, Cloudflare technical processing, metadata sensitivity and current contact limitations.
- [x] Pakistan-focused Terms of Use draft updated with lawful-use rules, user file responsibilities, output verification, service limitations and governing-law wording.
- [x] Legal review decision record added in `LEGAL_REVIEW_PAKISTAN.md`.
- [ ] **Launch blocker:** owner supplies the contracting operator's legal name/status, service address and a monitored private privacy contact route. Do not publish guessed details or treat this as waived.
- [ ] Pakistan-qualified legal reviewer confirms current federal/provincial law, consumer rights, enforceability and the final policy/terms wording.
- [ ] Confirm current hosting logs, retention, subprocessors and international processing; verify the deployed site makes no unintended third-party browser requests (including remote fonts).
- [ ] Recheck Gazette/parliamentary status of applicable data-protection legislation immediately before launch.
- [ ] Do not describe these drafts as lawyer-approved or legally compliant until the above review is documented.

## Product scope and roadmap

- [x] Fourteen image tools are the implemented working scope for this release.
- [x] AI Background Remover and AI Upscaler remain Coming Soon.
- [x] Keep the 3,000 proposed entries as an internal planning inventory only; do not generate public catalogue entries or SEO pages from them.
- [ ] Integrate and verify any future roadmap additions separately; they are not a Release 1.0.0 requirement.

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
- [x] A dedicated release branch exists; production main has not been modified.
- [ ] Owner verifies repository backup and release permissions in GitHub.
- [ ] Protect `main` with PR requirement, required CI check, conversation resolution, and force-push/deletion restrictions.
- [ ] Enable and verify private vulnerability reporting and the private advisory route.
- [ ] Enforce multi-factor authentication on the GitHub and Cloudflare owner accounts; Cloudflare account settings currently report account-wide two-factor enforcement disabled.
- [ ] Owner verifies the site in Google Search Console and submits the sitemap.
- [ ] Owner performs and documents a controlled rollback rehearsal before a high-traffic launch (the production site has not been deliberately rolled back).

## Release decision

This integrated branch is a release candidate, not a final production release. Do not tag or announce `1.0.0` until the integrated CI/preview checks, manual browser/device/export acceptance, owner configuration, security review and legal review are complete. Production merge and deployment require explicit owner approval.


## Release 1 tool integration — 2026-11-24

- [x] Batch Image Converter and Image to PDF are integrated as tools 15 and 16 in the release-candidate branch, with dedicated workspace components, browser-local processing utilities, tool landing pages, and sitemap entries.
- [ ] Fresh CI on the final integrated commit must pass before this candidate is accepted.
- [ ] Independently open downloaded image outputs and PDFs; independently validate ZIP integrity and checksums.
- [ ] Complete Chrome, Edge and Firefox coverage, plus physical Android Chrome and iPhone Safari checks for the two added tools.
- [ ] Complete all other manual, legal, owner-configuration, production-host and rollback gates before final release.
