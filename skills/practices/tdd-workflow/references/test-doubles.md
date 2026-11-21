# Test doubles

A *test double* replaces a real dependency during a test. Choosing the right type avoids brittle tests that break on every refactor.

## Types

| Type | What it does | Use it to |
|---|---|---|
| **Dummy** | Passed in but never used | Fill required parameters |
| **Stub** | Returns fixed answers | Control indirect inputs (what the dependency returns) |
| **Spy** | Records how it was called | Verify indirect outputs when there is no other observable effect |
| **Mock** | A spy with preprogrammed expectations | Protocols where the interaction *is* the behavior (sending an email, publishing an event) |
| **Fake** | A simplified working implementation | In-memory repositories, a controllable clock, an in-memory queue |

## Usage Rules

1. **Double only the system's edges**: network, database, file system, clock, randomness, third-party services. Your own domain logic is tested for real.
2. **Prefer fakes to mocks.** An `InMemoryOrderRepository` lets you check the final state (`repo.findById(id)`) instead of checking calls (`expect(repo.save).toHaveBeenCalledWith(...)`), which couples the test to the implementation.
3. **Verify interactions only when the interaction is the result.** "A welcome email was sent": yes. "`calculateTax` was called before `applyDiscount`": no.
4. **Don't mock what you don't own.** Instead of mocking `axios` or the Stripe SDK, create your own adapter (`PaymentGateway`) with a small interface and double that interface. Test the real adapter with integration tests.
5. **If a test needs more than 2–3 doubles**, the unit has too many dependencies. That is a design signal (see SRP), not a test problem.

## Examples (TypeScript)

### Repository fake

```ts
export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
}

export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();
  async save(order: Order) { this.orders.set(order.id, structuredClone(order)); }
  async findById(id: string) { return this.orders.get(id) ?? null; }
}

it('persists the confirmed order', async () => {
  const repo = new InMemoryOrderRepository();
  const service = new OrderService(repo);

  const order = await service.confirm(buildDraftOrder({ id: 'o-1' }));

  expect(await repo.findById('o-1')).toMatchObject({ status: 'confirmed' });
});
```

### Injectable clock (instead of mocking `Date`)

```ts
type Clock = () => Date;

export function isCouponValid(coupon: Coupon, now: Clock = () => new Date()) {
  return coupon.expiresAt.getTime() > now().getTime();
}

it('rejects an expired coupon', () => {
  const now = () => new Date('2026-01-10T00:00:00Z');
  expect(isCouponValid({ expiresAt: new Date('2026-01-09T23:59:59Z') }, now)).toBe(false);
});
```

If the code already uses the global `Date` and you cannot inject, use the runner's fake timers (`vi.useFakeTimers()` / `vi.setSystemTime()`, `jest.useFakeTimers()`, or `mock.timers` in `node:test`) and restore them in `afterEach`.

### Spy when the interaction is the result

```ts
it('sends the welcome email on sign-up', async () => {
  const mailer = { send: vi.fn().mockResolvedValue(undefined) };
  const signup = new SignupService(new InMemoryUserRepository(), mailer);

  await signup.register({ email: 'ana@example.com' });

  expect(mailer.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'ana@example.com', template: 'welcome' }));
});
```
