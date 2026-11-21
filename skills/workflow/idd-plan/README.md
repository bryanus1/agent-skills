# 🛠️ IDD Plan (`idd-plan`)

> **Phase 2 of the IDD (Issue-Driven Development) flow: `idd-explore` → `idd-plan` → `idd-apply`. Produces a detailed implementation plan (requirements with scenarios, design, verified files, tasks and verification) and saves it in the same tracker item or, if you have none, in a local `.md`. Does not touch code.**

| Property | Value |
| :--- | :--- |
| **Name** | `idd-plan` |
| **Category** | `workflow` |
| **Version** | `1.1.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Depends on** | [`idd-explore`](../idd-explore/README.md) (provider adapters) |

---

## 🧭 The IDD Flow

| Phase | Skill | Output | Touches code? |
|---|---|---|---|
| 1. Explore | [`idd-explore`](../idd-explore/README.md) | 7-section spec | No |
| 2. Plan | **`idd-plan`** | Detailed plan | No |
| 3. Apply | [`idd-apply`](../idd-apply/README.md) | Code + ticked tasks | Yes |

---

## 📦 Installation

```bash
npx skills add bryanus1/agent-skills --skill idd-explore --skill idd-plan --skill idd-apply
```

---

## 📄 What the Plan Contains

1. **Context**: why and what for.
2. **Requirements** in delta format (`ADDED` / `MODIFIED` / `REMOVED`), with "MUST…" and *Given / When / Then* scenarios.
3. **Design and decisions**: approach, code that is reused and the discarded alternative.
4. **Affected files**: paths verified in the repo.
5. **Tasks** `- [ ] 1.1 … → R1`, small and linked to requirements.
6. **Verification**: real commands per scenario.
7. **Out of scope, assumptions, open questions and metadata**.

For small changes it produces a **short plan** (context, requirements, tasks and verification) and, if the plan goes beyond about 12 tasks, it proposes **splitting** it into several items.

Full template, short plan and example: [references/plan-template.md](references/plan-template.md).

> **Spanish headings from earlier versions:** since 1.1.0 the plan is written with English markers (`## 🛠️ Implementation Plan`, `Status: planned`). Plans created before that keep `## 🛠️ Plan de Implementación` and `Estado: planificado`, and `idd-plan` and `idd-apply` still recognize them.

---

## 💡 Examples

The skill replies in the user's language, so you can ask in English or Spanish.

### 1. From a GitHub issue
> *"Plan issue #42"*

Reads the issue (and the `idd-explore` spec if there is one), explores the repo, asks you only what changes the scope, shows you the plan and, after your OK, adds it to the issue body with `gh issue edit --body-file`.

### 2. From a Notion page
> *"Write the implementation plan for https://www.notion.so/…"*

Same as above, but writes the `🛠️ Implementation Plan` section into the same page.

### 3. No tracker
> *"Plan docs/specs/2026-11-12-export-csv.md"*

Appends the plan below the spec in that same file.

---

## 📚 Documentation

- **[`SKILL.md`](SKILL.md)**: operating instructions and critical rules.
- **[Plan template](references/plan-template.md)**: structure, writing rules and an example.
