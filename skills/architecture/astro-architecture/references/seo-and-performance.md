# 🔍 Checklist de SEO Técnico y Core Web Vitals

## 1. Metadatos Esenciales en `BaseLayout.astro`

Todo `BaseLayout.astro` debe aceptar `title`, `description`, `image` (opcional) y `noindex` (opcional), generando:

- `<meta charset="utf-8" />` y `<meta name="viewport" content="width=device-width, initial-scale=1" />`
- `<title>{title}</title>` (idealmente 50–60 caracteres)
- `<meta name="description" content={description} />` (140–160 caracteres)
- `<link rel="canonical" href={canonicalURL} />` construyendo la URL con `new URL(Astro.url.pathname, Astro.site)`
- **Open Graph:** `og:type`, `og:url`, `og:title`, `og:description`, `og:image`, `og:locale`
- **Twitter Cards:** `twitter:card` (`summary_large_image`), `twitter:title`, `twitter:description`, `twitter:image`

> **Importante:** Configurar `site: 'https://tudominio.com'` en `astro.config.mjs` para que `Astro.site` y `@astrojs/sitemap` generen URLs absolutas válidas.

---

## 2. Datos Estructurados (JSON-LD)

Inyectar JSON-LD en el `<head>` mediante `<script type="application/ld+json" set:html={JSON.stringify(schema)} />`:

- **Landing de producto/SaaS:** `Organization` + `SoftwareApplication` (o `Product`).
- **Sección FAQ:** `FAQPage` con las preguntas y respuestas reales visibles en la página.

---

## 3. Rastreo e Indexación

- Instalar `@astrojs/sitemap` en `astro.config.mjs`.
- Crear `public/robots.txt` apuntando al sitemap:
  ```txt
  User-agent: *
  Allow: /

  Sitemap: https://tudominio.com/sitemap-index.xml
  ```

---

## 4. Core Web Vitals

- **LCP (< 2.5s):** Preload o `fetchpriority="high"` en la imagen del Hero; fuentes auto-hospedadas (`@fontsource/*`) o con `font-display: swap`.
- **CLS (< 0.1):** Dimensiones explícitas en todas las imágenes (`<Image />`) y reserva de espacio en embeds o banners.
- **INP (< 200ms):** Mantener el bundle de JS cercano a `0 KB` en la carga inicial evitando `client:load` innecesario.
