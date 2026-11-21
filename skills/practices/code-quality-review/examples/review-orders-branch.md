# Example: reviewing a branch that adds discounts to orders

**Request:** "Review my branch before I open the PR."

## 1. Scope

```
Scope: branch vs main · 4 file(s) · +96 −12

frontend (1)
    src/components/OrderSummary.tsx  +30 −4
backend (2)
    src/api/orders.ts  +52 −6
    src/services/pricing.ts  +14 −2
tests (1)
    test/pricing.test.ts  +0 −0   (unchanged)

Recommended lenses: clean-code, frontend-best-practices, backend-best-practices, solid-principles, tdd-workflow
Warnings: ! Changes source code without touching any test.
```

Decision: `clean-code`, `frontend`, `backend` and `tdd-workflow` are applied. `solid-principles` is skipped: the change adds a function to an existing service, with no new classes or dependencies. `design-patterns` is skipped: a single discount rule, no second variant.

## 2. Evidence

- Tests: ✅ 9/9 (`npm test`). Typecheck: ✅. Lint: ✅.
- `detect-smells`: `orders.ts:34 long-function (58 lines)`, `pricing.ts:20 magic-number (0.15)`.

## 3. Report

### Verdict
**Changes required**: a new SQL injection and discount logic without tests.

### Findings
| # | Sev. | Lens | Location | Problem and effect | Fix |
|---|---|---|---|---|---|
| 1 | Critical | backend | src/api/orders.ts:41 | `WHERE coupon = '${req.query.coupon}'`: SQL injection | Parameterized query |
| 2 | Important | tdd | src/services/pricing.ts:20-33 | The coupon discount rule has no tests; the 9 existing ones pass because they don't exercise it | Tests for valid, expired and stacked coupons |
| 3 | Important | frontend | OrderSummary.tsx:22 | `useEffect` copies `total - discount` into state: two renders and a value one frame behind | Compute it during render |
| 4 | Minor | clean-code | pricing.ts:20 | Unnamed `0.15` | `const LOYALTY_DISCOUNT = 0.15` |

The `long-function` smell at `orders.ts:34` is grouped with finding 1 (same function): fix the injection first, then consider extracting; it is not reported as a separate finding because 58 lines with one clear responsibility don't hurt today.

### Done well
The discount calculation is a pure function, easy to test.

### Out of scope / not verified
- Accessibility of the new coupon dropdown: needs a browser.
- `orders.ts` already had other interpolated queries on lines 12 and 18 (pre-existing: opening a separate issue is recommended).

### Suggested fix plan
1. Finding 1 → `backend-best-practices` (with a test that reproduces the injection).
2. Finding 2 → `tdd-workflow`.
3. Findings 3 and 4 → `frontend-best-practices` and `clean-code`.

Shall I apply any of them?
