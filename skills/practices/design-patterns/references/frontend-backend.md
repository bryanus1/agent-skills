# Frontend and Backend Patterns

## Contents

**Backend**
1. [Repository](#repository)
2. [Result / Either](#result--either)
3. [Middleware / Chain of Responsibility](#middleware--chain-of-responsibility)
4. [Unit of Work and transactions](#unit-of-work-and-transactions)
5. [Idempotency and Outbox](#idempotency-and-outbox)

**Frontend**
6. [Custom Hook](#custom-hook)
7. [Compound Components](#compound-components)
8. [Container / Presentational](#container--presentational)
9. [Render props and Slots](#render-props-and-slots)
10. [Data adapter and remote state](#data-adapter-and-remote-state)

---

## Repository

**Problem:** the business logic must not know about SQL, the ORM or the storage format.

**When yes:** non-trivial business rules tested without a DB; a likely storage change; several data sources. **When not:** simple CRUD where the repository only forwards each ORM method (an empty layer), or where the framework/ORM already exposes a good-enough repository.

```ts
// The domain defines what it needs, in business language
export interface OrderRepository {
  findById(id: OrderId): Promise<Order | null>;
  findOverdue(now: Date): Promise<Order[]>;     // queries with intent, not a generic `query(sql)`
  save(order: Order): Promise<void>;
}
```

Rules: methods with **business intent**; return domain entities, not ORM rows; an in-memory implementation (`InMemoryOrderRepository`) for tests; integration tests for the real repository against the DB. Do not expose the ORM (`QueryBuilder`) outside it.

## Result / Either

**Problem:** tell **expected** business failures (insufficient stock, expired coupon) apart from unexpected errors, without relying on exceptions for the normal flow.

**When yes:** the caller must handle each possible failure and the compiler should force it to; frequent failures on the normal path. **When not:** the project already uses domain exceptions consistently: **don't mix two conventions**; in that case, use typed exceptions.

```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type PlaceOrderError = { type: 'OUT_OF_STOCK'; sku: string } | { type: 'COUPON_EXPIRED'; code: string };

async function placeOrder(input: PlaceOrderInput): Promise<Result<Order, PlaceOrderError>> {
  if (!(await stock.has(input.sku))) return { ok: false, error: { type: 'OUT_OF_STOCK', sku: input.sku } };
  return { ok: true, value: await orders.create(input) };
}

const result = await placeOrder(input);
if (!result.ok) return res.status(409).json(result.error);   // the compiler forces the check
```

Don't install libraries (`neverthrow`, `fp-ts`) without confirming; a four-line type is enough. **Unexpected** errors (network down, a bug) are still exceptions.

## Middleware / Chain of Responsibility

**Problem:** a pipeline of independent steps for each request (auth, validation, logging, rate limiting, error handling) that can be composed.

Express/Fastify/Hono (`app.use`), NestJS (guards, pipes, interceptors, filters) and tRPC routers already solve it. **Use the framework's mechanism**; don't build your own chain except for pipelines outside HTTP (imports, message processing).

Rules: each step does one thing; order matters and must be documented (auth before validation; error handling last); don't put business logic in middleware.

## Unit of Work and transactions

**Problem:** several changes that must be committed or rolled back together.

Most ORMs already implement Unit of Work (Prisma `$transaction`, TypeORM `EntityManager`, Drizzle `transaction`). Define the **transaction boundary in the use case** and pass it to the repositories, without the domain knowing the ORM:

```ts
await this.tx.run(async (repos) => {   // `tx` is a port; its adapter uses the ORM's transaction
  await repos.orders.save(order);
  await repos.stock.decrement(order.items);
});
```

**When not:** operations with a single write. Don't open a long transaction around network calls.

## Idempotency and Outbox

**Problem:** retries or duplicates must not repeat effects (charging twice), and a DB change must publish an event reliably.

- **Idempotency key** stored with the result: if the same key arrives again, the previous result is returned.
- **Outbox:** write the event to a table in the same transaction as the change, and a separate process publishes it. It avoids "saved but not published".

Apply them only where the risk justifies it (payments, integrations, messaging); they add infrastructure.

---

## Custom Hook

**Problem:** reuse stateful logic (subscriptions, forms, remote data, debounce) across components.

```tsx
function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
```

Rules: a hook expresses **one** concern; it returns a small, stable shape; it cleans up its effects; if it uses no state or effects, it is a plain function. It is the functional equivalent of Strategy/Observer in React.

## Compound Components

**Problem:** a set of related pieces that share implicit state (Tabs, Accordion, Select, Menu) whose consumer wants to control the composition, instead of receiving a 20-prop API.

```tsx
const TabsContext = createContext<{ active: string; setActive(id: string): void } | null>(null);

function Tabs({ defaultTab, children }: { defaultTab: string; children: React.ReactNode }) {
  const [active, setActive] = useState(defaultTab);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}
Tabs.Tab = function Tab({ id, children }: { id: string; children: React.ReactNode }) {
  const ctx = useTabs();
  return <button aria-selected={ctx.active === id} onClick={() => ctx.setActive(id)}>{children}</button>;
};
Tabs.Panel = function Panel({ id, children }: { id: string; children: React.ReactNode }) {
  return useTabs().active === id ? <div role="tabpanel">{children}</div> : null;
};
```

**When not:** simple components with few props; compose with `children`. Mind accessibility (roles, keyboard), and consider headless libraries (Radix, React Aria) before implementing it by hand.

## Container / Presentational

**Problem:** data access and presentation mixed in one component, hard to test and reuse.

Today it is expressed as **hook + presentational component**: the hook fetches/transforms data; the component only receives props and renders (easy to test and to show in Storybook).

## Render props and Slots

**Problem:** a component must delegate part of the rendering to the consumer (lists, tables, virtualization) without knowing its content. Use `children` as a function or slot-style props (`header`, `footer`, `renderRow`) instead of branching on boolean flags. Today they are often replaced by composition with `children` or by hooks; use render props when the component needs to **pass data** to the content.

## Data adapter and remote state

**Problem:** components depend on the backend's format and duplicate fetching, caching and loading states.

- Convert the response into a UI model in **a single place** (`toUser(dto)`), at the exit of the data layer.
- Use the data library the project already has (TanStack Query, SWR, RTK Query) instead of reimplementing caching and invalidation with `useEffect`.
- Model async states as a discriminated union (`idle | loading | success | error`), not as loose booleans.
- Keep **server state** (remote data) separate from **UI state** (modals, filters): each has its own tool.
