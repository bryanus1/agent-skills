# Critical Files Catalog (`pr-plain-review`)

Reference guide for spotting high-impact files and changes in a PR before approving it. On any match (by path or by diff content), **read the whole file** on the PR branch to check how it interacts with the rest of the system.

---

## 0. Ownership and `CODEOWNERS`

Check whether `.github/CODEOWNERS`, `CODEOWNERS` or `docs/CODEOWNERS` exists.
- If a touched file matches a pattern with assigned owners, say so next to the critical file (e.g. *"Needs review from `@team-security` per `CODEOWNERS`"*).

---

## 1. Migrations and Data Schema

- **Usual paths:**
  - `migrations/`, `supabase/migrations/`, `prisma/migrations/`, `drizzle/`, `alembic/`, `db/migrate/`, `*.sql`, `schema.prisma`, `schema.ts`, `models/` with column changes.
- **Diff signals:**
  - `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, `DELETE FROM`.
  - `ALTER COLUMN ... TYPE`, `RENAME COLUMN`, `ADD COLUMN ... NOT NULL` without a `DEFAULT`.
  - `CREATE INDEX` without `CONCURRENTLY` on large tables (may block writes).
  - Changes to `prisma/schema.prisma` or Drizzle schemas without the matching migration file (or migrations edited after they were applied).
- **What to confirm before approving:**
  - Is existing data lost, or will the production version break during the rollout (zero-downtime deploy)?
  - Is there a rollback plan, or would it need a backup restore?

---

## 2. RLS, Policies and Permissions

- **Usual paths:**
  - Supabase/Postgres policies (`*.sql`), `rls`, `policies`, `permissions`, `rbac`, `acl`, `guards`, `middlewares/auth*`, `rules` (Firestore/Storage).
- **Diff signals:**
  - `DISABLE ROW LEVEL SECURITY`, `DROP POLICY`, `ALTER POLICY`.
  - Permissive policies (`USING (true)`, `WITH CHECK (true)` on tables with user or multi-tenant data).
  - `SECURITY DEFINER` functions without a fixed `SET search_path` or exposed to public roles (`anon`, `authenticated`).
  - Use of `service_role`, admin keys or tenant/ownership bypasses in client endpoints or Server Actions.
  - Changes to roles, scopes or the permission matrix (`admin`, `owner`, `member`).
- **What to confirm before approving:**
  - Can an authenticated or anonymous user read/modify rows that belong to another user or organization?
  - Do sensitive operations still check permissions on the server, not just in the UI?

---

## 3. Legal Terms, Privacy and Sensitive Copy

- **Usual paths:**
  - `terms*`, `tos*`, `privacy*`, `legal*`, `cookies*`, `consent*`, `gdpr*`, `dpa*`, `compliance*`, `pricing*`, `plans*`, billing `faq*`, legal email templates.
- **Diff signals:**
  - Changes to terms of use, the privacy policy, data retention/deletion, sharing with third parties or subprocessors.
  - Changes to consent text, mandatory checkboxes or communications opt-in/opt-out.
  - Changes to displayed prices, renewal cycles, or the cancellation or refund policy.
- **What to confirm before approving:**
  - Was the change reviewed by product/legal, or does it reflect exactly what was agreed?
  - Does it require users to re-accept the terms or an updated effective date?

---

## 4. Authentication, Sessions and Secrets

- **Usual paths:**
  - `auth*`, `login*`, `oauth*`, `sso*`, `jwt*`, `session*`, `middleware*`, `cors*`, `.env*`, `config/secrets*`.
- **Diff signals:**
  - Changes to token expiry, cookies (`httpOnly`, `secure`, `sameSite`), the password reset flow or email verification.
  - Removed or relaxed signature checks on webhooks (`stripe-signature`, HMAC).
  - Opened CORS (`origin: '*'`, `credentials: true` combined with broad origins).
  - Real credentials, tokens, private keys or `.env` files committed by mistake.
- **What to confirm before approving:**
  - Did any private route become public or reachable without a valid session?
  - If a secret leaked into the PR history, **deleting it in another commit is not enough**: it has to be rotated before approving.

---

## 5. Payments, Billing and Financial State

- **Usual paths:**
  - `billing*`, `payments*`, `checkout*`, `stripe*`, `webhooks/stripe*`, `subscriptions*`, `invoices*`, `credits*`, `refunds*`.
- **Diff signals:**
  - Price, discount, tax or proration calculations moved to the client or done without server-side catalog validation.
  - Webhooks without idempotency checks (double credit or double charge on retries).
  - Changes to subscription state machines (`trialing`, `active`, `past_due`, `canceled`) or to access after non-payment.
- **What to confirm before approving:**
  - Are amounts and currencies validated on the server?
  - What happens if the payment provider sends the same event twice?

---

## 6. Infrastructure, CI/CD and Critical Dependencies

- **Usual paths:**
  - `.github/workflows/*`, `Dockerfile*`, `docker-compose*`, `terraform/`, `infra/`, `k8s/`, `vercel.json`, `fly.toml`, `netlify.toml`, `package.json` + lockfiles (`pnpm-lock.yaml`, `package-lock.json`, `Cargo.lock`, `poetry.lock`).
- **Diff signals:**
  - Changes to production deploy pipelines, `permissions: write-all` in Actions, or secrets exposed to PRs from forks (`pull_request_target`).
  - New dependencies with network/system access, major upgrades of the framework/ORM/auth library, or test/lint steps removed from CI.
- **What to confirm before approving:**
  - Can a failure or change in this file break deployments or weaken the CI gates?
