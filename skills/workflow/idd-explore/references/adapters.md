# Provider Adapters (IDD)

Commands and tools to read and write items in each provider. All three phases of the IDD flow (`idd-explore`, `idd-plan`, `idd-apply`) use them.

**Priority:** the tracker is the source of truth. The local file is used only when no tracker is available.

---

## 🔍 Detecting the Provider

| User input | Provider | Tool |
|---|---|---|
| `https://www.notion.so/...`, page ID | **Notion** | Notion MCP |
| `ENG-104`, `https://linear.app/...` | **Linear** | Linear MCP |
| `#42`, `owner/repo#42`, `https://github.com/<o>/<r>/issues/42` | **GitHub Issues** | `gh issue` |
| `https://github.com/orgs/<o>/projects/N`, `https://github.com/users/<u>/projects/N` | **GitHub Projects** | `gh project` + `gh issue` |
| `.md` path, pasted text, Jira or anything without an integration | **Local** | file system |

If the input is not a tracker item, check which tracker is available (Notion/Linear MCP connected, or `gh auth status` OK) and **offer** to create the item there before falling back to the local file.

---

## 1. Notion

- **Read:** `notion-fetch` with the page URL or ID.
- **Update the body:** `notion-update-page` with the Markdown content (add or replace the relevant section; keep the rest).
- **Create:** `notion-create-pages` in the database or parent page the user names (ask if it is not known).
- **Comment:** `notion-create-comment` on the page (`idd-apply` progress).
- **Checkboxes:** tasks are written as to-dos (`- [ ]`); they are consolidated by editing the page at the end.

## 2. Linear

- **Read:** `get_issue` with `{ "id": "ENG-104" }`; the details are in `description`. For comments, `list_comments`.
- **Update:** `save_issue` with `{ "id": "ENG-104", "description": "<full markdown>" }`. For long descriptions, use `patch` mode if available.
- **Create:** `save_issue` without `id`, with `team` (required) and `title`. Check first with `list_issues` that no matching issue exists.
- **Comment:** `save_comment` with `issueId` and `body` (`idd-apply` progress).

## 3. GitHub Issues

```bash
gh issue view 42 --json number,title,body,state,labels       # read
gh issue edit 42 --body-file <tmp-body.md>                    # replace the body
gh issue create --title "<title>" --body-file <tmp-body.md>   # create
gh issue comment 42 --body-file <tmp-comment.md>              # comment (idd-apply progress)
gh issue view 42 --comments                                   # read comments when resuming
```

Always use `--body-file` (it avoids escaping problems). Write the temporary file outside the repo and delete it when done.

## 4. GitHub Projects

```bash
gh project item-list <N> --owner <owner> --format json        # find the item
gh project item-add <N> --owner <owner> --url <issue-url>     # add a new issue to the project
```

- If the item has a linked issue, read and write that issue with the GitHub Issues commands.
- If it is a *draft item*, edit it with `gh project item-edit --id <item-id> --title "<title>" --body "<markdown>"` (no `--body-file` support). For long bodies, offer to convert it into an issue first.
- Requires the `project` scope in `gh` (`gh auth refresh -s project`); if it is missing, tell the user instead of running it.

## 5. Local (fallback)

- **One file per change:** `docs/specs/<YYYY-MM-DD>-<slug>.md` (kebab-case slug derived from the title).
- `idd-explore` creates it with the spec; `idd-plan` appends `## 🛠️ Implementation Plan` below it; `idd-apply` ticks the checkboxes.
- For Jira or other trackers without an integration: besides saving the file, show the Markdown block ready to copy.

---

## 🏷️ IDD Markers

The phases find each other's output through these literal markers. **Write** the English marker. **Read** both: items created by earlier versions of the skills use the Spanish one. When you update an item that already uses the Spanish markers, keep them in Spanish so the item does not mix languages.

| Written by | English marker (write) | Legacy Spanish marker (also read) |
|---|---|---|
| `idd-explore` | `## 🎯 Goal` | `## 🎯 Objetivo` |
| `idd-explore` | `## 🛡️ Architectural Constraints` | `## 🛡️ Restricciones Arquitectónicas` |
| `idd-explore` | `## 📋 Key Business Rules` | `## 📋 Reglas de Negocio Clave` |
| `idd-explore` | `## 🧭 Technical Context in the Repo` | `## 🧭 Contexto Técnico en el Repo` |
| `idd-explore` | `## 📦 Proposed Scope` | `## 📦 Alcance Propuesto` |
| `idd-explore` | `## 🗓️ Metadata & Planning` | `## 🗓️ Metadatos & Planificación` |
| `idd-explore` | `## ❓ Open Questions / Decisions` | `## ❓ Preguntas / Decisiones Abiertas` |
| `idd-plan` | `## 🛠️ Implementation Plan` | `## 🛠️ Plan de Implementación` |
| `idd-plan` | `### Tasks` | `### Tareas` |
| `idd-plan` | `### Verification` | `### Verificación` |
| `idd-plan` / `idd-apply` | `Status: planned` | `Estado: planificado` |
| `idd-apply` | `Status: in progress` | `Estado: en progreso` |
| `idd-apply` | `Status: blocked — <reason>` | `Estado: bloqueado — <motivo>` |
| `idd-apply` | `Status: implemented · <YYYY-MM-DD>` | `Estado: implementado · <YYYY-MM-DD>` |
| `idd-apply` | `🔄 IDD Progress` (comment) | `🔄 Progreso IDD` |
| `idd-apply` | `✅ IDD — implemented` (comment) | `✅ IDD — implementado` |
| `idd-apply` | `### Deviations` | `### Desviaciones` |

To find pending local plans, search `docs/specs/*.md` for both `Status: planned|in progress` and `Estado: planificado|en progreso`.

---

## ✍️ Common Write Rule

Before writing to any provider: show the full content, say **where** it will be written and wait for the user's explicit confirmation. When updating, keep the existing sections that do not belong to this phase.

Most providers **replace the whole body** (`gh issue edit`, `save_issue`). So: read the current body again right before writing, change only your own section (the spec, `## 🛠️ Implementation Plan` or its checkboxes) and send the whole body. If the body changed since your last read, start from the new version.
