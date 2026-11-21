# 🖥️ Frontend Best Practices (`frontend-best-practices`)

> **Review and improve components, hooks and pages with verifiable, prioritized criteria: state and effects, remote data, forms, accessibility, performance and security. Fixes what hurts and leaves alone what is already fine.**

| Property | Value |
| :--- | :--- |
| **Name** | `frontend-best-practices` |
| **Category** | `practices` |
| **Version** | `1.1.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |

---

## 📦 Installation

```bash
# In the current project:
npx skills add bryanus1/agent-skills --skill frontend-best-practices

# Global:
npx skills add bryanus1/agent-skills --skill frontend-best-practices -g

# Recommended together with this one:
npx skills add bryanus1/agent-skills --skill tdd-workflow
npx skills add bryanus1/agent-skills --skill clean-code
npx skills add bryanus1/agent-skills --skill nextjs-architecture
```

---

## 💡 Usage Examples with AI Agents

* **Reviewing a component**:
  > *"Review `UserList.tsx` and apply frontend best practices."*
  >
  > 🤖 A findings table by severity with `file:line` (XSS, keyboard, `fetch` races, derived state, keys), minimal fixes, *don't apply* decisions and what it could not verify without a browser.

* **Writing a new component**:
  > *"Create an accessible contact form with validation."*
  >
  > 🤖 Labels, errors tied to each field, submitting state, validation on the client and the server.

* **A component that is already fine**:
  > *"Apply good practices to this button."*
  >
  > 🤖 Reports that there are no relevant findings instead of inventing improvements.

---

## 🧭 What It Covers

| Area | Reference |
|---|---|
| State, effects and remote data | [react-state-effects](references/react-state-effects.md) |
| Forms | [forms-and-data](references/forms-and-data.md) |
| Accessibility (WCAG 2.2 AA) | [accessibility](references/accessibility.md) |
| Performance (Core Web Vitals) | [performance](references/performance.md) |
| Security (XSS, tokens, secrets) | [security-frontend](references/security-frontend.md) |

## 🚫 What It Does NOT Do

- It does not define the folder structure (use the architecture skills).
- It does not claim performance or accessibility improvements it cannot measure: it declares them as not verified.
- It does not install dependencies without confirmation.

---

## 📁 Structure

```
frontend-best-practices/
├── SKILL.md
├── README.md
├── references/
├── examples/review-user-list.md
└── evals/            # evals.json + fixtures
```
