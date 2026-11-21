# 🔎 Explain Change (`explain-change`)

> **Audit after `/opsx:apply`, `idd-apply` or any AI-assisted implementation: compares the code actually written against the original proposal and sums up the decisions the AI made on its own (assumptions, limits, contracts, dependencies, extra scope and shortcuts).**

| Property | Value |
| :--- | :--- |
| **Name** | `explain-change` |
| **Category** | `workflow` |
| **Version** | `1.1.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Supported Sources** | OpenSpec (`openspec/changes/`), IDD (Notion, Linear, GitHub Issues/Projects, `docs/specs/`), `.md` plans or PRs |
| **Mode** | Read-only by default |

---

## 📦 Installation

```bash
# Install into the current project with skills.sh:
npx skills add bryanus1/agent-skills --skill explain-change

# Install globally on your machine:
npx skills add bryanus1/agent-skills --skill explain-change -g
```

---

## 💡 Usage Examples

The skill replies in the user's language, so you can ask in English or Spanish.

### 1. Right after `/opsx:apply`
> *"explicar-cambio after the last /opsx:apply"*

Finds the active change in `openspec/changes/<name>/` (`proposal.md`, `design.md`, `specs/`, `tasks.md`), inspects the `git diff` and the new files, and shows you only the implicit decisions the AI made (e.g. a library installed outside the design, an arbitrary limit or a collateral refactor).

### 2. After implementing a ticket with `idd-apply`
> *"Which decisions did the AI make that weren't in the ENG-104 plan?"*

Reads the plan and the progress/deviation comments on the Linear issue, separates what you had already approved in the plan's deviations from the silent decisions or omitted items, and prioritizes what needs your validation. It reads both the English IDD markers and the Spanish ones from earlier versions.

### 3. Local Markdown plan or PR
> *"Audit the changes on this branch against docs/specs/2026-11-12-export-csv.md"*

Compares the current branch against `main` and the given spec, and asks which decisions to accept (with the option to document them after your OK) or revert.

---

## 📚 Documentation

- **[`SKILL.md`](SKILL.md)**: step-by-step workflow, the no-self-justification rule and read-only constraints.
- **[Proposal sources](references/proposal-sources.md)**: finding and reading OpenSpec, IDD and generic plans.
- **[Decision taxonomy and report](references/decision-taxonomy.md)**: the 6 categories, 🔴/🟡/🟢 criteria, canonical template and a full example.
