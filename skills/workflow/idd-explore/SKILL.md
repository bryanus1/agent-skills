---
name: idd-explore
version: 2.1.0
description: >-
  Explore phase of the IDD (Issue-Driven Development) flow. Refines Notion, Linear, GitHub Issues/Projects items or local notes that only have a title or loose ideas: explores the repo, extracts constraints and rules, keeps estimates and leaves a spec ready for idd-plan.
tags: [workflow, idd, sdd, issue-tracking, triage, specification, linear, notion, github-issues]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - triage issue
  - refinar issue
  - refine issue
  - analizar ticket
  - analyze ticket
  - preparar ticket
  - prepare ticket
  - explorar requerimiento
  - explore requirement
  - linear triage
  - github issue triage
  - idd explore
requirements:
  tools: [view_file, replace_file_content, run_command]
---

# IDD Explore (Issue Triage)

## 🎯 Purpose

First phase of the **IDD (Issue-Driven Development)** flow: `idd-explore` → `idd-plan` → `idd-apply`.

Turns vague, minimal (title only) or informal ("brain dump") issues into a structured technical spec, checking the requirement against the reality of the local repository and keeping the estimate and schedule metadata intact.

**The tracker is the source of truth** (Notion, Linear, GitHub Issues/Projects). A local Markdown file in `docs/specs/` is used only when none is available.

---

## ⚡ When to Trigger

Use this skill when the user:
- Gives a tracker item (`ENG-104`, `#42`, a Notion, Linear or GitHub Projects URL) and asks to refine, analyze or prepare it.
- Says *"refine this issue"*, *"triage ENG-104"*, *"explore this requirement"* or *"prepare the ticket"*.
- Pastes loose notes or a `.md` path and wants to turn them into a clear requirement before planning.

Do not use it to produce the implementation plan (that is `idd-plan`) or to write code (that is `idd-apply`).

---

## 📋 Workflow

### Step 1: Detect the Source and Ingest the Requirement
Detect the source from the input (details in [references/adapters.md](references/adapters.md)):

| Input | Source | Read with |
|---|---|---|
| `notion.so/...` URL or page ID | **Notion** | Notion MCP `notion-fetch` |
| `ENG-104`, Linear URL | **Linear** | Linear MCP `get_issue` |
| `#42`, `owner/repo#42`, issue URL | **GitHub Issues** | `gh issue view` |
| `github.com/.../projects/N` URL or project item | **GitHub Projects** | `gh project item-list` → linked issue |
| `.md` path or pasted text | **Local** | read the file or the text |

Extract the title, body and current state.

### Step 2: Analyze the Notes and Extract Constraints
1. Classify the content:
   - **Case A (empty / title only):** infer the scope from the codebase and the title.
   - **Case B (unstructured notes):** extract architectural constraints, business rules and edge cases, plus management metadata (estimate, dates, phase, suggested commands).
2. **Strict preservation:** no estimate, phase or date is ever dropped.

### Step 3: Read-Only Codebase Exploration
1. Targeted search by title and keywords.
2. Find the impacted files and modules, existing patterns, and related types and schemas.
3. **Do not edit code** in this phase.

### Step 4: Write the Spec (7 Sections)
Follow [references/issue-template.md](references/issue-template.md) exactly:
`🎯 Goal` · `🛡️ Architectural Constraints` · `📋 Key Business Rules` · `🧭 Technical Context in the Repo` · `📦 Proposed Scope` · `🗓️ Metadata & Planning` · `❓ Open Questions / Decisions`.

Keep the section headings exactly as in the template (the later phases look for them); write the content in the user's language.

### Step 5: Review Gate
1. Show the full spec in the chat and say where it will be saved.
2. **Wait for the user's explicit confirmation before any write.**

### Step 6: Persist (tracker first)
1. **The input was a tracker item:** write the spec into the item's description or the body of the Notion page.
2. **The input was text or a `.md`, but a tracker is connected** (Notion or Linear MCP, or an authenticated `gh`): offer to create the item there, and create it only if the user accepts.
3. **No tracker:** save to `docs/specs/<YYYY-MM-DD>-<slug>.md` (one file per change, which `idd-plan` and `idd-apply` extend later).

### Step 7: Next Step
Close with (in the user's language):
> *"The spec is ready. Whenever you want, run **idd-plan** on this same item to produce the implementation plan."*

---

## ⚠️ Critical Rules

1. **Reply in the user's language**, even though this skill is written in English.
2. **Never edit the project's source code**: this phase is specification, not implementation.
3. **Mandatory review gate**: do not write to the tracker or to disk without showing the draft and getting confirmation.
4. **Keep management metadata**: estimates, time windows and phases always go to `🗓️ Metadata & Planning`.
5. **Verify paths**: `🧭 Technical Context in the Repo` lists only paths you confirmed exist. Never invent paths.
6. **No duplicates**: if the item already exists in a tracker, update that item; do not also create a local `.md`.
7. **Legacy Spanish specs**: items written by earlier versions use Spanish headings (`🎯 Objetivo`, `🗓️ Metadatos & Planificación`…). Recognize them with the table in [references/adapters.md](references/adapters.md#-idd-markers); when updating such an item, keep its existing headings instead of mixing languages.
8. **Relative links**: the skill's internal links are always relative (e.g. `[adapters](references/adapters.md)`).

---

## 📚 References

- [Spec template](references/issue-template.md): the 7 sections and a full example.
- [Provider adapters](references/adapters.md): reading and writing in Notion, Linear, GitHub Issues/Projects and local files, plus the IDD markers.
