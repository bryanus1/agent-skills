# Spec Template (IDD Explore)

This template defines the canonical structure `idd-explore` produces to document issues in any tracker (Linear, GitHub, GitLab, Jira) or in local notes.

Keep the `##` headings exactly as written: `idd-plan` and `idd-apply` look for them (see the IDD markers in [adapters.md](adapters.md#-idd-markers)). Write the content under them in the user's language.

---

## 📄 Markdown Template (copy / persist)

```markdown
## 🎯 Goal
<!-- Short description of the problem being solved and why it is needed now. -->

## 🛡️ Architectural Constraints
<!-- Layer constraints (e.g. backend vs frontend), security, persistence or performance. -->
- **Location:** 
- **Layer boundaries:** 
- **Security / Permissions:** 

## 📋 Key Business Rules
<!-- Specific functional criteria, formulas, edge cases and domain considerations. -->
- **Rule 1:** 
- **Edge cases:** 

## 🧭 Technical Context in the Repo
<!-- Existing files, modules, tables or functions found during the inspection. -->
- **Files / Modules:** `path/to/module`
- **Existing pattern:** 
- **Dependencies involved:** 

## 📦 Proposed Scope
### In Scope
- [ ] Deliverable or feature 1
- [ ] Deliverable or feature 2

### Out of Scope
- Deliberate exclusions for this phase or ticket.

## 🗓️ Metadata & Planning
<!-- Mandatory: keep the tracking notes that came with the original ticket. -->
- **Estimate:** 
- **Time window / Milestone:** 
- **Phase / Epic:** 
- **Priority / Labels:** 

## ❓ Open Questions / Decisions
<!-- Pending questions to settle with the team before or during the specification. -->
- 
```

---

## 📌 Realistic Example

```markdown
## 🎯 Goal
Compute deadlines and terms (business/calendar days, hours, months and years) with traceable rules and versions, centralized exclusively in the backend.

## 🛡️ Architectural Constraints
- **Location:** Backend (TypeScript/Deno Edge Function or Postgres function).
- **Layer boundaries:** The web and mobile apps only consume it; no date rule runs on the client.
- **Traceability:** Store the basis and version of the applied rule alongside the computed date.

## 📋 Key Business Rules
- Strict distinction between business days and calendar days (holidays and weekends).
- Month calculation: a month is not a fixed 30 calendar days.
- Automated test suite with edge cases and real dates.

## 🧭 Technical Context in the Repo
- **Modules found:** `supabase/functions/terms-calculator/` and migrations in `supabase/migrations/`.
- **Current date library:** `date-fns` in the project dependencies.

## 📦 Proposed Scope
### In Scope
- [ ] Backend endpoint to compute time limits.
- [ ] Persist the rule and basis metadata in the response/record.
- [ ] Unit and integration test suite for leap years and holidays.

### Out of Scope
- Real-time sync over WebSockets.

## 🗓️ Metadata & Planning
- **Estimate:** 16 h
- **Time window:** Nov 16 → Nov 19, 2026
- **Phase:** F4 · Terms and calendar
- **Suggested slug:** `bs-521-terms-calculation`

## ❓ Open Questions / Decisions
- Is the list of national holidays managed in a Postgres table or a static config file?
```
