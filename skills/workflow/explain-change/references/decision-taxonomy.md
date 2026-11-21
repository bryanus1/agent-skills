# Decision Taxonomy and Report (`explain-change`)

Use this guide to classify what the AI decided outside the proposal and to present the report prioritized by the need for human validation. Render the headings and labels in the user's language.

---

## 🔍 6 Categories of Implicit Decisions

| Category | What to look for in the diff | Typical example |
| :--- | :--- | :--- |
| **1. Extra scope** | Touched files that match no task or requirement; style refactors in unrelated modules; endpoints/buttons nobody asked for. | Rewrote `src/utils/date.ts` and renamed existing functions "to clean up". |
| **2. Contracts and data** | New API/DB fields, added migrations, changed HTTP codes, payloads, exported types or response formats. | Returned `200` with `{ error }` instead of `422`, or added a `metadata jsonb` column. |
| **3. Behavior and defaults** | Numeric limits, timeouts, retries, pagination, cache policies, silent error handling (empty `catch` / fallback) or user-facing messages that were not defined. | Set a 500-row limit, a 5 s timeout, or returned `[]` when the query fails. |
| **4. Architecture and dependencies** | Libraries installed in `package.json`/lockfiles, new patterns or abstractions, a different approach than the one agreed in `design.md`. | Installed `json2csv` instead of using the existing serializer, or created an extra adapter. |
| **5. Security, permissions and config** | RLS rules, middlewares/guards, relaxed validations (`optional()`, `z.any()`), CORS, new environment variables or flags. | Added `PROCESS_TIMEOUT_MS` to the config and made the `email` field optional. |
| **6. Shortcuts, trade-offs and debt** | `TODO`/`FIXME`, casts (`as any`, `@ts-ignore`), skipped tests (`it.skip`), excessive mocks, tasks ticked `[x]` in `tasks.md` that are not complete. | Ticked the test task as done but only tested the happy path with a full mock. |

---

## 🚦 Priority Criteria

- 🔴 **Needs your validation:** changes to public contracts, DB/migrations, security/permissions, new dependencies, large extra scope, or decisions that contradict `proposal.md` / `design.md`.
- 🟡 **Worth reviewing:** functional assumptions (limits, messages, ordering, fallbacks), new environment variables, collateral refactors, or shortcuts/technical debt (`TODO`, incomplete tests).
- 🟢 **Minor implementation detail:** internal decisions consistent with the proposal (local variable names, internal split of private helpers, import order). Group them in 1–3 short bullets at the end so they do not bury what matters.

---

## 📄 Canonical Report Template

```markdown
### Verdict: <Faithful to the proposal | Minor decisions | Decisions that need validation | Misaligned with the proposal>
**Proposal compared:** <OpenSpec path / IDD item / plan>
**Change inspected:** <modified/new files in the working tree, or branch against base>

### 🔴 Decisions that need your validation
1. **[<Category>] <Short title of the decision>** (`file:line`)
   - **What the AI decided:** <concrete description of what was implemented>
   - **Against the proposal:** <"Not in proposal.md" | "Contradicts design.md § X">
   - **Likely reason and impact:** <technical reason and effect on the product/system>
   - **Alternative if you don't like it:** <direct option>

### 🟡 Decisions worth reviewing
- **[<Category>] <Summary>** (`file:line`) — <against the proposal + short impact>

### 🟢 Minor implementation details
- <Grouped summary of reasonable internal decisions that change neither behavior nor contract>

### 📋 Proposal items omitted, partial or deviated
- **Omitted / partial:** <requirements or tasks ticked `[x]` with real gaps, or "None">
- **Deviations already recorded:** <those documented in the plan's deviations section / IDD comments, or "None">

### Next step
Which decisions do you **accept** as they are (I can document them in `<design.md / plan>` if you confirm) and which do you want us to **adjust or revert**?
```

---

## 📌 Full Example

```markdown
### Verdict: Decisions that need validation
**Proposal compared:** `openspec/changes/export-invoices-csv/` (`proposal.md`, `design.md`, `specs/export/spec.md`, `tasks.md`)
**Change inspected:** 5 modified files, 1 new (uncommitted after `/opsx:apply`)

### 🔴 Decisions that need your validation
1. **[Architecture and dependencies] Installed the `papaparse` library, which `design.md` did not plan for** (`package.json:18`, `src/invoices/export.ts:3`)
   - **What the AI decided:** Added `papaparse` and `@types/papaparse` to the project instead of using `toCsv` from `src/shared/csv.ts`, as `design.md` says.
   - **Against the proposal:** Contradicts `design.md` ("Reuse the internal `toCsv` helper without adding dependencies").
   - **Likely reason and impact:** It avoided fixing quote escaping in `toCsv`, but it introduces a new external dependency and changes the lockfile.
   - **Alternative if you don't like it:** Uninstall `papaparse`, fix the escaping in `src/shared/csv.ts` and reuse it.

2. **[Behavior and defaults] Capped the export at 500 rows and returns an empty `200` on read errors** (`src/invoices/export.ts:29-41`)
   - **What the AI decided:** Set `MAX_EXPORT_ROWS = 500` and wrapped the query in a `try/catch` that returns an empty CSV with only the header.
   - **Against the proposal:** `specs/export/spec.md` defined neither a row limit nor that silent fallback.
   - **Likely reason and impact:** It avoided timeouts on large queries, but a user with >500 invoices gets an incomplete file with no truncation warning or error.
   - **Alternative if you don't like it:** Raise the limit or make it configurable, and return `422` or a warning header when it is exceeded.

### 🟡 Decisions worth reviewing
- **[Extra scope] Refactored the date formatting functions in `src/shared/dates.ts:12-34`** — Not asked for in `tasks.md`; it keeps the public signature, but it touches a module other reports use.
- **[Shortcuts and debt] Added `// TODO: validate admin role permission` in `src/invoices/export.ts:15`** — Ticked task 2.1 as `[x]` in `tasks.md`, but left restricting access by role pending.

### 🟢 Minor implementation details
- Created the private helper `sanitizeCsvCell` in `src/invoices/export.ts:52` to prevent formula injection in Excel (`=`, `+`, `-`, `@`).

### 📋 Proposal items omitted, partial or deviated
- **Omitted / partial:** The "Export with no results returns `204` or a notice" scenario in `specs/export/spec.md` ended up returning a header-only CSV with `200 OK`.
- **Deviations already recorded:** None.

### Next step
Which decisions do you **accept** as they are (I can document them in `openspec/changes/export-invoices-csv/design.md` if you confirm) and which do you want us to **adjust or revert**?
```
