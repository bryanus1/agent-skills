# 🗂️ Monorepo Architecture (`monorepo-architecture`)

> **Estándar de monorepo con pnpm workspaces y Turborepo para una web Next.js y una API NestJS: estructura `apps/` y `packages/`, paquetes internos compilados, contratos compartidos (Zod u OpenAPI), límites de dependencias verificables y scaffolding de features full-stack.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `monorepo-architecture` |
| **Categoría** | `architecture` |
| **Versión** | `1.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requisitos** | `node`, `pnpm` |
| **Skills Requeridas** | [`nestjs-architecture`](../nestjs-architecture/README.md), [`nextjs-architecture`](../nextjs-architecture/README.md) |

---

## 📦 Instalación

> **Importante:** Esta skill requiere tener instaladas junto a ella [`nestjs-architecture`](../nestjs-architecture/README.md) y [`nextjs-architecture`](../nextjs-architecture/README.md).

### Vía `skills.sh` CLI (Recomendado)

```bash
# Instalar la skill y sus dependencias en el proyecto actual:
npx skills add bryanus1/agent-skills --skill monorepo-architecture
npx skills add bryanus1/agent-skills --skill nestjs-architecture
npx skills add bryanus1/agent-skills --skill nextjs-architecture
```

### Vía Enlace Simbólico Local

```bash
mkdir -p .agents/skills
ln -s /ruta/a/agent-skills/skills/architecture/monorepo-architecture .agents/skills/monorepo-architecture
ln -s /ruta/a/agent-skills/skills/architecture/nestjs-architecture .agents/skills/nestjs-architecture
ln -s /ruta/a/agent-skills/skills/architecture/nextjs-architecture .agents/skills/nextjs-architecture
```

---

## 💡 Ejemplos de Uso con Agentes de IA

* **Crear la estructura raíz del monorepo**:
  > *"Crea un monorepo para acme con web en Next.js y API en NestJS que compartan validaciones"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-monorepo.mjs --scope acme --contracts zod --dry-run` y, tras tu confirmación, sin `--dry-run`  
  > ➔ Genera raíz con `pnpm-workspace.yaml` y `turbo.json`, `packages/tsconfig`, `packages/eslint-config`, `packages/contracts` y `pnpm check:boundaries`.

* **Andamiar un dominio full-stack de punta a punta**:
  > *"Añade facturas de punta a punta"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-fullstack-feature.mjs invoice`  
  > ➔ Crea el contrato Zod en `packages/contracts/src/invoices`, el módulo NestJS de 18 archivos en `apps/api/src/modules/invoices` y la feature Next.js en `apps/web/src/features/invoices`. Si hay un conflicto en cualquier parte, aborta sin escribir nada.

* **Revisar límites entre workspaces**:
  > *"¿Hay imports prohibidos entre apps y paquetes?"*
  >
  > 🤖 **El agente ejecutará**: `pnpm check:boundaries` (o `node <skill-dir>/scripts/check-boundaries.mjs`)  
  > ➔ Detecta apps importando apps, paquetes importando apps, rutas relativas entre workspaces, dependencias no declaradas, imports profundos y ciclos.

---

## 🛠️ Scripts y Opciones CLI

> `<skill-dir>` es el directorio donde está instalada esta skill (p. ej. `.agents/skills/monorepo-architecture` o `.claude/skills/monorepo-architecture`).

- **[`scripts/scaffold-monorepo.mjs`](scripts/scaffold-monorepo.mjs)**:
  ```bash
  node <skill-dir>/scripts/scaffold-monorepo.mjs --scope <scope> --contracts <zod|openapi> [--pnpm-version <x.y.z>] [--dry-run] [--force]
  ```
- **[`scripts/scaffold-package.mjs`](scripts/scaffold-package.mjs)**:
  ```bash
  node <skill-dir>/scripts/scaffold-package.mjs <name> [--kind lib|contracts|api-client|config] [--scope <scope>] [--dry-run] [--force]
  ```
- **[`scripts/scaffold-fullstack-feature.mjs`](scripts/scaffold-fullstack-feature.mjs)**:
  ```bash
  node <skill-dir>/scripts/scaffold-fullstack-feature.mjs <noun-singular> [--contracts zod|openapi] [--plural <name>] [--api-dir apps/api] [--web-dir apps/web] [--dry-run] [--force]
  ```
- **[`scripts/check-boundaries.mjs`](scripts/check-boundaries.mjs)**:
  ```bash
  node <skill-dir>/scripts/check-boundaries.mjs [--root .] [--apps-dir apps] [--json]
  ```

---

## 📚 Documentación y Referencias

- **[`SKILL.md`](SKILL.md)**: Especificación operativa completa, matriz Zod vs OpenAPI y reglas críticas para el agente.
- **[Guía de Estructura del Monorepo](references/monorepo-structure-guide.md)**: Árbol completo, responsabilidades y conexión de apps.
- **[Turborepo y pnpm Workspaces](references/turborepo-and-pnpm.md)**: `workspace:*`, `turbo.json`, filtros, caché y variables de entorno.
- **[Paquetes Compartidos y Contratos](references/shared-packages-and-contracts.md)**: Paquetes compilados, `exports` y modos Zod y OpenAPI.
- **[Límites y Dependencias](references/boundaries-and-dependencies.md)**: Reglas del validador y cómo corregir violaciones.
- **[Ejemplos de Flujos](examples/workflows.md)**: Monorepo nuevo, dominio full-stack y corrección de violaciones.
