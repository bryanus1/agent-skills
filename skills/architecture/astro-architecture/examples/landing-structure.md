# 📁 Ejemplo de Estructura y Composición en Astro

## 1. Árbol de Carpetas Recomendado

```text
├── public/
│   ├── favicon.svg
│   ├── og-default.png
│   └── robots.txt
├── src/
│   ├── assets/                 # Imágenes optimizadas por astro:assets
│   │   └── hero-preview.png
│   ├── components/
│   │   ├── sections/           # Secciones de página (Zero-JS)
│   │   │   ├── HeroSection.astro
│   │   │   ├── FeaturesSection.astro
│   │   │   ├── FaqSection.astro
│   │   │   └── CtaSection.astro
│   │   ├── ui/                 # Primitivas reutilizables
│   │   │   ├── Navbar.astro
│   │   │   └── Footer.astro
│   │   └── islands/            # Islas interactivas (solo si requieren JS)
│   │       └── PricingToggle.tsx
│   ├── data/                   # Copy y configuración tipada
│   │   └── site.ts
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── global.css
├── astro.config.mjs
└── tsconfig.json
```

---

## 2. Composición de `src/pages/index.astro`

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import HeroSection from '../components/sections/HeroSection.astro';
import FeaturesSection from '../components/sections/FeaturesSection.astro';
import FaqSection from '../components/sections/FaqSection.astro';
import CtaSection from '../components/sections/CtaSection.astro';
import { siteConfig, landingContent } from '../data/site';
---

<BaseLayout title={siteConfig.title} description={siteConfig.description}>
  <HeroSection {...landingContent.hero} />
  <FeaturesSection features={landingContent.features} />
  <FaqSection faqs={landingContent.faqs} />
  <CtaSection {...landingContent.cta} />
</BaseLayout>
```
