---
name: glab-cli
version: 1.2.0
description: >-
  Automatización de flujos de GitLab (MRs con Conventional Commits, emojis, Scoped Labels, diagnóstico de CI/CD y releases) usando glab CLI y scripts.
tags: [gitlab, glab, cli, devops, git, ci-cd, merge-requests]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - glab
  - gitlab cli
  - gitlab mr
  - merge request
  - gitlab ci
  - gitlab pipeline
  - gitlab issue
  - crear mr gitlab
requirements:
  tools: [run_command, view_file, replace_file_content]
  bins: [glab, git, bash]
---

# 🦊 GitLab CLI (`glab`) Workflow & Automation

## 🎯 Propósito
Guiar al asistente y desarrollador en la gestión y automatización de repositorios en **GitLab** utilizando `glab` CLI y scripts auxiliares. Estandariza la creación de **Merge Requests (MRs)** siguiendo las normas estrictas del equipo (Conventional Commits, mapeo de emojis, Scoped Labels y ausencia de scope cuando no hay issue), diagnóstico rápido de pipelines fallidos y gestión de releases.

## ⚡ Cuándo Activar esta Skill
- Al trabajar en proyectos alojados en GitLab (`gitlab.com`, GitLab Self-Managed o Dedicated).
- Al crear, revisar, aprobar o gestionar Merge Requests (`glab mr` o `scripts/create_mr.sh`).
- Al diagnosticar jobs fallidos de CI/CD o ver logs de pipelines (`scripts/diagnose_pipeline.sh` o `glab ci`).
- Al validar entorno de autenticación, variables o releases de GitLab.

## 📋 Flujo de Trabajo Paso a Paso

```mermaid
flowchart TD
    A["Verificar Entorno\n(scripts/check_env.sh)"] --> B{"Tarea Requerida"}
    B -->|"Crear Merge Request"| C["Ejecutar scripts/create_mr.sh\n(Validación de Emojis, Scope y Labels)"]
    B -->|"Depurar CI/CD"| D["Ejecutar scripts/diagnose_pipeline.sh\n(glab ci trace <job>)"]
    B -->|"Releases / Tags"| E["Ejecutar scripts/release_helper.sh\n(glab release list/create)"]
```

1. **Paso 1: Verificación de Estado y Autenticación**:
   - Ejecutar el script de comprobación previa:
     ```bash
     bash <skill-dir>/scripts/check_env.sh
     ```

2. **Paso 2: Creación Estandarizada de Merge Requests**:
   - Usar el script asistente para generar el MR con el título, emojis, labels y formato exacto:
     ```bash
     # Con Issue ID detectado o explícito:
     bash <skill-dir>/scripts/create_mr.sh --issue 42 --domain auth

     # Sin Issue ID (genera título sin scope: <type>: <emoji> <desc>):
     bash <skill-dir>/scripts/create_mr.sh --domain operations
     ```
   - O manualmente con `glab mr create`:
     ```bash
     glab mr create --fill --remove-source-branch --yes
     ```

3. **Paso 3: Diagnóstico y Monitoreo de Pipelines de CI/CD**:
   - Inspeccionar el pipeline de la rama activa y jobs fallidos:
     ```bash
     bash <skill-dir>/scripts/diagnose_pipeline.sh
     ```
   - Ver logs del job específico (ej. `lint`, `test:unit`, `build:app`):
     ```bash
     bash <skill-dir>/scripts/diagnose_pipeline.sh --job lint --lines 50
     ```

4. **Paso 4: Gestión de Releases y Notas de Versión**:
   - Listar o crear releases:
     ```bash
     bash <skill-dir>/scripts/release_helper.sh list
     bash <skill-dir>/scripts/release_helper.sh draft-notes
     ```

## 🛠️ Scripts y Herramientas Auxiliares

> **Rutas:** `<skill-dir>` es el directorio que contiene este `SKILL.md` (p. ej. `.claude/skills/<name>/` o `.agents/skills/<name>/`). Ejecuta los scripts desde la raíz del proyecto del usuario, no desde `<skill-dir>`.

- [`scripts/check_env.sh`](scripts/check_env.sh): Valida `git`, `glab` y sesión activa.
- [`scripts/create_mr.sh`](scripts/create_mr.sh): Creación automatizada de MR con validación de:
  - Formato con issue: `<type>(#<issue-id>): <emoji> <description>`
  - Formato sin issue: `<type>: <emoji> <description>` (sin scope)
  - Scoped Labels obligatorios (`type::*`, `layer::*`, `domain::*`, `priority::*`).
  - Dominios permitidos: si existe `.glab-domains` en la raíz del repo (un dominio por línea), `--domain` debe estar en esa lista; si no existe, se acepta cualquier nombre en kebab-case. Antes de crear el MR, lee ese archivo para elegir el dominio correcto.
  - Usa siempre `--dry-run` primero para mostrar el título y los labels al usuario.
- [`scripts/diagnose_pipeline.sh`](scripts/diagnose_pipeline.sh): Inspección de jobs y logs de CI.
- [`scripts/release_helper.sh`](scripts/release_helper.sh): Consulta y generación de releases.

## ⚠️ Reglas Críticas

1. **Regla de Título y Scope de MR**:
   - Si **hay Issue ID**: `<type>(#<issue-id>): <emoji> <description>` (ej. `feat(#42): ✨ pet registration`).
   - Si **NO hay Issue ID**: `<type>: <emoji> <description>` (ej. `chore: 🔧 upgrade dependencies`).
   - **NUNCA usar carpetas ni paths como scope** (ej. `feat(web): ...` está PROHIBIDO).
2. **Uso Exclusivo de Scoped Labels de Grupo**:
   - Solo usar labels de grupo (`type::feature`, `layer::frontend`, `domain::<dominio>`, etc.). Nunca crear labels locales de repo.
   - Los dominios válidos son los del archivo `.glab-domains` del proyecto; nunca inventes uno que no esté ahí.
3. **No interactividad en scripts**: Usar siempre `--yes` o flags no interactivas.

## 📚 Referencias Adicionales

* [Estándares de GitLab, Emojis y Scoped Labels](references/gitlab_standards.md)
* [CheatSheet Completo de Comandos glab](references/commands_cheatsheet.md)
* [Guía de CI/CD y Resolución de Problemas](references/ci_and_troubleshooting.md)
* [Ejemplos de Flujos de Trabajo](examples/workflows.md)
