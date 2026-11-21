# ⚙️ IDD Apply (`idd-apply`)

> **Phase 3 of the IDD (Issue-Driven Development) flow: `idd-explore` → `idd-plan` → `idd-apply`. Implements the plan task by task, ticks each checkbox in the same tracker item (or the local `.md`), stops on deviations and closes with the verification defined in the plan.**

| Property | Value |
| :--- | :--- |
| **Name** | `idd-apply` |
| **Category** | `workflow` |
| **Version** | `1.1.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Depends on** | [`idd-explore`](../idd-explore/README.md) (adapters), [`idd-plan`](../idd-plan/README.md) (plan template) |

---

## 🧭 The IDD Flow

| Phase | Skill | Output | Touches code? |
|---|---|---|---|
| 1. Explore | [`idd-explore`](../idd-explore/README.md) | 7-section spec | No |
| 2. Plan | [`idd-plan`](../idd-plan/README.md) | Detailed plan | No |
| 3. Apply | **`idd-apply`** | Code + ticked tasks | Yes |

---

## 📦 Installation

```bash
npx skills add bryanus1/agent-skills --skill idd-explore --skill idd-plan --skill idd-apply
```

---

## 🔁 How It Works

1. Finds the plan (tracker or `docs/specs/*.md`) and checks that it has requirements, tasks and verification.
2. Shows you the pending tasks and asks for a single OK to keep the progress updated.
3. Runs each task with the smallest change and verifies it. In the tracker it posts one progress comment per group of tasks (without rewriting the description); locally it ticks `- [x]` in the file.
4. If something does not match the plan, it stops, proposes the adjustment and, with your OK, records it (in the progress comment or, locally, in the plan).
5. Runs the **Verification** section, shows you the summary and, with your OK, consolidates the plan in a single edit: ticked checkboxes, deviations and `Status: implemented`.

It does not commit, push or close the issue unless you ask. Status and deviation format: [references/apply-checklist.md](references/apply-checklist.md).

> **Plans from earlier versions:** plans written with the Spanish markers (`## 🛠️ Plan de Implementación`, `Estado: …`, `🔄 Progreso IDD`) still work; `idd-apply` reads them and keeps writing the Spanish markers in those items.

---

## 💡 Examples

The skill replies in the user's language, so you can ask in English or Spanish.

### 1. Plan in Linear
> *"Implement the plan for ENG-104"*

Reads the plan from the issue, runs the tasks, comments the progress with `save_comment` and, at the end, consolidates the description with `save_issue`.

### 2. Continue a half-done plan
> *"Continue with the plan for #42"*

Reads the plan's checkboxes and the `🔄 IDD Progress` comments to know what is done, and continues from the first pending task.

### 3. Local plan
> *"Apply the plan"*

Searches `docs/specs/` for unfinished plans; if there are several, it asks which.

---

## 📚 Documentation

- **[`SKILL.md`](SKILL.md)**: operating instructions and critical rules.
- **[Execution checklist](references/apply-checklist.md)**: statuses, checkboxes, deviations and closing summary.
