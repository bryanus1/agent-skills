---
name: architecture-map
version: 1.1.0
description: >-
  Generate or update the architecture page by reading the real repository: stack, Mermaid diagram, modules/apps, data, auth, key flows, integrations and deployment. Supports Notion (MCP) and a local docs/ARCHITECTURE.md, preserving manual notes after confirmation.
tags: [architecture, documentation, diagram, mermaid, notion, onboarding, repo-analysis]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - mapa-arquitectura
  - mapa de arquitectura
  - generar página de arquitectura
  - actualizar página de arquitectura
  - documentar arquitectura del repo
  - architecture map
  - generate architecture page
  - update architecture docs
  - document the repo architecture
requirements:
  tools: [view_file, write_to_file, replace_file_content, run_command]
  bins: [git]
---

# Architecture Map (`mapa-arquitectura`)

## 🎯 Purpose

Generate from scratch, or keep up to date, a project's **living architecture page** by reading the repository's real code (instead of stale documentation or assumptions). It produces a clear view of the system (verified stack, Mermaid diagram, modules/apps, data, security, key flows, integrations and deployment) in **Notion** or in **`docs/ARCHITECTURE.md`**.

---

## ⚡ When to Trigger

Trigger this skill when the user:
- Asks to create, generate or update the architecture page or document (*"mapa-arquitectura"*, *"update the architecture page"*, *"document this repo's architecture"*).
- Has just merged structural changes or is onboarding someone and needs to sync `docs/ARCHITECTURE.md` or a Notion page with the real state of the code.

**Do not use it** to design a new project from scratch with prescriptive framework standards (use `monorepo-architecture`, `nestjs-architecture`, `nextjs-architecture`, `astro-architecture` or `react-native-architecture` for that).

---

## 📋 Workflow

### Step 1: Determine the Destination and Mode (Create vs. Update)
Follow [references/destinations.md](references/destinations.md):
1. **Notion (MCP):** if the user passes a Notion URL/ID or asks to write to Notion, use `notion-fetch` if the page already exists; if it is new, confirm which parent page or database to create it in.
2. **Local file:** if Notion is not mentioned, look for `docs/ARCHITECTURE.md`, `ARCHITECTURE.md` and `docs/architecture.md`, in that order, to **update in place without duplicating**. If none exists, propose `docs/ARCHITECTURE.md` (or first ask whether a Notion MCP is connected and they prefer Notion).
3. **Preservation in update mode:** read the whole current document and identify hand-written sections (ADRs, business decisions, roadmap, owners, external links) to keep them intact.

### Step 2: Explore the Repository by Layers (Read-Only)
Follow the checklist in [references/repo-discovery.md](references/repo-discovery.md), excluding build folders, dependencies and files with secrets:
1. **Topology and manifests:** monorepo vs. single app, runtimes and package manager.
2. **Apps, modules and boundaries:** entry points, main routes, shared packages and dependency direction.
3. **Data and persistence:** database, ORM/migrations, file storage, cache or queues (only if they exist).
4. **Auth, security and permissions:** identity providers, middleware/guards and RLS rules.
5. **Integrations and environment variables:** external SDKs and webhooks; list **only the names** of variables from `.env.example` or configuration code (reading real `.env` files is **forbidden**).
6. **Key flows:** trace 1–3 main end-to-end paths, citing verified paths.
7. **Testing, CI/CD and deployment:** verified scripts, workflows and deployment artifacts.

### Step 3: Detect Drift (Update Mode Only)
Compare what you observed in Step 2 against the existing page and briefly list what is stale or new (modules added/removed, stack changes, new integrations, deployment migration or changed commands).

### Step 4: Write the Architecture Map
Follow [references/architecture-template.md](references/architecture-template.md):
1. Adapt the sections to the project's real size (omit DB, queue or auth sections if they don't exist).
2. Generate a valid Mermaid diagram (`flowchart TD` or `flowchart LR`), quoting labels that contain parentheses, brackets or slashes.
3. Mark anything that cannot be inferred with certainty from the code as `[to confirm]` instead of guessing. Pages written by earlier versions use `[por confirmar]`; treat it the same way and keep it in pages that already use it.
4. Add the freshness metadata at the end (`Last updated: <YYYY-MM-DD> · Commit: <short-sha>`).

### Step 5: Review Gate and Persistence
1. Show in the chat:
   - The **exact destination** (Notion URL/page or local path).
   - On creation: the full draft.
   - On update: the **drift summary**, the **preserved manual sections** and the updated content.
2. **Wait for the user's explicit confirmation** before creating or editing files or Notion pages.
3. If updating in Notion, read again with `notion-fetch` right before `notion-update-page` so concurrent edits are not overwritten. Do not edit source code or commit.

---

## ⚠️ Critical Rules

1. **Reply in the user's language**, even though this skill is written in English. Write the page in the language of the existing page or, for a new one, the user's language.
2. **Only facts verified in the repo:** every path, command, module or integration documented must have been checked in real files. Anything unverifiable is marked `[to confirm]`.
3. **Zero secrets:** never read `.env`, `.env.local`, `.env.production`, private keys or credentials; only variable names from `.env.example` or code.
4. **Mandatory confirmation gate:** writing to `docs/ARCHITECTURE.md` or Notion without first showing the proposal and receiving confirmation is forbidden.
5. **Strict preservation of manual notes:** never delete ADRs, historical context, links or team notes that cannot be regenerated from the code.
6. **No duplicate destination:** if an `ARCHITECTURE.md` or a linked page already exists, update it instead of creating a second parallel copy.
7. **Architectural level:** explain boundaries, responsibilities and flows; avoid endless lists of every file in the repo.
8. **Documentation only:** do not modify application code or run `git commit` or `git push`.

---

## 📚 References

- [Repo discovery checklist](references/repo-discovery.md): what to read by layer and which files to ignore.
- [Architecture template and Mermaid](references/architecture-template.md): canonical structure, size adaptation and an example.
- [Destinations and note preservation](references/destinations.md): flow for Notion MCP, local Markdown and safe merging.
