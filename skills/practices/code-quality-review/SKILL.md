---
name: code-quality-review
version: 1.1.0
description: >-
  Quality review of a change (branch, PR or paths) that orchestrates the practices skills: it sets the scope, picks the lenses that fit what changed (clean-code, SOLID, patterns, TDD, frontend, backend) and delivers a single prioritized, deduplicated report. Review only by default; it does not modify code.
tags: [code-review, quality, review, orchestrator, best-practices]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - revisa mi código
  - review my code
  - revisión de calidad
  - code quality review
  - review this branch
  - revisa este pr
  - review this pr
  - antes de abrir el pr
  - before opening the pr
  - revisión completa del cambio
  - quality review
requirements:
  tools: [run_command, view_file]
  bins: [node, git]
  skills: [clean-code, solid-principles, design-patterns, tdd-workflow, frontend-best-practices, backend-best-practices]
---

# Code Quality Review

## 🎯 Purpose

Give **one coherent review** of a change, applying only the lenses that fit what was touched and without repeating the same finding from three angles. This skill adds no criteria of its own: **it decides which lenses to use, in what order, and merges their results** into a prioritized report.

It is **read-only by default**. It fixes things only if the user asks, and then it delegates the fix to the skill that owns the finding (with its tests and its report).

The lenses are the sibling skills in `practices`. If one is not installed, carry on with the rest and say so in the report.

## ⚡ When to Trigger

- "Review my branch / my PR / these files" or "before opening the PR".
- A general review is requested without naming an aspect (cleanliness, design, security…).
- You want a single report instead of invoking each skill separately.

**Do not use it** if the user asks about one specific aspect ("does it follow SOLID?", "is this endpoint secure?"): trigger that skill directly.

## 📋 Workflow

### 1. Set the scope

```bash
node <skill-dir>/scripts/collect-scope.mjs                 # current branch vs main/master/develop + uncommitted changes
node <skill-dir>/scripts/collect-scope.mjs --working       # only what is not committed yet
node <skill-dir>/scripts/collect-scope.mjs --base origin/main --json
node <skill-dir>/scripts/collect-scope.mjs -- src/orders   # without git: classifies the given paths
```

The script (read-only) lists the files by area, the changed lines, the recommended lenses and warnings (code without tests, a huge change). Check the scope against what the user asked; **do not review files outside it**. If the script detects no changes (for example, the files are git-ignored or the directory is not the change's repository) but the user named files or paths, work with those paths as given and say so in the report. If the change goes over ~800 lines, propose reviewing it by area.

### 2. Pick the lenses

Use the [lens-routing](references/lens-routing.md) table. Summary:

| If the change… | Lens |
|---|---|
| touches source code | `clean-code` (always) |
| touches the UI (components, hooks, pages, styles) | `frontend-best-practices` |
| touches endpoints, services, queries or migrations | `backend-best-practices` |
| adds or changes several classes/modules/dependencies | `solid-principles` |
| introduces a variant, integration or pattern (or needs one) | `design-patterns` |
| changes behavior | `tdd-workflow` (are there tests that cover it?) |

Do not apply a lens "for completeness": every lens you add must be justified by something in the change.

### 3. Gather objective evidence first

Before giving opinions, run what the project already has (read-only on the code):

- Tests: use `node <skill-dir>/../tdd-workflow/scripts/detect-test-runner.mjs` to find the command, then run it. Note the real result; if tests fail or cannot run, that is a finding.
- Typecheck and lint if they exist.
- Cleanliness signals: `node <skill-dir>/../clean-code/scripts/detect-smells.mjs <files in scope>`. They are heuristic hints, not verdicts.

### 4. Apply each lens to the scope

For each chosen lens, follow **its** SKILL.md (its check tables, severities and "when not to" rules), but only to **diagnose**, not to modify. Read the full code of the files in scope, not just the diff: many defects lie in how the change interacts with what already existed.

### 5. Merge, deduplicate and prioritize

Follow [severity-and-report](references/severity-and-report.md):

- **One finding, one owner**: if two lenses see the same thing (e.g. a huge function is a smell and also violates SRP), report it once, under the lens whose action resolves it, and mention the other as context.
- **Global order** by severity, not by lens or file: all Critical findings first (security, data loss, users blocked), then all Important, then Minor. Number them after sorting.
- **Useful maximum**: if there are more than ~15 findings, show the top 10 and group the rest by theme.
- **What is good** gets one line; "no relevant findings" is a valid result.
- **Contradictions between lenses** (e.g. `design-patterns` suggests abstracting, `clean-code` asks for simplicity): decide with the proportionality rule (does it hurt today? is there a second variant?) and explain the decision.

### 6. Report and offer next steps

Deliver the report below. Close with an **ordered fix plan** (which skill would fix each group) and ask what to apply. Do not modify anything without confirmation.

## 🚫 When NOT to Use This Skill

- A single, clear aspect: use the specific skill.
- Trivial changes (typo, copy, version): a quick read is enough; say "no findings".
- If the user wants to implement, not review: use the architecture skills or `tdd-workflow`.

## ⚠️ Critical Rules

- **Reply in the user's language**, even though this skill is written in English.
- **Read-only by default**: do not edit, commit or push; do not run anything that changes data or dependencies.
- **Strict scope**: review what changed (and what is needed to understand it); pre-existing problems go under "Out of scope", unless they are security-critical.
- **Evidence**: every finding with `file:line`, a concrete effect and its lens. No "could be improved".
- **Test and linter results are the real ones**: if you could not run them, say so; do not assume them.
- **No duplicates or filler**: do not repeat another lens's finding or list checks that passed.
- **Security is never silenced**: a critical finding is reported even if the review asked about something else.
- **Proportionality**: do not propose patterns, layers or abstractions that the owning skill advises against (see its "When NOT" sections).
- **Do not install dependencies** or change configuration without confirmation.

## 📤 Report

```markdown
### Verdict
<Ready for PR | Ready with minor changes | Changes required> — <1–2 sentences>

### Scope and evidence
- Scope: <branch vs main | paths>, <N files, +X −Y>
- Lenses applied: clean-code, backend-best-practices (skipped: frontend — no UI changes)
- Tests: ✅ 12/12 (`npm test`) | ❌ 2 failing | not run (reason)
- Typecheck / lint: ✅ | not configured

### Findings (by priority)
| # | Sev. | Lens | Location | Problem and effect | Suggested fix |
|---|---|---|---|---|---|
| 1 | Critical | backend | src/orders.ts:21 | SQL built by interpolation: injection | Parameterized query |
| 2 | Important | tdd | src/orders.ts | Changes the tax calculation without a new test | Add a test for the exempt case |
| 3 | Minor | clean-code | src/utils.ts:8 | Name `data2` is not descriptive | Rename |

### Done well
<one line>

### Out of scope / not verified
- <pre-existing, needs a browser, a measurement or a user decision>

### Suggested fix plan
1. <finding 1 → backend-best-practices>
2. <finding 2 → tdd-workflow>
Shall I apply any of them?
```

## 📚 References

- [Lens routing and merging](references/lens-routing.md)
- [Severity, deduplication and report format](references/severity-and-report.md)
- [Full review example](examples/review-orders-branch.md)

## 🛠️ Scripts

- `scripts/collect-scope.mjs`: classifies the changed files and recommends lenses (read-only; `--help` for options).
