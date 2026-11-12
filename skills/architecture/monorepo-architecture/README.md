# 🗂️ Monorepo Architecture (`monorepo-architecture`)

> **Estándar de monorepo con pnpm workspaces, Turborepo y OXC para apps web (Next.js), API (NestJS), mobile (Expo), landing (Astro), workers y servicios políglotas: paquetes compilados, design tokens, contratos Zod/OpenAPI, límites por plataforma y scaffolding multi-app.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `monorepo-architecture` |
| **Categoría** | `architecture` |
| **Versión** | `2.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requisitos** | `node`, `pnpm` |
| **Skills Hermanas** | [`astro-architecture`](../astro-architecture/README.md), [`nestjs-architecture`](../nestjs-architecture/README.md), [`nextjs-architecture`](../nextjs-architecture/README.md), [`react-native-architecture`](../react-native-architecture/README.md) |

---

## 📦 Instalación

> **Importante:** Para el scaffolding completo entre aplicaciones, instala las skills hermanas que utilice tu monorepo junto a esta skill.

### Vía `skills.sh` CLI (Recomendado)

```bash
npx skills add bryanus1/agent-skills --skill monorepo-architecture
npx skills add bryanus1/agent-skills --skill nestjs-architecture
npx skills add bryanus1/agent-skills --skill nextjs-architecture
npx skills add bryanus1/agent-skills --skill react-native-architecture
npx skills add bryanus1/agent-skills --skill astro-architecture
```

### Vía Enlace Simbólico Local

```bash
mkdir -p .agents/skills
ln -s /ruta/a/agent-skills/skills/architecture/monorepo-architecture .agents/skills/monorepo-architecture
ln -s /ruta/a/agent-skills/skills/architecture/nestjs-architecture .agents/skills/nestjs-architecture
ln -s /ruta/a/agent-skills/skills/architecture/nextjs-architecture .agents/skills/nextjs-architecture
ln -s /ruta/a/agent-skills/skills/architecture/react-native-architecture .agents/skills/react-native-architecture
ln -s /ruta/a/agent-skills/skills/architecture/astro-architecture .agents/skills/astro-architecture
```

---

## 💡 Ejemplos de Uso con Agentes de IA

* **Crear un monorepo multi-plataforma (Web + API + Mobile + Landing)**:
  > *"Crea un monorepo para acme con web Next.js, API NestJS, app móvil Expo y landing Astro usando OpenAPI"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-monorepo.mjs --scope acme --contracts openapi --apps web,api,mobile,landing --dry-run`  
  > ➔ Genera raíz con `pnpm-workspace.yaml`, `turbo.json`, `.npmrc` (con hoisting para Expo), `packages/tsconfig` (8 presets), `packages/oxc-config`, `packages/api-client` y `pnpm check:boundaries`.

* **Añadir una app o servicio a un monorepo existente**:
  > *"Agrega una app móvil Expo y un worker Node al monorepo"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-app.mjs mobile --type mobile` y `node <skill-dir>/scripts/scaffold-app.mjs worker --type worker`  
  > ➔ Conecta `package.json` (`monorepo.platform`), `tsconfig.json`, `.oxlintrc.json` y `metro.config.js` en `apps/mobile`.

* **Andamiar un dominio de punta a punta (API + Web + Mobile)**:
  > *"Añade facturas en api, web y mobile"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-fullstack-feature.mjs invoice --targets api,web,mobile`  
  > ➔ Crea el contrato Zod en `packages/contracts/src/invoices`, el módulo NestJS de 18 archivos, la feature Next.js y la feature Expo/React Native de forma atómica.

* **Revisar límites entre workspaces y plataformas**:
  > *"¿Hay imports prohibidos entre apps, archivos .astro o paquetes web/móvil?"*
  >
  > 🤖 **El agente ejecutará**: `pnpm check:boundaries` (o `node <skill-dir>/scripts/check-boundaries.mjs`)  
  > ➔ Detecta `app-import`, `package-imports-app`, `relative-escape`, `undeclared`, `deep-import`, `cycle` y `platform-mismatch` (también dentro de `.astro`).

---

## 🛠️ Scripts y Opciones CLI

> `<skill-dir>` es el directorio donde está instalada esta skill (p. ej. `.agents/skills/monorepo-architecture` o `.claude/skills/monorepo-architecture`).

- **[`scripts/scaffold-monorepo.mjs`](scripts/scaffold-monorepo.mjs)**:
  ```bash
  node <skill-dir>/scripts/scaffold-monorepo.mjs --scope <scope> --contracts <zod|openapi> [--apps web,api,mobile,landing] [--linter oxc|eslint|both] [--pnpm-version <x.y.z>] [--dry-run] [--force]
  ```
- **[`scripts/scaffold-app.mjs`](scripts/scaffold-app.mjs)**:
  ```bash
  node <skill-dir>/scripts/scaffold-app.mjs <name> --type <web|api|mobile|landing|spa|docs|worker|polyglot> [--dir <path>] [--scope <scope>] [--linter oxc|eslint|both] [--dry-run] [--force]
  ```
- **[`scripts/scaffold-package.mjs`](scripts/scaffold-package.mjs)**:
  ```bash
  node <skill-dir>/scripts/scaffold-package.mjs <name> [--kind lib|contracts|api-client|design-tokens|ui-web|ui-native|config] [--linter oxc|eslint|both] [--scope <scope>] [--dry-run] [--force]
  ```
- **[`scripts/scaffold-fullstack-feature.mjs`](scripts/scaffold-fullstack-feature.mjs)**:
  ```bash
  node <skill-dir>/scripts/scaffold-fullstack-feature.mjs <noun-singular> [--targets api,web,mobile] [--contracts zod|openapi] [--plural <name>] [--api-dir apps/api] [--web-dir apps/web] [--mobile-dir apps/mobile] [--dry-run] [--force]
  ```
- **[`scripts/check-boundaries.mjs`](scripts/check-boundaries.mjs)**:
  ```bash
  node <skill-dir>/scripts/check-boundaries.mjs [--root .] [--apps-dir apps,services] [--json]
  ```

---

## 📚 Documentación y Referencias

- **[`SKILL.md`](SKILL.md)**: Especificación operativa completa, matriz de arquetipos y reglas críticas.
- **[Guía de Estructura del Monorepo](references/monorepo-structure-guide.md)**: Árbol multi-app (`web + api + mobile + landing`), conexión de apps y registro de nuevos stacks.
- **[Turborepo y pnpm Workspaces](references/turborepo-and-pnpm.md)**: Metro + pnpm para Expo, Astro, `turbo.json`, caché y variables de entorno.
- **[Paquetes Compartidos y Contratos](references/shared-packages-and-contracts.md)**: Compilación, ESM/CJS, `design-tokens`, `ui-web` vs `ui-native`, Zod y OpenAPI.
- **[Límites y Dependencias](references/boundaries-and-dependencies.md)**: Reglas del validador (`platform-mismatch`, `.astro`) y CI.
- **[Ejemplos de Flujos](examples/workflows.md)**: Monorepo 4-apps, añadir `mobile`/`worker`/`polyglot`, feature cross-platform y corrección de violaciones.
