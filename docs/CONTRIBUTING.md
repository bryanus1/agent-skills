# 🤝 Contributing Guide: Agent Skills Hub

Thanks for your interest in contributing to **Agent Skills Hub**! This guide covers the workflow and the architecture, safety and quality guidelines for designing, building and validating new skills.

---

## 🛠️ Prerequisites

- **Node.js**: v18 or later.
- **pnpm**: v9 or v10 (`npm install -g pnpm` or `corepack enable`).
- **Git**: Set up in your local environment.
- **Bash / POSIX shell**: To test executable scripts (in tool-assisted skills).

---

## 🚀 Workflow

### 1. Clone the repository and create a branch

Follow the branch convention: `feat/<category>-<name>` or `fix/<name>`:

```bash
git checkout -b feat/docker-optimization
```

### 2. Pick the Skill Type and Base Template

Pick one of the templates in `templates/`:

| Type | Template Directory | When to Use |
| :--- | :--- | :--- |
| **Basic Skill (Markdown only)** | `templates/basic-skill/` | Architecture guidelines, checklists, code conventions or procedural workflows with no scripts. |
| **Tool-Assisted Skill** | `templates/tool-assisted-skill/` | Workflows that need executable scripts (`scripts/`), extended technical docs (`references/`) or example sets (`examples/`). |

Copy the template into the right category under `skills/<category>/<skill-name>`:

```bash
mkdir -p skills/docker/docker-optimization
cp -r templates/tool-assisted-skill/* skills/docker/docker-optimization/
```

---

### 3. Write the `SKILL.md` File

Every `SKILL.md` MUST start with a valid YAML frontmatter block that follows [`docs/SPECIFICATION.md`](SPECIFICATION.md):

```yaml
---
name: docker-optimization
version: 1.0.0
description: >-
  Optimizes Dockerfiles with multi-stage builds, smaller images and efficient layer caching.
tags: [docker, containers, devops, optimization]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - optimize dockerfile
  - docker multi-stage
  - optimizar dockerfile
  - reducir tamaño de imagen
requirements:
  tools: [run_command, view_file, replace_file_content]
  bins: [docker]
---
```

#### ⚠️ Critical Frontmatter Rules:
- **`name`**: Lowercase letters, digits and hyphens only (`^[a-z0-9-]+$`), max 40 characters.
- **`description`**: **Max 350 characters**, in English. It must say briefly what the skill does and when to activate it (Progressive Disclosure).
- **`triggers`**: At least 2 keywords or triggering intents, bilingual (English / Spanish).

---

### 4. Markdown Body Structure (`SKILL.md` and `README.md`)

Write the skill in **English** (agents follow English instructions most reliably) and use the terms in [GLOSSARY.md](GLOSSARY.md). Include the standard sections in `SKILL.md`:
1. `# Skill Name`
2. `## 🎯 Purpose`: Clear goal and the problem it solves.
3. `## ⚡ When to Trigger`: Unambiguous triggers.
4. `## 📋 Workflow`: Numbered, deterministic steps (with a Mermaid diagram if it helps).
5. `## 🛠️ Helper Scripts`: (If any) how to run the scripts in `scripts/`.
6. `## ⚠️ Critical Rules`: Safety constraints and non-negotiable guidelines. Always include: `Reply in the user's language, even though this skill is written in English.`
7. `## 📚 References`: Links to files in `references/` or `examples/`.

Each skill also needs its own developer-facing **`README.md`** with:
- A metadata table (name, category, version, compatible agents, requirements).
- Installation commands (`npx skills add bryanus1/agent-skills --skill <name>` and symlink).
- Activation and usage examples with AI agents.
- A summary of the CLI scripts (if any) and links to `SKILL.md` and `references/`.

---

### 5. Script Guidelines (`scripts/`)

- **Determinism**: Non-interactive scripts (or scripts that accept flags such as `--yes`, `--non-interactive`, `-y`).
- **Exit codes**: `0` on success, `>0` on errors with a clear message.
- **Executable bit**: Always run `chmod +x scripts/*.sh` before committing.
- **Safety**: Never run destructive commands without explicit confirmation (`rm -rf /`, `git push --force`).
- **No overwrites**: Scripts that generate files must abort (exit code `1`, writing nothing) if any target file already exists, offer `--dry-run` to preview, and require `--force` to overwrite.
- **Portable paths**: Skills are installed into other projects (`.claude/skills/<name>/`, `.agents/skills/<name>/`…). In `SKILL.md`, link the skill's own files with skill-relative paths (`references/guide.md`) and show scripts as `node <skill-dir>/scripts/x.mjs`. Never use absolute paths or `file:///`.
- **Output language**: Help text, errors, warnings and comments in generated code are in English.
- **Tests**: Every new or changed script needs tests in `tests/*.test.mjs` (`node:test`, no dependencies) that run the script in a temporary directory. Bash scripts must pass `shellcheck -S warning`.

### 5.1 Evals (`evals/evals.json`)

Every skill under `skills/` must include at least 2 evals in the `skill-creator` format (see [SPECIFICATION.md](SPECIFICATION.md#2-directory-structure)). `pnpm test:unit` checks that the JSON is valid, that `skill_name` matches and that the files in `files` exist. Write `expected_output` in English; keep some prompts in Spanish to check that the skill still triggers and replies in the user's language. Store eval runs in `evals-workspace/`, which git ignores.

---

### 6. Required Linter Validation

Before committing or opening a PR, run the linter:

```bash
# Validate the whole repository (strict mode, as in CI):
pnpm lint:strict

# Validate your skill only:
node scripts/lint-skills.mjs --strict skills/docker/docker-optimization

# Regenerate catalog/catalog.json and the README table/install blocks:
pnpm catalog
```

The linter must finish with `0 errors, 0 warnings`. Besides the frontmatter, it checks that `name` matches the folder and is unique, that `agents` uses allowed values, that relative links resolve, that there are no machine-specific absolute paths, and that the required sections are present. CI also fails if the catalog or the README are not regenerated.

---

## 📝 Commit Convention

All commits follow **Conventional Commits**:

```bash
feat(docker): add docker-optimization skill with multi-stage scripts
fix(gh-cli): correct issue scope in pr title generation
docs(contributing): update step-by-step contribution guide
```

---

## 🔢 Skill Versioning

Each skill has its own `version` (SemVer) in the frontmatter, separate from the repository version that semantic-release produces. Any change inside a skill (except `README.md` or `evals/`) requires a bump:

| Change | Bump | Example |
| :--- | :--- | :--- |
| Breaks existing usage: removed or renamed flags, different generated structure, rules that invalidate earlier code | **major** | `1.4.2 → 2.0.0` |
| New compatible capability: new flag, new section or rule, new script | **minor** | `1.4.2 → 1.5.0` |
| Bug fixes, typos or documentation clarifications | **patch** | `1.4.2 → 1.4.3` |

Translating a skill into English is a **minor** bump: behavior stays the same, but what the agent reads and what the scripts print changes.

CI checks this with `node scripts/check-skill-versions.mjs --base origin/main` (or `pnpm versions:check`). After bumping versions, run `pnpm catalog` to update the catalog and the README.

---

## 📋 Pull Request Acceptance Criteria

1. ✅ **Green checks**: `pnpm test` passes (strict linter, up-to-date catalog and unit tests) and every changed skill has a version bump.
2. ✅ **Progressive Disclosure**: Light frontmatter, no full runbooks inside the description.
3. ✅ **Agent-agnostic**: Works with multiple AI agents.
4. ✅ **Safety**: No credentials, tokens or destructive scripts.

---

## 📜 License

By contributing to this repository, you agree that your contributions are licensed under the MIT License.
