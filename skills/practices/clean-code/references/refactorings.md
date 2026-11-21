# Refactoring Catalog

Small transformations that preserve behavior. Apply one at a time and run the tests between steps. The examples are in TypeScript.

## Contents

1. [Extract function](#extract-function)
2. [Guard clauses](#guard-clauses)
3. [Parameter object](#parameter-object)
4. [Split a flag argument](#split-a-flag-argument)
5. [Named constant](#named-constant)
6. [Explaining variable](#explaining-variable)
7. [Lookup table instead of conditionals](#lookup-table-instead-of-conditionals)
8. [Separate query and command](#separate-query-and-command)
9. [Split loop / pipeline](#split-loop--pipeline)
10. [Domain error instead of a generic error](#domain-error-instead-of-a-generic-error)
11. [Extract hook (frontend)](#extract-hook-frontend)
12. [Rename](#rename)

## Extract function

**When:** a function has sections, comments that explain blocks or mixes abstraction levels.

```ts
// Before
function printInvoice(invoice: Invoice) {
  // compute total
  let total = 0;
  for (const line of invoice.lines) total += line.price * line.qty;
  // print
  console.log(`Invoice ${invoice.id}: ${total.toFixed(2)} €`);
}

// After
function printInvoice(invoice: Invoice) {
  console.log(`Invoice ${invoice.id}: ${formatEuros(totalOf(invoice))}`);
}
const totalOf = (invoice: Invoice) => invoice.lines.reduce((sum, l) => sum + l.price * l.qty, 0);
const formatEuros = (amount: number) => `${amount.toFixed(2)} €`;
```

The extracted name must say *what* it does, not *how*. If the only name you can think of is something like `doStuffPart2`, the cut is wrong.

## Guard clauses

**When:** deep nesting caused by validations or special cases.

```ts
// Before
function payout(user: User) {
  if (user) {
    if (user.isActive) {
      if (user.balance > 0) {
        return transfer(user);
      }
    }
  }
  return null;
}

// After
function payout(user: User | null) {
  if (!user || !user.isActive) return null;
  if (user.balance <= 0) return null;
  return transfer(user);
}
```

## Parameter object

**When:** more than 3 parameters, or parameters that always travel together.

```ts
// Before
searchFlights('MAD', 'BCN', '2026-03-01', '2026-03-05', 2, true);

// After
searchFlights({ from: 'MAD', to: 'BCN', departure: '2026-03-01', return: '2026-03-05', passengers: 2, flexibleDates: true });
```

Changing the signature of an exported function breaks its callers: update all of them, or temporarily keep the old signature delegating to the new one.

## Split a flag argument

```ts
// Before
function getPrice(product: Product, isMember: boolean) { ... }

// After
function getRegularPrice(product: Product) { ... }
function getMemberPrice(product: Product) { ... }
```

If the flag is a mode with more than two values, use a union of literals (`mode: 'regular' | 'member' | 'wholesale'`).

## Named constant

```ts
// Before
if (subtotal >= 50) shipping = 0;

// After
const FREE_SHIPPING_THRESHOLD_EUR = 50;
if (subtotal >= FREE_SHIPPING_THRESHOLD_EUR) shipping = 0;
```

Include the unit in the name when it is not obvious (`_MS`, `_EUR`, `_KG`).

## Explaining variable

```ts
// Before
if (order.status === 'paid' && Date.now() - order.paidAt < 14 * 24 * 3600 * 1000 && !order.refunded) { ... }

// After
const REFUND_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const isWithinRefundWindow = Date.now() - order.paidAt < REFUND_WINDOW_MS;
const isRefundable = order.status === 'paid' && isWithinRefundWindow && !order.refunded;
if (isRefundable) { ... }
```

## Lookup table instead of conditionals

**When:** `if`/`switch` chains that only map one value to another.

```ts
// Before
function statusLabel(status: Status) {
  return status === 'pending' ? 'Pending' : status === 'paid' ? 'Paid' : status === 'refunded' ? 'Refunded' : 'Unknown';
}

// After
const STATUS_LABELS: Record<Status, string> = { pending: 'Pending', paid: 'Paid', refunded: 'Refunded' };
const statusLabel = (status: Status) => STATUS_LABELS[status];
```

With `Record<Status, string>` the compiler warns you if a status is missing. When each case has different *behavior* (not just a value), consider Strategy or polymorphism.

## Separate query and command

```ts
// Before: a "get" that also writes
function getCart(userId: string) {
  const cart = carts.get(userId) ?? createCart(userId);
  analytics.track('cart_viewed', { userId });
  return cart;
}

// After
function getOrCreateCart(userId: string) { return carts.get(userId) ?? createCart(userId); }
// tracking happens explicitly where the cart is shown
```

## Split loop / pipeline

```ts
// Before
let total = 0;
const names: string[] = [];
for (const u of users) {
  if (u.active) {
    total += u.spent;
    names.push(u.name.toUpperCase());
  }
}

// After
const activeUsers = users.filter((u) => u.active);
const total = activeUsers.reduce((sum, u) => sum + u.spent, 0);
const names = activeUsers.map((u) => u.name.toUpperCase());
```

On hot paths with large collections, measure before replacing a single loop with several passes.

## Domain error instead of a generic error

```ts
// Before
if (invoice.paid) throw new Error('error');

// After
export class InvoiceAlreadyPaidError extends Error {
  constructor(readonly invoiceId: string) {
    super(`Invoice ${invoiceId} is already paid`);
    this.name = 'InvoiceAlreadyPaidError';
  }
}
if (invoice.paid) throw new InvoiceAlreadyPaidError(invoice.id);
```

The HTTP layer translates the domain error to the right status code (409) in a single place.

## Extract hook (frontend)

```tsx
// Before: the component handles fetch, states and render
function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => { fetchOrders().then(setOrders).catch(setError); }, []);
  if (error) return <ErrorState error={error} />;
  return <OrderList orders={orders} />;
}

// After
function useOrders() {
  const [state, setState] = useState<{ orders: Order[]; error: Error | null }>({ orders: [], error: null });
  useEffect(() => {
    let cancelled = false;
    fetchOrders()
      .then((orders) => !cancelled && setState({ orders, error: null }))
      .catch((error) => !cancelled && setState({ orders: [], error }));
    return () => { cancelled = true; };
  }, []);
  return state;
}

function Orders() {
  const { orders, error } = useOrders();
  if (error) return <ErrorState error={error} />;
  return <OrderList orders={orders} />;
}
```

If the project already uses a data library (TanStack Query, SWR, RTK Query), the right refactor is to use it, not to write another hook by hand.

## Rename

The cheapest refactor and one of the most valuable. Use the IDE's or language server's rename (it updates every reference) instead of a text search and replace. For public exports, check the usages outside the file before renaming.
