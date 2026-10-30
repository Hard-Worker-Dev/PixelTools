// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
describe("published site contract", () => {
  it("contains the core informational pages", () => {
    for (const path of ["public/about/index.html", "public/privacy/index.html", "public/terms/index.html", "public/contact/index.html", "public/404.html"]) expect(existsSync(resolve(root, path)), path).toBe(true);
  });
  it("adds SEO metadata and FAQ schema to all tool pages", () => {
    const slugs = ["image-compressor","image-resizer","image-cropper","image-converter","image-rotator","image-flipper","image-watermark","rounded-corners","image-blur","grayscale-converter","image-color-picker","image-metadata-viewer","image-to-base64","image-metadata-cleaner"];
    for (const slug of slugs) {
      const html = read("public/tools/" + slug + "/index.html");
      expect(html, slug).toContain("<title>");
      expect(html, slug).toContain('name="description"');
      expect(html, slug).toContain('rel="canonical"');
      expect(html, slug).toContain("https://pixeltools-9xe.pages.dev/tools/" + slug + "/");
      expect(html, slug).toContain("<h1>");
      expect(html, slug).toContain("FAQPage");
    }
  });
  it("keeps homepage, informational canonicals and robots on the production hostname", () => {
    expect(read("index.html")).toContain('href="https://pixeltools-9xe.pages.dev/"');
    for (const page of ["about", "privacy", "terms", "contact"]) {
      expect(read("public/" + page + "/index.html")).toContain('href="https://pixeltools-9xe.pages.dev/' + page + '/">');
    }
    expect(read("public/robots.txt")).toContain("Sitemap: https://pixeltools-9xe.pages.dev/sitemap.xml");
    expect(read("index.html")).not.toContain("pixeltools.pages.dev");
  });

  it("includes every published page in the sitemap", () => {
    const sitemap = read("public/sitemap.xml");
    const paths = ["/","/about/","/privacy/","/terms/","/contact/","/tools/image-compressor/","/tools/image-resizer/","/tools/image-cropper/","/tools/image-converter/","/tools/image-rotator/","/tools/image-flipper/","/tools/image-watermark/","/tools/rounded-corners/","/tools/image-blur/","/tools/grayscale-converter/","/tools/image-color-picker/","/tools/image-metadata-viewer/","/tools/image-to-base64/","/tools/image-metadata-cleaner/"];
    for (const path of paths) expect(sitemap).toContain("https://pixeltools-9xe.pages.dev" + path);
  });
  it("keeps every static page internal navigation link resolvable", () => {
    const sitemap = read("public/sitemap.xml");
    const routes = Array.from(sitemap.matchAll(/<loc>https:\/\/pixeltools-9xe\.pages\.dev([^<]*)<\/loc>/g), match => match[1]);
    const pages = ["index.html", ...routes.filter(route => route !== "/").map(route => "public/" + route.replace(/^\//, "") + "index.html"), "public/404.html"];
    for (const page of pages) {
      const html = read(page);
      const links = Array.from(html.matchAll(/href="([^"]+)"/g), match => match[1]);
      for (const href of links) {
        if (!href.startsWith("/") || href.startsWith("//")) continue;
        const route = href.split(/[?#]/)[0];
        if (!route) continue;
        const target = route === "/" ? "index.html" : route.endsWith("/")
          ? "public/" + route.replace(/^\//, "") + "index.html"
          : "public/" + route.replace(/^\//, "");
        expect(existsSync(resolve(root, target)), page + " -> " + href).toBe(true);
      }
    }
  });
  it("ships baseline browser security headers", () => {
    const headers = read("public/_headers");
    for (const value of ["X-Content-Type-Options: nosniff","Referrer-Policy:","X-Frame-Options: DENY","Content-Security-Policy:","frame-ancestors \'none\'"]) expect(headers).toContain(value);
  });
  it("does not claim AI tools are live", () => expect(read("public/about/index.html")).toContain("not available yet"));
});