# Example: order service

**Request:** "This `OrderService` is a monster, help me with SOLID."

## Starting code

```ts
import nodemailer from 'nodemailer';
import { db } from './db';

export class OrderService {
  async checkout(dto: { email: string; items: { sku: string; price: number; qty: number }[]; coupon?: string; country: string }) {
    if (!dto.items.length) throw new Error('empty');
    let total = 0;
    for (const i of dto.items) total += i.price * i.qty;
    if (dto.coupon === 'WELCOME10') total *= 0.9;
    else if (dto.coupon === 'VIP20') total *= 0.8;
    if (dto.country === 'ES') total *= 1.21;
    else if (dto.country === 'FR') total *= 1.2;
    const { rows } = await db.query('insert into orders(email,total) values($1,$2) returning id', [dto.email, total]);
    await nodemailer.createTransport({ host: process.env.SMTP_HOST }).sendMail({ to: dto.email, subject: 'Order ' + rows[0].id, text: 'Total: ' + total });
    return { id: rows[0].id, total };
  }
}
```

## Diagnosis

| Principle | Location | Evidence | Hurts today? | Decision |
|---|---|---|---|---|
| DIP | lines 2, 14-15 | The service imports `db` and `nodemailer`; testing it requires a DB and SMTP | Yes: there are no tests | **Apply**: `OrderRepository` and `OrderNotifier` interfaces |
| SRP | the whole `checkout` | Prices, coupons, taxes, SQL and email: five reasons to change | Yes: every campaign touches this file | **Apply**: extract the price calculation as pure functions |
| OCP | coupons (lines 7-8) and taxes (10-11) | `if/else` chains on coupon and country | Partly: 2 and 2 cases, a single place | **Defer**: use data tables (cheap), no classes |
| LSP / ISP | — | No inheritance; the new interfaces are born small | No | **Don't apply** |

Explicit decision: do **not** create `CouponStrategy`, `TaxStrategy` or factories. With two coupons and two countries in a single place, a `Record` table is enough; it will be reassessed with a third variant or if the rules start needing their own logic.

## Result

```ts
// pricing.ts: pure rules, no I/O
const COUPON_FACTOR: Record<string, number> = { WELCOME10: 0.9, VIP20: 0.8 };
const VAT_BY_COUNTRY: Record<string, number> = { ES: 0.21, FR: 0.2 };

export function priceOrder(items: Item[], coupon: string | undefined, country: string): number {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discounted = subtotal * (coupon ? COUPON_FACTOR[coupon] ?? 1 : 1);
  return discounted * (1 + (VAT_BY_COUNTRY[country] ?? 0));
}

// order.service.ts: orchestration; depends on abstractions defined here
export interface OrderRepository { create(order: { email: string; total: number }): Promise<{ id: string }>; }
export interface OrderNotifier { orderConfirmed(order: { id: string; total: number }, email: string): Promise<void>; }

export class OrderService {
  constructor(private readonly orders: OrderRepository, private readonly notifier: OrderNotifier) {}

  async checkout(dto: CheckoutDto) {
    if (!dto.items.length) throw new EmptyOrderError();
    const total = priceOrder(dto.items, dto.coupon, dto.country);
    const { id } = await this.orders.create({ email: dto.email, total });
    await this.notifier.orderConfirmed({ id, total }, dto.email);
    return { id, total };
  }
}
```

`PgOrderRepository` and `SmtpOrderNotifier` live in `infra/` and are composed in `main.ts`. The `priceOrder` tests need nothing; the `OrderService` tests use an in-memory repository and a spy notifier.

> In a real refactor, the undeclared behavior change (an unknown coupon is ignored as before, but the `Error('empty')` error becomes `EmptyOrderError`) is flagged in the report for the user to confirm.

## Out of scope

- Rounding amounts with floating point (store cents as integers).
- The email copy is coupled to the total; if marketing wants templates, that is another task.
