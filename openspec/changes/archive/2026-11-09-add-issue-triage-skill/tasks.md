# Tasks

## 1. Directory Structure and Reference Guides

- [x] 1.1 Create `skills/project-management/issue-triage/` directory structure with `references/` and verify folders exist.
- [x] 1.2 Author `references/issue-template.md` with the standardized 7-section template for issue descriptions and verify it maps cleanly to OpenSpec proposals.
- [x] 1.3 Author `references/adapters.md` documenting provider-specific commands and tool usage for Linear (MCP/CLI), GitHub (`gh issue`), GitLab (`glab issue`), and Manual fallback.

## 2. Core Skill Implementation

- [x] 2.1 Author `skills/project-management/issue-triage/SKILL.md` with compliant YAML frontmatter (description < 350 chars, bilingual triggers, tools) and deterministic workflow covering provider detection, note parsing, codebase exploration, review gate, and upstream persistence.
- [x] 2.2 Define critical rules and safety boundaries in `SKILL.md` (read-only codebase discovery, mandatory user confirmation before writing, preserving user estimates/dates).
- [x] 2.3 Author `skills/project-management/issue-triage/README.md` with human-facing documentation, provider adapter matrix, prompt examples, and relative markdown links.

## 3. Linting, Catalog Registration, and Verification

- [x] 3.1 Run skill linter via `pnpm lint:strict` (or `node scripts/lint-skills.mjs --strict skills/project-management/issue-triage`) and verify 0 errors and 0 warnings.
- [x] 3.2 Run `pnpm catalog` to regenerate `catalog/catalog.json` and update the catalog table in the root `README.md`, verifying git diff shows the new skill cleanly.

## Workflow follow-up

- Review change artifacts and prepare for execution via `/openspec-apply-change add-issue-triage-skill`.
