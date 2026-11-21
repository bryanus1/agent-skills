---
name: solid-principles
version: 1.1.0
description: >-
  Apply and review the SOLID principles (SRP, OCP, LSP, ISP, DIP) at the class, module and component level, in backend and frontend: detect violations, refactor with tests and decide when NOT to apply them. Use it when designing or reviewing classes, services, hooks or components with too many responsibilities or too much coupling.
tags: [solid, srp, ocp, lsp, isp, dip, design, refactoring, best-practices]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - solid
  - principios solid
  - solid principles
  - single responsibility
  - responsabilidad única
  - open closed
  - inversión de dependencias
  - dependency inversion
  - esta clase hace demasiado
  - this class does too much
  - este servicio tiene demasiadas responsabilidades
  - refactor to solid
requirements:
  tools: [view_file, replace_file_content, run_command]
---

# SOLID Principles

## 🎯 Purpose

Apply SOLID as a **diagnosis and decision tool**, not as a ritual. Each principle answers a concrete pain (changes that ripple, impossible tests, extensions that force you to edit existing code). If that pain does not exist, applying the principle only adds layers.

This skill works at the **class, module and component** level. For readability inside a function use `clean-code`; to choose a specific pattern (Strategy, Adapter, Repository…) use `design-patterns`; for the project's folder structure, the architecture skills.

## ⚡ When to Trigger

- The user mentions SOLID or one of its principles, or asks to "apply design principles".
- A class, service, hook or component "does too much", is hard to test or changes for unrelated reasons.
- Adding a variant (another payment method, another provider, another user type) forces you to edit an `if`/`switch` in several places.
- New code is being reviewed with dependencies created inside the class (`new Stripe()`, direct `fetch` in the business logic).

## 📋 Workflow

### 1. Set the scope and read

Identify the scope (a file, a module, a component). Read the code and its tests, and the project's conventions: how it injects dependencies, whether it uses a DI container (NestJS, Angular, tsyringe) or manual composition, functional or class style. **The project's conventions win**: in React or functional code, the principles are expressed with functions, hooks and composition, not with class hierarchies.

### 2. Diagnose by signals, not by labels

Go through the table and note only what you find with concrete evidence (`file:line`).

| Principle | Violation signal | Diagnostic question |
|---|---|---|
| **SRP** | A description with "and" (`validates AND saves AND sends email`); imports from different layers (HTTP, SQL, third-party SDK); the file changes for reasons unrelated to each other | How many reasons (actors or decisions) does this unit have to change? |
| **OCP** | A `switch`/`if` on a type repeated in several places; adding a variant forces you to edit stable code | Can I add a new case without touching the existing ones? |
| **LSP** | A subclass that throws `NotImplemented`, ignores a method or tightens preconditions; `instanceof` in the client code | Does the client work the same with any implementation? |
| **ISP** | An interface or props with many members, of which each client uses few; huge mocks in tests; methods that throw "not supported" | Does each client depend only on what it uses? |
| **DIP** | `new` of infrastructure inside the business logic; the domain imports from the ORM, the SDK or `process.env` | Can the business rule be tested without the network or a DB? |

Details, backend and frontend examples and refactors per principle: [SRP](references/srp.md), [OCP](references/ocp.md), [LSP](references/lsp.md), [ISP](references/isp.md), [DIP](references/dip.md).

### 3. Decide whether it is worth it (mandatory)

For each violation, before touching anything, answer:

1. **Does it hurt today?** Changes that ripple, repeated bugs, impossible tests, constant merge conflicts? If not, and there is no second variant in sight, **don't apply the principle**; note it as an observation.
2. **How many real variants are there?** A single implementation does not justify an interface. With two, consider abstracting; with three, abstract (rule of three).
3. **What is the simplest solution?** Often extracting a function or moving a parameter is enough; a class hierarchy is the last resort.
4. **What cost does it add?** More files, more indirection, more to read. It must pay for itself.

Summarize the decision: **Apply**, **Defer** (wait for the second variant) or **Don't apply** (with the reason).

### 4. Safety net

A design refactor changes the structure, not the behavior. Run the existing tests and note the starting state. If they don't cover the affected code, write characterization tests first (if the `tdd-workflow` skill is available, follow its Flow C). Without tests, limit the change to mechanical moves and warn about the risk.

### 5. Refactor in small steps

- One principle and one violation at a time; tests between steps.
- Start with the change that isolates the most: usually **extracting a dependency behind a small interface** (DIP + ISP) or **extracting a responsibility** (SRP).
- Keep the public API (exports, signatures, routes, props) unless the user asks otherwise; if a change breaks it, say so first.
- Interfaces are defined by **the consumer**, with what it needs, not by copying the implementation's API.
- Composition lives in one place (the application root, the DI module, the context provider), not scattered through the code.

### 6. Verify and report

Run tests, typecheck and lint if the project has them. Report using the format in the "Report" section, and include the **Don't apply** and **Defer** decisions too: they are part of the review's value.

## 🚫 When NOT to Apply SOLID

- **A single implementation with no reason to vary**: `interface PaymentGateway` with a single `StripeGateway` class and no second provider on the horizon is noise, unless the interface is the seam needed for testing.
- **Scripts, prototypes and throwaway code.**
- **Small pure functions**: they already satisfy SRP and DIP by construction.
- **When the framework already dictates the shape** (a Nest controller, a Next page): don't fight the convention to satisfy a principle.
- **To reduce lines**: SOLID usually increases the number of files; if the only goal is "less code", use `clean-code`.

## ⚠️ Critical Rules

- **Reply in the user's language**, even though this skill is written in English.
- **Do not add abstractions without a concrete reason** (real variation, a test seam or a demonstrable pain). Cite the reason in the report.
- **Refactoring does not change behavior.** Without tests to back it, don't claim it; run the tests before and after and report the real result.
- **Do not change the public API without warning** and without confirmation.
- **Do not force class hierarchies into functional code** (React, hooks, function modules): use composition and functions.
- **Do not install dependencies** (DI containers, libraries) without confirmation; constructor or parameter injection is almost always enough.
- **Do not touch what was not requested**: everything else goes under "Out of scope".
- **Principles are justified by their effect**, not by their name. "This violates SRP" is not a finding; "this file changes for three different reasons, see commits X and Y" is.

## 📤 Report

```markdown
### Summary
<1–2 sentences: state of the design and the 1–3 highest-impact violations>

### Diagnosis
| Principle | Location | Evidence | Hurts today? | Decision |
|---|---|---|---|---|
| SRP | src/orders/order.service.ts:12-90 | Validates, computes taxes, persists and sends email; changed for 3 reasons in 3 commits | Yes | Apply |
| DIP | src/orders/order.service.ts:8 | `new SmtpMailer()` inside the service; the test sends real emails | Yes | Apply |
| OCP | src/pricing.ts:30 | `switch (tier)` in a single place, 3 stable cases | No | Don't apply |

### Changes applied
1. <refactor> — tests: ✅ N/N

### Deferred / out of scope
- <what to wait on until a second variant exists, bugs seen, decisions for the user>
```

## 📚 References

- [SRP: single responsibility](references/srp.md)
- [OCP: open/closed](references/ocp.md)
- [LSP: Liskov substitution](references/lsp.md)
- [ISP: interface segregation](references/isp.md)
- [DIP: dependency inversion](references/dip.md)
- [Full example: order service](examples/order-service.md)
