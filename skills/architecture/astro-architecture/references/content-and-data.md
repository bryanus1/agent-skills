# 📦 Content Collections, Datos Tipados y `astro:assets`

## 1. Datos Tipados para Landing Pages (`src/data/`)

Para el copy estructurado de una landing page (navegación, features, precios, FAQs), centraliza el contenido en `src/data/*.ts` con interfaces explícitas:

```ts
// src/data/site.ts
export interface NavItem {
  label: string;
  href: string;
}

export interface SiteConfig {
  name: string;
  title: string;
  description: string;
  url: string;
  nav: NavItem[];
}
```

**Ventaja:** Los componentes en `src/components/sections/` se mantienen limpios, reutilizables y fáciles de testear o traducir.

---

## 2. Content Collections con Zod (`src/content.config.ts`)

Cuando el proyecto incluya **blog, casos de éxito, changelog, testimonios extensos o documentación**, usa Content Collections en lugar de archivos sueltos:

```ts
// src/content.config.ts (Astro 5+)
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(100),
      description: z.string().max(160),
      publishedAt: z.coerce.date(),
      cover: image().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog };
```

---

## 3. Optimización de Imágenes con `astro:assets`

Usa siempre `<Image />` o `<Picture />` de `astro:assets` para imágenes importadas desde `src/assets/`:

```astro
---
import { Image } from 'astro:assets';
import heroImg from '../../assets/hero-dashboard.png';
---

<Image
  src={heroImg}
  alt="Panel principal mostrando métricas en tiempo real"
  widths={[480, 800, 1200]}
  sizes="(max-width: 768px) 100vw, 600px"
  loading="eager"
  fetchpriority="high"
  class="rounded-2xl shadow-xl"
/>
```

### Reglas para imágenes
- **Above-the-fold (Hero):** `loading="eager"` y `fetchpriority="high"`.
- **Below-the-fold:** `loading="lazy"` (comportamiento por defecto en `<Image />`).
- **Formato:** Astro convierte automáticamente a `webp`/`avif` en build.
- **Imágenes decorativas:** Usar `alt=""` y `aria-hidden="true"`.
