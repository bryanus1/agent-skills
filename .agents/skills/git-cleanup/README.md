# 🧹 Limpieza e Higiene de Ramas Locales de Git (`git-cleanup`)

> **Limpieza segura de ramas locales de Git tras fusionar PRs (Squash/Merge). Protege ramas principales (`main`/`master`/`develop`), detecta ramas eliminadas en `origin` y elimina ramas obsoletas sin los falsos negativos de `git branch --merged`.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `git-cleanup` |
| **Categoría** | `git` |
| **Versión** | `1.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requisitos** | `git`, `bash` |

---

## 📦 Instalación

### Vía `skills.sh` CLI (Recomendado)

```bash
# Instalar en el proyecto actual:
npx skills add bryanus1/agent-skills --skill git-cleanup

# Instalar globalmente en tu máquina:
npx skills add bryanus1/agent-skills --skill git-cleanup -g
```

### Vía Enlace Simbólico Local

```bash
# Google Antigravity:
mkdir -p .agents/skills
ln -s /ruta/a/agent-skills/skills/git/git-cleanup .agents/skills/git-cleanup

# Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/git-cleanup .claude/skills/git-cleanup
```

---

## 💡 Ejemplos de Uso con Agentes de IA

* **Limpieza tras fusionar un PR**:
  > *"Acabo de fusionar mi PR en GitHub, actualiza main y limpia las ramas locales"*
  >
  > 🤖 **El agente ejecutará**: `git switch main && git pull && git-cleanup` (o el procedimiento nativo con `git fetch --prune` si `git-cleanup` no está instalado)  
  > ➔ Actualiza `origin`, poda referencias obsoletas (`fetch --prune`), protege `main`/`master`/`develop` y elimina con seguridad las ramas locales ya inexistentes en el remoto.

* **Proteger ramas adicionales permanentemente**:
  > *"Configura git-cleanup para que nunca borre la rama release/v2"*
  >
  > 🤖 **El agente ejecutará**: `git config --add cleanup.protected release/v2`

---

## 📚 Documentación y Referencias

- **[`SKILL.md`](SKILL.md)**: Especificación operativa completa, modo con CLI y fallback nativo autónomo.
- **[Guía de Higiene de Ramas y Squash Merge](references/branch_hygiene.md)**: Explicación del problema del Squash Merge y diferencias entre `git branch -d` y `git branch -D`.
