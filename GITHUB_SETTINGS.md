# GitHub Repository Settings for Public Release

Repository: https://github.com/Hard-Worker-Dev/PixelTools

The application code and CI workflow are prepared, but repository-owner settings must be applied in GitHub.

## Protect the main branch

In **Settings → Branches** (or repository rulesets):

- Add a rule targeting `main`.
- Require a pull request before merging.
- Require the successful GitHub Actions check for **PixelTools CI / verify** (select the exact check shown by GitHub after the latest workflow has completed).
- Require approval from at least one reviewer if another maintainer is available.
- Require conversation resolution.
- Block force pushes and branch deletion.
- Do not allow direct pushes for routine feature changes; keep emergency administrator bypass deliberate and limited.

## Enable private vulnerability reporting

In **Settings → Security → Code security and analysis**:

- Enable private vulnerability reporting if available.
- Keep dependency graph and Dependabot alerts enabled.
- Keep Dependabot security updates enabled.
- Review Dependabot version-update pull requests before merging. Major React, TypeScript or icon-library upgrades should not be merged automatically without compatibility review.

## Actions permissions

- Keep the default `GITHUB_TOKEN` permission read-only.
- Grant additional write permissions only to workflows that genuinely need them.
- The current CI workflow uses `contents: read` and does not need repository write permission.

## Current repository observation

At the time this document was prepared, the `main` branch was not protected. The available repository connection can inspect settings but cannot apply the required branch-protection or private vulnerability-reporting switches. The repository owner must apply and verify them in GitHub.
