# 🏛️ NestJS Modular Monolith Architecture (`nestjs-architecture`)

> **Estándar de Modular Monolith para NestJS. Guía el andamiaje de módulos de dominio desacoplados, contratos DTO estrictos, documentación OpenAPI Swagger exhaustiva, persistencia agnóstica a cualquier ORM con Repository/Entity y doble barrera de seguridad (RBAC).**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `nestjs-architecture` |
| **Categoría** | `architecture` |
| **Versión** | `1.1.1` |
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

* **Andamiar un módulo de dominio completo (18 archivos)**:
  > *"Crea el módulo de facturas (invoice) con arquitectura limpia y contrato de repositorio"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-module.mjs invoice --target-dir src/modules`  
  > ➔ Genera los **18 archivos** del módulo (`entities`, `dto`, `repositories/repository.ts` con contrato `IInvoiceRepository` y token `INVOICE_REPOSITORY_TOKEN`, `repositories/invoice.repository.ts`, `services` desacoplados, `controllers` con Swagger completo, specs unitarias y `invoice.module.ts`).

* **Andamiar dentro de un monorepo (`apps/api`)**:
  > *"Crea el módulo de mascotas (pet) en la API del monorepo"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-module.mjs pet --target-dir apps/api/src/modules`

---

## 🛠️ Scripts y Opciones CLI

> `<skill-dir>` es el directorio donde está instalada esta skill (p. ej. `.agents/skills/nestjs-architecture` o `.claude/skills/nestjs-architecture`).

### [`scripts/scaffold-module.mjs`](scripts/scaffold-module.mjs)

```bash
node <skill-dir>/scripts/scaffold-module.mjs <noun-singular> [--target-dir <path>] [--plural <name>] [--dry-run] [--force]
```

* **Opciones**:
  * `--target-dir <path>`: Directorio destino (por defecto `src/modules`).
  * `--plural <name>`: Plural explícito en `kebab-case` cuando la pluralización sea irregular.
  * `--dry-run`: Previsualiza los 18 archivos sin escribir en disco.
  * `--force`: Sobrescribe archivos existentes (solo con confirmación explícita).

---

## 📚 Documentación y Referencias

- **[`SKILL.md`](SKILL.md)**: Especificación operativa completa, secuencia de 18 archivos y reglas críticas para el agente.
- **[Guía del Monolito Modular](references/modular-monolith-guide.md)**: Encapsulación de dominio y comunicación inter-módulos.
- **[Estándares de DTOs y Swagger OpenAPI](references/dto-and-swagger-standards.md)**: Matriz de DTOs, decoradores Swagger y pipes de validación.
- **[Patrón de Repositorios y Entidades de Dominio](references/repository-and-entity-pattern.md)**: Desacoplamiento de ORM, mappers y unit tests.
- **[Estrategia de RBAC y Validación de Ownership](references/rbac-and-ownership.md)**: Guards en controladores y validación de propiedad en servicios.
