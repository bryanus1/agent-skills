# OCP: Open/Closed

> A unit should be **open for extension and closed for modification**: adding new behavior should not force you to edit code that is already tested and stable.

OCP does **not** mean "never touch a file". It applies at the **real variation points**: where new variants have already appeared (or will soon). Opening everything to extension just in case is over-engineering.

## How to detect it

- The same `switch (type)` or `if/else if` chain appears in several files.
- Adding a payment method, export format or notification type forces you to edit the core logic.
- A central function knows the details of every variant.

## Backend

### Before

```ts
function shippingCost(order: Order): number {
  switch (order.carrier) {
    case 'standard': return 4.99;
    case 'express':  return order.weight * 2 + 9.99;
    case 'pickup':   return 0;
  }
}
```

With 3 stable cases in **a single place**, this is fine (see "When not to apply it"). It becomes a problem when the `switch` repeats (cost, labels, delivery times) and every new carrier requires editing all of them.

### After: Strategy / strategy table

```ts
interface ShippingRule {
  cost(order: Order): number;
  eta(order: Order): number;
}

const SHIPPING_RULES: Record<Carrier, ShippingRule> = {
  standard: { cost: () => 4.99, eta: () => 5 },
  express:  { cost: (o) => o.weight * 2 + 9.99, eta: () => 1 },
  pickup:   { cost: () => 0, eta: () => 2 },
};

const shippingCost = (order: Order) => SHIPPING_RULES[order.carrier].cost(order);
```

Adding `drone` means **adding an entry**; `Record<Carrier, …>` makes the compiler warn about any that are missing. If the variants need their own state or dependencies, turn them into classes that implement the interface and register them at the composition point.

## Frontend

### Before

```tsx
function Field({ field }: { field: FieldConfig }) {
  if (field.type === 'text') return <input type="text" ... />;
  if (field.type === 'select') return <select ...>...</select>;
  if (field.type === 'date') return <DatePicker ... />;
  return null;
}
```

### After: component registry

```tsx
const FIELD_RENDERERS: Record<FieldType, React.ComponentType<FieldProps>> = {
  text: TextField,
  select: SelectField,
  date: DateField,
};

function Field({ field }: { field: FieldConfig }) {
  const Renderer = FIELD_RENDERERS[field.type];
  return <Renderer {...field} />;
}
```

Accepting `children`/`render props` so the consumer can extend without editing the component also counts as OCP.

## How to refactor

1. Confirm there is real variation: how many cases are there, and how many places know about them?
2. Define the minimal interface with what the client needs (see [ISP](isp.md)).
3. Move each branch into its implementation (or table entry) **without changing behavior**; tests between steps.
4. If the variants are data (rates, copy), prefer a **data table** to classes.

## When not to apply it

- A small, stable `switch` in a single place: it is more readable than N classes.
- Variants that always change together with the client code: the abstraction isolates nothing.
- Before the second variant: wait until you know it; the right shape of the abstraction shows with two cases, not one.
