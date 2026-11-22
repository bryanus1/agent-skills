# 🏝️ Islands and Rendering in Astro

## 1. Zero-JS by Default

In Astro, every `.astro` component is rendered at build time (SSG) or on the server (SSR) and **sends no JavaScript to the browser** unless you say so explicitly.

### Decision rule: do I need an island?

| Use case | Recommended solution | JS shipped |
| :--- | :--- | :--- |
| Hero, Features, static Pricing, Footer | Plain `.astro` component | `0 KB` |
| FAQ accordion | Native HTML `<details>` and `<summary>` | `0 KB` |
| Simple mobile menu | Checkbox/CSS or `<details>` | `0 KB` |
| Interactive tabs or filters with state | React/Svelte/Solid/Vue island (`client:visible`) | The island only |
| Multi-step form / calculator | Island (`client:visible`) | The island only |
| Authentication modal or global search | Island (`client:idle`) | The island only |
| *Above-the-fold* carousel / chart | Island (`client:load`) | The island only |

---

## 2. `client:*` Directives

- **`client:visible`**: hydrates when the component enters the viewport. **The default choice** for any *below-the-fold* island (complex FAQs, pricing calculators, contact forms at the end of the page).
- **`client:idle`**: hydrates when the browser's main thread is free. Ideal for non-critical widgets (chat, cookie banners, search bar).
- **`client:media="(max-width: 768px)"`**: hydrates only when the media query matches (for example, a mobile drawer).
- **`client:load`**: hydrates immediately on page load. **Use it very sparingly**, only if the user interacts within the first second *above the fold*.
- **`client:only="react"`**: skips server rendering. Avoid it on landing pages because it hurts SEO and LCP.

---

## 3. Rendering Modes (`astro.config.mjs`)

- **Static (`output: 'static'`)**: the default and the recommendation for landing pages, blogs and documentation. Maximum speed from a CDN.
- **SSR / Hybrid (`output: 'server'` + `export const prerender = true`)**: use it only when you need `/api/*` endpoints with dynamic logic (form submissions with secrets, webhooks, per-request personalization). In `server` mode, mark the landing's static pages with `export const prerender = true`.
