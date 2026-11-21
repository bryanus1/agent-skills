# Data Access

## Contents
1. [Safe queries](#safe-queries)
2. [N+1 and queries in loops](#n1-and-queries-in-loops)
3. [Transactions and concurrency](#transactions-and-concurrency)
4. [Indexes and performance](#indexes-and-performance)
5. [Migrations](#migrations)

## Safe queries

- **Always parameterized**: `db.query('SELECT … WHERE id = $1', [id])`. Concatenating or interpolating values into SQL is injection, also in `ORDER BY` and column names (use an allowlist).
- With an ORM, avoid "raw" functions with interpolation; if they are needed, use the ORM's own parameters.
- Select only the columns you need; don't expose full ORM rows as the response (they leak internal fields such as `passwordHash`): map to an output DTO.

## N+1 and queries in loops

**Signal:** a `for`/`map` that runs one query per element.

```ts
// Avoid: 1 + N queries
const orders = await db.query('SELECT * FROM orders WHERE user_id = $1', [userId]);
for (const o of orders) o.items = await db.query('SELECT * FROM items WHERE order_id = $1', [o.id]);

// Prefer: 2 queries (or a JOIN)
const items = await db.query('SELECT * FROM items WHERE order_id = ANY($1)', [orders.map(o => o.id)]);
```

With an ORM: eager loading (`include`, `relations`, `joinedload`) or a `DataLoader` in GraphQL. Confirm it with the query log, not by intuition.

## Transactions and concurrency

- Several changes that must be committed or rolled back together go in **one transaction** (create order + decrement stock). Without it, a failure halfway leaves inconsistent data.
- Keep transactions **short**, with no network calls inside.
- **Race conditions** (check, then write): use unique constraints, `UPDATE … WHERE stock >= n`, optimistic locking (a version column) or row locking, instead of "read, decide in code, write".
- Integrity constraints (`UNIQUE`, `FOREIGN KEY`, `NOT NULL`, `CHECK`) are enforced by the database; validation in code does not replace them.
- Money: integers in the smallest unit or `DECIMAL`, never `float`.

## Indexes and performance

- Index the columns of the **real filters, joins and sorts** of frequent queries; verify with `EXPLAIN (ANALYZE)`.
- A composite index respects the column order (equality first, range after).
- Every index makes writes more expensive: don't add them "just in case".
- Watch out for functions on the column in the `WHERE` (`WHERE lower(email) = …` does not use a simple index), `LIKE '%x'` and huge `OFFSET`s.
- A connection pool with a bounded size; always release the connection (`finally`).

## Migrations

- Versioned, repeatable and reviewed; never edit a migration that has already been applied.
- **Backward compatible** for zero-downtime deploys: add a nullable column → deploy the code → backfill → make it required; drop columns in a deploy after the one that stops using them.
- Dangerous operations on large tables (adding an index without `CONCURRENTLY` in Postgres, changing types) need a plan; confirm with the user before running them against real data.
