# Security Policy

## Supported release line

Security fixes are applied to the active PixelTools release candidate and current production branch.

## Reporting a vulnerability

Please do not disclose suspected vulnerabilities in public issues, discussions or social posts.

Use GitHub's Report a vulnerability flow on the repository Security tab when private vulnerability reporting is available:
https://github.com/Hard-Worker-Dev/PixelTools/security/advisories/new

Include the affected component, impact, reproduction steps and safe proof of concept. Do not include real users' images or personal data.

If private vulnerability reporting is not enabled, contact the repository owner through their GitHub profile and request a private reporting route. The repository owner should enable private vulnerability reporting in GitHub repository security settings before a broad public launch.

## Security design notes

- Image processing for currently available tools is performed in the browser.
- The website does not provide a PixelTools image-upload API in this release.
- Inputs are restricted to JPG, PNG and WebP, with a 25 MB file limit.
- Image dimensions are checked before decoding, with a 12,000-pixel-per-side and 60-megapixel cap.
- EXIF can contain sensitive metadata, including GPS coordinates; review metadata before sharing it.
- Metadata Cleaner re-encodes an image and does not copy the source container, but browser encoders may add generic output metadata. It is not a forensic sanitizer.
