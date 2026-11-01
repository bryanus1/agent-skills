# ⚡ Next.js Screaming Architecture (`nextjs-architecture`)

> **Estándar de Screaming Architecture para Next.js App Router. Guía la estructuración por features, subcarpetas encapsuladas, Server Actions, hooks con TanStack Query, componentes `FormDialog` y testing con cobertura $\ge 90\%$.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `nextjs-architecture` |
| **Categoría** | `architecture` |
| **Versión** | `1.1.1` |
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

* **Andamiar una feature completa**:
  > *"Estructura la feature de facturación (billing) con Screaming Architecture y un modelo inicial"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-feature.mjs billing --with-starter`  
  > ➔ Genera las 7 subcarpetas (`components`, `hooks`, `models`, `schemas`, `screens`, `services`, `utils`), modelos planos `.ts` sin tests, screen encapsulada y barrel de hoja terminal.

* **Crear componente modal desacoplado (`FormDialog`)**:
  > *"Crea un diálogo modal para crear facturas en billing con shadcn Dialog"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-component.mjs create-invoice-dialog --target-dir src/features/billing/components --type dialog`  
  > ➔ Genera el patrón `FormDialog` con TSDoc, validación y tests unitarios adyacentes.

---

## 🛠️ Scripts y Opciones CLI

> `<skill-dir>` es el directorio donde está instalada esta skill (p. ej. `.agents/skills/nextjs-architecture` o `.claude/skills/nextjs-architecture`).

- **[`scripts/scaffold-feature.mjs`](scripts/scaffold-feature.mjs)**:
  ```bash
  node <skill-dir>/scripts/scaffold-feature.mjs <feature-name> [--target-dir <path>] [--with-starter] [--dry-run] [--force]
  ```
- **[`scripts/scaffold-component.mjs`](scripts/scaffold-component.mjs)**:
  ```bash
  node <skill-dir>/scripts/scaffold-component.mjs <component-name> [--target-dir <path>] [--type default|dialog|section] [--dry-run] [--force]
  ```

---

## 📚 Documentación y Referencias

- **[`SKILL.md`](SKILL.md)**: Especificación operativa completa, regla de hoja terminal para barrels y reglas críticas para el agente.
- **[Guía Detallada de Screaming Architecture](references/screaming-architecture-guide.md)**: Estructura de directorios, capas, sufijos y convenciones de nombres.
- **[Patrones de Componentes y FormDialog](references/component-and-dialog-patterns.md)**: Protocolo de descubrimiento en 3 niveles, contenedor `FormDialog` y TSDoc.
- **[Patrones de Datos: Server Actions & TanStack Query](references/tanstack-and-actions-pattern.md)**: Guía de selección y snippets de Server Actions y React Query hooks.
