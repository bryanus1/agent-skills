# Example: from a repeated `switch` to strategies (and when to stay with a table)

**Request:** "We have carriers, and every time we add one we have to touch half the code. Apply the Strategy pattern."

## Problem

```ts
// shipping.ts
export function shippingCost(o: Order) {
  switch (o.carrier) {
    case 'standard': return 4.99;
    case 'express': return 9.99 + o.weightKg * 2;
    case 'pickup': return 0;
  }
}
// eta.ts
export function etaDays(o: Order) {
  switch (o.carrier) { case 'standard': return 5; case 'express': return 1; case 'pickup': return 2; }
}
// labels.ts
export function carrierLabel(o: Order) {
  switch (o.carrier) { case 'standard': return 'Standard'; case 'express': return 'Express'; case 'pickup': return 'Pickup'; }
}
```

- **What hurts:** the same `switch` in three files; a new carrier means editing all three, and it is easy to forget one.
- **What varies:** cost, delivery time and label per carrier. **What is stable:** the `Order` model and who consumes this data.
- **Real variants:** 3 today, 2 more planned this quarter.
- **Project conventions:** functional TypeScript, no DI container.

## Decision

| Candidate | Simple alternative | Verdict | Reason |
|---|---|---|---|
| Strategy with classes (`ExpressShipping implements ShippingStrategy`) | Function table `Record<Carrier, CarrierRule>` | **Table** | The variants have no state or dependencies; the project is functional. Classes would add 4 files with no benefit. |
| Factory to choose the strategy | `CARRIERS[order.carrier]` | **Don't apply** | The table already is the selection. |

Moving to classes will be **reassessed** if a carrier needs to call an external API (its own state or dependencies): then each rule becomes a class that receives its client through the constructor, and the table is composed in `main.ts`.

## Result

```ts
// carriers.ts: the only place that knows about carriers
export interface CarrierRule {
  label: string;
  cost(order: Order): number;
  etaDays: number;
}

export const CARRIERS: Record<Carrier, CarrierRule> = {
  standard: { label: 'Standard', cost: () => 4.99, etaDays: 5 },
  express: { label: 'Express', cost: (o) => 9.99 + o.weightKg * 2, etaDays: 1 },
  pickup: { label: 'Pickup', cost: () => 0, etaDays: 2 },
};

export const shippingCost = (o: Order) => CARRIERS[o.carrier].cost(o);
export const etaDays = (o: Order) => CARRIERS[o.carrier].etaDays;
export const carrierLabel = (o: Order) => CARRIERS[o.carrier].label;
```

Adding `drone` is one entry in `CARRIERS`; the `Record<Carrier, …>` type makes the compiler warn if one is missing. The existing `shippingCost` tests keep passing unchanged (same behavior, same API).

## Report (summary)

- **Changes applied:** a `CARRIERS` table; the three `switch`es delegate to it. Tests: ✅ 12/12.
- **Not applied:** Strategy classes and Factory (justified above).
- **Deferred:** reassess classes when a carrier needs an external API.
- **Out of scope:** rounding of `weightKg * 2` with decimals and the missing validation for negative weight.
