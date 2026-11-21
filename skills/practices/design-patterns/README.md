# 🧩 Design Patterns (`design-patterns`)

> **Choose and apply design patterns (GoF and modern: Strategy, Adapter, Factory, Repository, Result, Compound Components, hooks…) starting from the problem rather than the catalog, always comparing them with the simplest alternative and deciding when to use none.**

| Property | Value |
| :--- | :--- |
| **Name** | `design-patterns` |
| **Category** | `practices` |
| **Version** | `1.1.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |

---

## 📦 Installation

```bash
# In the current project:
npx skills add bryanus1/agent-skills --skill design-patterns

# Global:
npx skills add bryanus1/agent-skills --skill design-patterns -g

# Recommended together with this one:
npx skills add bryanus1/agent-skills --skill solid-principles
npx skills add bryanus1/agent-skills --skill tdd-workflow
```

---

## 💡 Usage Examples with AI Agents

* **From a repeated `switch` to an extensible solution**:
  > *"Every time we add a carrier I have to touch three files. Apply the Strategy pattern."*
  >
  > 🤖 States the problem, compares it with the simple alternative (a rules table) and applies it; explains when it would move to classes.

* **Isolating a third-party SDK**:
  > *"I want to switch email providers and test without calling the SDK. Which pattern should I use?"*
  >
  > 🤖 Port and adapter (Adapter + DIP): a domain interface, a single adapter that imports the SDK, and tests with a fake.

* **Stopping unnecessary patterns**:
  > *"Apply Singleton and Factory to my configuration."*
  >
  > 🤖 Challenges the request with arguments (global state, no variants) and offers an alternative through composition.

---

## 📚 Documentation

- **[`SKILL.md`](SKILL.md)**: workflow, problem → pattern table and rules for the agent.
- References: **[Creational](references/creational.md)**, **[Structural](references/structural.md)**, **[Behavioral](references/behavioral.md)**, **[Frontend and backend](references/frontend-backend.md)**.
- **[Example: from a repeated switch to strategies](examples/strategy-vs-table.md)**.
