# Instructions for AI Agents in `agent-skills`

You are assisting in the **Agent Skills Hub** repository. Your primary responsibility is to design, implement, test, and maintain modular, agent-agnostic skills whenever the user requests one.

---

## 🎯 Repository Overview

- **Purpose**: Centralized, standardized repository of skills for AI assistants and coding agents (*Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf, etc.*).
- **Core Standard**: Follow [`docs/SPECIFICATION.md`](docs/SPECIFICATION.md) strictly for all skills.

---

## 🛠️ Step-by-Step Guide for Creating a New Skill

Whenever the user asks to create a new skill (e.g., *"Crea una skill para X"* or *"Create a skill for Y"*), follow these exact steps:

### 1. Determine Scope and Template
- **Basic Skill (Markdown Only)**: Use for procedural workflows, design rules, architecture checklists, and standard coding conventions.
  - Base template: [`templates/basic-skill/`](templates/basic-skill/SKILL.md)
- **Tool-Assisted Skill**: Use when the workflow benefits from executable scripts (`scripts/`), deep technical documentation (`references/`), or reference outputs (`examples/`).
  - Base template: [`templates/tool-assisted-skill/`](templates/tool-assisted-skill/SKILL.md)

### 2. Choose Directory Location & Name
- Place the skill in:
  - `skills/<category>/<skill-name>/` (e.g., `skills/git/conventional-commits/`, `skills/testing/tdd-workflow/`)
  - OR `skills/<skill-name>/` if unclassified.
- **Name format**: Kebab-case (`^[a-z0-9-]+$`), lowercase, maximum 40 characters.

### 3. Write `SKILL.md` with Required Frontmatter
Every `SKILL.md` MUST begin with a valid YAML frontmatter block:

```yaml
---
name: your-skill-name
version: 1.0.0
description: >-
  Concise explanation of what the skill does and when to activate it. Max 350 characters. Include triggering keywords.
tags: [tag1, tag2]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - trigger phrase 1
  - trigger phrase 2
  - palabra clave en español (si aplica)
requirements:
  tools: [view_file, replace_file_content, run_command] # As needed
---
```

#### Critical Frontmatter Rules:
- **`description`**: Must be under **350 characters** (Progressive Disclosure rule). Do not put full runbooks inside the description.
- **`triggers`**: Minimum 2 trigger phrases representing user intent in relevant languages (English / Spanish).

### 4. Structure the `SKILL.md` Body
Ensure the document has the following standard sections:
1. `# Title of the Skill`
2. `## 🎯 Propósito / Purpose`: Clear objective and problem it solves.
3. `## ⚡ Cuándo Activar esta Skill / When to Trigger`: Unambiguous conditions for activation.
4. `## 📋 Flujo de Trabajo Paso a Paso / Step-by-Step Workflow`: Deterministic, numbered steps.
5. `## ⚠️ Reglas Críticas / Critical Rules`: Security constraints and non-negotiable guidelines.
6. `## 📚 Referencias / References` (Optional): Links to markdown files in `references/`.
7. `## 🛠️ Scripts` (Optional): Instructions on scripts in `scripts/`.

### 5. Validate with the Linter
**ALWAYS** run the linter after creating or updating any skill:

```bash
pnpm lint:strict
```
*(Or `node scripts/lint-skills.mjs --strict <path-to-skill>`)*

Ensure the linter exits with `PASS`, `0 errors` and `0 warnings` (CI runs it in strict mode). Fix any schema or validation issues before finishing.

### 6. Regenerate the Catalog
When a skill is added or its frontmatter changes, run:

```bash
pnpm catalog
```

This rewrites `catalog/catalog.json` and the generated blocks in `README.md` (skills table and install commands). Never edit those blocks by hand; CI fails if they are out of date. Update the README's example and directory tree sections manually.

### 7. Bump the Skill Version
When **updating** an existing skill, bump its frontmatter `version` (major = breaking, minor = new capability, patch = fix or docs; see [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md#-versionado-de-skills)). Changes only under `evals/` are exempt. Verify with `node scripts/check-skill-versions.mjs --base main`, then rerun `pnpm catalog`.

---

## 🔒 Safety and Quality Guidelines

- **Determinism**: Provide explicit, testable instructions rather than vague suggestions.
- **No Destructive Operations**: Scripts or instructions must never execute unchecked destructive commands (`rm -rf /`, `git push --force`).
- **File Links**: Inside a skill, link to its own files with paths relative to the skill directory (`[label](references/guide.md)`). Never use absolute paths or `file:///` URLs: skills are installed into other projects and machines, where those paths do not exist.
- **Script Paths**: Show script invocations as `node <skill-dir>/scripts/<script>.mjs` (or `bash <skill-dir>/scripts/<script>.sh`), never `skills/<category>/<name>/scripts/...`, and state that `<skill-dir>` is the directory containing the `SKILL.md`.
