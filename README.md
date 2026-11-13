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
| **[`astro-architecture`](skills/architecture/astro-architecture/README.md)** | `architecture` | `1.0.0` | Todos | Estándar de arquitectura para proyectos Astro (landing pages, marketing sites y sitios content-driven). Guía estructura modular, Islands Architecture (Zero-JS), Tailwind CSS, Content Collections con Zod, SEO técnico, astro:assets, linting con OXC y testing E2E con Playwright. |
| **[`monorepo-architecture`](skills/architecture/monorepo-architecture/README.md)** | `architecture` | `2.0.0` | Todos | Estándar de monorepo con pnpm workspaces, Turborepo y OXC para apps web (Next.js), API (NestJS), mobile (Expo), landing (Astro), workers y servicios políglotas: paquetes compilados, design tokens, contratos Zod/OpenAPI, límites por plataforma y scaffolding multi-app. |
| **[`nestjs-architecture`](skills/architecture/nestjs-architecture/README.md)** | `architecture` | `2.0.0` | Todos | Estándar de Modular Monolith para NestJS 12 (NodeAdapter, SWC, Vitest y OXC). Guía el andamiaje de módulos de dominio, contratos DTO/Zod, Swagger OpenAPI, repositorios ORM-agnósticos, doble barrera RBAC/ownership y testing &gt;= 90%. |
| **[`nextjs-architecture`](skills/architecture/nextjs-architecture/README.md)** | `architecture` | `1.2.1` | Todos | Estándar de Screaming Architecture para Next.js App Router. Guía la estructuración por features, subcarpetas encapsuladas, Server Actions con Zod, hooks con TanStack Query, FormDialog, linting con OXC y testing con Vitest + SWC (&gt;= 90%) y Playwright E2E. |
| **[`react-native-architecture`](skills/architecture/react-native-architecture/README.md)** | `architecture` | `1.1.0` | Todos | Estándar Screaming Architecture para React Native y Expo Router. Guía estructuración por features, rutas delgadas en src/app, TanStack Query, NativeWind, tests Jest &gt;= 90%, análisis estático con Oxlint y formato Oxfmt. Incluye validador y scaffolds de feature, componente, hook y servicio. |
| **[`gh-cli`](skills/git/gh-cli/README.md)** | `git` | `1.0.1` | Todos | Automatización de flujos de GitHub con gh CLI y scripts: Pull Requests con Conventional Commits, emojis y labels verificados, diagnóstico de GitHub Actions, issues y releases con notas generadas. Úsala al crear o revisar PRs, depurar workflows fallidos o publicar releases. |
| **[`git-cleanup`](skills/git/git-cleanup/README.md)** | `git` | `1.0.0` | Todos | Limpieza segura de ramas locales de Git tras fusionar PRs (Squash/Merge). Protege ramas principales (main/master/develop), detecta ramas eliminadas en origin y elimina ramas obsoletas sin falsos negativos. |
| **[`backend-best-practices`](skills/practices/backend-best-practices/README.md)** | `practices` | `1.0.0` | Todos | Revisa y mejora código backend (APIs HTTP, servicios, acceso a datos) con buenas prácticas verificables: diseño de API, validación y errores, acceso a datos, seguridad, fiabilidad y observabilidad. Prioriza por impacto y corrige solo lo que duele. Úsala al revisar o escribir endpoints, servicios y consultas. |
| **[`clean-code`](skills/practices/clean-code/README.md)** | `practices` | `1.0.0` | Todos | Clean Code a nivel de función y archivo: nombres, funciones pequeñas, manejo de errores, comentarios y catálogo de code smells → refactor, con detector heurístico. Úsala al limpiar, refactorizar o revisar la legibilidad de código frontend o backend, o al escribir código nuevo que deba quedar mantenible. |
| **[`code-quality-review`](skills/practices/code-quality-review/README.md)** | `practices` | `1.0.0` | Todos | Revisión de calidad de un cambio (rama, PR o rutas) que orquesta las skills de practices: delimita el alcance, elige las lentes según lo que cambió (clean-code, SOLID, patrones, TDD, frontend, backend) y entrega un único informe priorizado y sin duplicados. Por defecto solo revisa; no modifica. |
| **[`design-patterns`](skills/practices/design-patterns/README.md)** | `practices` | `1.0.0` | Todos | Elige y aplica patrones de diseño (GoF y modernos: Strategy, Adapter, Factory, Repository, Result, Compound Components, hooks) a partir del problema, no del catálogo, y decide cuándo NO usar ninguno. Úsala al pedir un patrón, al ver ifs/switch repetidos, SDKs acoplados o lógica de UI duplicada, en frontend o backend. |
| **[`frontend-best-practices`](skills/practices/frontend-best-practices/README.md)** | `practices` | `1.0.0` | Todos | Revisa y mejora código frontend (React/Next.js y afines) con buenas prácticas verificables: estado y efectos, datos remotos, formularios, accesibilidad, rendimiento y seguridad. Prioriza hallazgos por impacto y corrige solo lo que duele. Úsala al revisar o escribir componentes, hooks y páginas. |
| **[`solid-principles`](skills/practices/solid-principles/README.md)** | `practices` | `1.0.0` | Todos | Aplica y revisa los principios SOLID (SRP, OCP, LSP, ISP, DIP) a nivel de clase, módulo y componente, en backend y frontend: detecta violaciones, refactoriza con tests y decide cuándo NO aplicarlos. Úsala al diseñar o revisar clases, servicios, hooks o componentes con demasiadas responsabilidades o acoplamiento. |
| **[`tdd-workflow`](skills/practices/tdd-workflow/README.md)** | `practices` | `1.0.0` | Todos | Desarrollo guiado por tests (TDD): ciclo Red → Green → Refactor con lista de tests, triangulación y test doubles, para frontend y backend. Úsala al implementar una feature o corregir un bug "con TDD", "test first" o "escribiendo los tests primero", o al reproducir un bug con un test que falle antes de arreglarlo. |
| **[`ssh-connect`](skills/tooling/ssh-connect/README.md)** | `tooling` | `1.0.0` | Todos | Gestión, conexión y ejecución remota en servidores SSH con ssh-connect. Soporta llaves .pem con permisos asegurados, contraseñas automatizadas (Keychain) y multiplexación persistente sin bloqueos de TTY. |
| **[`ts-import-organizer`](skills/tooling/ts-import-organizer/README.md)** | `tooling` | `1.1.1` | Todos | Organiza imports en TypeScript/JavaScript (.ts, .tsx, .js, .jsx). Se aplica siempre DESPUÉS de formatear el código. Agrupa: builtins → externos → path aliases → side-effects. Ordena líneas y miembros ({ ... }) por longitud, elimina unused y convierte rutas relativas a aliases. Activa al ordenar imports o escribir código. |
| **[`idd-apply`](skills/workflow/idd-apply/README.md)** | `workflow` | `1.0.0` | Todos | Fase Apply del flujo IDD (Issue-Driven Development). Implementa el plan guardado en Notion, Linear, GitHub Issues/Projects o un .md local: ejecuta las tareas en orden, marca cada casilla al verificarla, se detiene ante desviaciones y cierra con la verificación del plan. |
| **[`idd-explore`](skills/workflow/idd-explore/README.md)** | `workflow` | `2.0.0` | Todos | Fase Explore del flujo IDD (Issue-Driven Development). Refina issues de Notion, Linear, GitHub Issues/Projects o notas locales con solo título o ideas sueltas: explora el repo, extrae restricciones y reglas, preserva estimaciones y deja una ficha lista para idd-plan. |
| **[`idd-plan`](skills/workflow/idd-plan/README.md)** | `workflow` | `1.0.0` | Todos | Fase Plan del flujo IDD (Issue-Driven Development). Convierte un ítem de Notion, Linear, GitHub Issues/Projects o un .md local en un plan de implementación detallado: requisitos con escenarios, diseño, archivos verificados, tareas y verificación. No toca código. |
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
