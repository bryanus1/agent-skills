# Proposal: Tool-Agnostic Issue Triage Skill

## Why

Tasks across project management systems (Linear, GitHub Issues/Projects, GitLab Issues, Jira, etc.) frequently arrive in two problematic states:
1. **Solo título**: Sin descripción, sin criterios de aceptación ni contexto técnico.
2. **Descripción vaga o "brain dump" sin estructurar**: Notas densas o informales que mezclan restricciones arquitectónicas, reglas de negocio en prosa, metadatos de gestión (estimaciones, fases, fechas de entrega) e instrucciones de flujo.

Desarrolladores y agentes de IA invierten tiempo innecesario descifrando estas tareas antes de poder comenzar a planificar o implementar.

`issue-triage` resuelve esto proporcionando un flujo agnóstico de refinamiento previo: el agente toma un issue desde cualquier gestor (Linear, GitHub, GitLab o entrada manual), extrae y preserva restricciones clave y metadatos existentes, inspecciona el repositorio local para mapear la arquitectura real, formula una especificación estructurada y actualiza la descripción/cuerpo del ticket en la herramienta de origen (o entrega el markdown listo), dejándolo perfectamente preparado para el flujo de OpenSpec (`/openspec-propose` y `/openspec-apply-change`).

## What Changes

- Add a new tool-agnostic skill `issue-triage` in `skills/project-management/issue-triage/`.
- Provide `SKILL.md` following repository specifications (`docs/SPECIFICATION.md`):
  - Frontmatter under 350 chars with bilingual triggers.
  - Core agnostic triage workflow (ingest, extract, explore codebase, formulate draft, review gate, persist).
  - Provider adapters for Linear (MCP / CLI), GitHub (`gh issue view`/`edit`), GitLab (`glab issue`), and Manual/Markdown fallback.
- Provide `README.md` with metadata table, multi-tool configuration examples, and agent prompts.
- Provide `references/issue-template.md` with the standardized 7-section structured issue template.
- Provide `references/adapters.md` detailing CLI/MCP command mappings for each supported issue tracker.
- Register `issue-triage` in `catalog/catalog.json` and the root `README.md` table via `pnpm catalog`.

## Capabilities

### New Capabilities
- `issue-triage`: Tool-agnostic capability to inspect an issue from any supported tracker (Linear, GitHub, GitLab, or manual input), parse unstructured notes while preserving metadata, explore local codebase context, and update the issue with a standardized, actionable specification ready for OpenSpec.

### Modified Capabilities
*(None. This is a new capability in the repository).*

## Impact

- **New Files**: `skills/project-management/issue-triage/SKILL.md`, `skills/project-management/issue-triage/README.md`, `skills/project-management/issue-triage/references/issue-template.md`, `skills/project-management/issue-triage/references/adapters.md`.
- **Integrations**: Integrates with Linear MCP / CLI, GitHub CLI (`gh`), GitLab CLI (`glab`), or clipboard/markdown output.
- **Dependencies**: No external runtime npm packages needed; leverages standard agent tools and installed CLIs/MCPs.
- **Catalog**: Updates `catalog/catalog.json` and root `README.md` catalog table.
