# 🧹 Clean Code (`clean-code`)

> **Readable, maintainable code at the function and file level: names, small functions, error handling, comments and a code smell → refactor catalog. Includes a safe refactoring process (tests before and after) and a heuristic smell detector for JS/TS.**

| Property | Value |
| :--- | :--- |
| **Name** | `clean-code` |
| **Category** | `practices` |
| **Version** | `1.1.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |

---

## 📦 Installation

```bash
# In the current project:
npx skills add bryanus1/agent-skills --skill clean-code

# Global:
npx skills add bryanus1/agent-skills --skill clean-code -g

# Recommended together with tdd-workflow (characterization tests before refactoring):
npx skills add bryanus1/agent-skills --skill tdd-workflow
```

---

## 💡 Usage Examples with AI Agents

* **Safe refactor**:
  > *"Refactor `src/orders/report.ts`, nobody understands it. The tests must keep passing."*
  >
  > 🤖 Runs the tests, detects smells, refactors in small steps with tests between steps and reports the changes. Bugs found are reported separately instead of being fixed silently.

* **Readability review (no changes)**:
  > *"Review `UserList.tsx` and tell me what you would improve."*
  >
  > 🤖 A prioritized findings table (correctness → comprehension → duplication → cosmetic) with `file:line` and the concrete refactor.

* **Legacy code without tests**:
  > *"Clean up `pricing.ts`, it's used in checkout."*
  >
  > 🤖 Characterization tests first, then the refactor.

---

## 🛠️ Script

```bash
node <skill-dir>/scripts/detect-smells.mjs src
node <skill-dir>/scripts/detect-smells.mjs src/orders --json
node <skill-dir>/scripts/detect-smells.mjs src --max-lines 60 --max-params 4 --fail-on-findings
```

Heuristic, read-only detector for JS/TS: `long-function`, `deep-nesting`, `too-many-params`, `long-file`, `magic-number`, `nested-ternary` and `todo-comment`. They are signals to review, not verdicts.

---

## 📚 Documentation

- **[`SKILL.md`](SKILL.md)**: workflow and rules for the agent.
- **[Smell catalog](references/smells.md)** and **[refactoring catalog](references/refactorings.md)**.
- **[Before/after examples](examples/before-after.md)** (backend and frontend).
