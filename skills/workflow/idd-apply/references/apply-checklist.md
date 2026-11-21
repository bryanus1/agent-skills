# Execution Checklist (IDD Apply)

Format of the markers `idd-apply` writes.

- **Plan in a tracker:** progress goes in comments on the item and the body is consolidated once, at the end.
- **Plan in a local `.md`:** everything is ticked directly in the file.

Plans created by earlier versions use the Spanish markers (`Estado: planificado`, `🔄 Progreso IDD`, `### Desviaciones`…). Read both; when the plan already uses the Spanish ones, keep writing them in Spanish. Full table: `<skill-dir>/../idd-explore/references/adapters.md` under "IDD Markers".

---

## Plan statuses

The status line sits at the top of `## 🛠️ Implementation Plan`. In the tracker, the intermediate statuses are reported in the comments, and the body only changes from `planned` to `implemented` at the end.

| Status | When |
|---|---|
| `Status: planned` | Left by `idd-plan` |
| `Status: in progress` | When the first task starts |
| `Status: blocked — <reason>` | When work must stop waiting for a decision |
| `Status: implemented · <YYYY-MM-DD>` | After the final verification and the user's OK |

## Checkboxes

- `- [ ]` pending · `- [x]` done and verified.
- A task that could not be verified stays `- [ ]` with a note: `- [ ] 2.1 … → R1 _(pending: test X fails)_`.
- Tasks added during implementation are numbered next (`1.3`, `1.4`…) and carry `_(added)_`.

## Progress comment (tracker)

One comment per group of tasks, and always one before ending the turn:

```markdown
🔄 IDD Progress — in progress

**Completed:** 1.1, 1.2
**Verification:** `pnpm test invoices` ✅
**Next:** 2.1
**Deviation:** (none) | Task 1.2 uses `paginateAll` instead of `find` (agreed with the user)
```

When resuming, the tasks listed in these comments count as done even if the body still shows `- [ ]`.

At the end, a final comment: `✅ IDD — implemented` with the closing summary.

## Deviations

If the result differs from the plan, add this at the end of the plan (in the tracker, when consolidating the body at the end):

```markdown
### Deviations
- **Task 1.2:** used `paginateAll` instead of `find` because `find` caps at 100 rows. Agreed with the user on 2026-11-12.
- **R2:** the limit changed from 10,000 to 5,000 rows (product decision).
```

## Before moving to the next task

- [ ] The change is limited to what the task asks for.
- [ ] It follows the repo's existing patterns.
- [ ] The task's verification passed.
- [ ] The progress is recorded (checkbox locally, or included in the next progress comment in the tracker).

## Closing summary (in the chat)

```markdown
**Plan:** <link or path> — Status: implemented
**Tasks:** 6/6 completed
**Files:** `src/a.ts`, `src/a.spec.ts`
**Verification:** `pnpm test invoices` ✅ · `pnpm lint` ✅
**Deviations:** 1 (see plan)
**Pending:** commit/PR when you say so
```
