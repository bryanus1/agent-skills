# TDD in the Backend

## What to test at each level

| Level | What it covers | Doubles |
|---|---|---|
| Unit (domain / use cases) | Business rules, validations, calculations, state transitions | In-memory fakes for repositories, clock and external services |
| Integration | Repositories against a real DB (container or test DB), HTTP adapters against a simulated server | None in the component under test |
| HTTP / contract | Routes, input validation, status codes, error format, auth | Real use cases with fakes at the edges, or the full app with a test DB |
| E2E | Complete flows across services | Minimal |

The TDD cycle usually starts **outside-in**: an HTTP test that describes the contract (red), then unit tests for each business rule that comes up while implementing it. For pure domain logic, start directly with the unit test.

## Use cases / services

- Inject dependencies through the constructor; in the test pass fakes (`InMemoryUserRepository`, `FixedClock`).
- Verify the result and the final state, not the sequence of calls.
- Explicitly cover domain errors (`InsufficientStockError`, `CouponExpiredError`) with `await expect(promise).rejects.toThrow(...)`.

```ts
it('rejects the reservation when there is no stock', async () => {
  const stock = new InMemoryStockRepository({ 'sku-1': 0 });
  const reserve = new ReserveStock(stock);

  await expect(reserve.execute({ sku: 'sku-1', qty: 1 })).rejects.toThrow(InsufficientStockError);
});
```

## NestJS

- Unit: instantiate the class directly (`new InvoiceService(fakeRepo)`); you don't need `Test.createTestingModule` for pure logic.
- Module integration: `Test.createTestingModule({ imports: [InvoiceModule] }).overrideProvider(PAYMENT_GATEWAY).useValue(fakeGateway).compile()`.
- HTTP: `app = moduleRef.createNestApplication(); await app.init();` and `request(app.getHttpServer()).post('/invoices').send(dto).expect(201)` with `supertest`. Apply the same global `ValidationPipe`/filters as in `main.ts` in the test, or the contract you test is not the real one.

## Express / Fastify / Hono

- Export the app without calling `listen` so you can use `supertest` (Express) or `app.inject()` (Fastify) / `app.request()` (Hono).

## Database

- Repositories: integration tests against the real engine (Testcontainers or a test DB), not SQLite if production is Postgres.
- Isolate each test: a transaction with rollback, truncation in `beforeEach`, or a schema per worker.
- Don't mock the ORM. If a use case needs the repository, use the in-memory fake in the unit test and leave the ORM for the repository's integration test.

## HTTP error contract

For each endpoint, test at least: success, invalid input (400/422 with field details), not found (404), unauthorized (401/403) and conflict where it applies (409). Check the format of the error body, not just the status code.
