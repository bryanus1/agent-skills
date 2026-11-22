# 📦 Content Collections, Typed Data and `astro:assets`

## 1. Typed Data for Landing Pages (`src/data/`)

For the structured copy of a landing page (navigation, features, pricing, FAQs), centralize the content in `src/data/*.ts` with explicit interfaces:

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

**Benefit:** the components in `src/components/sections/` stay clean, reusable and easy to test or translate.

---

## 2. Content Collections with Zod (`src/content.config.ts`)

When the project includes a **blog, case studies, changelog, long testimonials or documentation**, use Content Collections instead of loose files:

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

## 3. Image Optimization with `astro:assets`

Always use `<Image />` or `<Picture />` from `astro:assets` for images imported from `src/assets/`:

```astro
---
import { Image } from 'astro:assets';
import heroImg from '../../assets/hero-dashboard.png';
---

<Image
  src={heroImg}
  alt="Main dashboard showing real-time metrics"
  widths={[480, 800, 1200]}
  sizes="(max-width: 768px) 100vw, 600px"
  loading="eager"
  fetchpriority="high"
  class="rounded-2xl shadow-xl"
/>
```

### Image rules
- **Above the fold (Hero):** `loading="eager"` and `fetchpriority="high"`.
- **Below the fold:** `loading="lazy"` (the default behavior of `<Image />`).
- **Format:** Astro converts to `webp`/`avif` automatically at build time.
- **Decorative images:** use `alt=""` and `aria-hidden="true"`.
