# 🧱 SOLID Principles (`solid-principles`)

> **Apply and review SRP, OCP, LSP, ISP and DIP at the class, module and component level in backend and frontend: diagnose by concrete signals, refactor with tests and explicitly decide when NOT to apply them (without a real reason, an abstraction is just noise).**

| Property | Value |
| :--- | :--- |
| **Name** | `solid-principles` |
| **Category** | `practices` |
| **Version** | `1.1.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |

---

## 📦 Installation

```bash
# In the current project:
npx skills add bryanus1/agent-skills --skill solid-principles

# Global:
npx skills add bryanus1/agent-skills --skill solid-principles -g

# Recommended together with this one:
npx skills add bryanus1/agent-skills --skill tdd-workflow
npx skills add bryanus1/agent-skills --skill clean-code
npx skills add bryanus1/agent-skills --skill design-patterns
```

---

## 💡 Usage Examples with AI Agents

* **Refactoring a service with too many responsibilities**:
  > *"This `OrderService` validates, computes prices, saves to the DB and sends the email. Apply SOLID to it."*
  >
  > 🤖 A per-principle diagnosis with evidence (`file:line`), an *Apply / Defer / Don't apply* decision for each, a refactor in small steps with tests between steps, and a final report.

* **Review without changes**:
  > *"Review this class hierarchy and tell me whether there are design problems."*
  >
  > 🤖 Detects violations (e.g. a subclass that throws `read-only` in an inherited method) and proposes splitting the interfaces, without touching files.

* **Stopping over-engineering**:
  > *"Apply OCP to this three-case `switch`."*
  >
  > 🤖 Explains why a small, stable `switch` in a single place needs no abstraction.

---

## 📚 Documentation

- **[`SKILL.md`](SKILL.md)**: workflow, signal table and rules for the agent.
- References: **[SRP](references/srp.md)**, **[OCP](references/ocp.md)**, **[LSP](references/lsp.md)**, **[ISP](references/isp.md)**, **[DIP](references/dip.md)**.
- **[Full example: order service](examples/order-service.md)**.
