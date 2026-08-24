# 🤖 Agent Skills Hub

> **Modular, agent-agnostic skills and workflows for Google Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf, and AI coding assistants.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Skills Status](https://img.shields.io/badge/Skills-Validated-brightgreen.svg)](scripts/lint-skills.mjs)

---

## 📖 Descripción General

**Agent Skills Hub** es un ecosistema abierto y estandarizado de habilidades (*skills*), guías procedimentales, scripts auxiliares y mejores prácticas para asistentes y agentes de desarrollo con IA.

Diseñado bajo el principio de **Progressive Disclosure**, permite dotar a los agentes de capacidades avanzadas de ingeniería de software sin sobrecargar su ventana de contexto inicial.

---

## 📂 Estructura del Repositorio

```
agent-skills/
├── docs/                        # Estándares y guías del proyecto
│   ├── SPECIFICATION.md         # Especificación técnica v1.0.0 del formato de skills
│   └── CONTRIBUTING.md          # Guía para crear y contribuir nuevas skills
├── templates/                   # Plantillas para la creación de skills
│   ├── basic-skill/             # Plantilla para flujos basados en Markdown
│   └── tool-assisted-skill/     # Plantilla con scripts y referencias técnicas
├── skills/                      # Catálogo de skills modulares
│   └── gitlab/
│       └── glab-cli/            # Flujos y automatización con GitLab CLI
├── scripts/                     # Herramientas de automatización y validación
│   └── lint-skills.mjs          # Linter y validador de schema para skills
├── AGENTS.md                    # Instrucciones para agentes de IA
├── package.json
└── README.md
```

---

## ⚡ Skills Disponibles

| Skill | Categoría | Agentes Compatibles | Descripción |
| :--- | :--- | :--- | :--- |
| **[`glab-cli`](file:///Users/brayansanjuan/Development/personal/agent-skills/skills/gitlab/glab-cli/SKILL.md)** | `gitlab` | Antigravity, Claude, Codex, Cursor, Windsurf | Automatización de GitLab (Merge Requests, pipelines de CI/CD, issues, releases y variables). |

---

## 📋 Plantillas Disponibles (`templates/`)

| Plantilla | Tipo | Descripción |
| :--- | :--- | :--- |
| **[`templates/basic-skill`](file:///Users/brayansanjuan/Development/personal/agent-skills/templates/basic-skill/SKILL.md)** | Markdown Puro | Ideal para guías procedimentales, reglas de arquitectura, patrones de diseño y checklists. |
| **[`templates/tool-assisted-skill`](file:///Users/brayansanjuan/Development/personal/agent-skills/templates/tool-assisted-skill/SKILL.md)** | Asistida por Herramientas | Ideal para flujos que combinan instrucciones con scripts ejecutables (`scripts/`), documentación profunda (`references/`) y ejemplos (`examples/`). |

---

## 🚀 Cómo Crear una Nueva Skill

### 1. Copiar una plantilla base

```bash
# Ejemplo: Skill simple
cp -r templates/basic-skill skills/<categoria>/<mi-skill>

# Ejemplo: Skill con scripts y referencias
cp -r templates/tool-assisted-skill skills/<categoria>/<mi-skill-avanzada>
```

### 2. Validar con el Linter

```bash
pnpm lint:skills
```

---

## 📐 Especificación

Consulta la especificación técnica completa en [`docs/SPECIFICATION.md`](file:///Users/brayansanjuan/Development/personal/agent-skills/docs/SPECIFICATION.md) y las instrucciones de agentes en [`AGENTS.md`](file:///Users/brayansanjuan/Development/personal/agent-skills/AGENTS.md).

---

## 📄 Licencia

Distribuido bajo la Licencia [MIT](file:///Users/brayansanjuan/Development/personal/agent-skills/LICENSE).
