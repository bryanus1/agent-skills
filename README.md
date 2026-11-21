# 🤖 Agent Skills Hub

> **Repositorio centralizado de habilidades (*skills*), utilidades y flujos de trabajo agnósticos para Google Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf, Roo Code y asistentes de IA.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Skills Status](https://img.shields.io/badge/Skills-Validated-brightgreen.svg)](scripts/lint-skills.mjs)
[![Skills.sh Compatible](https://img.shields.io/badge/Skills.sh-Compatible-blue.svg)](https://skills.sh)

---

## 📖 Descripción General

**Agent Skills Hub** es un ecosistema abierto y estandarizado de habilidades modulares que enseñan a agentes y asistentes de IA cómo ejecutar tareas complejas con alta precisión y consistencia.

Diseñado bajo el principio de **Progressive Disclosure**:
1. **Descubrimiento (Level 1)**: Solo `name` y `description` se cargan en el prompt inicial.
2. **Activación (Level 2)**: El agente lee `SKILL.md` únicamente cuando la tarea coincide con los `triggers`.
3. **Profundización (Level 3)**: Documentación en `references/` o utilidades en `scripts/` se leen solo cuando se necesita.

---

## ⚡ Skills Disponibles en el Catálogo

> Haz clic en el nombre de cualquier skill para abrir su **`README.md`**, donde encontrarás su comando de instalación específico, requisitos, ejemplos de prompts, scripts CLI y referencias técnicas.

<!-- Tabla generada por `pnpm catalog` a partir del frontmatter de cada SKILL.md. No editar a mano. -->
<!-- catalog-table:start -->
| Skill | Categoría | Versión | Agentes | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **[`architecture-map`](skills/architecture/architecture-map/README.md)** | `architecture` | `1.0.0` | Todos | Genera o actualiza la página de arquitectura leyendo el repositorio real: stack, diagrama Mermaid, módulos/apps, datos, auth, flujos clave, integraciones y despliegue. Soporta Notion (MCP) y docs/ARCHITECTURE.md local, preservando notas manuales tras confirmar. |
| **[`astro-architecture`](skills/architecture/astro-architecture/README.md)** | `architecture` | `1.0.0` | Todos | Estándar de arquitectura para proyectos Astro (landing pages, marketing sites y sitios content-driven). Guía estructura modular, Islands Architecture (Zero-JS), Tailwind CSS, Content Collections con Zod, SEO técnico, astro:assets, linting con OXC y testing E2E con Playwright. |
| **[`monorepo-architecture`](skills/architecture/monorepo-architecture/README.md)** | `architecture` | `2.0.0` | Todos | Estándar de monorepo con pnpm workspaces, Turborepo y OXC para apps web (Next.js), API (NestJS), mobile (Expo), landing (Astro), workers y servicios políglotas: paquetes compilados, design tokens, contratos Zod/OpenAPI, límites por plataforma y scaffolding multi-app. |
| **[`nestjs-architecture`](skills/architecture/nestjs-architecture/README.md)** | `architecture` | `2.0.0` | Todos | Estándar de Modular Monolith para NestJS 12 (NodeAdapter, SWC, Vitest y OXC). Guía el andamiaje de módulos de dominio, contratos DTO/Zod, Swagger OpenAPI, repositorios ORM-agnósticos, doble barrera RBAC/ownership y testing &gt;= 90%. |
| **[`nextjs-architecture`](skills/architecture/nextjs-architecture/README.md)** | `architecture` | `1.2.1` | Todos | Estándar de Screaming Architecture para Next.js App Router. Guía la estructuración por features, subcarpetas encapsuladas, Server Actions con Zod, hooks con TanStack Query, FormDialog, linting con OXC y testing con Vitest + SWC (&gt;= 90%) y Playwright E2E. |
| **[`react-native-architecture`](skills/architecture/react-native-architecture/README.md)** | `architecture` | `1.1.0` | Todos | Estándar Screaming Architecture para React Native y Expo Router. Guía estructuración por features, rutas delgadas en src/app, TanStack Query, NativeWind, tests Jest &gt;= 90%, análisis estático con Oxlint y formato Oxfmt. Incluye validador y scaffolds de feature, componente, hook y servicio. |
| **[`gh-cli`](skills/git/gh-cli/README.md)** | `git` | `1.1.0` | Todos | Automates GitHub workflows with the gh CLI and scripts: Pull Requests with Conventional Commits, emojis and verified labels, GitHub Actions diagnostics, issues, and releases with generated notes. Use when creating or reviewing PRs, debugging failed workflows or publishing releases. |
| **[`git-cleanup`](skills/git/git-cleanup/README.md)** | `git` | `1.1.0` | Todos | Safely cleans up local Git branches after PRs are merged (squash or merge). Protects the main branches (main/master/develop), detects branches deleted on origin and removes stale branches without false negatives. Use after merging a PR or to prune old local branches. |
| **[`pr-plain-review`](skills/git/pr-plain-review/README.md)** | `git` | `1.1.0` | Todos | Plain-language review before approving a PR or branch: explains what changed, why, which critical files it touched (migrations, RLS, legal terms, auth, payments, infra) and what risk it carries. Read-only; it never edits code or approves without confirmation. |
| **[`backend-best-practices`](skills/practices/backend-best-practices/README.md)** | `practices` | `1.1.0` | Todos | Review and improve backend code (HTTP APIs, services, data access) with verifiable good practices: API design, validation and errors, data access, security, reliability and observability. Prioritizes by impact and fixes only what hurts. Use it when reviewing or writing endpoints, services and queries. |
| **[`clean-code`](skills/practices/clean-code/README.md)** | `practices` | `1.1.0` | Todos | Clean Code at the function and file level: names, small functions, error handling, comments and a code smell → refactor catalog, with a heuristic detector. Use it to clean up, refactor or review the readability of frontend or backend code, or when writing new code that must stay maintainable. |
| **[`code-quality-review`](skills/practices/code-quality-review/README.md)** | `practices` | `1.1.0` | Todos | Quality review of a change (branch, PR or paths) that orchestrates the practices skills: it sets the scope, picks the lenses that fit what changed (clean-code, SOLID, patterns, TDD, frontend, backend) and delivers a single prioritized, deduplicated report. Review only by default; it does not modify code. |
| **[`design-patterns`](skills/practices/design-patterns/README.md)** | `practices` | `1.1.0` | Todos | Choose and apply design patterns (GoF and modern: Strategy, Adapter, Factory, Repository, Result, Compound Components, hooks) starting from the problem, not the catalog, and decide when to use NONE. Use it when a pattern is requested, or on repeated ifs/switches, coupled SDKs or duplicated UI logic, in frontend or backend. |
| **[`frontend-best-practices`](skills/practices/frontend-best-practices/README.md)** | `practices` | `1.1.0` | Todos | Review and improve frontend code (React/Next.js and similar) with verifiable good practices: state and effects, remote data, forms, accessibility, performance and security. Prioritizes findings by impact and fixes only what hurts. Use it when reviewing or writing components, hooks and pages. |
| **[`solid-principles`](skills/practices/solid-principles/README.md)** | `practices` | `1.1.0` | Todos | Apply and review the SOLID principles (SRP, OCP, LSP, ISP, DIP) at the class, module and component level, in backend and frontend: detect violations, refactor with tests and decide when NOT to apply them. Use it when designing or reviewing classes, services, hooks or components with too many responsibilities or too much coupling. |
| **[`tdd-workflow`](skills/practices/tdd-workflow/README.md)** | `practices` | `1.1.0` | Todos | Test-driven development (TDD): Red → Green → Refactor cycle with a test list, triangulation and test doubles, for frontend and backend. Use it to build a feature or fix a bug "with TDD", "test first" or "writing the tests first", or to reproduce a bug with a failing test before fixing it. |
| **[`ssh-connect`](skills/tooling/ssh-connect/README.md)** | `tooling` | `1.1.0` | Todos | Manages, connects to and runs commands on SSH servers with ssh-connect. Supports .pem keys with locked-down permissions, automated passwords (Keychain) and persistent multiplexing with no TTY hangs. Use to connect to, diagnose or transfer files with a remote server. |
| **[`ts-import-organizer`](skills/tooling/ts-import-organizer/README.md)** | `tooling` | `1.2.0` | Todos | Organizes imports in TypeScript/JavaScript (.ts, .tsx, .js, .jsx), always AFTER the code is formatted. Groups: builtins → external → path aliases → side effects. Sorts lines and members ({ ... }) by length, removes unused imports and turns deep relative paths into aliases. Use when sorting imports or writing code. |
| **[`explain-change`](skills/workflow/explain-change/README.md)** | `workflow` | `1.1.0` | Todos | After an AI implements a change (/opsx:apply, idd-apply or any plan), compares the real diff against the original proposal and sums up the decisions the AI made that were not specified: assumptions, extra scope, contracts, dependencies and shortcuts. Read-only. |
| **[`idd-apply`](skills/workflow/idd-apply/README.md)** | `workflow` | `1.1.0` | Todos | Apply phase of the IDD (Issue-Driven Development) flow. Implements the plan saved in Notion, Linear, GitHub Issues/Projects or a local .md: runs the tasks in order, ticks each checkbox once verified, stops on deviations and closes with the plan's verification. |
| **[`idd-explore`](skills/workflow/idd-explore/README.md)** | `workflow` | `2.1.0` | Todos | Explore phase of the IDD (Issue-Driven Development) flow. Refines Notion, Linear, GitHub Issues/Projects items or local notes that only have a title or loose ideas: explores the repo, extracts constraints and rules, keeps estimates and leaves a spec ready for idd-plan. |
| **[`idd-plan`](skills/workflow/idd-plan/README.md)** | `workflow` | `1.1.0` | Todos | Plan phase of the IDD (Issue-Driven Development) flow. Turns a Notion, Linear, GitHub Issues/Projects item or a local .md into a detailed implementation plan: requirements with scenarios, design, verified files, tasks and verification. Does not touch code. |
<!-- catalog-table:end -->

### 🧭 Flujo IDD (Issue-Driven Development)

Tres skills ligeras, solo Markdown, inspiradas en Spec-Driven Development: **`idd-explore`** (refina el requerimiento) → **`idd-plan`** (plan detallado con requisitos, escenarios, tareas y verificación) → **`idd-apply`** (implementa y marca las tareas). Cada cambio vive en un solo lugar: el ítem de tu tracker (Notion, Linear, GitHub Issues/Projects) o, si no usas ninguno, `docs/specs/<YYYY-MM-DD>-<slug>.md`.

```bash
npx skills add bryanus1/agent-skills --skill idd-explore --skill idd-plan --skill idd-apply
```

---

## 📦 Cómo Instalar y Usar las Skills

Puedes instalar estas skills directamente desde GitHub en cualquier proyecto o asistente de IA usando [`skills.sh`](https://skills.sh) CLI o mediante enlaces simbólicos locales. Consulta el `README.md` de cada skill en la tabla superior para ver sus dependencias y ejemplos de activación.

### 1. Vía CLI oficial (`skills.sh`) — *Recomendado*

```bash
# Listar todas las skills disponibles en este repositorio:
npx skills add bryanus1/agent-skills --list

# Instalar una skill específica en tu proyecto actual:
npx skills add bryanus1/agent-skills --skill <skill-name>

# Instalar una skill globalmente en tu máquina (disponible para todos tus proyectos):
npx skills add bryanus1/agent-skills --skill <skill-name> -g

# Instalar todas las skills del repositorio:
npx skills add bryanus1/agent-skills --all
```

### 2. Vía Enlace Simbólico (Symlink Local)

Si tienes este repositorio clonado en tu máquina y quieres reflejar los cambios automáticamente:

```bash
# Para Google Antigravity:
mkdir -p .agents/skills
ln -s /ruta/a/agent-skills/skills/<categoria>/<skill-name> .agents/skills/<skill-name>

# Para Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/<skill-name> .claude/skills/<skill-name>
```

---

## 📂 Estructura del Repositorio

```
agent-skills/
├── docs/                        # Estándares técnicos y de contribución
│   ├── SPECIFICATION.md         # Especificación técnica v1.0.0 del formato de skills
│   └── CONTRIBUTING.md          # Flujo de trabajo y normas para contribuir
├── templates/                   # Plantillas base (incluyen README.md y SKILL.md)
│   ├── basic-skill/             # Plantilla para flujos basados en Markdown puro
│   └── tool-assisted-skill/     # Plantilla con scripts ejecutables y referencias
├── skills/                      # Catálogo organizado por categorías (<categoría>/<skill>/)
│   ├── architecture/            # monorepo, nestjs, nextjs, react-native
│   ├── git/                     # git-cleanup, gh-cli
│   ├── practices/               # tdd-workflow, clean-code, solid-principles, design-patterns, frontend/backend-best-practices, code-quality-review
│   ├── tooling/                 # ts-import-organizer, ssh-connect
│   └── workflow/                # idd-explore, idd-plan, idd-apply (flujo IDD)
├── catalog/
│   └── catalog.json             # Índice de skills generado por `pnpm catalog`
├── scripts/                     # Herramientas de automatización y validación del hub
│   ├── lib/skills.mjs           # Descubrimiento y parseo de SKILL.md compartido
│   ├── lint-skills.mjs          # Linter: schema, README.md, enlaces, rutas absolutas y secciones
│   ├── build-catalog.mjs        # Genera catalog.json y la tabla del README
│   └── check-skill-versions.mjs # Verifica incrementos SemVer en PRs
├── tests/                       # Suite de pruebas unitarias (node:test)
├── AGENTS.md                    # Instrucciones y reglas para agentes trabajando en este repo
├── package.json
└── README.md
```

Cada carpeta de skill (`skills/<categoría>/<skill>/`) contiene su propio **`README.md`** (documentación humana, instalación y ejemplos) y su **`SKILL.md`** (instrucciones operativas para el agente).

---

## 🤝 Cómo Contribuir y Trabajar en este Repo

Para mantener la calidad y el estándar agnóstico, revisa la [**Guía de Contribución (`docs/CONTRIBUTING.md`)**](docs/CONTRIBUTING.md) y la [**Especificación Técnica (`docs/SPECIFICATION.md`)**](docs/SPECIFICATION.md).

### Resumen del flujo de desarrollo:

1. **Crear una rama**: `git checkout -b feat/mi-nueva-skill`.
2. **Elegir plantilla**: Copiar desde `templates/basic-skill` o `templates/tool-assisted-skill`.
3. **Escribir `SKILL.md` y `README.md`**: Definir Frontmatter YAML válido en `SKILL.md` (`name`, `version`, `description` < 350 chars, `triggers`) y documentar la instalación y ejemplos de uso en `README.md`.
4. **Validar con el Linter, regenerar el catálogo y ejecutar tests**:
   ```bash
   pnpm lint:strict
   pnpm catalog
   pnpm test
   ```
5. **Commit con Conventional Commits**: `feat(categoria): add mi-nueva-skill`.

---

## 📄 Licencia

Distribuido bajo la Licencia [MIT](LICENSE).
