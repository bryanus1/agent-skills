# 🦊 GitLab CLI (`glab-cli`)

> **Automatización de flujos de GitLab (Merge Requests con Conventional Commits, emojis, Scoped Labels, diagnóstico de CI/CD y releases) usando `glab` CLI y scripts.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `glab-cli` |
| **Categoría** | `gitlab` |
| **Versión** | `1.2.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requisitos** | `glab`, `git`, `bash` |

---

## 📦 Instalación

### Vía `skills.sh` CLI (Recomendado)

```bash
# Instalar en el proyecto actual:
npx skills add bryanus1/agent-skills --skill glab-cli

# Instalar globalmente en tu máquina:
npx skills add bryanus1/agent-skills --skill glab-cli -g
```

### Vía Enlace Simbólico Local

```bash
# Google Antigravity:
mkdir -p .agents/skills
ln -s /ruta/a/agent-skills/skills/gitlab/glab-cli .agents/skills/glab-cli

# Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/glab-cli .claude/skills/glab-cli
```

---

## 💡 Ejemplos de Uso con Agentes de IA

* **Crear Merge Request estandarizado con Issue ID**:
  > *"Crea un Merge Request para la funcionalidad de autenticación vinculada al issue #42"*
  >
  > 🤖 **El agente ejecutará**: `bash <skill-dir>/scripts/create_mr.sh --issue 42 --domain auth`  
  > ➔ Genera el título con emoji: `feat(#42): ✨ nextauth credentials`, asigna los Scoped Labels oficiales (`type::feature`, `domain::auth`, `layer::frontend`) y redacta la descripción estructurada.

* **Crear Merge Request sin Issue ID (sin scope)**:
  > *"Crea un MR para actualizar las dependencias de Zod"*
  >
  > 🤖 **El agente ejecutará**: `bash <skill-dir>/scripts/create_mr.sh --domain operations`  
  > ➔ Genera título limpio sin paréntesis de scope: `chore: 🔧 upgrade zod`.

* **Diagnosticar pipeline fallido**:
  > *"El pipeline de CI falló en mi rama, ayúdame a ver qué pasó"*
  >
  > 🤖 **El agente ejecutará**: `bash <skill-dir>/scripts/diagnose_pipeline.sh --job lint`

---

## 🛠️ Scripts y Opciones CLI

> `<skill-dir>` es el directorio donde está instalada esta skill (p. ej. `.agents/skills/glab-cli` o `.claude/skills/glab-cli`).

- **[`scripts/check_env.sh`](scripts/check_env.sh)**: Valida `git`, `glab` y sesión activa.
- **[`scripts/create_mr.sh`](scripts/create_mr.sh)**: Crea MRs con Conventional Commits, emojis, Scoped Labels, validación de `.glab-domains` y `--dry-run`.
- **[`scripts/diagnose_pipeline.sh`](scripts/diagnose_pipeline.sh)**: Inspección de jobs y logs de CI (`--job <nombre> --lines <n>`).
- **[`scripts/release_helper.sh`](scripts/release_helper.sh)**: Consulta y generación de releases (`list`, `draft-notes`).

---

## 📚 Documentación y Referencias

- **[`SKILL.md`](SKILL.md)**: Especificación operativa completa y reglas críticas para el agente.
- **[Estándares de GitLab, Emojis y Scoped Labels](references/gitlab_standards.md)**
- **[CheatSheet Completo de Comandos `glab`](references/commands_cheatsheet.md)**
- **[Guía de CI/CD y Resolución de Problemas](references/ci_and_troubleshooting.md)**
- **[Ejemplos de Flujos de Trabajo](examples/workflows.md)**
