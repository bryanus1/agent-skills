# Lens Routing and Merging

## How to decide

`collect-scope.mjs` proposes lenses based on paths and extensions. It is a heuristic: **adjust it by reading the code**. A file in `utils/` can be backend; a `.ts` under `components/` can be pure logic with no UI.

| Lens | Applies when | Skipped when |
|---|---|---|
| `clean-code` | Source code changed | Only docs, config or assets |
| `frontend-best-practices` | Components, hooks, pages, styles, forms | There is no UI |
| `backend-best-practices` | Endpoints, services, queries, migrations, workers | There is no server or data |
| `solid-principles` | New or heavily modified classes or modules, dependencies created inside the logic, repeated `switch`es | Small changes to standalone functions |
| `design-patterns` | A pattern is introduced, a new variant in a `switch`, an external integration, or the user mentions it | There is no variation or integration |
| `tdd-workflow` | Behavior changes (whenever there is source code) | A pure refactor with tests that already cover it |

## What to look at in each lens during a review

Each lens uses its own checks; this is only the recommended order to save effort:

1. **Backend/frontend (security and data first)**: critical findings drive the verdict.
2. **tdd-workflow**: does the change have tests that would fail if the behavior broke? A test that cannot fail does not count.
3. **solid-principles / design-patterns**: only on new or modified code; they go through their proportionality filter.
4. **clean-code**: last and cheapest; it must not drown out the important findings.

## Finding ownership (deduplication)

When several lenses flag the same thing, assign a single owner:

| Finding | Owner | Also mention as context |
|---|---|---|
| Huge function mixing layers (HTTP + SQL + email) | `solid-principles` (SRP/DIP) | `clean-code` (long-function) |
| `switch` repeated by type | `design-patterns` | `solid-principles` (OCP) |
| A `new` dependency inside the logic that prevents testing | `solid-principles` (DIP) | `tdd-workflow` |
| Behavior change without a test | `tdd-workflow` | — |
| Injection, XSS, secrets, missing authorization | `backend`/`frontend` | — (always critical) |
| Names, magic numbers, stale comments | `clean-code` | — |
| `useEffect` copying derived state | `frontend` | `clean-code` |
| N+1, missing transaction, missing index | `backend` | — |

## Typical contradictions

- **`design-patterns` proposes abstracting / `clean-code` asks for simplicity.** Decide with the proportionality rule: does the second variant already exist? If not, simplicity wins; note the pattern as "deferred".
- **`solid-principles` wants an interface / the framework already injects.** The framework's convention wins.
- **`backend` asks for validation and layers / `clean-code` asks for less code.** Security and data integrity win; do not add layers that don't provide them.
- **`tdd-workflow` asks for tests / the change is a throwaway script.** State the risk, do not insist.

## If a skill is missing

If a sibling skill is not installed, do not make it up: review that aspect with brief, general judgment, mark it in the report as "without skill X" and recommend installing it (`npx skills add bryanus1/agent-skills --skill <name>`).
