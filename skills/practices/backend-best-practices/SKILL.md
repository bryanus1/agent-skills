---
name: backend-best-practices
version: 1.1.0
description: >-
  Review and improve backend code (HTTP APIs, services, data access) with verifiable good practices: API design, validation and errors, data access, security, reliability and observability. Prioritizes by impact and fixes only what hurts. Use it when reviewing or writing endpoints, services and queries.
tags: [backend, api, rest, security, database, observability, best-practices]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - buenas prácticas backend
  - backend best practices
  - revisa este endpoint
  - review this endpoint
  - review api
  - diseño de api
  - api design
  - seguridad backend
  - backend security
  - n+1
  - revisión de backend
  - backend review
requirements:
  tools: [view_file, replace_file_content, run_command]
---

# Backend Best Practices

## 🎯 Purpose

Review and improve server code with **verifiable, prioritized criteria**. Each finding cites evidence (`file:line`), its impact (security, data, availability, maintenance) and a proportionate fix. What is already fine stays as it is.

It covers five areas: **API design and errors, data access, security, reliability and observability**. It does not decide the module structure (`nestjs-architecture`, `monorepo-architecture`), internal readability (`clean-code`), class responsibilities (`solid-principles`) or which pattern to use (`design-patterns`). For tests use `tdd-workflow`.

## ⚡ When to Trigger

- The user asks to review, harden or "apply good practices" to endpoints, services, queries or middleware.
- A new endpoint or service is written that receives external input, touches the database or calls third parties.
- There are symptoms: slow queries, unexplained 500 errors, inconsistent data, information leaks, lack of traceability.

## 📋 Workflow

### 1. Read the context

Identify the language and framework (NestJS, Express, Fastify, Hono…), the ORM or DB client, how input is validated and errors are handled today, how logging and configuration work. **Use the project's conventions and libraries**; don't introduce others without confirming.

### 2. Review by area

| Area | Key checks | Details |
|---|---|---|
| **API design and errors** | Input validation at the edge; correct status codes; a uniform error format that does not leak internal details; pagination; idempotency in repeatable operations | [api-design](references/api-design.md) |
| **Data access** | Parameterized queries; no N+1; transactions for related changes; indexes for the real filters; safe migrations | [data-access](references/data-access.md) |
| **Security** | Authentication and **per-resource authorization**; injection; secrets out of the code; rate limits; sensitive data neither exposed nor logged | [security-backend](references/security-backend.md) |
| **Reliability** | Timeouts on external calls; bounded retries, and only if idempotent; graceful shutdown; no heavy work blocking the event loop | [reliability-observability](references/reliability-observability.md) |
| **Observability** | Structured logs with correlation; no sensitive data; metrics and health checks; errors with context | [reliability-observability](references/reliability-observability.md) |

Stick to the areas relevant to the requested scope and to the files that were requested.

### 3. Prioritize

- **Critical**: an exploitable vulnerability (injection, missing authorization, exposed secrets), data loss or corruption.
- **Important**: errors that return wrong codes or leak details, N+1 or unindexed queries on hot paths, missing transactions, missing timeouts.
- **Minor**: naming consistency, unhelpful logs, formatting improvements. Mention them without fixing if they were not requested.

### 4. Fix with a safety net

Run the tests before and after. If the change alters the HTTP contract (status codes, response shape, fields), **say so before applying it**: clients depend on it. For a bug or a vulnerability, first write a test that reproduces it (the `tdd-workflow` flow). One change per finding.

### 5. Verify and report

Run tests, typecheck and lint if they exist. State what you **could not verify** (real performance with production data, behavior under load, network policies) and how to check it. Report using the format below.

## 🚫 When NOT to Over-Engineer

- **Adding layers** (repository, DTO, use case) to a simple CRUD the framework already covers.
- **Caching, queues or microservices** without a measured performance problem.
- **Retries on non-idempotent operations** (charges, shipments): they create duplicates.
- **Indexes "just in case"**: every index costs on writes; base the decision on the real queries (`EXPLAIN`).
- **Small, correct handlers**: if there are no real findings, say so; "no changes needed" is a valid result.

## ⚠️ Critical Rules

- **Reply in the user's language**, even though this skill is written in English.
- **Evidence first**: every finding with `file:line` and a concrete effect.
- **Security is never deferred**: an injection or missing authorization is reported as critical even if it was not requested.
- **Do not change the public contract without warning** (routes, status codes, response shape, field names).
- **Never log or return secrets, tokens or unnecessary personal data**; don't put them in the code or in examples.
- **Destructive migrations** (dropping columns, changing types) and any operation on real data: confirm with the user; propose backward-compatible steps.
- **Do not install dependencies** without confirmation.
- **Do not make up performance metrics**: measure, or state that nothing was measured.
- **Do not touch what was not requested**: everything else goes under "Out of scope".

## 📤 Report

```markdown
### Summary
<overall state and the 1–3 highest-impact findings>

### Findings
| # | Severity | Area | Location | Problem and effect | Action |
|---|---|---|---|---|---|
| 1 | Critical | Security | orders.ts:21 | SQL built by concatenating `req.query.status`: injection | Fixed (parameterized query) |
| 2 | Important | API | orders.ts:30 | Returns 200 with `{error}` on failure and exposes `err.stack` | Fixed (4xx/5xx, generic message) — changes the contract |
| 3 | Minor | Logs | orders.ts:44 | `console.log` without context | Mentioned only |

### Changes applied
1. <change> — tests: ✅ N/N

### Not verified / out of scope
- <what needs real load, production data or a user decision>
```

## 📚 References

- [API design, validation and errors](references/api-design.md)
- [Data access](references/data-access.md)
- [Backend security](references/security-backend.md)
- [Reliability and observability](references/reliability-observability.md)
- [Full review example](examples/review-orders-api.md)
