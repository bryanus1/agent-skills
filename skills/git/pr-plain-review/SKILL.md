---
name: pr-plain-review
version: 1.1.0
description: >-
  Plain-language review before approving a PR or branch: explains what changed, why, which critical files it touched (migrations, RLS, legal terms, auth, payments, infra) and what risk it carries. Read-only; it never edits code or approves without confirmation.
tags: [git, pull-request, code-review, risk-analysis, migrations, rls, pre-approval]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - revisar-pr
  - revisar pr antes de aprobar
  - resumen del pr en lenguaje llano
  - qué cambia este pr
  - archivos críticos del pr
  - pr plain review
  - review pr before approving
  - what does this pr change
  - critical files in this pr
requirements:
  tools: [run_command, view_file]
  bins: [git]
---

# PR Plain Review (`revisar-pr`)

## 🎯 Purpose

Gives whoever is about to approve a Pull Request or Merge Request a quick, honest read in **plain language** before they press *Approve*: what really changes for users, data and operations; why it was done; which critical files it touched; and what real risk the team takes on by approving it.

It is **strictly read-only**: it does not edit code, post comments, or approve or merge PRs without explicit confirmation.

---

## ⚡ When to Trigger

Use this skill when the user:
- Asks to review a PR, MR or branch **before approving** or merging it (*"revisar-pr"*, *"review this PR before I approve it"*, *"what does this PR change and how risky is it?"*).
- Wants a **plain-language / business** explanation of a technical diff, or wants to check whether it touched sensitive areas (migrations, RLS, legal terms, auth, payments, infrastructure).

**When to hand off to another skill:**
- For a deep technical code audit (Clean Code, SOLID, patterns, TDD): use `code-quality-review`.
- To create a PR, diagnose GitHub Actions or publish a release: use `gh-cli`.

---

## 📋 Workflow

### Step 1: Get the Diff and Context (read-only)
1. Find the source from the request:
   - **GitHub PR:** read the metadata and diff without changing anything:
     ```bash
     gh pr view <n> --json number,title,body,baseRefName,headRefName,files,commits,statusCheckRollup,labels,isDraft
     gh pr diff <n>
     gh pr view <n> --comments
     ```
   - **GitLab MR:** `glab mr view <n>` and `glab mr diff <n>`.
   - **Local branch or pasted diff:** inspect `git log <base>..HEAD --oneline`, `git diff --stat <base>...HEAD` and `git diff <base>...HEAD` (detect `main`, `master` or `develop` if no base is given).
2. Read any issue or spec linked in the PR body (`Closes #...`, tracker ID) if you can access it, to understand the original intent.
3. **Large PRs (>40 files or >1500 lines):** group the files by area, read every critical file in full and a representative sample of the rest, and state at the top of the report what was reviewed in detail and what only in summary.

### Step 2: Translate the "What" and Check the "Why"
1. Explain the observable effect of the change in plain language (what changes for end users, customers, stored data, costs or the support team). If a technical term cannot be avoided (e.g. *RLS*, *migration*, *webhook*), explain its practical impact in one sentence.
2. Compare the PR's **title, description and comments** against the actual diff:
   - If the PR does things its description does not mention (e.g. touches permissions, drops columns, changes prices or refactors unrelated modules), flag it as a **silent change**.
   - If there is no description or issue, say *"Not specified in the PR"* instead of inventing reasons.

### Step 3: Audit Critical Files
1. Check every modified, renamed or deleted file, and the diff hunks, against the 6 families in [references/critical-files.md](references/critical-files.md):
   - **Migrations and data schema**
   - **RLS, policies and permissions**
   - **Legal terms, privacy and sensitive copy**
   - **Authentication, sessions and secrets**
   - **Payments and financial state**
   - **Infrastructure, CI/CD and critical dependencies**
2. Also check for `CODEOWNERS` (`.github/CODEOWNERS`, `CODEOWNERS` or `docs/CODEOWNERS`) to point out whether a touched file needs approval from a specific owner.
3. **Full read required:** for each modified critical file, read the whole file in its resulting state (not just the diff hunk) to catch interactions with policies, guards, earlier migrations or existing rules.

### Step 4: Assess Risk, Reversibility and Objective Signals
1. Classify the overall risk (`Low`, `Medium`, `High` or `Blocking`) with the matrix in [references/report-template.md](references/report-template.md).
2. Assess **reversibility**: tell apart a PR that a `git revert` after merging undoes from one that leaves hard or impossible-to-undo effects (deleted data, column type changes, legal acceptance, key rotation, charges).
3. Collect the real state of `statusCheckRollup` / CI checks and check whether the critical areas add or update tests. Never assume the tests pass without evidence in the PR or a real run.

### Step 5: Deliver the Pre-Approval Report
1. Present the report in the chat following exactly the structure in [references/report-template.md](references/report-template.md).
2. If no critical file was found, say so explicitly and list the categories you checked.
3. If the user asks to leave the review on GitHub/GitLab, show the exact text first and wait for confirmation before running `gh pr comment` or `gh pr review`. Never run `--approve` or `merge` without an explicit order.

---

## ⚠️ Critical Rules

1. **Reply in the user's language**, even though this skill is written in English. The report template is in English; render it in the user's language.
2. **Read-only by default:** never edit project code, approve PRs, merge branches or post comments on the tracker/PR without an explicit request and confirmation.
3. **Plain language backed by evidence:** translate into clear impact for the reader, always citing the `file:line` or exact resource behind each risk.
4. **No assumptions:** if context is missing (no description, no visible CI, binary or generated file), say so explicitly under *"What could not be verified"*.
5. **Never downplay critical files:** any touch to migrations, RLS, legal terms, auth, payments or secrets goes in the dedicated table, even if it looks "small".
6. **Be honest about scope:** in large PRs never pretend to have read every line; state which critical files were read in full and which areas were summarized.
7. **Stay on focus:** if the user also wants an architecture opinion or a deep refactor beyond this brief, suggest `code-quality-review`.

---

## 📚 References

- [Critical files catalog](references/critical-files.md): path patterns, diff signals and key questions per category.
- [Report template and risk matrix](references/report-template.md): canonical format, risk criteria and a full example.
