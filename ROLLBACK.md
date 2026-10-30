# PixelTools Production Rollback Procedure

**Cloudflare Pages project:** `pixeltools`  
**Production hostname:** https://pixeltools-9xe.pages.dev  
**Current Git release candidate:** `1.0.0-rc.1`

Use this procedure only when a production deployment causes a confirmed user-facing issue. Do not deliberately roll back the live site as a test during normal operation.

## Before rollback

1. Freeze new merges and pushes to `main` until the incident is understood.
2. Open Cloudflare Dashboard → **Workers & Pages** → **pixeltools** → **Deployments**.
3. Review the **Production** deployments and identify the last known-good deployment whose build and production checks succeeded.
4. Record the current production deployment ID, commit SHA and URL, plus the target deployment ID, commit SHA and URL.
5. Confirm that the target is a successful **production** deployment. Preview deployments are not valid rollback targets.

## Dashboard rollback

1. In the deployments list, open the three-dot menu for the selected last-known-good production deployment.
2. Choose **Rollback to this deployment**.
3. Review the target deployment and confirm the rollback.
4. Wait for Cloudflare to report the resulting production deployment. Record its deployment ID, URL, commit SHA and timestamp.

Cloudflare documents this as an immediate production rollback. A previously successful production deployment is a valid target; preview deployments are not. See [Cloudflare Pages Rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/).

## API alternative

Cloudflare's Pages rollback endpoint is:

`POST /accounts/{account_id}/pages/projects/{project_name}/deployments/{deployment_id}/rollback`

For this project, `project_name` is `pixeltools`. Use the full UUID of the known-good production deployment as `deployment_id`, not its eight-character short ID. The API operation requires a Cloudflare API token with Pages Write permission. Do not store API tokens in this repository or paste them into issues.

API reference: [Roll back a Pages deployment](https://developers.cloudflare.com/api/go/resources/pages/subresources/projects/subresources/deployments/methods/rollback/).

## After rollback

- Confirm that the production Pages project now points at the intended successful deployment.
- Open the production hostname in a normal browser and verify the homepage, tool search, one representative image workflow and policy pages.
- Check browser console/network errors and the effective security headers.
- Confirm sitemap and robots.txt remain reachable and canonical URLs still use the production hostname.
- Notify users if there was a user-visible incident.
- Fix the cause on a branch, run the full CI workflow, then deploy through the normal main-branch process.
- Keep the failed deployment and commit history for diagnosis; do not delete evidence during incident response.

## Current recovery points

- Backup branch: `backup/public-beta-2026-10-30`
- Release branch: `release/1.0.0-rc.1`
- Main candidate commit at the time these branches were created: `33be72b2f6c97ac08f0e90144394db83e9979b57`

These Git branches preserve source history. Cloudflare Pages production rollback still uses a successful production deployment from the Cloudflare deployment history.

## Rehearsal status

A controlled rollback rehearsal has **not** been performed. Do it in a planned maintenance window or before a high-traffic launch, and record the deployment IDs and verification results. Do not mark this rehearsal complete just because this document exists.
