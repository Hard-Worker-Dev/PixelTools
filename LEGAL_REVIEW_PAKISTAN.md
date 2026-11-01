# Pakistan Legal Review — PixelTools

**Prepared:** 1 November 2026  
**Jurisdiction selected by project owner:** Pakistan  
**Status:** Drafting and issue-spotting only — not a legal opinion or counsel approval.

## Documents drafted

- Public Privacy Policy: `public/privacy/index.html`
- Public Terms of Use: `public/terms/index.html`
- Public contact route: `public/contact/index.html`

The public documents are written against the currently implemented release behavior described in the repository. They must be reviewed again before enabling any roadmap tool, or if analytics, cookies, accounts, payments, cloud image processing, AI inference, user submissions, advertising or other data flows are introduced. The 75 new roadmap entries are Coming Soon only and are not part of the current working product.

## Verified product facts used

- The current release offers 14 working image tools and marks AI Background Remover and AI Upscaler as Coming Soon.
- Selected image files are processed in the user's browser; the project does not operate an image-processing upload API in this release.
- The app does not require accounts or payments and does not currently provide first-party advertising or analytics profiles.
- The site now uses system fonts and is hosted on Cloudflare Pages. Cloudflare may independently process connection/technical data under its own terms.
- The Metadata Viewer can expose EXIF fields, including GPS coordinates. Base64 output can encode the full image content.
- No dedicated project privacy email, registered legal entity name or postal address is currently published. The public issue tracker is not an appropriate channel for sensitive privacy requests.

## Pakistan legal context to confirm with counsel

This note does not assert that a comprehensive Pakistani personal-data protection act is currently in force. Public legal sources consulted during drafting indicate that the Personal Data Protection Bill 2023 remains a proposal/draft and was not passed through the Senate process recorded on the Senate bill page. Re-check current Gazette and parliamentary status immediately before launch.

Relevant official or primary references:

1. Prevention of Electronic Crimes Act, 2016 and the 2025 amendment — National Cyber Crime Investigation Agency laws page: https://nccia.gov.pk/laws.php
2. Ministry of IT and Telecommunication legislation listing, including the Personal Data Protection Bill (May 2023) shown as Draft: https://www.moitt.gov.pk/Legislations
3. Senate of Pakistan bill record for the Personal Data Protection Bill, 2023: https://senate.gov.pk/en/billsummary.php?bid=1182
4. Electronic Transactions Ordinance, 2002 — Pakistan Code: https://pakistancode.gov.pk/pdffiles/administratordbc98dd49f2df3b1d07bb986dcceb9a3.pdf

These sources are a starting point, not an exhaustive analysis of federal and provincial consumer, contract, intellectual-property, cybercrime, advertising, accessibility or e-commerce requirements.

## Required owner and counsel decisions before calling the documents approved

- **Deferred for this pass; not waived:** confirm the contracting operator's full legal name, business/individual status, service address and a monitored privacy contact channel. Add these to the policy and terms where appropriate.
- Confirm the actual hosting account, Cloudflare plan/settings, log access, retention, subprocessors and any international processing/transfer arrangements.
- Verify the deployed stylesheet no longer makes remote font requests and confirm no other third-party browser requests have been added.
- Confirm whether any cookies, local storage, telemetry, error reporting, CDN security challenges or other browser storage are active in production.
- Review the age/guardian wording, prohibited-use terms, disclaimers, liability wording and dispute/forum language for enforceability and mandatory consumer rights.
- Determine the process for privacy complaints and legal notices, including a private channel; do not direct confidential requests to public GitHub issues.
- Confirm the intended user markets beyond Pakistan. A Pakistan governing-law clause does not remove mandatory consumer or privacy laws that may apply elsewhere.
- Recheck the current law and Gazette notifications, including any enactment of a personal-data protection statute after the sources above were published.

## Release gate

The documents may be deployed as clearly labelled project drafts, but must not be represented as lawyer-approved or a guarantee of statutory compliance until a Pakistan-qualified lawyer has reviewed them and the operator/contact details and actual production data flows have been confirmed.
