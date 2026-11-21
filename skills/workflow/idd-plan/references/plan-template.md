# Plan Template (IDD Plan)

Canonical structure produced by `idd-plan`. It is added as a `## 🛠️ Implementation Plan` section below the `idd-explore` spec, in the same tracker item or the same local `.md`.

Keep the headings and the `> Status: …` line exactly as written: `idd-apply` looks for them. Items created by earlier versions use the Spanish markers (`## 🛠️ Plan de Implementación`, `Estado: planificado`…); the full list is in `<skill-dir>/../idd-explore/references/adapters.md` under "IDD Markers". Write the content in the user's language.

---

## Where it is saved

| Situation | Destination |
|---|---|
| The input is a Notion, Linear, GitHub Issues or GitHub Projects item | The item's description or the page body |
| The input is text or a `.md` and a tracker is connected | Offer to create the item in the tracker |
| No tracker | `docs/specs/<YYYY-MM-DD>-<slug>.md` |

Commands for each provider: `<skill-dir>/../idd-explore/references/adapters.md`.

---

## Writing rules

- **Requirements** in normative language: "The system MUST…", "MUST NOT…". Numbered `R1`, `R2`…
- **Delta, not a full specification**: group into `ADDED` (new), `MODIFIED` (changes existing behavior; state the before) and `REMOVED` (state the reason and the migration). Omit empty groups.
- **Scenarios** in *Given / When / Then*, observable from outside (response, UI, file, record), not internal details.
- **Tasks** of 15 min to 2 h each, in execution order, starting with a verb and naming their requirement (`→ R1`). Group by area (`1.` data, `2.` logic, `3.` UI, `4.` tests…).
- **Verification** that can be run: the project's real commands and which scenario each one covers.
- **Paths** only if you checked that they exist; new ones carry `(new)`.

---

## 📄 Template

```markdown
## 🛠️ Implementation Plan

> Status: planned · Source: <link or path> · Date: <YYYY-MM-DD>

### Context
<!-- Problem, reason and expected result, in 2–5 lines. -->

### Requirements

#### ADDED
- **R1.** The system MUST …
  - **Scenario:** <name>
    - **Given** …
    - **When** …
    - **Then** …

#### MODIFIED
- **R2.** <behavior> MUST … (before: …)
  - **Scenario:** …

#### REMOVED
- **R3.** Removes … — Reason: … — Migration: …

### Design and decisions
- **Approach:** …
- **Reuses:** `path/to/util.ts` (`existingFunction`)
- **Discarded:** <alternative> — <one-line reason>

### Affected files
- `src/...` — <what changes>
- `src/...` (new) — <what for>

### Tasks
1. **<Area>**
   - [ ] 1.1 <Verb> … → R1
   - [ ] 1.2 … → R1
2. **Tests**
   - [ ] 2.1 … → R1, R2

### Verification
- [ ] `<test command>` — covers R1 (scenario …)
- [ ] `<lint/build command>`
- [ ] Manual check: … — covers R2

### Out of scope
- …

### Assumptions
- …

### Open questions
- … (empty if there are none)

### Metadata
- **Estimate:** … · **Phase:** … · **Window:** …
```

---

## ⚡ Short plan

For small changes (one module, up to 3 tasks, no data, public API or dependency changes). Same writing rules, fewer sections:

```markdown
## 🛠️ Implementation Plan

> Status: planned · Source: <link or path> · Date: <YYYY-MM-DD> · Short plan

### Context
<!-- 1–2 lines. -->

### Requirements
- **R1.** The system MUST …
  - **Scenario:** **Given** … **When** … **Then** …

### Tasks
- [ ] 1 <Verb> … in `src/...` → R1
- [ ] 2 Test for … → R1

### Verification
- [ ] `<test command>` — covers R1
```

If design decisions, more than 3 tasks or open questions come up while writing it, switch to the full plan.

## ✂️ When to split

If the plan goes beyond about 12 tasks or holds deliverables that can ship separately, propose one item per deliverable. Each item gets its own plan and a `Related: <link>` line in Metadata. The original item stays as an index listing the new ones.

---

## 📌 Example

```markdown
## 🛠️ Implementation Plan

> Status: planned · Source: ENG-104 · Date: 2026-11-12

### Context
Billing users need to download the filtered invoice list as CSV to reconcile it in their spreadsheet. Today they can only see it on screen.

### Requirements

#### ADDED
- **R1.** The `GET /invoices/export` endpoint MUST return a CSV with the same filters as `GET /invoices`.
  - **Scenario:** filtered export
    - **Given** 3 invoices, 2 with status `paid`
    - **When** `/invoices/export?status=paid` is called
    - **Then** the response is `text/csv` with a header and 2 rows
- **R2.** The endpoint MUST NOT export more than 10,000 rows.
  - **Scenario:** limit exceeded
    - **Given** a filter with 12,000 results
    - **When** it is exported
    - **Then** it responds 422 with the message `EXPORT_TOO_LARGE`

### Design and decisions
- **Approach:** reuse `InvoiceQueryService.find` and serialize with the existing `toCsv` helper.
- **Reuses:** `src/shared/csv.ts` (`toCsv`)
- **Discarded:** generating the CSV on the client — the list is paginated and does not have every row.

### Affected files
- `src/invoices/invoices.controller.ts` — new `export` route
- `src/invoices/invoices.controller.spec.ts` — tests for R1 and R2

### Tasks
1. **Backend**
   - [ ] 1.1 Add the `GET /invoices/export` route that reuses the filters → R1
   - [ ] 1.2 Validate the 10,000-row limit and return 422 → R2
2. **Tests**
   - [ ] 2.1 Test the filtered export → R1
   - [ ] 2.2 Test the limit → R2

### Verification
- [ ] `pnpm test invoices` — covers R1 and R2
- [ ] `pnpm lint`

### Out of scope
- Export to Excel or PDF.

### Assumptions
- The separator is a comma and the encoding is UTF-8.

### Open questions
- (none)

### Metadata
- **Estimate:** 4 h · **Phase:** F2 · Reports
```
