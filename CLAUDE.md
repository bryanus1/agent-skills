# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A catalog of agent-agnostic **skills** (Markdown `SKILL.md` + optional `scripts/`, `references/`, `examples/`, `evals/`) meant to be installed into other projects via `npx skills add bryanus1/agent-skills --skill <name>` (skills.sh). There is no application code. The only "build" is the skill linter. Docs and skill content are written mostly in Spanish, with some English.

**Read [AGENTS.md](AGENTS.md) before creating or editing a skill.** It is the step-by-step authoring guide: template choice, directory placement, required frontmatter, and body sections. [docs/SPECIFICATION.md](docs/SPECIFICATION.md) is the authoritative format spec.

## Commands

```bash
pnpm install                                   # also installs husky hooks
pnpm lint:skills                               # validate every SKILL.md under skills/ and templates/ (same as `pnpm test`)
node scripts/lint-skills.mjs skills/dart/dart-import-organizer   # validate one skill (dir or SKILL.md path)
```

Skill scripts are standalone, dependency-free Node (`.mjs`) or Bash, run directly, e.g.
`node skills/architecture/nestjs-architecture/scripts/scaffold-module.mjs invoice --target-dir src/modules`. Most support `--help`.

## Linter behavior (`scripts/lint-skills.mjs`)

The linter uses its own minimal YAML frontmatter parser, not a real YAML library, so keep frontmatter simple:
- Only **top-level, unindented** `key: value` lines are parsed. Nested keys (e.g. `requirements.tools`) are ignored.
- Supported values: scalars, inline arrays `[a, b]`, `- item` lists under an empty key, and `>-` / `>` / `|` multiline strings. Continuation lines must be indented.
- **Errors** (exit 1): missing frontmatter delimiters; missing or invalid `name` (`^[a-z0-9-]+$`, max 40 chars); missing or non-SemVer `version`; fewer than 2 `triggers`; empty body.
- **Warnings** (no failure, but CONTRIBUTING expects 0): `description` over 350 chars; no `# ` H1 in the body.

## Git workflow and releases

- The husky `pre-commit` hook runs `pnpm lint:skills`. The `commit-msg` hook runs commitlint (Conventional Commits; allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert; scope is typically the skill category, e.g. `feat(flutter): ...`).
- CI (`.github/workflows/ci.yml`) runs the linter on non-main pushes and PRs, and validates PR commit messages.
- Pushes to `main` trigger semantic-release (`.releaserc.json`). `feat` gives a minor bump; `fix`/`perf`/`refactor`/`docs` give a patch; `ci`/`chore` don't release. npm publish is disabled, so the release only creates a GitHub release and tag.

## Repo layout notes

- `skills/<category>/<skill-name>/` holds the published catalog. When adding a skill, also update the catalog table, the `npx skills add` list, and the structure tree in `README.md`.
- `templates/basic-skill/` and `templates/tool-assisted-skill/` are the starting points for new skills. The linter validates them too.
- `skills/typescript/ts-import-organizer-workspace/` holds eval iteration output from the `skill-creator` workflow. It is not a skill.
- `.agents/skills/skill-creator` and `.claude/skills/skill-creator` are the vendored Anthropic `skill-creator` skill (tracked in `skills-lock.json`). They are tooling for authoring and evaluating skills, not part of the catalog.
