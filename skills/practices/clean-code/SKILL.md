---
name: clean-code
version: 1.1.0
description: >-
  Clean Code at the function and file level: names, small functions, error handling, comments and a code smell → refactor catalog, with a heuristic detector. Use it to clean up, refactor or review the readability of frontend or backend code, or when writing new code that must stay maintainable.
tags: [clean-code, refactoring, code-smells, readability, code-review, best-practices]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - clean code
  - código limpio
  - limpia este código
  - clean up this code
  - refactoriza esta función
  - refactor this function
  - code smells
  - mejorar legibilidad
  - revisar legibilidad
  - este código es difícil de leer
  - this code is hard to read
  - refactor for readability
requirements:
  tools: [view_file, replace_file_content, run_command]
---

# Clean Code

## 🎯 Purpose

Make code easy to read, change and test at the **function and file** level: names, size and shape of functions, error handling, comments and duplication. It provides a safe refactoring process (behavior intact, small steps, tests between steps) and a heuristic detector that speeds up finding where to look.

Out of scope: class and module design (SOLID), choosing design patterns and folder architecture. If the real problem lives there, say so in the report instead of forcing it with local refactors.

## ⚡ When to Trigger

- The user asks to clean up, refactor or "improve" code, or says it is hard to read or maintain.
- A code review focused on readability and maintainability is requested.
- New code is being written and the user wants it to follow good practices.
- Before adding a feature to a function that is already long or confusing (preparing the ground).

## 📋 Workflow

### 1. Set the scope and the mode

- **Review mode** (report only): the user asks to review, give an opinion or "what would you improve". Do not edit files.
- **Refactor mode**: the user asks to clean up or refactor. Edit, but only within the requested scope (the named files or functions).
- **Writing mode**: new code. Apply the rules in the "Clean Code Rules" section from the start.

First read the project's conventions: linter and formatter (`eslint`, `biome`, `prettier`), strict `tsconfig` or not, existing naming and error style. **The project's conventions win over this skill's generic rules.**

### 2. Safety net (refactor mode)

A refactor changes the structure without changing the behavior, and you can only claim that if there are tests.

1. Find the tests that cover the code and run them. Note the starting result.
2. If there are no tests, write **characterization tests** that pin down the current behavior (representative inputs, edges and errors) before touching anything. If the `tdd-workflow` skill is installed, follow its Flow C.
3. If writing tests is not viable, warn about the risk and limit the refactor to safe mechanical transformations (rename, extract variable or function, guard clauses).

### 3. Find candidates

```bash
node <skill-dir>/scripts/detect-smells.mjs <files or folders>
```

`<skill-dir>` is the directory that holds this `SKILL.md`; run it from the project root. It flags long functions, deep nesting, too many parameters, long files, magic numbers, nested ternaries and TODO/FIXME (`--json` for structured output; thresholds configurable with `--max-lines`, `--max-depth`, `--max-params`, `--max-file-lines`). It only analyzes JS/TS; in other languages, review by hand with the same catalog.

The script gives **signals, not verdicts**. Then read the code and look for the smells no metric detects: misleading names, mixed abstractions, hidden effects, silenced errors. Use the [smell catalog](references/smells.md).

### 4. Prioritize

Order the findings by impact, not by count:

1. **Correctness risk**: swallowed errors, shared mutable state, hidden side effects, unchecked `null`.
2. **Comprehension**: misleading names, functions that do several things, complex conditionals, mixed abstraction levels.
3. **Duplication that may diverge**: the same business rule copied in several places.
4. **Cosmetic**: what the formatter or linter already handles. Do not report it as a finding if a tool covers it; suggest running it.

### 5. Refactor in small steps (refactor mode)

- Apply **one transformation at a time** from the [refactoring catalog](references/refactorings.md) and run the tests after each one (or after each small mechanical group).
- Do not mix refactoring with behavior changes. If you find a bug, **do not fix it silently**: report it and ask, or fix it in a separate, declared step with its own test.
- Keep the public API (exported names, signatures, routes) unless the user asks otherwise. If a change affects it, say so first.
- Stop when the code is clear. Do not extract abstractions "just in case".

### 6. Report

Use the format in the "Report" section. In review mode, each finding has its `file:line` location, the smell, why it matters in *this* code and the concrete suggested refactor (with a before/after snippet only when it helps).

## 📏 Clean Code Rules

**Names**
- They reveal intent and domain: `overdueInvoices`, not `list2` or `data`. Booleans as questions: `isExpired`, `hasAccess`, `canRetry`.
- Functions with a verb (`calculateTotal`, `sendInvoice`), classes and types with a noun. One concept, one word across the codebase (do not mix `fetch`, `get` and `retrieve` for the same thing).
- Name length grows with scope: `i` is fine in a three-line loop; an export needs a full name.

**Functions**
- They do one thing at one level of abstraction. If you can extract a piece with a name that is not a paraphrase of the code, the function did more than one thing.
- Few lines and little nesting: use **guard clauses** and early returns instead of nested `if`s.
- Few parameters (≤ 3). Beyond that, group them in a named object (`{ from, to, currency }`). Avoid boolean parameters that change behavior (`render(true)`): split into two functions or use a named option.
- Separate commands from queries: a function that returns a value should not also change state unexpectedly.
- No hidden side effects: if `getUser()` also writes to a cache or to analytics, the name lies.

**Errors**
- Do not swallow errors (`catch {}` or `catch (e) { console.log(e) }` and carry on). Handle them, add context and rethrow, or let them propagate.
- Fail early with domain-specific errors (`InvoiceAlreadyPaidError`) instead of `Error('error')` or magic return codes.
- Validate input at the edges (controllers, forms, adapters) and trust the types inside the core.
- Do not use `null`/`undefined` as an ambiguous error signal; use an exception, a `Result` type or an explicit optional value, per the project's convention.

**Comments**
- The code explains the *what*; the comment, the *why* (a decision, an external constraint, a workaround with a link to the issue).
- Delete commented-out code (git remembers it) and comments that repeat the code.
- A comment that explains a block usually asks for that block to be extracted into a function with that name.

**Data and expressions**
- Replace magic numbers and strings with named constants or enums (`FREE_SHIPPING_THRESHOLD`).
- Prefer immutability: `const`, copies (`map`, `filter`, spread) instead of mutating arguments.
- Only simple ternaries; if they nest, use `if`/`switch`, a lookup map or a function.
- Complex conditions → a named variable or function (`const isEligibleForRefund = ...`).
- Duplication: apply the **rule of three**. Two copies may be a coincidence; at the third, extract. Duplication is cheaper than the wrong abstraction.

**Frontend (components)**
- A component with too many responsibilities (fetch + state + formatting + layout) gets split: logic in hooks or pure functions, presentation in small components.
- Do not put in state what you can compute during render; avoid `useEffect` to sync derived state.
- Props with domain names and no deep "prop drilling" of many loose props.

**Backend (services and handlers)**
- Controllers/handlers translate HTTP ↔ domain: they validate, call a use case and map the response. Business logic does not live in them.
- Do not mix SQL queries, business rules and response formatting in the same function.
- Logs carry structured context (`{ orderId, userId }`), never sensitive data.

## ⚠️ Critical Rules

- **Reply in the user's language**, even though this skill is written in English.
- **Refactoring does not change behavior.** Without tests to back it, do not claim the behavior is preserved.
- **Run the tests before and after** refactoring, and report the real result. If they were failing before, say so.
- **Do not silently fix bugs** inside a refactor: report them separately.
- **Do not touch what was not requested.** Out of scope, at most a note under "Out of scope".
- **Do not over-abstract**: no new interfaces, factories or layers for a single use. Simplicity is also clean code.
- **Do not change the public API** (exports, signatures, HTTP contracts) without warning and getting confirmation.
- **The script's metrics are heuristics.** A 45-line function that is a clear configuration table is not a problem.

## 📤 Report

```markdown
### Summary
<1–2 sentences: overall state and the 2–3 highest-impact problems>

### Findings
| Priority | Location | Smell | Why it matters here | Refactor |
|---|---|---|---|---|
| High | src/orders/report.ts:42 | Swallowed error | A network failure returns an empty report as if it were valid | Rethrow with context or return a Result |
| Medium | src/orders/report.ts:12 | Long function (88 lines) | Mixes query, calculation and formatting | Extract `loadOrders`, `summarize`, `formatRow` |

### Changes applied (refactor mode)
1. <transformation> — tests: ✅ N/N

### Out of scope / pending
- <bugs found, module design problems, decisions for the user>
```

## 📚 References

- [Code smell catalog](references/smells.md)
- [Refactoring catalog](references/refactorings.md)
- [Frontend and backend before/after examples](examples/before-after.md)

## 🛠️ Scripts

- `scripts/detect-smells.mjs`: heuristic detector for JS/TS, read-only. Rules: `long-function`, `deep-nesting`, `too-many-params`, `long-file`, `magic-number`, `nested-ternary`, `todo-comment`. Options: `--json`, `--max-lines`, `--max-depth`, `--max-params`, `--max-file-lines`, `--fail-on-findings`, `--help`.
