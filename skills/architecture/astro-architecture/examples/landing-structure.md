# 📁 Astro Structure and Composition Example

## 1. Recommended Folder Tree

```text
├── public/
│   ├── favicon.svg
│   ├── og-default.png
│   └── robots.txt
├── src/
│   ├── assets/                 # Images optimized by astro:assets
│   │   └── hero-preview.png
│   ├── components/
│   │   ├── sections/           # Page sections (Zero-JS)
│   │   │   ├── HeroSection.astro
│   │   │   ├── FeaturesSection.astro
│   │   │   ├── FaqSection.astro
│   │   │   └── CtaSection.astro
│   │   ├── ui/                 # Reusable primitives
│   │   │   ├── Navbar.astro
│   │   │   └── Footer.astro
│   │   └── islands/            # Interactive islands (only if they need JS)
│   │       └── PricingToggle.tsx
│   ├── data/                   # Copy and typed configuration
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

## 2. Composition of `src/pages/index.astro`

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
