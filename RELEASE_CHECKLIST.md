# PixelTools Public Release Checklist

**Candidate:** 1.0.0-rc.1 (integrated release branch; not final)  
**Release branch:** `release/v1.0.0-rc.1-2026-11-24`  
**Production hostname:** https://pixeltools-9xe.pages.dev  
**Repository:** https://github.com/Hard-Worker-Dev/PixelTools  
**Legal jurisdiction selected by owner:** Pakistan

This checklist separates automated evidence from manual acceptance. A box must only be checked when evidence exists. The integrated release branch must pass its own CI and preview checks; successful checks on component branches are supporting evidence, not a substitute.

## Automated checks with evidence

- [x] Component PR #11 test-fix commit `0527519e4129edfcfaafbca7112bb6916b37d07a`: GitHub Actions run `45378405269` completed successfully. Full audit, production-only audit, TypeScript, Vitest, production build and artifact upload all passed.
- [x] Component PR #20 commit `15174a8cf7814dfefef339cf7046a66fafc87a4f`: GitHub Actions run `45377493862` completed successfully.
- [x] PR #20 Cloudflare Pages preview succeeded: https://685db8a9.pixeltools-9xe.pages.dev
- [x] PR #20 Cloudflare Workers Build preview succeeded: https://4cb05fc3-pixeltools.zerotohero125crore.workers.dev
- [ ] Integrated release branch CI (full dependency audit, production-only audit, TypeScript, Vitest and production build) — pending.
- [ ] Integrated release branch Cloudflare Pages and Workers previews — pending.
- [x] Existing automated coverage is documented for all 14 implemented tool workspaces, all 11 image editing/export tools, Color Picker, Metadata Viewer and Base64 workflows. Reconfirm on the integrated branch.
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
- [x] Thirty catalogue categories with 100 planned entries each (3,000 total) are disabled and labelled Coming Soon; they are roadmap entries, not working tools.
- [ ] Implement and test roadmap entries only in separate, reviewed batches. They are not a Release 1.0.0 gate and must not be advertised as working.

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
- [ ] Owner verifies the site in Google Search Console and submits the sitemap.
- [ ] Owner performs and documents a controlled rollback rehearsal before a high-traffic launch (the production site has not been deliberately rolled back).

## Release decision

This integrated branch is a release candidate, not a final production release. Do not tag or announce `1.0.0` until the integrated CI/preview checks, manual browser/device/export acceptance, owner configuration, security review and legal review are complete. Production merge and deployment require explicit owner approval.
