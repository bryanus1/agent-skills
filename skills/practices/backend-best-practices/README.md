# 🛠️ Backend Best Practices (`backend-best-practices`)

> **Review and improve endpoints, services and data access with verifiable, prioritized criteria: API design and errors, queries, security, reliability and observability. Fixes what hurts and warns before changing the public contract.**

| Property | Value |
| :--- | :--- |
| **Name** | `backend-best-practices` |
| **Category** | `practices` |
| **Version** | `1.1.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |

---

## 📦 Installation

```bash
# In the current project:
npx skills add bryanus1/agent-skills --skill backend-best-practices

# Global:
npx skills add bryanus1/agent-skills --skill backend-best-practices -g

# Recommended together with this one:
npx skills add bryanus1/agent-skills --skill tdd-workflow
npx skills add bryanus1/agent-skills --skill solid-principles
npx skills add bryanus1/agent-skills --skill nestjs-architecture
```

---

## 💡 Usage Examples with AI Agents

* **Reviewing an API module**:
  > *"Review `orders-api.ts` and apply backend best practices."*
  >
  > 🤖 A findings table by severity with `file:line` (SQL injection, IDOR, mass assignment, N+1, errors with 200 and a stack), minimal fixes, an explicit warning about contract changes and what it could not verify.

* **New endpoint**:
  > *"Create an endpoint to cancel an order."*
  >
  > 🤖 Validation at the edge, per-resource authorization, correct status codes, a transaction if it changes several tables, idempotency.

* **A handler that is already fine**:
  > *"Apply good practices to this endpoint."*
  >
  > 🤖 Reports that there are no relevant findings instead of inventing layers.

---

## 🧭 What It Covers

| Area | Reference |
|---|---|
| API, validation and errors | [api-design](references/api-design.md) |
| Data access and migrations | [data-access](references/data-access.md) |
| Security (OWASP) | [security-backend](references/security-backend.md) |
| Reliability and observability | [reliability-observability](references/reliability-observability.md) |

## 🚫 What It Does NOT Do

- It does not define the module structure (use `nestjs-architecture`, `monorepo-architecture`).
- It does not change status codes, routes or response shapes without warning.
- It does not run migrations or touch real data without confirmation.
- It does not claim performance improvements without measuring them.

---

## 📁 Structure

```
backend-best-practices/
├── SKILL.md
├── README.md
├── references/
├── examples/review-orders-api.md
└── evals/            # evals.json + fixtures (node:test)
```
