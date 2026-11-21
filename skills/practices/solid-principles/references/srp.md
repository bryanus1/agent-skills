# SRP: Single Responsibility

> A unit should have **one reason to change**: a single actor or business decision that can ask for changes to it.

SRP does not mean "does one thing" (that belongs to functions, see `clean-code`). It means **different people or decisions** should not force you to edit the same file. An `InvoicePrinter` class can have twenty methods and satisfy SRP if they all change for the same reason.

## How to detect it

- The file is modified in commits with unrelated motives (a rate change, an email format change, a SQL schema change).
- Imports from different layers in the same file: HTTP/framework, ORM or SQL, third-party SDKs, presentation formatting.
- Names like `Manager`, `Helper`, `Service` that pile up everything.
- Every test needs to set up half the system to check one rule.

## Backend

### Before

```ts
export class OrderService {
  async checkout(dto: CheckoutDto) {
    if (!dto.items.length) throw new Error('empty');                     // validation
    const subtotal = dto.items.reduce((s, i) => s + i.price * i.qty, 0); // pricing rule
    const total = subtotal * 1.21;                                       // tax rule
    const order = await db.query('insert into orders ...', [total]);     // persistence
    await smtp.send({ to: dto.email, subject: 'Order', body: `...${total}` }); // notification
    return order;
  }
}
```

It changes because of: tax rules (finance), DB schema (data), email copy (marketing).

### After

```ts
// pricing.ts: pricing and tax rules, pure and testable
export const totalWithTax = (items: Item[], vatRate: number) =>
  items.reduce((s, i) => s + i.price * i.qty, 0) * (1 + vatRate);

// order.service.ts: orchestrates the use case, knows nothing about SQL or SMTP
export class OrderService {
  constructor(private orders: OrderRepository, private notifier: OrderNotifier) {}

  async checkout(dto: CheckoutDto) {
    if (!dto.items.length) throw new EmptyOrderError();
    const order = await this.orders.create({ total: totalWithTax(dto.items, VAT_RATE) });
    await this.notifier.orderConfirmed(order, dto.email);
    return order;
  }
}
```

There is still one service, but now it **orchestrates**; each decision lives where its actor can change it without touching the others.

## Frontend

### Before: a component with fetch, state, rules and UI

```tsx
function Checkout() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => { fetch('/api/cart').then(r => r.json()).then(setItems); }, []);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0) * 1.21;
  return <div>{items.map(/* ... */)} <strong>{total.toFixed(2)} €</strong></div>;
}
```

### After

```tsx
const totalWithTax = (items: Item[]) => /* pure rule, testable without React */;

function useCart() { /* data access: fetch, cache, errors */ }

function CartSummary({ items }: { items: Item[] }) { /* presentation only */ }

function Checkout() {
  const { items } = useCart();
  return <CartSummary items={items} total={totalWithTax(items)} />;
}
```

## How to refactor

1. Identify the reasons to change and name them (pricing, persistence, notification).
2. Extract the **pure** parts first (calculations, rules) into functions: it is the cheapest step and gains the most in tests.
3. Then extract what touches the outside world (DB, network, email) behind a small interface (see [DIP](dip.md)).
4. The original stays as the **orchestrator** with the same public signature.

## False positives

- A long class whose methods always change together: that is cohesion, not a violation.
- Splitting by size without criteria produces `OrderValidator`, `OrderCalculator`, `OrderSaver`… that are always edited together: you created scattered coupling, not SRP.
- A framework controller that translates HTTP into a use case and returns the response already fulfills its single responsibility.
