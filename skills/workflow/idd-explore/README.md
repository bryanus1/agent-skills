# 🔍 IDD Explore (`idd-explore`)

> **Phase 1 of the IDD (Issue-Driven Development) flow: `idd-explore` → `idd-plan` → `idd-apply`. Turns a ticket with only a title or loose notes into a structured spec with real repo context, saved in your tracker (Notion, Linear, GitHub Issues/Projects) or, if you have none, in a local `.md`.**

| Property | Value |
| :--- | :--- |
| **Name** | `idd-explore` (formerly `issue-triage`) |
| **Category** | `workflow` |
| **Version** | `2.1.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Sources** | Notion (MCP), Linear (MCP), GitHub Issues/Projects (`gh`), local `.md` |

---

## 🧭 The IDD Flow

| Phase | Skill | Output | Touches code? |
|---|---|---|---|
| 1. Explore | **`idd-explore`** | 7-section spec | No |
| 2. Plan | [`idd-plan`](../idd-plan/README.md) | Detailed plan: requirements, scenarios, tasks, verification | No |
| 3. Apply | [`idd-apply`](../idd-apply/README.md) | Code + ticked tasks | Yes |

Everything lives in **one place per change**: the tracker item, or `docs/specs/<YYYY-MM-DD>-<slug>.md` if there is no tracker. Each phase adds its own section and asks for confirmation before writing.

---

## 📦 Installation

```bash
# All three phases of the flow:
npx skills add bryanus1/agent-skills --skill idd-explore --skill idd-plan --skill idd-apply

# This phase only:
npx skills add bryanus1/agent-skills --skill idd-explore
```

> **Migrating from `issue-triage`:** the skill was renamed in version 2.0.0. Uninstall `issue-triage` and install `idd-explore`; the core behavior is the same.

> **Spanish headings from earlier versions:** since 2.1.0 the spec headings are written in English (`## 🎯 Goal`…). Items created before that keep their Spanish headings (`## 🎯 Objetivo`…), and the three phases still recognize them. See the IDD markers in [adapters.md](references/adapters.md#-idd-markers).

---

## 🔌 Providers

| Provider | Input | Read | Write |
| :--- | :--- | :--- | :--- |
| **Notion** | Page URL or ID | `notion-fetch` | `notion-update-page` / `notion-create-pages` |
| **Linear** | `ENG-104`, URL | `get_issue` | `save_issue` |
| **GitHub Issues** | `#42`, URL | `gh issue view` | `gh issue edit/create --body-file` |
| **GitHub Projects** | Project URL | `gh project item-list` | linked issue + `gh project item-add` |
| **Local** | `.md` path, text | file / prompt | `docs/specs/<date>-<slug>.md` |

---

## 💡 Examples

The skill replies in the user's language, so you can ask in English or Spanish.

### 1. Linear ticket with only a title
> *"Triage ENG-104, it only has a title"*

The agent reads the issue, explores the repo without changing it, builds the spec, shows it to you and, once you confirm, updates the description in Linear. It ends by suggesting `idd-plan`.

### 2. Notion page with loose notes
> *"Explore this requirement: https://www.notion.so/…"*

Extracts constraints, rules and estimates from the notes, checks the modules involved in the repo and, after your OK, writes the spec into the same page.

### 3. No tracker
> *"Refine this, I don't use any tracker: (notes…)"*

Produces the spec and, after confirmation, saves it to `docs/specs/2026-11-12-<slug>.md`.

---

## 📚 Documentation

- **[`SKILL.md`](SKILL.md)**: operating instructions and critical rules.
- **[Spec template](references/issue-template.md)**: the 7 sections with an example.
- **[Adapters](references/adapters.md)**: reading and writing per provider, and the IDD markers (shared by all three phases).
