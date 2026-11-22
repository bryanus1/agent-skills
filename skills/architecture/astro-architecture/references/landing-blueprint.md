# 🧩 Landing Page Section Blueprint

An effective landing page follows a progressive conversion narrative. Each section lives in `src/components/sections/` as an independent `.astro` component and receives its typed data from `src/data/`.

---

## 1. Recommended Section Order

1. **Navbar (`src/components/ui/Navbar.astro`)**
   - Logo + at most 3–5 anchor links (`#features`, `#pricing`, `#faq`) + 1 highlighted primary CTA.
   - No mega dropdown menus that distract from the conversion goal.

2. **Hero (`HeroSection.astro`)**
   - **A single `<h1>` per page**, clear and benefit-oriented (not just the brand name).
   - A concise subtitle (1–2 lines) explaining *what it does* and *for whom*.
   - **Primary CTA** (main action) + optional **secondary CTA** (e.g. "Watch demo").
   - Main visual (*product shot*, illustration or code) optimized with `<Image loading="eager" fetchpriority="high" />` to protect LCP.

3. **Social Proof (`SocialProofSection.astro`)**
   - Customer logos, verifiable metrics or short testimonials right below the Hero.

4. **Value Proposition / Features (`FeaturesSection.astro`)**
   - Responsive grid (`grid-cols-1 md:grid-cols-3`) with 3–6 concrete benefits.
   - Light inline SVG icons or icons from an optimized set; avoid heavy client-side icon libraries.

5. **How It Works (`HowItWorksSection.astro`)**
   - 3 numbered steps that reduce perceived friction.

6. **Pricing / Plans (`PricingSection.astro`)** *(if applicable)*
   - At most 3 columns, visually highlighting the recommended plan (`aria-label` or a clear badge).

7. **FAQ (`FaqSection.astro`)**
   - Use native `<details>` and `<summary>` styled with Tailwind (`group`, `group-open:rotate-180`) to get accessible accordions without JavaScript.

8. **Final CTA + Footer (`CtaSection.astro`, `Footer.astro`)**
   - Close with a direct call to action and a footer with legal links, contact and social networks.

---

## 2. Accessibility (WCAG AA) and Tailwind CSS

- **Skip link:** include `<a href="#main-content" class="sr-only focus:not-sr-only ...">Skip to main content</a>` at the start of `BaseLayout.astro`.
- **Contrast:** at least `4.5:1` for normal text and `3:1` for large text or UI elements.
- **Focus states:** never remove `outline` without replacing it with `focus-visible:ring-2 focus-visible:ring-offset-2`.
- **Reduced motion:** respect `motion-reduce:transition-none` and `motion-reduce:animate-none` in animations.
