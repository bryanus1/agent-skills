# ⚡ Astro Architecture

> **Architecture standard for Astro projects (landing pages, *marketing sites* and *content-driven* sites) with Islands Architecture (*Zero-JS by default*), Tailwind CSS, Content Collections, technical SEO, OXC linting and Playwright E2E testing.**

| Property | Value |
| :--- | :--- |
| **Name** | `astro-architecture` |
| **Version** | `1.1.0` |
| **Category** | `architecture` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requirements** | `node` |

---

## 📦 Installation

```bash
# Install in the current project with skills.sh:
npx skills add bryanus1/agent-skills --skill astro-architecture

# Install globally on your machine:
npx skills add bryanus1/agent-skills --skill astro-architecture -g
```

---

## 💡 Usage Examples with AI Agents

- **Create the architecture of an Astro landing page:**
  > *"Structure an Astro landing page following `astro-architecture` with a Hero, Features, a JS-free FAQ and full SEO."*
  >
  > 🤖 **The agent will run:** `node <skill-dir>/scripts/scaffold-landing.mjs --target-dir . --name "My Product"`

- **Audit an existing Astro project:**
  > *"Check my Astro project for SEO, `astro:assets` usage and unnecessary `client:load`."*
  >
  > 🤖 **The agent will run:** `node <skill-dir>/scripts/audit-astro.mjs --target-dir .`

---

## 🛠️ Scripts and CLI Options

- **[`scripts/scaffold-landing.mjs`](scripts/scaffold-landing.mjs)**: generates the base structure (`BaseLayout.astro`, sections in `src/components/sections/`, `Navbar`, `Footer`, `src/data/site.ts`, `src/styles/global.css` and `src/pages/index.astro`) with English placeholder copy.
  - `--target-dir <path>`: root directory of the Astro project (default `.`).
  - `--name "<Name>"`: site/product name for the initial copy.
  - `--dry-run`: previews the files to create without writing to disk.
  - `--force`: overwrites existing files.
- **[`scripts/audit-astro.mjs`](scripts/audit-astro.mjs)**: audits `tsconfig.json`, `client:load` overuse, `<img>` tags without `astro:assets`, SEO metadata and `public/robots.txt`.
  - `--target-dir <path>`: root directory of the Astro project (default `.`).
  - `--strict`: exits with code `1` if it finds warnings as well as errors.

---

## 📚 Documentation and References

- **[`SKILL.md`](SKILL.md)**: step-by-step workflow and critical rules for the AI agent.
- **[Islands and Rendering](references/islands-and-rendering.md)**: *Zero-JS* criteria, `client:*` directives and SSG/SSR modes.
- **[Landing Page Blueprint](references/landing-blueprint.md)**: section order, conversion and WCAG AA accessibility.
- **[Content Collections and Data](references/content-and-data.md)**: typed data in `src/data/`, Content Collections with Zod and `astro:assets`.
- **[SEO and Core Web Vitals](references/seo-and-performance.md)**: checklist of metadata, Open Graph, JSON-LD, sitemap and performance.
- **[Toolchain and Testing (OXC + Playwright)](references/testing-and-toolchain.md)**: `.oxlintrc.json`, `oxfmt` and an E2E suite with Playwright over `astro preview`.
- **[Structure Example](examples/landing-structure.md)**: file tree and composition of `index.astro`.
