# 🗺️ Architecture Map (`architecture-map`)

> **Generate from scratch, or keep up to date, the architecture page by reading the real repository: topology, Mermaid diagram, modules/apps, stack, data, auth, key flows, integrations and deployment — in Notion (MCP) or in `docs/ARCHITECTURE.md`, preserving the team's manual notes.**

| Property | Value |
| :--- | :--- |
| **Name** | `architecture-map` |
| **Category** | `architecture` |
| **Version** | `1.1.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Supported Destinations** | Notion (MCP) and local Markdown (`docs/ARCHITECTURE.md` / `ARCHITECTURE.md`) |

---

## 📦 Installation

```bash
# Install in the current project with skills.sh:
npx skills add bryanus1/agent-skills --skill architecture-map

# Install globally on your machine:
npx skills add bryanus1/agent-skills --skill architecture-map -g
```

---

## 💡 Usage Examples

### 1. Generate the initial architecture page in the repo
> *"mapa-arquitectura for this project"*

Explores manifests, modules, migrations, `.env.example` (without reading real `.env` files) and CI workflows, traces the main flows and shows you the `docs/ARCHITECTURE.md` draft with a Mermaid diagram for you to approve before creating it.

### 2. Update an existing Notion page without losing ADRs
> *"Update the architecture page at https://www.notion.so/acme/Architecture-12345 by reading the current state of the repo"*

Reads the Notion page with `notion-fetch`, compares it with the real code, summarizes the detected drift (new modules, stack changes), preserves the manual ADR and business context sections, and waits for your confirmation before calling `notion-update-page`.

### 3. Sync an existing `ARCHITECTURE.md` in a small repo
> *"mapa-arquitectura: update the architecture docs for this CLI"*

Detects `ARCHITECTURE.md` at the root without creating duplicates in `docs/`, omits irrelevant sections such as database or RLS, and updates only verified commands and modules after your approval.

---

## 📚 Documentation

- **[`SKILL.md`](SKILL.md)**: step-by-step workflow, review gate and safety rules.
- **[Discovery checklist](references/repo-discovery.md)**: layer-by-layer exploration and excluded files.
- **[Architecture template](references/architecture-template.md)**: canonical format, safe Mermaid rules and an example.
- **[Destinations and preservation](references/destinations.md)**: support for Notion MCP, local Markdown and protection of manual ADRs.
