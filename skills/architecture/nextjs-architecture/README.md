# ⚡ Next.js Screaming Architecture (`nextjs-architecture`)

> **Screaming Architecture standard for the Next.js App Router. Guides feature-based structure, encapsulated subfolders, Server Actions with Zod, TanStack Query hooks, `FormDialog`, OXC linting and testing with Vitest + SWC ($\ge 90\%$) and Playwright E2E.**

| Property | Value |
| :--- | :--- |
| **Name** | `nextjs-architecture` |
| **Category** | `architecture` |
| **Version** | `1.3.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requirements** | `node` |

---

## 📦 Installation

### Via the `skills.sh` CLI (Recommended)

```bash
# Install in the current project:
npx skills add bryanus1/agent-skills --skill nextjs-architecture

# Install globally on your machine:
npx skills add bryanus1/agent-skills --skill nextjs-architecture -g
```

### Via a Local Symlink

```bash
# Google Antigravity:
mkdir -p .agents/skills
ln -s /path/to/agent-skills/skills/architecture/nextjs-architecture .agents/skills/nextjs-architecture

# Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/nextjs-architecture .claude/skills/nextjs-architecture
```

---

## 💡 Usage Examples with AI Agents

* **Scaffold a full feature with its App Router route**:
  > *"Structure the billing feature with Screaming Architecture, starter files and its App Router route"*
  >
  > 🤖 **The agent will run**: `node <skill-dir>/scripts/scaffold-feature.mjs billing --with-starter --with-route`  
  > ➔ Generates the 7 subfolders (`components`, `hooks`, `models`, `schemas`, `screens`, `services`, `utils`), a flat `.ts` model without tests, an encapsulated screen with a **Vitest** test, leaf-folder barrels and the thin route `src/app/billing/page.tsx`.

* **Create a decoupled modal component (`FormDialog`)**:
  > *"Create a modal dialog to create invoices in billing with the shadcn Dialog"*
  >
  > 🤖 **The agent will run**: `node <skill-dir>/scripts/scaffold-component.mjs invoice-form-dialog --target-dir src/features/billing/components --type dialog`  
  > ➔ Generates the `FormDialog` pattern (`'use client'`) with TSDoc, a Vitest unit test (`vi.fn()`) and an `index.ts`.

---

## 🛠️ Scripts and CLI Options

> `<skill-dir>` is the directory where this skill is installed (e.g. `.agents/skills/nextjs-architecture` or `.claude/skills/nextjs-architecture`).

- **[`scripts/scaffold-feature.mjs`](scripts/scaffold-feature.mjs)**:
  ```bash
  node <skill-dir>/scripts/scaffold-feature.mjs <feature-name> [--target-dir <path>] [--app-dir <path>] [--with-starter] [--with-route] [--dry-run] [--force]
  ```
- **[`scripts/scaffold-component.mjs`](scripts/scaffold-component.mjs)**:
  ```bash
  node <skill-dir>/scripts/scaffold-component.mjs <component-name> [--target-dir <path>] [--type default|dialog|section] [--dry-run] [--force]
  ```

---

## 📚 Documentation and References

- **[`SKILL.md`](SKILL.md)**: the full operating spec, the leaf-folder barrel policy and the critical rules for the agent.
- **[Detailed Screaming Architecture Guide](references/screaming-architecture-guide.md)**: directory structure, the Server vs Client Components boundary, layers, suffixes and naming conventions.
- **[Component and FormDialog Patterns](references/component-and-dialog-patterns.md)**: the 3-level discovery protocol, the `FormDialog` container wired to Zod, and TSDoc.
- **[Data Patterns: Server Actions & TanStack Query](references/tanstack-and-actions-pattern.md)**: server-side Zod validation, encapsulated services and key factories in leaf hooks.
- **[Testing and Toolchain: Vitest, Playwright, OXC and SWC](references/testing-and-toolchain.md)**: Vitest + SWC setup ($\ge 90\%$ coverage), Playwright E2E (`e2e/`) and `.oxlintrc.json`.
