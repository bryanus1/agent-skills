# Structural Patterns

## Contents

1. [Adapter (port and adapter)](#adapter-port-and-adapter)
2. [Decorator](#decorator)
3. [Facade](#facade)

## Adapter (port and adapter)

**Problem:** the business code depends on the shape of a third-party SDK, API or library; switching vendors or testing without the network forces you to edit the logic.

**When yes:** external integrations (payments, email, storage, AI, third-party APIs), data formats from another system that you don't want to spread.

**When not:** stable utility libraries (`lodash`, `date-fns`) that don't justify a wrapper.

```ts
// Port: defined by the domain, in its own language
export interface EmailSender {
  send(input: { to: string; subject: string; html: string }): Promise<void>;
}

// Adapter: translates to the concrete SDK
export class SendGridEmailSender implements EmailSender {
  constructor(private readonly client: MailService) {}
  async send({ to, subject, html }: { to: string; subject: string; html: string }) {
    await this.client.send({ to, from: this.from, subject, html });
  }
}
```

Rules: the interface speaks the business language and **does not copy the SDK's API**; the adapter is the only file that imports the SDK; SDK errors are translated into domain errors. It is the basis of DIP (see `solid-principles`).

**Data adapter (anticorruption layer):** converts an external API's response into your domain model in a single place (`toUser(dto)`), so the rest of the code does not depend on foreign field names.

## Decorator

**Problem:** add cross-cutting behavior (cache, logs, metrics, retries, authorization) without modifying or inheriting from the original.

**In TS/JS it is almost always a higher-order function or an object that wraps another with the same interface.**

```ts
interface UserRepository { findById(id: string): Promise<User | null>; }

class CachedUserRepository implements UserRepository {
  private cache = new Map<string, User | null>();
  constructor(private readonly inner: UserRepository) {}
  async findById(id: string) {
    if (!this.cache.has(id)) this.cache.set(id, await this.inner.findById(id));
    return this.cache.get(id)!;
  }
}

// composition: new CachedUserRepository(new PgUserRepository(db))
```

Functional version:

```ts
const withRetry = <A extends unknown[], R>(fn: (...a: A) => Promise<R>, retries = 2) =>
  async (...args: A): Promise<R> => {
    for (let attempt = 0; ; attempt++) {
      try { return await fn(...args); } catch (e) { if (attempt >= retries) throw e; }
    }
  };
```

**Variants that already are Decorators:** Express/Koa/Nest middleware (guards, interceptors), React HOCs and wrappers, `withAuth(handler)`. **Avoid** stacking more than 3 decorators without tests of the composition (order matters: retry inside or outside the cache?).

## Facade

**Problem:** a subsystem with many pieces forces the client to know the order and the details of each one.

**When yes:** a use case that coordinates 3+ services and is repeated in several places; a simple API over a complex library.

```ts
export class CheckoutFacade {
  constructor(private cart: CartService, private pricing: PricingService, private payments: PaymentGateway, private orders: OrderRepository) {}
  async checkout(cartId: string, token: string) {
    const cart = await this.cart.get(cartId);
    const total = this.pricing.total(cart);
    await this.payments.charge({ amountCents: toCents(total), token });
    return this.orders.create({ cartId, total });
  }
}
```

**When not:** if it only forwards calls without simplifying (an empty layer), or if it becomes a "god" that piles up business logic: the facade **orchestrates**, it does not decide.
