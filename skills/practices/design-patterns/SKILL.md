---
name: design-patterns
version: 1.1.0
description: >-
  Choose and apply design patterns (GoF and modern: Strategy, Adapter, Factory, Repository, Result, Compound Components, hooks) starting from the problem, not the catalog, and decide when to use NONE. Use it when a pattern is requested, or on repeated ifs/switches, coupled SDKs or duplicated UI logic, in frontend or backend.
tags: [design-patterns, gof, strategy, adapter, factory, repository, refactoring, best-practices]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - patrón de diseño
  - patrones de diseño
  - design pattern
  - design patterns
  - qué patrón uso
  - which pattern should I use
  - aplica el patrón strategy
  - patrón repository
  - repository pattern
  - patrón adapter
  - adapter pattern
  - factory pattern
  - strategy pattern
  - observer pattern
requirements:
  tools: [view_file, replace_file_content, run_command]
---

# Design Patterns

## 🎯 Purpose

A pattern is a **named solution to a recurring problem**, and its value is the shared vocabulary and the already-studied balance of forces. This skill starts from the problem (what hurts, what varies) and arrives at the pattern, not the other way round. Applying a pattern without the problem is the most common mistake: it produces layers with no benefit.

It complements `solid-principles` (why to separate and what depends on what) and `clean-code` (readability inside functions). For folder structure, use the catalog's architecture skills.

## ⚡ When to Trigger

- The user asks for a pattern by name ("apply Strategy", "use the Repository pattern") or asks "which pattern should I use for…".
- There are repeated `if`/`switch` statements on a type, third-party SDKs coupled to the logic, objects with complex construction, events that many modules need to listen to, or UI logic duplicated across components.
- A design is being reviewed and you want to know whether a pattern would help (or whether the existing one is unnecessary).

Do not trigger it for local readability (names, long functions): use `clean-code`.

## 📋 Workflow

### 1. State the problem, not the solution

Before naming any pattern, answer in writing:

1. **What hurts today?** (a change that ripples, an impossible test, duplication, coupling to a vendor, repeated construction).
2. **What varies and what is stable?** The pattern isolates what varies from what doesn't.
3. **How many real variants exist?** (one, two, three or more; known or hypothetical).
4. **What conventions does the project have?** (classes or functions, DI container, state and data libraries, framework).

If the user asked for a specific pattern, still check that it fits the problem; if it doesn't, say so and propose the alternative.

### 2. Choose with the problem → pattern table

| Problem | Candidate | Simpler alternative to consider first |
|---|---|---|
| Several ways to do the same thing, chosen at runtime (rates, exporters, validators) | **Strategy** | A `Record<Type, function>` table |
| Integrate a third-party API/SDK without coupling to it | **Adapter** (port + adapter) | Wrapper function |
| Create objects whose type depends on data or configuration | **Factory** / Factory Method | A `create(...)` function with a `switch` |
| Construction with many optional parameters | **Builder** | Options object with defaults |
| Add cross-cutting behavior without touching the original (cache, logs, retries, auth) | **Decorator** / middleware | Higher-order function |
| Hide a complex subsystem behind a simple API | **Facade** | A module with one public function |
| Notify several parties of a change without coupling them | **Observer** / events | A direct callback if there is a single listener |
| A process with fixed steps and variable details | **Template Method** | A function that takes the variable steps as parameters |
| Change behavior by state, with explicit transitions | **State** / state machine | A `switch` on an enum if there are few states |
| Encapsulate an action to undo, queue or log it | **Command** | Function + data |
| Isolate data access from business logic | **Repository** | A data-access function behind an interface |
| Return success/failure without exceptions in expected flows | **Result / Either** | Typed domain exceptions |
| An instance shared across the whole app | Module/instance composed at the root | **Avoid the classic Singleton** (global state, hard tests) |
| UI with related pieces that share state (tabs, accordion, select) | **Compound Components** | Props + `children` |
| Reuse stateful logic across components | **Custom Hook** | Pure function |
| Separate presentation from data access in the UI | **Container/Presentational** or hook + component | — |

Details, shape and TypeScript examples: [Creational](references/creational.md), [Structural](references/structural.md), [Behavioral](references/behavioral.md), [Frontend and backend](references/frontend-backend.md).

### 3. Compare with the simplest alternative (mandatory)

For the chosen candidate, answer:

- Does a **function** or a **data table** solve the problem with fewer pieces? In TypeScript/JavaScript many GoF patterns are *higher-order functions* or *object literals*; a class hierarchy is usually unnecessary.
- Are there **at least two real variants** or a necessary test seam? With only one, **defer**.
- Does the pattern **fit the project's conventions**? (Don't bring classes into functional code, or a DI container where there is none.)
- How much does it add? (files, indirection, reading curve). It must pay for itself.

Outcome: **Apply**, **Defer** (wait for the second variant) or **Don't apply** (simple alternative). Write it down with the reason.

### 4. Safety net

If the pattern is introduced into existing code, it is a refactor: run the tests before and after. If they don't cover the affected code, add characterization tests first (if `tdd-workflow` is available, follow its Flow C). If you are building something new, write the behavior test first.

### 5. Implement minimally

- **Name the pattern in the code** only when it helps (`ShippingStrategy`, `StripeAdapter`, `OrderRepository`); it is shared vocabulary. Don't force it into the name if the project's convention is different.
- Define the interface **from the consumer's side** with the minimum it needs (see ISP in `solid-principles`).
- Keep composition (which implementation is used) in a single place, not scattered.
- Keep the public API unless explicitly asked, and flag any behavior change.

### 6. Verify and report

Run tests, typecheck and lint if they exist. Use the format in the "Report" section; include the **Don't apply** and **Defer** decisions.

## 🚫 When NOT to Use a Pattern

- **A single implementation with no second one in sight**: the interface, the factory or the strategy is noise.
- **A small, stable `switch` in a single place**: it is more readable than N classes.
- **To look "professional"** or because "the project should have patterns": every piece must justify its cost.
- **Singleton, Service Locator and global state**: there is almost always an alternative through injection or composition.
- **When the framework already solves it** (Express/Nest middleware as Decorator/Chain, hooks as Strategy/Observer, an ORM as Repository/Unit of Work): use the native mechanism.
- **Decorative combinations**: stacking Factory + Strategy + Builder for two cases is over-engineering, not design.

## ⚠️ Critical Rules

- **Reply in the user's language**, even though this skill is written in English.
- **Start from the problem**, not the pattern. Cite the concrete pain in the report; without real pain or variation, there is no pattern.
- **Ask about the simple alternative before adding classes.** A function or a table beats a hierarchy almost every time in TS/JS.
- **Do not change the public API or the behavior without warning.** A refactor to a pattern keeps the behavior; run the tests before and after and report the real result.
- **Do not install dependencies** (DI containers, event libraries, `neverthrow`, `xstate`…) without the user's confirmation.
- **Respect the project's conventions**: functional style vs classes, an existing DI container, the state or data library already chosen.
- **Do not touch what was not requested**: everything else goes under "Deferred / out of scope".

## 📤 Report

```markdown
### Problem
<what hurts, what varies, how many real variants>

### Decision
| Candidate | Simple alternative | Verdict | Reason |
|---|---|---|---|
| Strategy | Record<Carrier, fn> table | Apply the table, not classes | 3 stateless variants; fits the project's functional style |
| Factory | — | Don't apply | Only one creation point |

### Changes applied
1. <change> — tests: ✅ N/N

### Deferred / out of scope
- <what to reassess with a second variant, risks, decisions for the user>
```

## 📚 References

- [Creational patterns](references/creational.md): Factory, Builder, avoiding Singleton
- [Structural patterns](references/structural.md): Adapter, Decorator, Facade
- [Behavioral patterns](references/behavioral.md): Strategy, Observer, State, Command, Template Method
- [Frontend and backend](references/frontend-backend.md): Repository, Result, Compound Components, hooks, middleware
- [Example: from a repeated switch to strategies](examples/strategy-vs-table.md)
