# Behavioral Patterns

## Contents

1. [Strategy](#strategy)
2. [Observer / events](#observer--events)
3. [State](#state)
4. [Command](#command)
5. [Template Method](#template-method)

## Strategy

**Problem:** several interchangeable ways to do the same thing (compute a rate, validate, export, sort), chosen at runtime, and a `switch` that repeats or grows.

**Ladder of solutions, from lightest to heaviest. Use the first one that is enough:**

1. **Data table** if the variants only differ in values (`{ standard: 4.99, express: 9.99 }`).
2. **Function table** if they differ in stateless behavior.
3. **Classes with an interface** if each variant needs its own state or dependencies.

```ts
// 2. Function table
type PricingRule = (order: Order) => number;

const PRICING: Record<Tier, PricingRule> = {
  basic: (o) => o.subtotal,
  pro: (o) => o.subtotal * 0.9,
  enterprise: (o) => Math.max(o.subtotal * 0.8, MIN_ENTERPRISE_FEE),
};

const priceFor = (order: Order) => PRICING[order.tier](order);
```

```ts
// 3. Classes, when there is state or dependencies
interface PaymentMethod { pay(amountCents: number): Promise<PaymentResult>; }
class CardPayment implements PaymentMethod { constructor(private gateway: CardGateway) {} /* ... */ }
class BankTransferPayment implements PaymentMethod { constructor(private bank: BankApi) {} /* ... */ }
```

**When not:** a small, stable `switch` in a single place; a single variant.

## Observer / events

**Problem:** several modules need to react to a fact (`OrderPlaced`) without the originator knowing them.

**When yes:** independent side effects (email, analytics, inventory) that must not block or couple to the main flow; UI that subscribes to a state.

**When not:** there is a single listener (a callback or a direct call is clearer), or order and transactionality matter (events make the flow implicit and hard to follow).

```ts
type Handler<E> = (event: E) => void | Promise<void>;

class EventBus<Events extends Record<string, unknown>> {
  private handlers: { [K in keyof Events]?: Handler<Events[K]>[] } = {};
  on<K extends keyof Events>(name: K, handler: Handler<Events[K]>) { (this.handlers[name] ??= []).push(handler); }
  async emit<K extends keyof Events>(name: K, event: Events[K]) { for (const h of this.handlers[name] ?? []) await h(event); }
}
```

Watch out for: define how a handler's errors are treated (do they break the flow?), avoid event loops, **return a function to unsubscribe** (memory leaks in the UI) and don't use events for flows that are an explicit business sequence. In NestJS: `@nestjs/event-emitter`; in the browser: `EventTarget`/`useSyncExternalStore`.

## State

**Problem:** an object's behavior changes with its state, and the valid transitions are a business requirement (order: `draft → paid → shipped → delivered`).

**Simple alternative:** an `enum`/union of literals plus a table of allowed transitions.

```ts
type OrderStatus = 'draft' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

function transition(order: Order, to: OrderStatus): Order {
  if (!TRANSITIONS[order.status].includes(to)) throw new InvalidTransitionError(order.status, to);
  return { ...order, status: to };
}
```

**When to scale up to State classes or a state machine (`xstate`):** each state has substantial logic of its own, there are nested/parallel states, or effects tied to transitions. In the UI, multi-step forms or async flows (`idle | loading | success | error`) are better modeled with **discriminated unions** than with loose booleans (`isLoading`, `isError`):

```ts
type State<T> = { status: 'idle' } | { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: Error };
```

## Command

**Problem:** turn an action into an object so you can queue, log, retry, undo or run it later.

**When yes:** undo/redo in an editor, job queues, action auditing, macros, retries.

**When not:** a direct call is enough. Don't use it to "decouple" a function from its only caller.

```ts
interface Command { execute(): Promise<void>; undo?(): Promise<void>; }

class RenameFile implements Command {
  constructor(private fs: FileSystem, private from: string, private to: string) {}
  execute() { return this.fs.rename(this.from, this.to); }
  undo() { return this.fs.rename(this.to, this.from); }
}
```

In a backend, BullMQ/SQS *jobs* are serialized commands: `{ type: 'SendInvoice', invoiceId }` plus a handler.

## Template Method

**Problem:** a process with fixed steps and some variable steps.

**In TS/JS, prefer passing the variable steps as parameters (composition) instead of inheriting:**

```ts
async function importFile<T>(file: File, steps: { parse(raw: string): T[]; validate(row: T): void; persist(rows: T[]): Promise<void> }) {
  const rows = steps.parse(await file.text());
  rows.forEach(steps.validate);
  await steps.persist(rows);
}
```

**The classic inheritance version** (an abstract base class with `abstract parse()`) is valid if the project already uses hierarchies and the steps share state, but it has the cost of coupling subclasses to the base (risk of violating LSP). If you see a one-level hierarchy with two subclasses, a function that receives the steps is probably simpler.
