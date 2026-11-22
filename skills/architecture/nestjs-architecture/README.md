# 🏛️ NestJS Modular Monolith Architecture (`nestjs-architecture`)

> **Modular Monolith standard for NestJS 12 (`NodeAdapter`, SWC, Vitest and OXC). Guides scaffolding of domain modules, DTO/Zod contracts with pagination, Swagger OpenAPI, ORM-agnostic repositories, a double RBAC/ownership barrier and $\ge 90\%$ test coverage.**

| Property | Value |
| :--- | :--- |
| **Name** | `nestjs-architecture` |
| **Category** | `architecture` |
| **Version** | `2.1.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requirements** | `node` |

---

## 📦 Installation

### Via the `skills.sh` CLI (Recommended)

```bash
# Install in the current project:
npx skills add bryanus1/agent-skills --skill nestjs-architecture

# Install globally on your machine:
npx skills add bryanus1/agent-skills --skill nestjs-architecture -g
```

### Via a Local Symlink

```bash
# Google Antigravity:
mkdir -p .agents/skills
ln -s /path/to/agent-skills/skills/architecture/nestjs-architecture .agents/skills/nestjs-architecture

# Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/nestjs-architecture .claude/skills/nestjs-architecture
```

---

## 💡 Usage Examples with AI Agents

* **Scaffold a full domain module with Prisma and Vitest (18 files)**:
  > *"Create the invoice module with Prisma, Vitest and clean architecture"*
  >
  > 🤖 **The agent will run**: `node <skill-dir>/scripts/scaffold-module.mjs invoice --target-dir src/modules --orm prisma`  
  > ➔ Generates the module's **18 files** (`entities`, `dto` with `PaginatedInvoiceResponseDto`, `repositories/repository.ts` with `IInvoiceRepository` and `INVOICE_REPOSITORY_TOKEN`, `repositories/invoice.repository.ts`, `services` with ownership, `controllers` with full Swagger, Vitest specs and `invoice.module.ts` exporting only `InvoiceService`).

* **Scaffold inside a monorepo with Zod contracts (`apps/api`)**:
  > *"Create the pet module wired to `@acme/contracts/pets` in the monorepo API"*
  >
  > 🤖 **The agent will run**: `node <skill-dir>/scripts/scaffold-module.mjs pet --target-dir apps/api/src/modules --contracts zod --scope acme`

---

## 🛠️ Scripts and CLI Options

> `<skill-dir>` is the directory where this skill is installed (e.g. `.agents/skills/nestjs-architecture` or `.claude/skills/nestjs-architecture`).

### [`scripts/scaffold-module.mjs`](scripts/scaffold-module.mjs)

```bash
node <skill-dir>/scripts/scaffold-module.mjs <noun-singular> [--target-dir <path>] [--plural <name>] [--orm custom|prisma|typeorm|drizzle] [--contracts class-validator|zod] [--scope <scope>] [--test-runner vitest|jest] [--dry-run] [--force]
```

* **Options**:
  * `--target-dir <path>`: destination directory (default `src/modules`).
  * `--plural <name>`: explicit plural in `kebab-case` when the pluralization is irregular.
  * `--orm <adapter>`: repository adapter (`custom`, `prisma`, `typeorm`, `drizzle`; default `custom`).
  * `--contracts <mode>`: input contracts (`class-validator` or `zod`; default `class-validator`).
  * `--scope <scope>`: npm scope for `--contracts zod` (e.g. `acme` → `@acme/contracts`).
  * `--test-runner <runner>`: spec runner (`vitest` or `jest`; default `vitest`).
  * `--dry-run`: previews the 18 files without writing to disk.
  * `--force`: overwrites existing files (only with explicit confirmation).

---

## 📚 Documentation and References

- **[`SKILL.md`](SKILL.md)**: full operating spec, the NestJS 12 stack (`NodeAdapter`, SWC, Vitest, OXC), the 18-file sequence and the critical rules.
- **[Modular Monolith and Stack Guide](references/modular-monolith-guide.md)**: bootstrap with `NodeAdapter`, SWC, `oxlint`/`oxfmt`, the global `src/` structure and inter-module communication.
- **[DTO, Zod and Swagger OpenAPI Standards](references/dto-and-swagger-standards.md)**: `ValidationPipe`, `PaginatedResponseDto`, `nestjs-zod` and the Swagger checklist.
- **[Repository and Domain Entity Pattern](references/repository-and-entity-pattern.md)**: Prisma/TypeORM/Drizzle adapters, transactions/Unit of Work and error mapping.
- **[RBAC and Ownership Validation Strategy](references/rbac-and-ownership.md)**: `APP_GUARD` order, `@CurrentUser()`, ownership in `create`/`findAll`/`findOne` and HTTP exceptions.
- **[Testing Strategy (Vitest + SWC + E2E)](references/testing-strategy.md)**: `vitest.config.ts` setup with `unplugin-swc`, unit tests, E2E and coverage exclusions.
- **[Workflow and Refactoring Examples](examples/workflows.md)**: refactoring a *Fat Controller* and inter-module communication.
