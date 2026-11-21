# DIP: Dependency Inversion

> High-level modules (business rules) must not depend on low-level ones (DB, network, SDKs). **Both depend on abstractions**, and the abstraction belongs to the high-level side.

The "inversion" is about **who owns the interface**: the domain defines what it needs (`OrderRepository`, `PaymentGateway`) and the infrastructure implements it. It is not the same as "dependency injection" (a technique to supply them), and it does not require a DI container.

## How to detect it

- `new Stripe()`, `new PrismaClient()`, `fetch(...)` or `process.env` inside business rules.
- The domain imports from the ORM, the web framework or an SDK.
- Testing a rule requires a DB, the network or environment variables; or the module gets patched (`jest.mock('stripe')`) to make testing possible.
- Switching providers forces you to edit the business logic.

## Backend

### Before

```ts
import Stripe from 'stripe';

export class CheckoutService {
  private stripe = new Stripe(process.env.STRIPE_KEY!);

  async pay(order: Order) {
    const charge = await this.stripe.charges.create({ amount: order.total * 100, currency: 'eur', source: order.token });
    return charge.id;
  }
}
```

### After

```ts
// checkout.service.ts: the domain defines the abstraction it needs
export interface PaymentGateway {
  charge(input: { amountCents: number; currency: string; token: string }): Promise<{ id: string }>;
}

export class CheckoutService {
  constructor(private readonly payments: PaymentGateway) {}

  async pay(order: Order) {
    const { id } = await this.payments.charge({ amountCents: Math.round(order.total * 100), currency: 'eur', token: order.token });
    return id;
  }
}

// infra/stripe.gateway.ts: the detail depends on the abstraction
export class StripeGateway implements PaymentGateway {
  constructor(private readonly stripe: Stripe) {}
  async charge({ amountCents, currency, token }: ChargeInput) {
    const c = await this.stripe.charges.create({ amount: amountCents, currency, source: token });
    return { id: c.id };
  }
}

// composition in a single place (main.ts / DI module)
const checkout = new CheckoutService(new StripeGateway(new Stripe(config.stripeKey)));
```

Test: `new CheckoutService({ charge: async () => ({ id: 'ch_1' }) })`, with no module mocks.

### NestJS

Use an injection token for the interface (interfaces don't exist at runtime):

```ts
export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
// provider: { provide: PAYMENT_GATEWAY, useClass: StripeGateway }
constructor(@Inject(PAYMENT_GATEWAY) private readonly payments: PaymentGateway) {}
```

## Frontend

- **Injectable data-access functions**: the hook receives the client or gets it from a context, instead of importing `axios` directly in each component.
- **Services through a context/provider** (`<ApiProvider client={...}>`), so tests and Storybook use a fake client.
- **Adapters** between the API's shape and the domain's (`toUser(dto)`), so components don't depend on the backend's format.

```tsx
const ApiContext = createContext<Api>(defaultApi);
function useOrders() { const api = useContext(ApiContext); return useQuery(['orders'], () => api.listOrders()); }
```

## How to refactor

1. Find the concrete dependency inside the business logic.
2. Define a **small interface in domain language** (see [ISP](isp.md)); don't copy the SDK's API.
3. Make the class receive the interface through the constructor (or a parameter, or a context in React).
4. Move the SDK usage into an adapter in the infrastructure layer.
5. Compose the pieces at the application root. If the project already uses a DI container, register it there.

## When not to apply it

- Stable platform dependencies (`Math`, `Array`, `Date` if you don't need to control time).
- A single use with no test seam needed and no second provider: a function with a parameter (`now: () => Date`) is usually enough, without an interface.
- Don't introduce a DI container or decorators just for this: the constructor and manual composition are enough.
