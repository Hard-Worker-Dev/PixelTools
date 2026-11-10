# PixelTools Phase 0 and Phase 1 — Execution Tasks

**Implementation branch:** `work/phase-0-1-foundation-registry`  
**Draft PR:** https://github.com/Hard-Worker-Dev/PixelTools/pull/17  
**Scope:** Phase 0 and Phase 1 only. No merge, production deployment, monetization, AI provider integration or new tool-suite expansion.

## Phase 0 — Release and architecture baseline

| ID | Task | Dependency | Status | Acceptance criteria |
|---|---|---|---|---|
| P0-01 | Inspect current feature branch, open PRs, CI workflow, package manifest and release gates | None | Done | Current feature branch and base commit identified; PR #14 divergence and open dependency PRs recorded |
| P0-02 | Create isolated implementation branch and stacked draft PR | P0-01 | Done | Changes isolated from production/main; PR #17 remains draft and targets the PDF feature branch |
| P0-03 | Verify dependency audit, typecheck, tests and production build on the implementation head | P0-02 | Pending | Fresh CI run is green on the latest head; no reliance on historical run results |
| P0-04 | Reconcile release docs and preserve manual/legal/rollback blockers | P0-01 | Done | Counts agree across README, roadmap, release audit, checklist and manual QA; unverified release gates remain unchecked |
| P0-05 | Resolve the pre-existing PR #14 base-branch divergence | P0-01 | Blocked / separate review | Conflict resolution is reviewed before any PR #14 branch rewrite or merge; no force-push or merge performed here |

## Phase 1 — Tool registry and catalogue

| ID | Task | Dependency | Status | Acceptance criteria |
|---|---|---|---|---|
| P1-01 | Extract core tools and roadmap catalogue into a typed single source of truth | P0-02 | Done | 24 core entries, 22 implemented and 2 Coming Soon; 3,000 separate roadmap entries |
| P1-02 | Assign every implemented tool an explicit category and status | P1-01 | Done | All tool IDs unique and all category keys map to the 30-category taxonomy |
| P1-03 | Calculate tool and category totals from registry data | P1-01 | Done | No hard-coded 100/101 category counts; totals derive from actual registry contents |
| P1-04 | Improve catalogue search and category filtering | P1-01 | Done | Search includes tool title, description, ID and category label; quick filters use normalized category groups |
| P1-05 | Replace fixed catalogue truncation with accessible pagination | P1-04 | Done | Initial 100 entries render; users can load another 100; category/search changes reset pagination |
| P1-06 | Add registry and UI regression tests | P1-01–P1-05 | Added / CI pending | Tests assert 22 implemented, 3,002 planned, 3,024 total, 30 categories, 100 roadmap entries/category, unique IDs, PDF counts and pagination |
| P1-07 | Reconcile product and release documentation | P1-01–P1-06 | Done | Feature-branch count and six-PDF QA caveat are consistent across user-facing and release documents |

## CI investigation notes

- Run #267 completed both full and production dependency audits with **0 vulnerabilities**.
- TypeScript then found two errors: an unused `PDFDocument` import in the existing PDF watermark module and a too-narrow inferred `Set` type in the new registry test.
- Both source corrections are committed. The next fresh CI result is still pending; the failed run is not counted as a pass.

## Explicit release gates

- CI status must be verified against the latest implementation commit.
- PDF exports must be independently opened and validated.
- Android Chrome and iPhone Safari physical-device QA remain required.
- Legal review, production hostname/HTTPS checks, Search Console ownership and rollback rehearsal remain open.
- PR #17 must remain draft until the user separately authorizes review readiness.
- PR #14 must not be merged or rewritten without separate review.
- Production deployment requires separate explicit approval.
