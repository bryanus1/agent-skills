# Example: a full TDD session

**Request:** "With TDD, implement `calculateShipping(order)`: free shipping from €50, otherwise €4.99; remote zones always pay €10 extra; an empty cart pays no shipping."

Vitest project; `detect-test-runner.mjs` reports `pnpm exec vitest run <file>` and the `*.test.ts` convention, colocated with the code.

## Test list

```text
[ ] empty cart → 0
[ ] subtotal 20 → 4.99
[ ] subtotal 50 (exact limit) → 0
[ ] remote zone with subtotal 20 → 14.99
[ ] remote zone with subtotal 80 → 10
```

## Cycle 1 — empty cart

🔴 Test:

```ts
import { describe, it, expect } from 'vitest';
import { calculateShipping } from './shipping';

describe('calculateShipping', () => {
  it('charges no shipping for an empty cart', () => {
    expect(calculateShipping({ items: [], zone: 'mainland' })).toBe(0);
  });
});
```

Stub in `shipping.ts`: `export function calculateShipping(order: Order): number { throw new Error('not implemented'); }`

`pnpm exec vitest run src/shipping.test.ts` → **fails**: `Error: not implemented`. That is the expected reason.

🟢 Fake it: `return 0;` → green.

🔵 Nothing to refactor.

## Cycle 2 — base rate

🔴 `it('charges 4.99 when the subtotal is below 50', ...)` with a €20 item → fails: `expected 0 to be 4.99`.

🟢 Triangulation: there are now two examples, so generalize what both require:

```ts
const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
if (subtotal === 0) return 0;
return 4.99;
```

🔵 Extract `BASE_RATE = 4.99` and the `subtotalOf(order)` function. Tests green. In the tests, extract `buildOrder({ subtotal, zone })`.

## Cycle 3 — exact free-shipping limit

🔴 `buildOrder({ subtotal: 50 })` → `expected 4.99 to be 0`.

🟢 `if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;` → green. (Writing the test reveals a new case: 49.999 due to rounding? It goes on the list instead of being solved now.)

## Cycles 4 and 5 — remote zone

🔴 Remote with 20 → `expected 4.99 to be 14.99`. 🟢 `+ (order.zone === 'remote' ? REMOTE_SURCHARGE : 0)`.

🔴 Remote with 80 → `expected 0 to be 10` (the early `return 0` skipped the surcharge). 🟢 Restructure: compute the base rate, then add the surcharge.

🔵 Readable final result:

```ts
export function calculateShipping(order: Order): number {
  const subtotal = subtotalOf(order);
  if (subtotal === 0) return 0;
  const base = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : BASE_RATE;
  return base + surchargeFor(order.zone);
}
```

## Report

| # | Test | Red | Green | Refactor |
|---|---|---|---|---|
| 1 | empty cart → 0 | not implemented | fake it | — |
| 2 | subtotal 20 → 4.99 | expected 0 to be 4.99 | triangulation | `BASE_RATE`, `subtotalOf`, `buildOrder` |
| 3 | subtotal 50 → 0 | expected 4.99 to be 0 | obvious | `FREE_SHIPPING_THRESHOLD` |
| 4 | remote 20 → 14.99 | expected 4.99 to be 14.99 | obvious | — |
| 5 | remote 80 → 10 | expected 0 to be 10 | restructure | `surchargeFor(zone)` |

Full suite: `pnpm exec vitest run` → 5 tests green. Pending: rounding of decimal subtotals (added to the list, not requested).
