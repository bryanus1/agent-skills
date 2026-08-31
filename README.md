# 🤖 Agent Skills Hub

> **Repositorio centralizado de habilidades (*skills*), utilidades y flujos de trabajo agnósticos para Google Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf, Roo Code y asistentes de IA.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Skills Status](https://img.shields.io/badge/Skills-Validated-brightgreen.svg)](scripts/lint-skills.mjs)
[![Skills.sh Compatible](https://img.shields.io/badge/Skills.sh-Compatible-blue.svg)](https://skills.sh)

---

## 📖 Descripción General

**Agent Skills Hub** es un ecosistema abierto y estandarizado de habilidades modulares que enseñan a agentes y asistentes de IA cómo ejecutar tareas complejas con alta precisión y consistencia.

Diseñado bajo el principio de **Progressive Disclosure**:
1. **Descubrimiento (Level 1)**: Solo `name` y `description` se cargan en el prompt inicial.
2. **Activación (Level 2)**: El agente lee `SKILL.md` únicamente cuando la tarea coincide con los `triggers`.
3. **Profundización (Level 3)**: Documentación en `references/` o utilidades en `scripts/` se leen solo cuando se necesita.

---

## ⚡ Skills Disponibles en el Catálogo

| Skill | Categoría | Agentes | Descripción |
| :--- | :--- | :--- | :--- |
| **[`glab-cli`](skills/gitlab/glab-cli/SKILL.md)** | `gitlab` / `devops` | Todos | Automatización de GitLab con Conventional Commits, emojis, Scoped Labels, diagnóstico de CI/CD y gestión de releases. |
| **[`ts-import-organizer`](skills/typescript/ts-import-organizer/SKILL.md)** | `typescript` / `clean-code` | Todos | Organización de imports en TS/JS (4 grupos, path aliases `@/`, `import type`, consolidación de duplicados y orden por longitud). |

---

## 📦 Cómo Instalar y Usar las Skills en Cualquier Proyecto

Puedes instalar estas skills directamente desde GitHub en cualquier proyecto o asistente de IA usando [`skills.sh`](https://skills.sh) CLI o enlaces directos:

### 1. Vía CLI oficial (`skills.sh`) — *Recomendado*

```bash
# Ver todas las skills disponibles en este repositorio
npx skills add bryanus1/agent-skills --list

# Instalar una skill específica en tu proyecto actual:
npx skills add bryanus1/agent-skills --skill glab-cli
npx skills add bryanus1/agent-skills --skill ts-import-organizer

# Instalar todas las skills del repositorio:
npx skills add bryanus1/agent-skills --all

# Instalar globalmente en tu máquina (disponible para todos tus proyectos):
npx skills add bryanus1/agent-skills --skill glab-cli -g
```

### 2. Vía Enlace Simbólico (Symlink Local)

Si tienes este repositorio clonado en tu máquina y quieres reflejar los cambios automáticamente:

```bash
# Para Google Antigravity:
mkdir -p .agents/skills
ln -s /ruta/a/agent-skills/skills/gitlab/glab-cli .agents/skills/glab-cli

# Para Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/glab-cli .claude/skills/glab-cli
```

---

## 💡 Ejemplos de Activación y Uso con Agentes de IA

Una vez instalada una skill, tu asistente de IA la activará automáticamente cuando uses lenguaje natural:

### 🦊 Ejemplo con `glab-cli`:

* **Crear Merge Request estandarizado**:
  > *"Crea un Merge Request para la funcionalidad de autenticación vinculada al issue #42"*
  > 
  > 🤖 **El agente ejecutará**: `./skills/gitlab/glab-cli/scripts/create_mr.sh --issue 42 --domain auth`  
  > ➔ Genera el título con emoji: `feat(#42): ✨ nextauth credentials`, asigna los Scoped Labels oficiales (`type::feature`, `domain::auth`, `layer::frontend`) y redacta la descripción estructurada.

* **Sin Issue ID (sin scope)**:
  > *"Crea un MR para actualizar las dependencias de Zod"*
  > 
  > 🤖 **El agente ejecutará**: `./skills/gitlab/glab-cli/scripts/create_mr.sh --domain operations`  
  > ➔ Genera título limpio sin paréntesis de scope: `chore: 🔧 upgrade zod`.

* **Diagnosticar pipeline fallido**:
  > *"El pipeline de CI falló en mi rama, ayúdame a ver qué pasó"*
  > 
  > 🤖 **El agente ejecutará**: `./skills/gitlab/glab-cli/scripts/diagnose_pipeline.sh --job lint`

---

### 🟦 Ejemplo con `ts-import-organizer`:

* **Limpiar y ordenar imports**:
  > *"Organiza los imports de este archivo `Dashboard.tsx`, elimina los que no use y cambia las rutas relativas `../../../` por `@/`"*
  > 
  > 🤖 **El agente aplicará**:
  > 1. Agrupación en 4 bloques: `builtins` ➔ `externos` ➔ `@/ aliases` ➔ `side-effects`.
  > 2. Conversión a `import type` para interfaces y tipos.
  > 3. Consolidación de imports de React en una sola línea.
  > 4. Ordenamiento por longitud de línea.

---

## 📂 Estructura del Repositorio

```
agent-skills/
├── docs/                        # Estándares técnicos y de contribución
│   ├── SPECIFICATION.md         # Especificación técnica v1.0.0 del formato de skills
│   └── CONTRIBUTING.md          # Flujo de trabajo y normas para contribuir
├── templates/                   # Plantillas para crear nuevas skills
│   ├── basic-skill/             # Plantilla para flujos basados en Markdown puro
│   └── tool-assisted-skill/     # Plantilla con scripts ejecutables y referencias
├── skills/                      # Catálogo organizado por categorías
│   ├── gitlab/
│   │   └── glab-cli/            # Flujos y scripts para GitLab CLI
│   └── typescript/
│       └── ts-import-organizer/ # Reglas y ejemplos de imports limpios en TypeScript
├── scripts/                     # Herramientas de automatización del hub
│   └── lint-skills.mjs          # Linter y validador de schema YAML
├── AGENTS.md                    # Instrucciones y reglas para agentes trabajando en este repo
├── package.json
└── README.md
```

---

## 🤝 Cómo Contribuir y Trabajar en este Repo

Para mantener la calidad y el estándar agnóstico, revisa la [**Guía de Contribución (`docs/CONTRIBUTING.md`)**](docs/CONTRIBUTING.md).

### Resumen del flujo de desarrollo:

1. **Crear una rama**: `git checkout -b feat/mi-nueva-skill`.
2. **Elegir plantilla**: Copiar desde `templates/basic-skill` o `templates/tool-assisted-skill`.
3. **Escribir `SKILL.md`**: Definir Frontmatter YAML válido (`name`, `version`, `description` < 350 chars, `triggers`).
4. **Validar con el Linter**:
   ```bash
   pnpm lint:skills
   ```
5. **Commit con Conventional Commits**: `feat(categoria): add mi-nueva-skill`.

---

## 📄 Licencia

Distribuido bajo la Licencia [MIT](LICENSE).
