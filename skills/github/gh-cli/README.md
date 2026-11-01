# 🐙 GitHub CLI (`gh-cli`)

> **Automatización de flujos de GitHub con `gh` CLI y scripts: Pull Requests con Conventional Commits, emojis y labels verificados, diagnóstico de GitHub Actions, issues y releases con notas generadas.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `gh-cli` |
| **Categoría** | `github` |
| **Versión** | `1.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requisitos** | `gh`, `git`, `bash` |

---

## 📦 Instalación

### Vía `skills.sh` CLI (Recomendado)

```bash
# Instalar en el proyecto actual:
npx skills add bryanus1/agent-skills --skill gh-cli

# Instalar globalmente en tu máquina:
npx skills add bryanus1/agent-skills --skill gh-cli -g
```

### Vía Enlace Simbólico Local

```bash
# Google Antigravity:
mkdir -p .agents/skills
ln -s /ruta/a/agent-skills/skills/github/gh-cli .agents/skills/gh-cli

# Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/gh-cli .claude/skills/gh-cli
```

---

## 💡 Ejemplos de Uso con Agentes de IA

* **Crear Pull Request estandarizado**:
  > *"Abre un PR de mi rama feat/42-login-form para el dominio auth y pide revisión a octocat"*
  >
  > 🤖 **El agente ejecutará**: `bash <skill-dir>/scripts/create_pr.sh --domain auth --reviewer octocat --dry-run` y, tras tu confirmación, el mismo comando sin `--dry-run`  
  > ➔ Título `feat(#42): ✨ login form`, labels `enhancement` y `domain: auth` (verificados en el repo antes de crear nada) y cuerpo con `Closes #42`.

* **Diagnosticar un check fallido de GitHub Actions**:
  > *"El check de lint de mi PR #57 está en rojo"*
  >
  > 🤖 **El agente ejecutará**: `bash <skill-dir>/scripts/diagnose_run.sh --pr 57 --job lint`  
  > ➔ Muestra los checks del PR y solo las líneas fallidas del job `lint` del último run fallido.

* **Publicar una release**:
  > *"Publica la release v1.4.0"*
  >
  > 🤖 **El agente ejecutará**: `bash <skill-dir>/scripts/release_helper.sh create v1.4.0 --dry-run` y, tras tu confirmación, la crea con notas generadas por GitHub.

---

## 🛠️ Scripts y Opciones CLI

> `<skill-dir>` es el directorio donde está instalada esta skill (p. ej. `.agents/skills/gh-cli` o `.claude/skills/gh-cli`).

- **[`scripts/check_env.sh`](scripts/check_env.sh)**: Valida `git`, `gh`, la sesión activa y el repositorio remoto.
- **[`scripts/create_pr.sh`](scripts/create_pr.sh)**: Crea PRs con Conventional Commits, emojis, verificación previa de labels y soporte `--dry-run`.
- **[`scripts/diagnose_run.sh`](scripts/diagnose_run.sh)**: Inspecciona el último run fallido de la rama o PR (`--pr <n> --job <nombre> --lines <n>`).
- **[`scripts/release_helper.sh`](scripts/release_helper.sh)**: Comandos `list`, `view`, `draft-notes` y `create <tag> [--dry-run]`.

---

## 📚 Documentación y Referencias

- **[`SKILL.md`](SKILL.md)**: Especificación operativa completa y reglas críticas para el agente.
- **[Estándares de GitHub: títulos, emojis, labels y cuerpo del PR](references/github_standards.md)**
- **[CheatSheet de comandos `gh`](references/commands_cheatsheet.md)**
- **[GitHub Actions y resolución de problemas](references/actions_and_troubleshooting.md)**
- **[Ejemplos de flujos de trabajo](examples/workflows.md)**
