# Destinations and Note Preservation (`architecture-map`)

A guide to choosing where the architecture page lives, reading its current content and updating it without destroying knowledge the team wrote.

---

## 🎯 Detecting the Destination

| Situation | Chosen destination | Action |
|---|---|---|
| The user passes a Notion URL/ID or asks to use Notion | **Notion (MCP)** | Read with `notion-fetch`; if it is new, ask for the parent page or database |
| The user names a specific path (e.g. `ARCHITECTURE.md`) | **The named local file** | Read it if it exists to update it; if not, create it after confirming |
| No explicit destination and `docs/ARCHITECTURE.md`, `ARCHITECTURE.md` or `docs/architecture.md` exists | **The existing local file** | Update **that same file** without creating duplicates |
| No explicit destination and no local file exists | **`docs/ARCHITECTURE.md` by default** | If a Notion MCP is connected, offer the choice between `docs/ARCHITECTURE.md` and Notion before generating/saving |

---

## 1. Notion (MCP)

- **Read an existing page:** `notion-fetch` with the page URL or ID.
- **Create a new page:** `notion-create-pages` inside the parent page or database the user confirms.
- **Update an existing page:**
  1. Identify existing manual blocks or sections (ADRs, roadmap, operational notes, links to Figma/Linear, owners).
  2. Show the user the drift summary, the proposed changes and which sections are kept intact.
  3. After explicit confirmation, call `notion-fetch` again right before writing to make sure nobody edited the page in the meantime, and apply the change with `notion-update-page`.

---

## 2. Local Markdown File

- **Create:** if the `docs/` folder does not exist, the agent creates it when the user confirms the `docs/ARCHITECTURE.md` draft.
- **Update:** edit the existing file (`docs/ARCHITECTURE.md`, `ARCHITECTURE.md` or `docs/architecture.md`), replacing only the technical sections derived from the code and keeping the manual blocks.

---

## 🛡️ Human Content Preservation Rule

Never blindly overwrite the whole page in an update:
- **Sections that can be regenerated from the repo:** technical summary, high-level diagram, apps and modules, verified stack, persistence/auth (observable in code), key flows, integrations/env vars, commands/deployment and the freshness date/commit.
- **Human sections that are ALWAYS preserved:**
  - `Team Decisions and Notes` (or `Decisiones y Notas del Equipo` in pages written by earlier versions) / ADRs.
  - Business context, SLAs, costs, roadmap or accepted debt written by people.
  - Links to boards, external runbooks or linked diagrams.
- If a manual note contradicts something obvious in the current code (e.g. it mentions a service already removed from `package.json`), **do not delete it**: keep it and point out the discrepancy to the user so they decide whether to remove it.
