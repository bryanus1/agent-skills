# Design: Tool-Agnostic Issue Triage Skill

## Context

The repository is the **Agent Skills Hub**, hosting modular, agent-agnostic skills conforming to `docs/SPECIFICATION.md` and `AGENTS.md`.

Developers work across diverse issue-tracking systems (Linear, GitHub Projects/Issues, GitLab, Jira). While the API commands to read and write tickets differ across systems, the cognitive task of issue triage is universal: taking an ambiguous ticket (empty title or unformatted brain dump), uncovering the codebase reality, distilling constraints, preserving business metadata, and formatting a structured specification.

See `proposal.md` for motivation and `specs/issue-triage/spec.md` for formal requirement contracts.

## Goals / Non-Goals

**Goals:**
- Provide a modular, tool-agnostic skill (`issue-triage`) located at `skills/project-management/issue-triage/`.
- Implement a **Provider Adapter Architecture** supporting:
  - **Linear Adapter**: via Linear MCP (`get_issue`, `save_issue`) or Orca CLI (`orca-linear`).
  - **GitHub Adapter**: via GitHub CLI (`gh issue view`, `gh issue edit`).
  - **GitLab Adapter**: via GitLab CLI (`glab issue view`, `glab issue update`).
  - **Manual / Markdown Fallback**: outputs formatted markdown when no direct integration is configured.
- Guarantee preservation of existing planning metadata (estimates, delivery windows, phases, milestones).
- Produce a standardized 7-section specification that directly maps into OpenSpec proposals (`proposal.md`).
- Enforce an interactive review gate before modifying remote issues.

**Non-Goals:**
- Implementing application features or modifying project source code.
- Managing git branches, merges, or deployments.
- Auto-closing or reassigning tickets without explicit user request.

## Decisions

### 1. Skill Location and Categorization
- **Choice**: `skills/project-management/issue-triage/`.
- **Rationale**: Groups issue management and triage under `project-management`, clearly separating it from git-specific tooling while signaling broad project workflow utility.

### 2. Architecture: Core Triage Engine + Provider Adapters

```
+------------------------------------------------------------------------+
|                          issue-triage skill                            |
+------------------------------------------------------------------------+
                                    |
          +-------------------------+-------------------------+
          v                                                   v
+--------------------+                               +--------------------+
|  PROVIDER ADAPTERS |                               | CORE TRIAGE ENGINE |
| - Linear (MCP/CLI) |                               | - Note extraction  |
| - GitHub (gh CLI)  |                               | - Repo exploration |
| - GitLab (glab CLI)|                               | - Draft formatting |
| - Manual fallback  |                               | - OpenSpec bridge  |
+--------------------+                               +--------------------+
```

- **Rationale**: Isolates the tool-specific read/write commands from the intelligent exploration and extraction logic. If a developer switches from Linear to GitHub, the core triage behavior remains identical.
- **Reference Documentation**: Technical command references for each adapter live in `references/adapters.md`.

### 3. Triage Information Architecture & Schema
- **Choice**: Standardized 7-section template:
  1. `## 🎯 Objetivo`: Problem statement and high-level goal.
  2. `## 🛡️ Restricciones Arquitectónicas`: Layer constraints (backend vs client, auth, performance).
  3. `## 📋 Reglas de Negocio Clave`: Domain rules, edge cases, calculation logic.
  4. `## 🧭 Contexto Técnico en el Repo`: Relevant file paths, functions, models discovered.
  5. `## 📦 Alcance Propuesto`: Checkboxes for In Scope and bullet list for Out of Scope.
  6. `## 🗓️ Metadatos & Planificación`: Preserved estimates, deadlines, phases, and OpenSpec commands.
  7. `## ❓ Preguntas / Decisiones Abiertas`: Items needing team alignment.
- **Rationale**: Perfectly aligns with `proposal.md` and `specs/` in OpenSpec.

### 4. Interactive Review Gate (Safe Updates)
- **Choice**: Strictly require displaying the finalized markdown block to the user and asking for approval before calling the write command (`save_issue`, `gh issue edit`, etc.).
- **Rationale**: Protects team boards from accidental overwrites.

## Risks / Trade-offs

- **[Risk: Accidental data loss when reformatting raw notes]** → *Mitigation*: The workflow includes an explicit "Note Extraction" step that isolates business rules, quotes critical constraints verbatim, and moves all metadata into section 6.
- **[Risk: Missing CLI or MCP authentication]** → *Mitigation*: If the adapter command fails due to auth or missing binary, the skill gracefully falls back to displaying the markdown in chat with copy-paste instructions.
