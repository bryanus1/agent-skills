# 🔍 Technical SEO and Core Web Vitals Checklist

## 1. Essential Metadata in `BaseLayout.astro`

Every `BaseLayout.astro` must accept `title`, `description`, `image` (optional) and `noindex` (optional), and generate:

- `<meta charset="utf-8" />` and `<meta name="viewport" content="width=device-width, initial-scale=1" />`
- `<title>{title}</title>` (ideally 50–60 characters)
- `<meta name="description" content={description} />` (140–160 characters)
- `<link rel="canonical" href={canonicalURL} />`, building the URL with `new URL(Astro.url.pathname, Astro.site)`
- **Open Graph:** `og:type`, `og:url`, `og:title`, `og:description`, `og:image`, `og:locale`
- **Twitter Cards:** `twitter:card` (`summary_large_image`), `twitter:title`, `twitter:description`, `twitter:image`

> **Important:** set `site: 'https://yourdomain.com'` in `astro.config.mjs` so `Astro.site` and `@astrojs/sitemap` generate valid absolute URLs.

---

## 2. Structured Data (JSON-LD)

Inject JSON-LD into the `<head>` with `<script type="application/ld+json" set:html={JSON.stringify(schema)} />`:

- **Product/SaaS landing:** `Organization` + `SoftwareApplication` (or `Product`).
- **FAQ section:** `FAQPage` with the real questions and answers visible on the page.

---

## 3. Crawling and Indexing

- Install `@astrojs/sitemap` in `astro.config.mjs`.
- Create `public/robots.txt` pointing to the sitemap:
  ```txt
  User-agent: *
  Allow: /

  Sitemap: https://yourdomain.com/sitemap-index.xml
  ```

---

## 4. Core Web Vitals

- **LCP (< 2.5s):** preload or `fetchpriority="high"` on the Hero image; self-hosted fonts (`@fontsource/*`) or `font-display: swap`.
- **CLS (< 0.1):** explicit dimensions on every image (`<Image />`) and reserved space for embeds or banners.
- **INP (< 200ms):** keep the JS bundle close to `0 KB` on initial load by avoiding unnecessary `client:load`.
