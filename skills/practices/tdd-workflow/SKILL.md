---
name: tdd-workflow
version: 1.1.0
description: >-
  Test-driven development (TDD): Red → Green → Refactor cycle with a test list, triangulation and test doubles, for frontend and backend. Use it to build a feature or fix a bug "with TDD", "test first" or "writing the tests first", or to reproduce a bug with a failing test before fixing it.
tags: [tdd, testing, unit-tests, red-green-refactor, vitest, jest, best-practices]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - tdd
  - test driven development
  - desarrollo guiado por tests
  - test first
  - escribe los tests primero
  - write the tests first
  - red green refactor
  - reproducir bug con un test
  - reproduce bug with a test
  - test que falle primero
  - failing test first
  - implementa con tdd
requirements:
  tools: [view_file, replace_file_content, run_command]
---

# TDD Workflow (Red → Green → Refactor)

## 🎯 Purpose

Drives the implementation with tests written **before** the production code, in short, verifiable cycles. Each cycle leaves evidence: a test that failed for the right reason, the smallest change that made it pass, and a refactor with the suite green.

The goal is not "having tests". It is designing with fast feedback: a test that is hard to write is a design signal (too many dependencies, mixed responsibilities, hidden effects). Listen to it before forcing the test with mocks.

## ⚡ When to Trigger

- The user asks to build something "with TDD", "test first", "writing the tests first" or "red-green-refactor".
- A bug needs fixing: first reproduce it with a failing test.
- Code without tests needs changing: first pin it down with characterization tests (see Flow C).
- The user wants to practice a kata or learn TDD step by step.

Do not use it for "add tests to this code" with no intent to change it: that is writing tests, not TDD (you can use its test design rules, but without the cycle).

## 📋 Workflow

### Step 0 — Detect the test environment

```bash
node <skill-dir>/scripts/detect-test-runner.mjs
```

`<skill-dir>` is the directory that holds this `SKILL.md`. Run it from the project root (or the package root, in a monorepo). It returns the runner, the command to run a single file and the naming and placement convention of the existing tests (`--json` for structured output).

- **Follow the detected convention** (`.spec.ts` or `.test.ts` suffix, a `test/` folder or colocated next to the code). Do not invent a new one.
- If there is no runner, propose one (Vitest for modern TS/JS, Jest if the project already uses its ecosystem, `node:test` to avoid dependencies) and **ask for confirmation before installing anything**.
- Run the suite once before starting. If there are already red tests, report it: you cannot tell your failures from inherited ones.

### Step 1 — Write the test list

Before touching code, write the list of behaviors to cover, from simplest to most complex. Include it in your reply or as a temporary comment in the test file.

```text
[ ] empty cart → shipping 0
[ ] order < €50 → base rate 4.99
[ ] order ≥ €50 → free shipping
[ ] remote zone → €10 surcharge even with free shipping
[ ] negative weight → throws ValidationError
```

- One item = one behavior observable through the public API, not an internal method.
- Include edges (empty, zero, exact limit, null, errors), not only the happy path.
- The list is alive: when you find a new case, add it; do not solve it together with another one.

### Step 2 — 🔴 Red: a test that fails for the right reason

1. Pick the **simplest** item not done yet.
2. Write a single test with an Arrange / Act / Assert structure and a name that describes the behavior (`returns free shipping when the subtotal reaches 50`).
3. If the symbol does not exist, create the minimal stub (empty signature, `throw new Error('not implemented')`) so the test **compiles and fails on the assertion**, not on a broken import.
4. Run **only that file** with the detected file command.
5. Read the failure. It must say exactly what you expect ("expected 0, received undefined"). If it fails for another reason, fix the test before going on. If it passes with no changes, the test adds nothing or the behavior already existed: say so and move to the next one.

### Step 3 — 🟢 Green: the smallest change

Make the test pass with the smallest possible change, using one of these three strategies:

| Strategy | When to use it |
|---|---|
| **Fake it** (return a constant) | You can't see the generalization yet. The next test will force it. |
| **Triangulation** | With a second, different example, generalize only what both tests require. |
| **Obvious implementation** | The solution is evident and short. Write it, but if the test fails, go back to smaller steps. |

Run the test file: all green. Do not add logic no test requires ("while I'm here…"): add it to the list.

### Step 4 — 🔵 Refactor with the suite green

- Remove duplication (between code and test too: the magic constants from Green often hide it), improve names, extract functions.
- Refactor the tests too: builder helpers (`buildOrder({ subtotal: 49 })`), no conditional logic inside a test.
- After each refactor, run the tests. If something turns red, undo the last step instead of debugging.
- Never change behavior in this phase: if you need to, it is a new item on the list.

### Step 5 — Repeat and close

1. Cross off the item and go back to Step 2 until the list is empty.
2. Run the **full suite** (not just your file), plus typecheck/lint if the project has them.
3. Report using the format in the "Final report" section.

### Flow B — Fixing a bug

1. Write a test that reproduces the bug with the data from the report. Run it and **confirm that it fails**, showing the output.
2. If you cannot reproduce it, do not "fix" it blindly: report what you tried and ask for more data.
3. Apply the smallest fix, run the test (green) and then the full suite.
4. Look for sibling cases of the same bug (other formats, limits) and add them to the list.

### Flow C — Changing code without tests (legacy)

1. Write **characterization tests**: they pin down what the code does today, even if it looks wrong. Name the suspicious ones as such (`keeps the current behavior: rounds down`).
2. If the code is not testable (hard dependencies on the DB, clock, network), introduce a minimal seam (a parameter with a default value, constructor injection) without changing behavior.
3. With the safety net green, apply the normal cycle for the requested change.

## 🧪 Designing Good Tests

- **Test behavior, not implementation.** Use the public API; do not verify private methods or the order of internal calls. A refactor should not break tests.
- **One reason to fail per test.** Several assertions are fine if they describe the same behavior.
- **Deterministic.** Control time, randomness, time zone and network. Inject a clock (`now: () => Date`) instead of mocking the global `Date` when the design allows it.
- **Test doubles only at the edges** (I/O, network, DB, clock, external services). Prefer in-memory *fakes* to mocks with expectations. Don't mock what you don't own: wrap the library in an adapter and mock the adapter. Details in [Test doubles](references/test-doubles.md).
- **The right level:** domain logic → unit; contract with DB/HTTP → integration; critical user flow → e2e (few). Guide per stack: [Frontend](references/frontend-testing.md) and [Backend](references/backend-testing.md).
- **Explicit, minimal data** in the test: only what matters for the behavior, the rest through builders or defaults.

## ⚠️ Critical Rules

- **Reply in the user's language**, even though this skill is written in English. Name the tests in the language the project's existing tests use.
- **No production code without a red test that asks for it** while you work in TDD mode. If you write something without a test (configuration, wiring), say so explicitly.
- **Run the test and actually see it red.** A test you never saw fail proves nothing. Never claim "it fails" or "it passes" without having run the command.
- **Do not change a test to make it pass** unless the test was wrong; if you change it, explain why in the report.
- **Do not delete, skip (`.skip`, `xit`) or weaken assertions** to get the suite green.
- **Small steps.** If you have been red for more than a few minutes, the step was too big: undo and split it.
- **Do not install dependencies or change the test configuration without the user's confirmation.**
- **Report honestly**: if the suite had earlier failures or you could not run the tests, say so with the real output.

## 📤 Final Report

```markdown
### TDD cycles
| # | Test (behavior) | Red (failure reason) | Green (strategy) | Refactor |
|---|---|---|---|---|
| 1 | empty cart → shipping 0 | expected 0, received undefined | fake it | — |
| 2 | subtotal ≥ 50 → free | expected 0, received 4.99 | triangulation | extract FREE_SHIPPING_THRESHOLD |

### Result
- Full suite: `<command>` → N tests, all green.
- Pending / out of scope: …
```

## 📚 References

- [Test doubles: dummy, stub, spy, mock and fake](references/test-doubles.md)
- [Frontend testing (components, hooks, e2e)](references/frontend-testing.md)
- [Backend testing (services, HTTP, database)](references/backend-testing.md)
- [Full TDD session example](examples/tdd-session.md)

## 🛠️ Helper Scripts

- `scripts/detect-test-runner.mjs`: detects vitest, jest, mocha, `node:test`, playwright, cypress, pytest, `go test` and `cargo test`, the package manager and the test convention. Read-only. Options: `--cwd <dir>`, `--json`, `--help`.
