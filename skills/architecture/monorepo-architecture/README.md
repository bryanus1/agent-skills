# 🗂️ Monorepo Architecture (`monorepo-architecture`)

> **Monorepo standard with pnpm workspaces, Turborepo and OXC for web (Next.js), API (NestJS), mobile (Expo), landing (Astro), workers and polyglot services: compiled packages, design tokens, Zod/OpenAPI contracts, per-platform boundaries and multi-app scaffolding.**

| Property | Value |
| :--- | :--- |
| **Name** | `monorepo-architecture` |
| **Category** | `architecture` |
| **Version** | `2.1.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requirements** | `node`, `pnpm` |
| **Sibling Skills** | [`astro-architecture`](../astro-architecture/README.md), [`nestjs-architecture`](../nestjs-architecture/README.md), [`nextjs-architecture`](../nextjs-architecture/README.md), [`react-native-architecture`](../react-native-architecture/README.md) |

---

## 📦 Installation

> **Important:** for full scaffolding across applications, install the sibling skills your monorepo uses alongside this skill.

### Via the `skills.sh` CLI (Recommended)

```bash
npx skills add bryanus1/agent-skills --skill monorepo-architecture
npx skills add bryanus1/agent-skills --skill nestjs-architecture
npx skills add bryanus1/agent-skills --skill nextjs-architecture
npx skills add bryanus1/agent-skills --skill react-native-architecture
npx skills add bryanus1/agent-skills --skill astro-architecture
```

### Via a Local Symlink

```bash
mkdir -p .agents/skills
ln -s /path/to/agent-skills/skills/architecture/monorepo-architecture .agents/skills/monorepo-architecture
ln -s /path/to/agent-skills/skills/architecture/nestjs-architecture .agents/skills/nestjs-architecture
ln -s /path/to/agent-skills/skills/architecture/nextjs-architecture .agents/skills/nextjs-architecture
ln -s /path/to/agent-skills/skills/architecture/react-native-architecture .agents/skills/react-native-architecture
ln -s /path/to/agent-skills/skills/architecture/astro-architecture .agents/skills/astro-architecture
```

---

## 💡 Usage Examples with AI Agents

* **Create a multi-platform monorepo (Web + API + Mobile + Landing)**:
  > *"Create a monorepo for acme with a Next.js web app, a NestJS API, an Expo mobile app and an Astro landing using OpenAPI"*
  >
  > 🤖 **The agent will run**: `node <skill-dir>/scripts/scaffold-monorepo.mjs --scope acme --contracts openapi --apps web,api,mobile,landing --dry-run`  
  > ➔ Generates the root with `pnpm-workspace.yaml`, `turbo.json`, `.npmrc` (with hoisting for Expo), `packages/tsconfig` (8 presets), `packages/oxc-config`, `packages/api-client` and `pnpm check:boundaries`.

* **Add an app or service to an existing monorepo**:
  > *"Add an Expo mobile app and a Node worker to the monorepo"*
  >
  > 🤖 **The agent will run**: `node <skill-dir>/scripts/scaffold-app.mjs mobile --type mobile` and `node <skill-dir>/scripts/scaffold-app.mjs worker --type worker`  
  > ➔ Wires up `package.json` (`monorepo.platform`), `tsconfig.json`, `.oxlintrc.json` and `metro.config.js` in `apps/mobile`.

* **Scaffold an end-to-end domain (API + Web + Mobile)**:
  > *"Add invoices to api, web and mobile"*
  >
  > 🤖 **The agent will run**: `node <skill-dir>/scripts/scaffold-fullstack-feature.mjs invoice --targets api,web,mobile`  
  > ➔ Atomically creates the Zod contract in `packages/contracts/src/invoices`, the 18-file NestJS module, the Next.js feature and the Expo/React Native feature.

* **Review boundaries between workspaces and platforms**:
  > *"Are there forbidden imports between apps, .astro files or web/mobile packages?"*
  >
  > 🤖 **The agent will run**: `pnpm check:boundaries` (or `node <skill-dir>/scripts/check-boundaries.mjs`)  
  > ➔ Detects `app-import`, `package-imports-app`, `relative-escape`, `undeclared`, `deep-import`, `cycle` and `platform-mismatch` (also inside `.astro` files).

---

## 🛠️ Scripts and CLI Options

> `<skill-dir>` is the directory where this skill is installed (e.g. `.agents/skills/monorepo-architecture` or `.claude/skills/monorepo-architecture`).

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

## 📚 Documentation and References

- **[`SKILL.md`](SKILL.md)**: the full operating spec, the archetype matrix and the critical rules.
- **[Monorepo Structure Guide](references/monorepo-structure-guide.md)**: the multi-app tree (`web + api + mobile + landing`), connecting apps and registering new stacks.
- **[Turborepo and pnpm Workspaces](references/turborepo-and-pnpm.md)**: Metro + pnpm for Expo, Astro, `turbo.json`, caching and environment variables.
- **[Shared Packages and Contracts](references/shared-packages-and-contracts.md)**: compilation, ESM/CJS, `design-tokens`, `ui-web` vs `ui-native`, Zod and OpenAPI.
- **[Boundaries and Dependencies](references/boundaries-and-dependencies.md)**: validator rules (`platform-mismatch`, `.astro`) and CI.
- **[Workflow Examples](examples/workflows.md)**: a 4-app monorepo, adding `mobile`/`worker`/`polyglot`, a cross-platform feature and fixing violations.
