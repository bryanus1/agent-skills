# Backend Security

Based on the OWASP Top 10 and ASVS. The most frequent and highest-impact issues, in this order.

## 1. Per-resource authorization (the most common failure)

"Is authenticated" is not enough. On every operation on a resource, check that **this user can act on this resource**:

```ts
const order = await orders.findById(id);
if (!order || order.userId !== user.id) return notFound();   // IDOR: don't return someone else's order
```

- Deny by default; permissions are checked on the server on every request (guards/middleware + an ownership check in the service).
- Don't trust identifiers or roles sent by the client (`userId` in the body): take them from the session or the verified token.

## 2. Injection

- **SQL/NoSQL**: parameterized queries; in MongoDB, don't pass user objects straight into the filter (`$ne`, `$gt`).
- **System commands**: avoid `exec` with user input; use `execFile` with separate arguments.
- **File paths**: normalize them and check they stay inside the allowed directory (path traversal).
- **SSRF**: if the server downloads URLs given by the user, validate the destination (allowlist, block internal ranges and cloud metadata).

## 3. Authentication and sessions

- Passwords with **argon2id** or bcrypt (an adequate cost), never a fast hash or reversible encryption.
- Tokens/JWT: verify signature, expiry and audience; short lifetimes; refresh token rotation; revocation possible.
- Session cookies `HttpOnly; Secure; SameSite`.
- Limit login attempts (rate limit and progressive lockout); error messages that don't reveal whether the user exists.

## 4. Sensitive data and secrets

- Secrets **only in environment variables or a secrets manager**; never in the repository, logs or responses. If you find one in the code, report it as critical and recommend rotating it (it is already compromised).
- Encrypt in transit (TLS), and especially sensitive data at rest.
- Don't return more fields than needed; exclude `passwordHash`, tokens, internal notes.
- Don't log passwords, tokens, card numbers or full personal data.

## 5. Abuse protection

- **Rate limiting** per IP/user on sensitive endpoints (login, sign-up, recovery, sending emails/SMS).
- Body and upload size limits; allowed file types; scan or isolate uploads.
- CORS with explicit origins (not `*` with credentials); security headers (`helmet` or equivalent).

## 6. Dependencies

- Audit (`npm audit`, Dependabot/Renovate), pin versions with a lockfile, don't run scripts from unknown sources. Don't do mass upgrades without confirming.
