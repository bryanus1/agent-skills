---
name: idd-plan
version: 1.1.0
description: >-
  Plan phase of the IDD (Issue-Driven Development) flow. Turns a Notion, Linear, GitHub Issues/Projects item or a local .md into a detailed implementation plan: requirements with scenarios, design, verified files, tasks and verification. Does not touch code.
tags: [workflow, idd, sdd, planning, specification, linear, notion, github-issues]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - planifica el issue
  - crear plan de implementación
  - plan this issue
  - create implementation plan
  - spec this
  - idd plan
requirements:
  tools: [view_file, replace_file_content, run_command]
  skills: [idd-explore]
---

# IDD Plan

## 🎯 Purpose

Second phase of the **IDD (Issue-Driven Development)** flow: `idd-explore` → **`idd-plan`** → `idd-apply`.

Produces a **very detailed, verifiable** plan before a single line of code is written, following Spec-Driven Development: the specification comes first, every requirement has testable scenarios and every task links to a requirement. The plan is saved **in the same tracker item** (or in the local `.md` if there is no tracker) and becomes the source of truth for `idd-apply`.

---

## ⚡ When to Trigger

Use this skill when the user:
- Asks to plan, specify or design the implementation of an item (`ENG-104`, `#42`, a Notion or GitHub Projects URL, a `.md` path).
- Says *"plan this issue"*, *"write the implementation plan"*, *"spec this"* or *"idd plan"*.
- Has just finished `idd-explore` and wants to move to the next phase.

If the requirement is so vague that no requirements can be written, suggest `idd-explore` first.

---

## 📋 Workflow

### Step 1: Locate the Source
Detect the provider as in the Explore phase (Notion, Linear, GitHub Issues/Projects, local). The exact commands are in `<skill-dir>/../idd-explore/references/adapters.md` (`<skill-dir>` is the directory that holds this `SKILL.md`); there is a summary under "Where it is saved" in [references/plan-template.md](references/plan-template.md).

### Step 2: Read the Requirement
1. Read the title, body and relevant comments.
2. If the `idd-explore` spec exists, use it as the base (goal, constraints, rules, scope, metadata).
3. If a `## 🛠️ Implementation Plan` section already exists (or the legacy `## 🛠️ Plan de Implementación`), treat the request as a **revision** of the plan, not a new one.

### Step 3: Explore the Repo (read-only)
1. Find the modules, files, types, tests and patterns the change will touch or should follow.
2. Find existing utilities that can be reused instead of writing new code.
3. Find how the project is verified (test, lint and build scripts).
4. **Do not edit any project file.**

### Step 4: Clarify the Essentials
Ask only about what changes the scope, the observable behavior, compatibility or the acceptance criteria. For minor details, make a reasonable assumption and record it under **Assumptions**.

### Step 5: Choose the Plan Size
- **Short plan** (small change: one module, up to 3 tasks, no data, public API or dependency changes): only **Context**, **Requirements** (1 or 2, with a scenario), **Tasks** and **Verification**. Use the "Short plan" variant of the template.
- **Full plan**: every other case.
- **Split**: if the plan goes beyond about 12 tasks or mixes independent deliverables, propose splitting it into several items (one per deliverable, each with its own plan and linked to the others). Do not split or create items without confirmation.

When in doubt between short and full, use the full plan.

### Step 6: Write the Plan
Follow [references/plan-template.md](references/plan-template.md) exactly:
1. **Context**: why and what for.
2. **Requirements**: grouped into `ADDED` / `MODIFIED` / `REMOVED`; each one with "MUST…" and at least one *Given / When / Then* scenario.
3. **Design and decisions**: the chosen approach and the discarded alternative in one line.
4. **Affected files**: verified paths only (or marked `(new)`).
5. **Tasks**: `- [ ] 1.1 …`, small, ordered, each with its requirement (`→ R1`).
6. **Verification**: concrete commands and checks per scenario.
7. **Out of scope**, **Assumptions**, **Open questions** and **Metadata** (keep the estimate, phase, dates and the link to the source).

Keep the headings and the status line exactly as in the template (`idd-apply` looks for them); write the content in the user's language. If the item already uses the legacy Spanish markers, keep using them for this item.

### Step 7: Review Gate
1. Show the full plan in the chat and say where it will be saved.
2. **Wait for the user's explicit confirmation** before writing.

### Step 8: Persist (tracker first)
1. **Tracker item:** add or replace the `## 🛠️ Implementation Plan` section in the item's description or the page body. Keep the `idd-explore` spec and the rest of the content.
2. **Text or `.md`, but a tracker is connected:** offer to create the item there; create it only if the user accepts.
3. **No tracker:** append the section to `docs/specs/<YYYY-MM-DD>-<slug>.md` (create it if it does not exist).

### Step 9: Stop
Do not start implementing, even if the original request hints at it. Close with (in the user's language):
> *"The plan is ready in <location>. Whenever you want, run **idd-apply** to implement it."*

---

## ⚠️ Critical Rules

1. **Reply in the user's language**, even though this skill is written in English.
2. **Do not edit project code**: this phase only produces the plan.
3. **Mandatory review gate**: nothing is written to the tracker or to disk without explicit confirmation.
4. **Verified paths**: never invent files; new ones are marked `(new)`.
5. **Testable requirements**: every requirement has at least one scenario; every scenario is covered in Verification.
6. **Traceable tasks**: every task points to a requirement and is small enough to be completed and verified on its own.
7. **One place per change**: do not duplicate the plan in the tracker and in a local `.md`.
8. **Keep metadata**: the source's estimates, phases and dates are preserved.
9. **Proportional to the change**: a short plan for small changes; propose splitting plans of more than about 12 tasks.

---

## 📚 References

- [Plan template](references/plan-template.md): canonical structure, writing rules and an example.
- Provider adapters and IDD markers (English and legacy Spanish): `<skill-dir>/../idd-explore/references/adapters.md` (installed with `idd-explore`).
