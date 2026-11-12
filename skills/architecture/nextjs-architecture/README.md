# ⚡ Next.js Screaming Architecture (`nextjs-architecture`)

> **Estándar de Screaming Architecture para Next.js App Router. Guía la estructuración por features, subcarpetas encapsuladas, Server Actions con Zod, hooks con TanStack Query, `FormDialog`, linting con OXC y testing con Vitest + SWC ($\ge 90\%$) y Playwright E2E.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `nextjs-architecture` |
| **Categoría** | `architecture` |
| **Versión** | `1.2.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requisitos** | `node` |

---

## 📦 Instalación

### Vía `skills.sh` CLI (Recomendado)

```bash
# Instalar en el proyecto actual:
npx skills add bryanus1/agent-skills --skill nextjs-architecture

# Instalar globalmente en tu máquina:
npx skills add bryanus1/agent-skills --skill nextjs-architecture -g
```

### Vía Enlace Simbólico Local

```bash
# Google Antigravity:
mkdir -p .agents/skills
ln -s /ruta/a/agent-skills/skills/architecture/nextjs-architecture .agents/skills/nextjs-architecture

# Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/nextjs-architecture .claude/skills/nextjs-architecture
```

---

## 💡 Ejemplos de Uso con Agentes de IA

* **Andamiar una feature completa con su ruta en App Router**:
  > *"Estructura la feature de facturación (billing) con Screaming Architecture, archivos iniciales y su ruta en App Router"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-feature.mjs billing --with-starter --with-route`  
  > ➔ Genera las 7 subcarpetas (`components`, `hooks`, `models`, `schemas`, `screens`, `services`, `utils`), modelo plano `.ts` sin tests, screen encapsulada con test en **Vitest**, barrel de hoja terminal y ruta delgada `src/app/billing/page.tsx`.

* **Crear componente modal desacoplado (`FormDialog`)**:
  > *"Crea un diálogo modal para crear facturas en billing con shadcn Dialog"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-component.mjs invoice-form-dialog --target-dir src/features/billing/components --type dialog`  
  > ➔ Genera el patrón `FormDialog` (`'use client'`) con TSDoc, test unitario con Vitest (`vi.fn()`) e `index.ts`.

---

## 🛠️ Scripts y Opciones CLI

> `<skill-dir>` es el directorio donde está instalada esta skill (p. ej. `.agents/skills/nextjs-architecture` o `.claude/skills/nextjs-architecture`).

- **[`scripts/scaffold-feature.mjs`](scripts/scaffold-feature.mjs)**:
  ```bash
  node <skill-dir>/scripts/scaffold-feature.mjs <feature-name> [--target-dir <path>] [--app-dir <path>] [--with-starter] [--with-route] [--dry-run] [--force]
  ```
- **[`scripts/scaffold-component.mjs`](scripts/scaffold-component.mjs)**:
  ```bash
  node <skill-dir>/scripts/scaffold-component.mjs <component-name> [--target-dir <path>] [--type default|dialog|section] [--dry-run] [--force]
  ```

---

## 📚 Documentación y Referencias

- **[`SKILL.md`](SKILL.md)**: Especificación operativa completa, regla de hoja terminal para barrels y reglas críticas para el agente.
- **[Guía Detallada de Screaming Architecture](references/screaming-architecture-guide.md)**: Estructura de directorios, frontera Server vs Client Components, capas, sufijos y convenciones de nombres.
- **[Patrones de Componentes y FormDialog](references/component-and-dialog-patterns.md)**: Protocolo de descubrimiento en 3 niveles, contenedor `FormDialog` conectado con Zod y TSDoc.
- **[Patrones de Datos: Server Actions & TanStack Query](references/tanstack-and-actions-pattern.md)**: Validación Zod en servidor, servicios encapsulados y key factories en hooks hoja.
- **[Testing y Toolchain: Vitest, Playwright, OXC y SWC](references/testing-and-toolchain.md)**: Configuración de Vitest + SWC ($\ge 90\%$ coverage), Playwright E2E (`e2e/`) y `.oxlintrc.json`.
