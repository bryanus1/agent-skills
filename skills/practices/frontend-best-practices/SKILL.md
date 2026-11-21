---
name: frontend-best-practices
version: 1.1.0
description: >-
  Review and improve frontend code (React/Next.js and similar) with verifiable good practices: state and effects, remote data, forms, accessibility, performance and security. Prioritizes findings by impact and fixes only what hurts. Use it when reviewing or writing components, hooks and pages.
tags: [frontend, react, nextjs, accessibility, performance, security, best-practices]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - buenas prácticas frontend
  - frontend best practices
  - revisa este componente
  - review this component
  - review react component
  - accesibilidad
  - accessibility
  - mejorar rendimiento react
  - improve react performance
  - useEffect
  - revisión de frontend
  - frontend review
requirements:
  tools: [view_file, replace_file_content, run_command]
---

# Frontend Best Practices

## 🎯 Purpose

Review and improve UI code with **verifiable, prioritized criteria**, not generic checklists. Each finding cites evidence (`file:line`), its impact (user, security, maintenance) and a proportionate fix. What is already fine stays as it is.

It covers six areas: **state and effects, remote data, forms, accessibility, performance and security**. It does not decide the folder structure (architecture skills: `nextjs-architecture`, `react-native-architecture`, `astro-architecture`), internal function readability (`clean-code`), class responsibilities (`solid-principles`) or patterns (`design-patterns`). For tests use `tdd-workflow`.

## ⚡ When to Trigger

- The user asks to review, harden or "apply good practices" to components, hooks or pages.
- A new component is written with remote data, forms or HTML from external content.
- There are symptoms: extra re-renders, flicker, stale data, `useEffect` loops, accessibility or Lighthouse failures.

## 📋 Workflow

### 1. Read the context

Identify the framework and version (React 18/19, Next App Router or Pages, Vite…), the data library (TanStack Query, SWR, RTK Query), the forms library (React Hook Form, Zod…), styling and tests. **Use what the project already has**; don't introduce libraries without confirming. Tell server and client components apart if the framework has them.

### 2. Review by area, with the checklist

| Area | Key checks | Details |
|---|---|---|
| **State and effects** | Derived state computed during render, not copied with `useEffect`; effects only to sync with external systems; correct dependencies; cleanup of subscriptions and requests; stable keys in lists | [react-state-effects](references/react-state-effects.md) |
| **Remote data** | Server state separate from UI state; loading, error and empty handled; no `fetch` in `useEffect` if there is a data library; cancel or ignore stale responses | [react-state-effects](references/react-state-effects.md) |
| **Forms** | Validation on the client **and** the server; errors tied to their field; submitting state and double submits; no data lost on failure | [forms-and-data](references/forms-and-data.md) |
| **Accessibility** | Semantic HTML before ARIA; everything interactive works with the keyboard and has a visible focus; accessible names; `alt`, labels, contrast; focus after dialogs and route changes | [accessibility](references/accessibility.md) |
| **Performance** | Measure before optimizing; don't render huge lists without virtualizing; sized and lazy images; code split by route; `memo`/`useMemo` only with evidence | [performance](references/performance.md) |
| **Security** | No unsanitized HTML (`dangerouslySetInnerHTML`); tokens out of `localStorage` if there is an alternative; no secrets in the bundle; user URLs validated; `target=_blank` links with `rel` | [security-frontend](references/security-frontend.md) |

Stick to the areas relevant to the requested scope and to the files that were requested.

### 3. Prioritize

Classify each finding and sort them:

- **Critical**: exploitable security (XSS), data loss, users blocked (keyboard/screen reader impossible).
- **Important**: state or data bugs (races, unhandled states), measurable performance problems, partial accessibility.
- **Minor**: consistency, names, micro-optimizations. Mention them without fixing if they were not requested.

### 4. Fix with a safety net

With existing tests, run them before and after. Without tests for the area, describe the expected behavior change and, if it is a bug, first write a test that reproduces it (the `tdd-workflow` flow). One change per finding; keep public props and exports unless asked otherwise.

### 5. Verify and report

Run tests, typecheck and lint if they exist. For accessibility and performance, state what you **could not verify** without a browser (screen reader, Lighthouse, real performance) and how to check it. Report using the format below.

## 🚫 When NOT to Over-Optimize

- **`useMemo`/`useCallback`/`memo` everywhere** without a measured problem: they add noise and sometimes cost.
- **Rewriting a component that works** to adopt another library or style.
- **Accessibility with hand-added ARIA** when a `<button>` or `<label>` solves it.
- **Small, correct components**: if there are no real findings, say so; "no changes needed" is a valid result.

## ⚠️ Critical Rules

- **Reply in the user's language**, even though this skill is written in English. Keep UI copy in the language the project already uses.
- **Evidence first**: every finding with `file:line` and its concrete effect; no "could be cleaner".
- **Security is never deferred**: a `dangerouslySetInnerHTML` with untrusted data is reported as critical even if it was not requested; sanitize with the library the project already uses or, if there is none, propose one and ask for confirmation.
- **Do not change visible behavior** (copy, styles, flows) without saying so.
- **Do not make up metrics**: don't claim performance improvements without measuring them.
- **Do not install dependencies** without confirmation.
- **Respect the project's conventions** (styles, structure, libraries) and the architecture skills if they are present.
- **Do not touch what was not requested**: everything else goes under "Out of scope".

## 📤 Report

```markdown
### Summary
<overall state and the 1–3 highest-impact findings>

### Findings
| # | Severity | Area | Location | Problem and effect | Action |
|---|---|---|---|---|---|
| 1 | Critical | Security | UserCard.tsx:42 | `dangerouslySetInnerHTML` with the user's `bio`: stored XSS | Fixed (sanitize / render as text) |
| 2 | Important | Data | UserList.tsx:15 | `fetch` in an effect without cancellation: an old response overwrites the new one | Fixed |
| 3 | Minor | Style | — | Inconsistent names | Mentioned only |

### Changes applied
1. <change> — tests: ✅ N/N

### Not verified / out of scope
- <what needs a browser, a measurement or a user decision>
```

## 📚 References

- [State, effects and remote data](references/react-state-effects.md)
- [Forms and validation](references/forms-and-data.md)
- [Accessibility](references/accessibility.md)
- [Performance](references/performance.md)
- [Frontend security](references/security-frontend.md)
- [Full review example](examples/review-user-list.md)
