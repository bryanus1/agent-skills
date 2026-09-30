# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A catalog of agent-agnostic **skills** (Markdown `SKILL.md` + optional `scripts/`, `references/`, `examples/`, `evals/`) meant to be installed into other projects via `npx skills add bryanus1/agent-skills --skill <name>` (skills.sh). There is no application code. The "build" is the skill linter plus the catalog generator. Docs and skill content are written mostly in Spanish, with some English.

**Read [AGENTS.md](AGENTS.md) before creating or editing a skill.** It is the step-by-step authoring guide: template choice, directory placement, required frontmatter, and body sections. [docs/SPECIFICATION.md](docs/SPECIFICATION.md) is the authoritative format spec.

## Commands

```bash
pnpm install                                   # also installs husky hooks
pnpm lint:skills                               # validate every SKILL.md under skills/ and templates/
pnpm lint:strict                               # same, but warnings fail too (what CI runs)
node scripts/lint-skills.mjs --strict skills/dart/dart-import-organizer   # validate one skill (dir or SKILL.md path)
pnpm catalog                                   # regenerate catalog/catalog.json and the generated README blocks
pnpm catalog:check                             # fail if they are stale (CI)
pnpm test:unit                                 # node --test over tests/*.test.mjs
pnpm test                                      # lint:strict + catalog:check + test:unit (pre-commit hook and release)
pnpm lint:shell                                # shellcheck the skills' Bash scripts (needs shellcheck installed; CI has it)
node scripts/check-skill-versions.mjs --base main   # every changed skill must bump its frontmatter version (CI)
```

Skill scripts are standalone, dependency-free Node (`.mjs`) or Bash, run from the target project's root, e.g.
`node skills/architecture/nestjs-architecture/scripts/scaffold-module.mjs invoice --target-dir src/modules`. Most support `--help`; scaffolds support `--dry-run` and abort on existing files unless `--force`.

## Linter and catalog (`scripts/`)

- `scripts/lib/skills.mjs` holds shared discovery and frontmatter parsing (real YAML via the `yaml` package). Discovery skips dot-dirs, `node_modules` and `*-workspace` dirs.
- `lint-skills.mjs` **errors**: invalid YAML; `name` not kebab-case, over 40 chars, not equal to its folder name (templates exempt), or duplicated across the catalog; non-SemVer `version`; missing `description`; fewer than 2 `triggers`; unknown `agents` values; broken relative links in the body; `file://` or machine-specific absolute paths (`/Users/…`, `/home/…`) anywhere in the skill's text files.
- `lint-skills.mjs` **warnings** (fail under `--strict`): `description` over 350 chars; no H1; a missing required section (Propósito, Cuándo Activar, Flujo de Trabajo, Reglas Críticas; matched in Spanish or English).
- `build-catalog.mjs` writes `catalog/catalog.json` (the package `main`) and rewrites the README between `<!-- catalog-table:start/end -->` and `<!-- catalog-install:start/end -->`. Never edit those blocks by hand.
- Inside a skill, link to its own files with skill-relative paths, and show script calls as `node <skill-dir>/scripts/...`, because skills are installed into other projects.

## Git workflow and releases

- The husky `pre-commit` hook runs `pnpm test`. The `commit-msg` hook runs commitlint (Conventional Commits; allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert; scope is typically the skill category, e.g. `feat(flutter): ...`).
- CI (`.github/workflows/ci.yml`) runs the strict linter, the catalog check, unit tests, shellcheck and the skill version-bump check on non-main pushes and PRs, and validates PR commit messages.
- Skill versions (frontmatter) are independent of the repo version. Any change to a skill outside `evals/` needs a SemVer bump; see `docs/CONTRIBUTING.md`.
- Pushes to `main` trigger semantic-release (`.releaserc.json`). `feat` gives a minor bump; `fix`/`perf`/`refactor`/`docs` give a patch; `ci`/`chore` don't release. npm publish is disabled, so the release only creates a GitHub release and tag.

## Repo layout notes

- `skills/<category>/<skill-name>/` holds the published catalog. When adding a skill, run `pnpm catalog`, then update the examples and structure tree in `README.md` by hand.
- A skill can depend on others through `requirements.skills` (validated by the linter, exported as `requires` in the catalog). `monorepo-architecture` uses it and calls its siblings' scripts through `<skill-dir>/../<skill>/scripts/`, so keep those scripts' flags stable.
- `templates/basic-skill/` and `templates/tool-assisted-skill/` are the starting points for new skills. The linter validates them too.
- Each skill has `evals/evals.json` (skill-creator format: `skill_name` + `evals[]` with `prompt`, `expected_output`, `files` relative to the skill). Eval runs go in the git-ignored `evals-workspace/`, never inside `skills/`.
- `tests/*.test.mjs` (Node's built-in `node:test`, no deps) cover the linter, the catalog generator, every scaffold's safety contract and output, the Dart import organizer, `glab-cli`'s `create_mr.sh --dry-run`, the `gh-cli` scripts (driven through a stub `gh` on `PATH`), the `monorepo-architecture` scaffolds and boundary checker, the version-bump check, and the evals files. Run one file with `node --test tests/scaffolds.test.mjs`, or one test with `--test-name-pattern "<regex>"`.
- `.agents/skills/skill-creator` and `.claude/skills/skill-creator` are the vendored Anthropic `skill-creator` skill (tracked in `skills-lock.json`). They are tooling for authoring and evaluating skills, not part of the catalog.
