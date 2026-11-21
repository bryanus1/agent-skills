---
name: explain-change
version: 1.1.0
description: >-
  After an AI implements a change (/opsx:apply, idd-apply or any plan), compares the real diff against the original proposal and sums up the decisions the AI made that were not specified: assumptions, extra scope, contracts, dependencies and shortcuts. Read-only.
tags: [workflow, openspec, idd, sdd, ai-audit, diff-analysis, traceability]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - explicar-cambio
  - explicar cambio
  - qué decidió la ia
  - decisiones fuera de la propuesta
  - después de /opsx:apply
  - auditar cambios contra la propuesta
  - explain change
  - undeclared decisions
  - what did the ai decide
  - audit change against the plan
requirements:
  tools: [run_command, view_file]
  bins: [git]
---

# Explain Change (`explicar-cambio`)

## 🎯 Purpose

Audits what was actually implemented after an AI ran `/opsx:apply`, `idd-apply` or any work plan. It compares the real diff against the original proposal and sums up **only the decisions the AI made on its own** without them being specified: assumptions, defaults, altered contracts, new dependencies, extra scope and shortcuts.

It is **strictly read-only**: it gives you visibility before you accept the change or open a PR, without editing code or rewriting documents without your confirmation.

---

## ⚡ When to Trigger

Use this skill when the user:
- Has just run `/opsx:apply`, `idd-apply` or an assisted implementation and asks what the AI did or decided (*"explicar-cambio"*, *"which decisions did the AI make that weren't in the proposal?"*, *"audit the change against the plan"*).
- Wants to check how faithful the code on disk or on the current branch is to a spec/plan (OpenSpec, IDD or a `.md` document).

**Do not use it** if the user asks to implement the plan (`idd-apply`) or to assess general quality/bugs without comparing against a proposal (`code-quality-review` or `pr-plain-review`).

---

## 📋 Workflow

### Step 1: Find the Original Proposal
Follow [references/proposal-sources.md](references/proposal-sources.md) for the flow the project uses:
1. **OpenSpec:** find the active change in `openspec/changes/<name>/` (`proposal.md`, `design.md`, `specs/**/*.md` and `tasks.md`), skipping `openspec/changes/archive/` unless explicitly asked. If there are several active changes, ask which one to audit (you can suggest the one that matches the branch or the modified files, and ask for confirmation).
2. **IDD:** read the spec and the `## 🛠️ Implementation Plan` section (together with `### Deviations` and the later `🔄 IDD Progress` comments) in Notion, Linear, GitHub Issues/Projects or `docs/specs/*.md`. Items from earlier versions use the Spanish markers (`## 🛠️ Plan de Implementación`, `### Desviaciones`, `🔄 Progreso IDD`); read both.
3. **Generic:** use the plan agreed in the conversation, a `.md` file the user names, or the issue/PR description.
4. **No proposal to compare against:** if there is no verifiable spec, plan or earlier description, stop and ask the user which document or requirements to compare against; never invent a proposal.

### Step 2: Collect the Change Actually Implemented (read-only)
Inspect what really exists in the repository:
```bash
git status --short
git diff --stat
git diff
git ls-files --others --exclude-standard
```
If the implementation was already committed on the current branch, also compare against the base branch (`main`, `master` or `develop`):
```bash
git log <base>..HEAD --oneline
git diff <base>...HEAD
```
For new files or structural changes, read the whole file when you need to understand dependencies, types or side effects.

### Step 3: Compare Proposal vs. Real Code (both directions)
1. **In the code but NOT in the proposal (implicit decisions):** review each modified/added file and classify any undeclared decision into the 6 categories of [references/decision-taxonomy.md](references/decision-taxonomy.md):
   - *Extra scope* (files, refactors or features outside the proposal).
   - *Contracts and data* (migrations, schemas, endpoints, HTTP codes or public types that were not specified).
   - *Behavior and defaults* (limits, timeouts, fallbacks, error messages or edge cases the AI chose).
   - *Architecture and dependencies* (added packages, patterns or layers missing from the design).
   - *Security, permissions and configuration* (auth, RLS, relaxed/tightened validations, environment variables).
   - *Shortcuts, trade-offs and debt* (`TODO`s, `as any`, skipped/weakened tests, tasks ticked as done when only partly done).
2. **In the proposal but NOT done, or done differently:** clearly separate **deviations that were already documented/agreed** (e.g. in `### Deviations` or `🔄 IDD Progress` comments) from **silent omissions or changes**.

### Step 4: Prioritize by Need for Human Validation
1. Filter out everything the proposal **did** specify, to focus only on the **undeclared delta**.
2. Classify each decision with [references/decision-taxonomy.md](references/decision-taxonomy.md):
   - 🔴 **Needs your validation:** affects security, data, public contracts, dependencies, large scope or money.
   - 🟡 **Worth reviewing:** business/UX assumptions, arbitrary limits, collateral refactors or technical debt.
   - 🟢 **Minor implementation detail:** reasonable local decisions (internal names, private helpers), grouped in a short summary without noise.

### Step 5: Deliver the Report and Closing Options
1. Present the report in the canonical format of [references/decision-taxonomy.md](references/decision-taxonomy.md).
2. If the code implemented the proposal exactly with no relevant hidden decisions, say so plainly as **Faithful to the proposal** without making up findings.
3. Close by asking which decisions they **accept** (offering to record them in `design.md` or in the plan's deviations section only after confirmation) and which they want to **revert or adjust**.

---

## ⚠️ Critical Rules

1. **Reply in the user's language**, even though this skill is written in English. The report template is in English; render it in the user's language.
2. **Read-only by default:** do not modify source code, tests, `design.md` or issues/PRs during the audit.
3. **No self-justification:** even if you ran `/opsx:apply` or `idd-apply` yourself in earlier turns, audit the diff on disk as a **skeptical third party**. Do not trust your memory or justify a change unless it is explicitly written in the proposal.
4. **Strict focus on the delta:** do not summarize what the proposal already asked for; the value of this skill is surfacing only what was **not** specified or what deviated.
5. **Traceable evidence:** every finding cites `file:line` and the proposal section or requirement it diverges from or adds to.
6. **Never invent a proposal:** if there is no proposal/plan to compare against, ask for it before evaluating.
7. **Honest when fully faithful:** if the AI followed the proposal without deviating or improvising relevant decisions, say so without padding it with trivia.

---

## 📚 References

- [Proposal sources](references/proposal-sources.md): how to find and read OpenSpec proposals, IDD plans (Notion, Linear, GitHub, local) and generic plans.
- [Decision taxonomy and report](references/decision-taxonomy.md): the 6 categories, 🔴/🟡/🟢 criteria, report template and a full example.
