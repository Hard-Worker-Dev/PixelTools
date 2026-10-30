# Google Search Console Setup

PixelTools production URL prefix:
`https://pixeltools-9xe.pages.dev/`

Sitemap:
`https://pixeltools-9xe.pages.dev/sitemap.xml`

## Owner steps

1. Sign in to Google Search Console using the Google account that should own the property.
2. Choose **Add property** and select **URL prefix**.
3. Enter `https://pixeltools-9xe.pages.dev/`.
4. Choose the **HTML tag** verification method if you can edit this repository.
5. Copy the complete meta tag Google provides. Send only the verification tag's name and content values to the maintainer; never share a Google password, recovery code or login session.
6. Add that exact verification meta tag inside the `<head>` of `index.html`, commit and deploy.
7. Return to Search Console and select **Verify**.
8. Open **Sitemaps**, enter `sitemap.xml`, and submit it.
9. Use **URL Inspection** to request indexing of the homepage and important tool landing pages.

## Already prepared by the repository

- `public/robots.txt` permits normal crawling and points at the sitemap.
- `public/sitemap.xml` lists the homepage, informational pages and 14 tool landing pages.
- Static tests verify sitemap entries, internal links and canonical URLs.

## Important notes

- Search Console ownership verification and sitemap submission have not been completed by this repository change.
- Sitemap submission does not guarantee crawling, indexing, ranking or a particular search appearance.
- If a custom domain is added later, create and verify the matching property and update canonical URLs, sitemap and robots.txt before submitting the new sitemap.
