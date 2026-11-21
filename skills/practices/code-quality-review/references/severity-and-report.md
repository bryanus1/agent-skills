# Severity, Deduplication and Report Format

## Common scale

| Severity | Criterion | Effect on the verdict |
|---|---|---|
| **Critical** | Exploitable vulnerability, data loss or corruption, broken tests hiding a regression, users blocked (keyboard/screen reader), exposed secrets | **Changes required** |
| **Important** | Likely bug, new behavior without tests, N+1 or missing transaction on a hot path, partial accessibility, a design violation that already hurts | Changes required, or **Ready with minor changes** if it is contained and reversible |
| **Minor** | Readability, names, consistency, micro-optimizations | Does not block |

If a lens uses another scale, translate it to this one. If you are torn between two levels, pick the lower one and explain the doubt; do not inflate severities to make the report look more useful.

## Verdict

- **Ready for PR**: no Critical or Important findings; tests pass.
- **Ready with minor changes**: only Minor findings, or contained Important ones.
- **Changes required**: at least one Critical, failing tests or several Important findings.

Without running the tests, the verdict cannot be "Ready for PR": say it could not be verified.

## Format rules

- One row per finding, with `file:line`, a concrete effect and a brief suggested fix.
- Sorted by severity and, within it, by impact.
- Up to ~15 findings are listed; with more, the top 10 and the rest grouped ("7 minor naming findings in `src/utils/`").
- **Done well**: one line, only if it adds something (a good test, a sound decision).
- **Out of scope**: pre-existing issues, things that need measuring or deciding.
- Never include secrets or personal data found during the review: describe where they are and recommend rotating them.

## Fix plan

Group the findings by the skill that fixes them, in this order of application:

1. Critical (each one with its owning skill and a test that reproduces it).
2. Missing tests (`tdd-workflow`), before refactoring.
3. Design (`solid-principles`, `design-patterns`) with the test net already in place.
4. Cleanup (`clean-code`).

End by asking what to apply. If the user accepts, delegate to the matching skill and follow **its** workflow and report.
