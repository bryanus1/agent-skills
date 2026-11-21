# Report Template and Risk Matrix (`pr-plain-review`)

Use this structure to deliver the pre-approval review. Keep the tone direct, without needless jargon, and backed by real paths. Render the headings and labels in the user's language.

---

## 📊 Risk Level Matrix

| Level | Criteria | Usual verdict |
| :--- | :--- | :--- |
| **Low** | Contained change, reversible with `git revert`, no critical files (or only trivial/documentation changes) and clear checks. | `Approve` |
| **Medium** | Touches relevant business logic or configuration with controlled impact; needs an edge case confirmed or checks verified. | `Approve with notes` |
| **High** | Touches critical files (migrations, RLS, auth, payments, terms, CI) with regression risk, partly irreversible impact, or changes the description does not explain. | `Request changes before approving` |
| **Blocking** | Data exposure or RLS/auth bypass, data loss without a backup, a secret leaked in the diff, a serious payments bug, or broken CI in a critical area. | `Do not approve yet` |

---

## 📄 Canonical Template

```markdown
### Verdict: <Approve | Approve with notes | Request changes before approving | Do not approve yet>
**Overall risk:** <Low | Medium | High | Blocking> — <one-sentence summary of the main reason>
**Reversibility:** <Easy (a `git revert` is enough) | Partial (<what is left behind>) | Irreversible (<reason>)>

### What changed (in plain language)
- <Concrete effect 1 for users, data or operations>
- <Concrete effect 2>

### Why it changed
<Reason according to the title, description and linked issue — or "Not specified in the PR">
> **Mismatch found (if any):** <changes in the diff that the PR description does not explain>

### Critical files touched
| Category | File | What it touches (plain language) | Reversibility |
|---|---|---|---|
| <Category> | `path/file` | <concrete impact> | <Reversible / Irreversible / Needs manual rollback> |

*(If none: "None found (checked the 6 critical categories: migrations, RLS/permissions, legal/terms, auth/secrets, payments and infra/CI).")*

### Risks and points to review before approving
1. **[<Severity>] <Risk summary>** (`file:line`)
   - **What could happen:** <concrete scenario>
   - **What to confirm or ask for:** <concrete action before pressing Approve>

### Checks, tests and what could not be verified
- **CI / Checks:** <real result or "Not visible / not configured">
- **Tests in critical areas:** <adds tests / does not cover X>
- **Not verified / scope:** <files skipped in a huge PR, runtime behavior, pending legal approval>
```

---

## 📌 Full Example

```markdown
### Verdict: Request changes before approving
**Overall risk:** High — Drops a column in production and loosens an access rule on the subscriptions table without mentioning either in the PR description.
**Reversibility:** Irreversible for data (once the migration runs, the `legacy_plan` data is gone).

### What changed (in plain language)
- Adds the annual subscription option to the pricing screen and the Stripe checkout flow.
- Stores the billing period in the database and updates the legal text on automatic renewal.
- Lets any authenticated user read the plans table from the app.

### Why it changed
According to the description of PR #88 ("Annual subscription plan"), it enables annual payments with a 20% discount for Q4.
> **Mismatch found:** The PR does not mention dropping `legacy_plan` in the migration or the change to the access policy (RLS) on `subscriptions`.

### Critical files touched
| Category | File | What it touches (plain language) | Reversibility |
|---|---|---|---|
| Migrations | `supabase/migrations/20261115_annual_plan.sql` | Adds `billing_interval` and drops the `legacy_plan` column | Irreversible (data loss) |
| RLS / Permissions | `supabase/migrations/20261115_annual_plan.sql` | Widens the `SELECT` policy on `subscriptions` | Reversible with a new migration |
| Legal terms | `content/legal/terms.mdx` | Updates the annual renewal and cancellation clause | Easy (`git revert`) |
| Payments | `src/billing/checkout.ts` | Computes the annual price before creating the Stripe session | Easy (`git revert`) |

### Risks and points to review before approving
1. **[Critical] Other customers' subscriptions may be exposed** (`supabase/migrations/20261115_annual_plan.sql:19`)
   - **What could happen:** The new RLS policy (the rule that decides who can read which rows in the database) uses `USING (true)` on `subscriptions` instead of filtering by `auth.uid() = user_id`. Any signed-in user could read other people's payment status.
   - **What to confirm or ask for:** Restrict the policy to `auth.uid() = user_id` before approving.
2. **[High] Destructive column drop in the same deploy** (`supabase/migrations/20261115_annual_plan.sql:7`)
   - **What could happen:** `DROP COLUMN legacy_plan` deletes historical data immediately and can make the old code fail during the rollout.
   - **What to confirm or ask for:** Check that no active records remain and, if so, move the `DROP` to a later PR after verifying in production.
3. **[Medium] Renewal clause change** (`content/legal/terms.mdx:42`)
   - **What could happen:** Changes the cancellation notice period from 7 to 15 days.
   - **What to confirm or ask for:** Confirm that legal/product approved that wording.

### Checks, tests and what could not be verified
- **CI / Checks:** `lint` ✅ · `unit-tests` ✅ (no integration tests against RLS).
- **Tests in critical areas:** `src/billing/checkout.ts` has a new unit test; the SQL migration and the RLS policy are not covered by automated tests.
- **Not verified:** Real behavior of the Stripe webhook in sandbox and external approval of `content/legal/terms.mdx`.
```
