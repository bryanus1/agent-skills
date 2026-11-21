# Proposal Sources (`explain-change`)

Guide to finding and reading the original proposal or plan before comparing it against the implemented code.

---

## 1. OpenSpec (`/opsx:apply` / `openspec/changes/`)

- **Where to look:** the `openspec/changes/<change-name>/` folder at the repo root.
- **What to skip:** ignore `openspec/changes/archive/` by default (unless the user asks to audit an archived change).
- **Files that make up the full proposal:**
  1. `proposal.md` — intent, scope and what is left out.
  2. `design.md` — technical decisions and agreed alternatives.
  3. `specs/**/*.md` — expected requirements and scenarios.
  4. `tasks.md` — task list and items ticked as done (`- [x]`).
- **If there are several active changes:** list the directories inside `openspec/changes/` (skipping `archive/`) and ask the user which to audit. If the current branch or the touched files clearly point to one, suggest it for confirmation.

---

## 2. IDD Flow (`idd-plan` / `idd-apply`)

Read the `## 🛠️ Implementation Plan` section (and the earlier spec if there is one) from the matching provider:

| Input or trace | Provider | How to read |
|---|---|---|
| `notion.so/...` URL or page ID | **Notion** | `notion-fetch` on the page |
| `ENG-104` or Linear URL | **Linear** | `get_issue` (body) + `list_comments` (to see the progress comments and recorded deviations) |
| `#42`, `owner/repo#42` or issue URL | **GitHub Issues** | `gh issue view <n> --json title,body,comments` |
| GitHub Projects URL or item | **GitHub Projects** | `gh project item-list` → read the linked issue or the draft item body |
| Local file | **Local** | `docs/specs/<YYYY-MM-DD>-<slug>.md` |

**IDD markers:** items written by earlier versions of the IDD skills use Spanish markers. Read both:

| English | Legacy Spanish |
|---|---|
| `## 🛠️ Implementation Plan` | `## 🛠️ Plan de Implementación` |
| `### Deviations` | `### Desviaciones` |
| `🔄 IDD Progress` | `🔄 Progreso IDD` |
| `✅ IDD — implemented` | `✅ IDD — implementado` |
| `Status: planned / in progress / implemented` | `Estado: planificado / en progreso / implementado` |

**Important in IDD:**
- Always check the plan's deviations subsection and the progress comments posted during `idd-apply`.
- If a decision that differs from the plan already appears there as agreed with the user, report it in one line under *"Deviations already recorded"* so it is not mixed with new silent decisions.

---

## 3. Generic Plan or Direct Reference

- **Plan in the chat:** if the change came from a plan approved in the same conversation, use it as the reference and state explicitly that you are comparing against the session's plan.
- **`.md` file or PR/issue description:** if the user gives a path (`docs/rfc-auth.md`, `PLAN.md`) or a PR (`gh pr view <n> --json title,body`), read it in full before reviewing the diff.

---

## 4. Tie-Breaking and No Proposal

- If the user names a source explicitly (e.g. *"after /opsx:apply on export-csv"* or *"against ENG-104"*), use that source directly.
- If there are both active changes in `openspec/changes/` and files in `docs/specs/`, ask which one matches the work in progress.
- If **there is no verifiable proposal or plan at all**, stop, say what you looked for, and ask the user for the file, ticket or summary to compare the diff against.
