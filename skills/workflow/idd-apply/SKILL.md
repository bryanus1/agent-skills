---
name: idd-apply
version: 1.1.0
description: >-
  Apply phase of the IDD (Issue-Driven Development) flow. Implements the plan saved in Notion, Linear, GitHub Issues/Projects or a local .md: runs the tasks in order, ticks each checkbox once verified, stops on deviations and closes with the plan's verification.
tags: [workflow, idd, sdd, implementation, linear, notion, github-issues]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - aplica el plan
  - implementa el plan
  - apply plan
  - implement the plan
  - continúa el plan
  - continue the plan
  - idd apply
requirements:
  tools: [view_file, replace_file_content, write_to_file, run_command]
  skills: [idd-explore, idd-plan]
---

# IDD Apply

## 🎯 Purpose

Third phase of the **IDD (Issue-Driven Development)** flow: `idd-explore` → `idd-plan` → **`idd-apply`**.

Implements exactly what the `idd-plan` plan says. **The plan is the source of truth**: tasks run in order and any deviation is agreed with the user before going on.

**How progress is recorded:**
- **Plan in a tracker:** during implementation, progress goes in **comments** on the item; the body is edited only once, at the end. That way the description is not rewritten on every task and other people's edits are not overwritten.
- **Plan in a local `.md`:** the checkboxes are ticked directly in the file.

---

## ⚡ When to Trigger

Use this skill when the user:
- Asks to implement, apply or continue a plan (`ENG-104`, `#42`, a Notion or GitHub Projects URL, a `.md` path).
- Says *"apply the plan"*, *"implement ENG-104"*, *"continue with the plan's tasks"* or *"idd apply"*.
- Has just approved a plan produced with `idd-plan`.

---

## 📋 Workflow

### Step 1: Locate the Plan
1. Detect the provider as in the earlier phases; the commands are in `<skill-dir>/../idd-explore/references/adapters.md` (`<skill-dir>` is the directory that holds this `SKILL.md`).
2. If the user does not name the item and there is no tracker, search `docs/specs/*.md` for files with `Status: planned` or `Status: in progress` (or the legacy `Estado: planificado` / `Estado: en progreso`). If there is more than one, ask which.
3. Read the whole `## 🛠️ Implementation Plan` section (or the legacy `## 🛠️ Plan de Implementación`) and, if it lives in a tracker, the later `🔄 IDD Progress` comments (or legacy `🔄 Progreso IDD`): tasks listed there as done count as `- [x]` even if the body does not show it yet.

### Step 2: Validate the Plan
Check that it has **Requirements with scenarios**, **Tasks** and **Verification**. If any is missing, or there are blocking **Open questions**, stop and suggest completing the plan with `idd-plan`.

### Step 3: Prepare
1. Show the summary: pending tasks (`- [ ]`), done tasks (`- [x]`) and the first one to run.
2. Check the git state (`git status`). If there are changes unrelated to the plan, warn before starting.
3. If the plan lives in a tracker, ask **once** for the OK to post progress comments during the implementation.
4. Mark the start: in the tracker, a first `🔄 IDD Progress — in progress` comment; locally, change the line to `Status: in progress`.

### Step 4: Run Task by Task
For each pending task, in order:
1. Read the files involved and the linked requirement (`→ R1`).
2. Make the **smallest change** that fulfills the task, following the repo's patterns and reusing what *Design and decisions* names.
3. Verify the task (test, build or a concrete check).
4. Record the progress:
   - **Tracker:** after each group of tasks (and always before ending the turn), post a `🔄 IDD Progress` comment with the completed tasks and how they were verified. Do not edit the body.
   - **Local:** tick `- [x]` in the file after each task.

### Step 5: Handle Deviations
Stop and ask if:
- A task is ambiguous, or a file or API in the plan does not exist or works differently.
- Something outside the plan or out of scope is needed.
- A test fails and the fix changes the design.

Propose the adjustment and, after confirmation, record it: in the tracker, in the next progress comment (*Deviation* section); locally, directly in the plan (new task, modified requirement or a note under *Deviations*). Then continue. Never improvise silently.

### Step 6: Final Verification
1. Run each item in the **Verification** section and tick it.
2. Check that every requirement scenario is covered. If something fails, go back to Step 4 or 5.

### Step 7: Close
1. Show the summary: completed tasks, changed files, verification result and deviations.
2. With the user's confirmation, consolidate the plan in its location with **a single edit**: every completed checkbox as `- [x]`, added tasks, `Status: implemented · <date>` and `### Deviations` if there were any. In the tracker, read the body again right before, change only the plan section and leave a final `✅ IDD — implemented` comment with the summary.
3. Do not commit, push, merge or close the issue unless the user asks.

Keep the markers exactly as in [references/apply-checklist.md](references/apply-checklist.md); write the content in the user's language. If the plan uses the legacy Spanish markers, keep writing the Spanish ones (`Estado: …`, `🔄 Progreso IDD`, `### Desviaciones`) so the item does not mix languages.

---

## ⚠️ Critical Rules

1. **Reply in the user's language**, even though this skill is written in English.
2. **The plan rules**: implement nothing outside the plan or its scope without agreeing on it and reflecting it in the plan first.
3. **Never tick a task without verifying it**: if it could not be verified, leave it as `- [ ]` and explain why.
4. **One place**: progress stays in the item where the plan lives (or in its `.md`); no local copy is created if the plan is in the tracker.
5. **In the tracker, the body is edited only once**: during implementation only comments are posted; the plan is consolidated at the end.
6. **Confirmation before writing to the tracker**: the user approves the progress comments at the start and the close at the end.
7. **No unrequested irreversible actions**: no commit, push, merge, closing issues or destructive commands (`rm -rf`, `git reset --hard`, `git push --force`).
8. **Report honestly**: if a test fails or a step was skipped, say so with the real output.

---

## 📚 References

- [Execution checklist](references/apply-checklist.md): status markers, deviation format and closing summary.
- Plan template: `<skill-dir>/../idd-plan/references/plan-template.md`.
- Provider adapters and IDD markers (English and legacy Spanish): `<skill-dir>/../idd-explore/references/adapters.md`.
