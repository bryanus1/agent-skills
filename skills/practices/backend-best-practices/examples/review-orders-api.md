# Example: reviewing an orders module

**Request:** "Review `orders-api.ts` and apply backend best practices."

## Starting code (abridged)

```ts
export async function listOrders(req: Req) {
  const rows = await db.query(`SELECT * FROM orders WHERE status = '${req.query.status}'`);   // line 8
  for (const o of rows) o.items = await db.query(`SELECT * FROM items WHERE order_id = '${o.id}'`);  // line 9
  return { status: 200, body: rows };
}

export async function getOrder(req: Req) {
  const [order] = await db.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  return { status: 200, body: order };                                                         // line 16
}

export async function createOrder(req: Req) {
  try {
    const order = await db.insert('orders', { ...req.body });                                  // line 21
    return { status: 200, body: order };
  } catch (err) {
    return { status: 200, body: { error: err.message, stack: err.stack } };                    // line 25
  }
}
```

## Findings

| # | Severity | Area | Location | Problem and effect | Action |
|---|---|---|---|---|---|
| 1 | Critical | Security | orders-api.ts:8,9 | SQL by interpolation with `req.query.status`: SQL injection | Parameterized query |
| 2 | Critical | Security | orders-api.ts:16 | `getOrder` does not check that the order belongs to the authenticated user (IDOR) | Check ownership; 404 if it is not theirs |
| 3 | Critical | Security | orders-api.ts:21 | `{ ...req.body }` copies any field into the order, incl. `userId` or `status` (*mass assignment*) | Validate and build the object field by field; `userId` from the session |
| 4 | Important | API | orders-api.ts:25 | Error with 200 and `err.stack` in the body: hides failures from clients and leaks internal details | 400/500 with a generic message; log the details — **changes the contract** |
| 5 | Important | Data | orders-api.ts:9 | N+1: one items query per order | A single query with `= ANY($1)` and grouping |
| 6 | Important | API | orders-api.ts:8 | Listing without a limit | Default `limit` of 50, cap of 100 |
| 7 | Minor | Logs | — | No error logging | Mentioned only |

## Decisions not to apply

- **No repository layer or general DTOs are added**: the module has three functions; parameterization and a validation function are enough.
- **No cache is introduced**: there is no measurement that justifies it.
- **No transaction is added to `createOrder`**: today it only does one write. It will be added when it creates the items in the same operation.

## Contract warning

Changes 4 and 6 modify status codes and response size. They are applied only after confirming with the user; otherwise they stay as recommendations.

## Report (summary)

- **Applied:** 1, 2, 3 and 5; tests ✅ 5/5. **Awaiting confirmation:** 4 and 6 (they change the contract).
- **Not verified:** performance with real data volume and whether the index on `orders.status` exists.
