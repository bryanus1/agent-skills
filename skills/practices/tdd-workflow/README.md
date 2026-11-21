# 🔴🟢🔵 TDD Workflow (`tdd-workflow`)

> **Test-driven development for frontend and backend: a test list, Red → Green → Refactor cycles with real run evidence, bugs reproduced with a failing test, and characterization tests before touching legacy code.**

| Property | Value |
| :--- | :--- |
| **Name** | `tdd-workflow` |
| **Category** | `practices` |
| **Version** | `1.1.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |

---

## 📦 Installation

```bash
# In the current project:
npx skills add bryanus1/agent-skills --skill tdd-workflow

# Global:
npx skills add bryanus1/agent-skills --skill tdd-workflow -g
```

---

## 💡 Usage Examples with AI Agents

* **New feature with TDD**:
  > *"With TDD, implement `calculateShipping(order)`: free shipping from €50, otherwise €4.99, and €10 extra in remote zones."*
  >
  > 🤖 The agent detects the runner, writes the test list, goes cycle by cycle showing each real red, and ends with the full suite green and a cycle table.

* **Fixing a bug**:
  > *"`parseDuration('90s')` returns 0. Fix it."*
  >
  > 🤖 First a test that reproduces the bug and fails; then the smallest fix; finally the full suite.

* **Changing legacy code without tests**:
  > *"I need to change the commission calculation in `billing.js`, but it has no tests."*
  >
  > 🤖 Characterization tests that pin down the current behavior, then the TDD cycle for the change.

---

## 🛠️ Script

```bash
# From the project root (or the package root in a monorepo):
node <skill-dir>/scripts/detect-test-runner.mjs
node <skill-dir>/scripts/detect-test-runner.mjs --json
node <skill-dir>/scripts/detect-test-runner.mjs --cwd packages/api
```

Detects vitest, jest, mocha, `node:test`, playwright, cypress, pytest, `go test` and `cargo test`; the package manager; the commands to run everything, a single file or watch mode; and the naming convention of the existing tests. Read-only.

---

## 📚 Documentation

- **[`SKILL.md`](SKILL.md)**: the full workflow for the agent.
- **[Test doubles](references/test-doubles.md)**, **[Frontend](references/frontend-testing.md)**, **[Backend](references/backend-testing.md)**.
- **[TDD session example](examples/tdd-session.md)**.
