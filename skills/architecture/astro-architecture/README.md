# ⚡ Astro Architecture

> **Estándar de arquitectura para proyectos Astro (landing pages, *marketing sites* y sitios *content-driven*) con Islands Architecture (*Zero-JS by default*), Tailwind CSS, Content Collections, SEO técnico, linting con OXC y testing E2E con Playwright.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `astro-architecture` |
| **Versión** | `1.0.0` |
| **Categoría** | `architecture` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requisitos** | `node` |

---

## 📦 Instalación

```bash
# Instalar en el proyecto actual con skills.sh:
npx skills add bryanus1/agent-skills --skill astro-architecture

# Instalar globalmente en tu máquina:
npx skills add bryanus1/agent-skills --skill astro-architecture -g
```

---

## 💡 Ejemplos de Uso con Agentes de IA

- **Crear la arquitectura de una landing page en Astro:**
  > *"Estructura una landing page en Astro siguiendo `astro-architecture` con Hero, Features, FAQ sin JS y SEO completo."*
  >
  > 🤖 **El agente ejecutará:** `node <skill-dir>/scripts/scaffold-landing.mjs --target-dir . --name "Mi Producto"`

- **Auditar un proyecto Astro existente:**
  > *"Revisa mi proyecto Astro para verificar SEO, uso de `astro:assets` y evitar `client:load` innecesario."*
  >
  > 🤖 **El agente ejecutará:** `node <skill-dir>/scripts/audit-astro.mjs --target-dir .`

---

## 🛠️ Scripts y Opciones CLI

- **[`scripts/scaffold-landing.mjs`](scripts/scaffold-landing.mjs)**: Genera la estructura base (`BaseLayout.astro`, secciones en `src/components/sections/`, `Navbar`, `Footer`, `src/data/site.ts`, `src/styles/global.css` y `src/pages/index.astro`).
  - `--target-dir <ruta>`: Directorio raíz del proyecto Astro (por defecto `.`).
  - `--name "<Nombre>"`: Nombre del sitio/producto para el copy inicial.
  - `--dry-run`: Previsualiza los archivos a crear sin escribir en disco.
  - `--force`: Sobrescribe archivos existentes.
- **[`scripts/audit-astro.mjs`](scripts/audit-astro.mjs)**: Audita `tsconfig.json`, abuso de `client:load`, etiquetas `<img>` sin `astro:assets`, metadatos SEO y `public/robots.txt`.
  - `--target-dir <ruta>`: Directorio raíz del proyecto Astro (por defecto `.`).
  - `--strict`: Sale con código `1` si detecta advertencias además de errores.

---

## 📚 Documentación y Referencias

- **[`SKILL.md`](SKILL.md)**: Flujo de trabajo paso a paso y reglas críticas para el agente de IA.
- **[Islas y Renderizado](references/islands-and-rendering.md)**: Criterios *Zero-JS*, directivas `client:*` y modos SSG/SSR.
- **[Blueprint de Landing Pages](references/landing-blueprint.md)**: Orden de secciones, conversión y accesibilidad WCAG AA.
- **[Content Collections y Datos](references/content-and-data.md)**: Datos tipados en `src/data/`, Content Collections con Zod y `astro:assets`.
- **[SEO y Core Web Vitals](references/seo-and-performance.md)**: Checklist de metadatos, Open Graph, JSON-LD, sitemap y rendimiento.
- **[Toolchain y Testing (OXC + Playwright)](references/testing-and-toolchain.md)**: Configuración de `.oxlintrc.json`, `oxfmt` y suite E2E con Playwright sobre `astro preview`.
- **[Ejemplo de Estructura](examples/landing-structure.md)**: Árbol de archivos y composición de `index.astro`.
