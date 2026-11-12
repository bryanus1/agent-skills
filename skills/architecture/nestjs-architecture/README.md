# 🏛️ NestJS Modular Monolith Architecture (`nestjs-architecture`)

> **Estándar de Modular Monolith para NestJS 12 (`NodeAdapter`, SWC, Vitest y OXC). Guía el andamiaje de módulos de dominio, contratos DTO/Zod con paginación, Swagger OpenAPI, repositorios ORM-agnósticos, doble barrera RBAC/ownership y testing $\ge 90\%$.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `nestjs-architecture` |
| **Categoría** | `architecture` |
| **Versión** | `2.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requisitos** | `node` |

---

## 📦 Instalación

### Vía `skills.sh` CLI (Recomendado)

```bash
# Instalar en el proyecto actual:
npx skills add bryanus1/agent-skills --skill nestjs-architecture

# Instalar globalmente en tu máquina:
npx skills add bryanus1/agent-skills --skill nestjs-architecture -g
```

### Vía Enlace Simbólico Local

```bash
# Google Antigravity:
mkdir -p .agents/skills
ln -s /ruta/a/agent-skills/skills/architecture/nestjs-architecture .agents/skills/nestjs-architecture

# Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/nestjs-architecture .claude/skills/nestjs-architecture
```

---

## 💡 Ejemplos de Uso con Agentes de IA

* **Andamiar un módulo de dominio completo con Prisma y Vitest (18 archivos)**:
  > *"Crea el módulo de facturas (invoice) con Prisma, Vitest y arquitectura limpia"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-module.mjs invoice --target-dir src/modules --orm prisma`  
  > ➔ Genera los **18 archivos** del módulo (`entities`, `dto` con `PaginatedInvoiceResponseDto`, `repositories/repository.ts` con `IInvoiceRepository` e `INVOICE_REPOSITORY_TOKEN`, `repositories/invoice.repository.ts`, `services` con ownership, `controllers` con Swagger completo, specs en Vitest y `invoice.module.ts` exportando solo `InvoiceService`).

* **Andamiar dentro de un monorepo con contratos Zod (`apps/api`)**:
  > *"Crea el módulo de mascotas (pet) conectado a `@acme/contracts/pets` en la API del monorepo"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-module.mjs pet --target-dir apps/api/src/modules --contracts zod --scope acme`

---

## 🛠️ Scripts y Opciones CLI

> `<skill-dir>` es el directorio donde está instalada esta skill (p. ej. `.agents/skills/nestjs-architecture` o `.claude/skills/nestjs-architecture`).

### [`scripts/scaffold-module.mjs`](scripts/scaffold-module.mjs)

```bash
node <skill-dir>/scripts/scaffold-module.mjs <noun-singular> [--target-dir <path>] [--plural <name>] [--orm custom|prisma|typeorm|drizzle] [--contracts class-validator|zod] [--scope <scope>] [--test-runner vitest|jest] [--dry-run] [--force]
```

* **Opciones**:
  * `--target-dir <path>`: Directorio destino (por defecto `src/modules`).
  * `--plural <name>`: Plural explícito en `kebab-case` cuando la pluralización sea irregular.
  * `--orm <adapter>`: Adaptador de repositorio (`custom`, `prisma`, `typeorm`, `drizzle`; por defecto `custom`).
  * `--contracts <mode>`: Contratos de entrada (`class-validator` o `zod`; por defecto `class-validator`).
  * `--scope <scope>`: Scope npm para `--contracts zod` (p. ej. `acme` → `@acme/contracts`).
  * `--test-runner <runner>`: Runner de specs (`vitest` o `jest`; por defecto `vitest`).
  * `--dry-run`: Previsualiza los 18 archivos sin escribir en disco.
  * `--force`: Sobrescribe archivos existentes (solo con confirmación explícita).

---

## 📚 Documentación y Referencias

- **[`SKILL.md`](SKILL.md)**: Especificación operativa completa, stack NestJS 12 (`NodeAdapter`, SWC, Vitest, OXC), secuencia de 18 archivos y reglas críticas.
- **[Guía del Monolito Modular y Stack](references/modular-monolith-guide.md)**: Bootstrap con `NodeAdapter`, SWC, `oxlint`/`oxfmt`, estructura global `src/` y comunicación inter-módulos.
- **[Estándares de DTOs, Zod y Swagger OpenAPI](references/dto-and-swagger-standards.md)**: `ValidationPipe`, `PaginatedResponseDto`, `nestjs-zod` y checklist Swagger.
- **[Patrón de Repositorios y Entidades de Dominio](references/repository-and-entity-pattern.md)**: Adaptadores Prisma/TypeORM/Drizzle, transacciones/Unit of Work y mapeo de errores.
- **[Estrategia de RBAC y Validación de Ownership](references/rbac-and-ownership.md)**: Orden de `APP_GUARD`, `@CurrentUser()`, ownership en `create`/`findAll`/`findOne` y excepciones HTTP.
- **[Estrategia de Testing (Vitest + SWC + E2E)](references/testing-strategy.md)**: Configuración `vitest.config.ts` con `unplugin-swc`, unit tests, E2E y exclusiones de cobertura.
- **[Ejemplos de Flujos y Refactorización](examples/workflows.md)**: Refactor de *Fat Controller* y comunicación inter-módulos.
