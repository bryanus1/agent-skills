# API Design, Validation and Errors

## Contents
1. [Validate at the edge](#validate-at-the-edge)
2. [Status codes](#status-codes)
3. [Error format](#error-format)
4. [Pagination and filters](#pagination-and-filters)
5. [Idempotency](#idempotency)
6. [Versioning and compatibility](#versioning-and-compatibility)

## Validate at the edge

All external input (body, query, params, headers, queue messages) is validated and typed **on the way in**, with the project's mechanism (Zod, class-validator, JSON Schema). After that, the internal code works with data that is already valid.

- Reject unknown fields or ignore them explicitly; never copy the whole body into the entity (*mass assignment*: a client would send `role: "admin"`).
- Limit sizes (body, string length, number of array elements).
- Validate the **meaning**, not just the type (quantity > 0, future date, valid email).

## Status codes

| Situation | Code |
|---|---|
| Success with a body / created / no content | 200 / 201 (+ `Location`) / 204 |
| Invalid input | 400 (or 422 if the project distinguishes semantic validation) |
| Not authenticated | 401 |
| Authenticated without permission | 403 (or 404 if you must not reveal that the resource exists) |
| Does not exist | 404 |
| Conflict (duplicate, stale version) | 409 |
| Too many requests | 429 (+ `Retry-After`) |
| Unexpected server failure | 500 |
| External dependency down | 502/503/504 |

A **200 with `{ "error": ... }`** breaks clients and monitors; use the real code. Pick codes consistently with what the project already uses.

## Error format

- A uniform shape (for example Problem Details, RFC 9457): `type`/`code`, a readable `message`, per-field `details` where relevant.
- **Never** return `err.stack`, ORM messages, SQL, server paths or versions. Log the details with a correlation id and return that id to the client.
- Tell **expected errors** (validation, not found, conflict: typed and mapped to 4xx) apart from **unexpected** ones (500, caught by a global handler).
- A `catch` that swallows the error without logging it is a hidden bug.

## Pagination and filters

- Every listing has a **maximum limit** (a default `limit` and a cap). A `SELECT *` with no `LIMIT` on a growing table is a future outage.
- **Cursor** pagination for data that changes or is large; offset only if the data is small and stable.
- Deterministic order (include a tie-breaker by id).
- Filters and sorting against an **allowlist** of columns (never interpolate the received name).

## Idempotency

- `GET`, `PUT` and `DELETE` must be idempotent by definition.
- For `POST`s that charge, send or create resources and that the client may retry, accept an **`Idempotency-Key`** and store the result associated with the key.

## Versioning and compatibility

- **Additive** changes (new optional fields) are compatible; renaming, removing or changing type/semantics is not: version it, or migrate with a coexistence period.
- Document the contract (OpenAPI) and keep it close to the code.
