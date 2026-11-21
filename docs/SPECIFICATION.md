# 📐 Agent Skills Specification (v1.0.0)

This specification defines a single, agent-agnostic standard for creating, packaging and distributing **Skills** for AI-powered coding assistants and agents (*Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf, Roo Code, etc.*).

---

## 1. Core Concepts

A **Skill** is a self-contained package of procedural knowledge, contextual guidelines, helper tools and workflows that teaches an agent how to carry out complex tasks accurately and consistently.

### Progressive Disclosure
AI agents work with a limited context window. To use it well:
1. **Discovery (Level 1)**: Only the skill's `name` and `description` are injected into the agent's initial prompt.
2. **Activation (Level 2)**: The agent reads `SKILL.md` only when the task matches the skill's `triggers`.
3. **Deep dive (Level 3)**: Files in `references/`, `scripts/` or `examples/` are read or run only when the main instructions say so.

---

## 2. Directory Structure

Each skill lives in its own directory with this layout:

```
skill-name/
├── SKILL.md              # [REQUIRED] YAML metadata + instructions for the agent
├── README.md             # [REQUIRED] Human docs: installation, examples and CLI
├── metadata.json         # [OPTIONAL] Extended schema and compatibility
├── scripts/              # [OPTIONAL] Scripts the agent runs (Bash, Python, Node)
│   ├── run_check.sh
│   └── helper.py
├── references/           # [OPTIONAL] Supporting docs and technical guides
│   └── architecture.md
├── examples/             # [OPTIONAL] Reference use cases (Before / After)
│   └── sample_output.md
└── evals/                # [REQUIRED under skills/] Evaluation prompts (skill-creator format)
    ├── evals.json        # { "skill_name", "evals": [{ "id", "prompt", "expected_output", "files" }] }
    └── inputs/           # Input files listed in "files" (paths relative to the skill)
```

Eval run results go in `evals-workspace/` (git-ignored), never inside `skills/`.

---

## 3. Frontmatter Schema (`SKILL.md`)

Every `SKILL.md` MUST start with a YAML frontmatter block delimited by `---`:

```yaml
---
name: string                   # [Required] Unique kebab-case identifier (max 40 chars)
version: string                # [Required] Semantic version (e.g. 1.0.0)
description: string            # [Required] Precise, actionable description (max 350 chars)
author: string                 # [Optional] Author or maintainer
license: string                # [Optional] SPDX license (e.g. MIT, Apache-2.0)
tags: string[]                 # [Optional] Tags for search and classification
agents: string[]               # [Optional] Compatible agents ('antigravity', 'claude-code', 'codex', 'cursor', 'windsurf', 'all')
triggers: string[]             # [Required] Keywords, commands or activation conditions
requirements:                  # [Optional] Runtime requirements
  tools: string[]              # Tools needed (e.g. 'run_command', 'view_file', 'replace_file_content')
  bins: string[]               # System binaries needed (e.g. 'git', 'docker', 'pnpm')
  skills: string[]             # Other catalog skills this one depends on (e.g. 'nestjs-architecture')
---
```

`requirements.skills` declares dependencies between skills: each name must exist in the catalog (the linter checks it) and is published as `requires` in `catalog/catalog.json`. Install the dependencies next to the skill (`npx skills add <repo> --skill <name>`); scripts can resolve them as sibling directories (`<skill-dir>/../<name>/`).

### Metadata Validation Rules:
- **`name`**: Lowercase letters, digits and hyphens only (`^[a-z0-9-]+$`).
- **`description`**: Must clearly answer:
  1. *What does the skill do?*
  2. *When should the agent activate it?*
  3. *Which keywords or intents trigger it?*
  *Recommended limit: 350 characters, to save global context.*
- **`triggers`**: At least 2 keywords or descriptive intents.

### Language
- Write the `description` and the body in **English**: agents follow English instructions most reliably.
- `triggers` are bilingual: include the phrases users actually type, in English and in Spanish.
- Every skill tells the agent to **reply in the user's language** (a line in Critical Rules), so an English skill does not switch the conversation to English.
- Shared terminology is in [GLOSSARY.md](GLOSSARY.md).

---

## 4. `SKILL.md` Body

The Markdown body follows a standard set of sections:

```markdown
# Human-Readable Skill Name

## 🎯 Purpose
Short statement of the skill's goal and the problem it solves.

## ⚡ When to Trigger
Exact conditions, user intents or code patterns that should start this workflow.

## 📋 Workflow
Numbered, deterministic steps the agent follows in order.

## 🛠️ Helper Scripts
(If any) What the scripts in `scripts/` do and how to run them.

## ⚠️ Critical Rules
Safety constraints, common mistakes to avoid and mandatory practices.

## 📚 References
Links to supporting documents in `references/`.
```

---

## 5. Script Guidelines (`scripts/`)

- **Determinism**: Scripts must be reproducible and non-interactive (or accept non-interactive flags such as `-y` or `--non-interactive`).
- **Meaningful exit codes**:
  - `0`: Success / validation passed.
  - `> 0`: Error, with an explicit message on `stderr` / `stdout`.
- **Portability**: Prefer POSIX shell scripts (`#!/usr/bin/env sh` or `bash`), standard Python 3 or Node.js without unnecessary heavy dependencies.
- **Safety**: Never run destructive commands (`rm -rf /`, `git push --force`) without explicit confirmation.
- **No overwrites**: Scripts that generate files must abort (exit code `1`, writing nothing) if any target file already exists, offer `--dry-run` to preview, and require `--force` to overwrite.
- **Portable paths**: Skills are installed into other projects (`.claude/skills/<name>/`, `.agents/skills/<name>/`…). In `SKILL.md`, link the skill's own files with skill-relative paths (`references/guide.md`) and show scripts as `node <skill-dir>/scripts/x.mjs`. Never use absolute paths or `file:///`.
- **Output language**: Help text, errors and comments in generated code are in English.

---

## 6. Multi-Agent Mapping and Compatibility

| Agent / Environment | Native Target Location | Adaptation Mode |
| :--- | :--- | :--- |
| **Google Antigravity** | `.agents/skills/<name>/` or `~/.gemini/config/skills/<name>/` | Native (`SKILL.md`) |
| **Claude Code** | `.claude/skills/<name>/` or `.claude/config/` | Native / Markdown import |
| **OpenAI Codex / CLI** | `.codex/skills/<name>/` | Native |
| **Cursor IDE** | `.cursorrules` / `.cursor/rules/` | Converted/injected by an adapter |
| **Windsurf** | `.windsurfrules` | Converted/injected by an adapter |
