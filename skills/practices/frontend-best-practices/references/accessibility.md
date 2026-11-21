# Accessibility

A reasonable minimum target: **WCAG 2.2 AA**. Correct semantic HTML gives the best return.

## Checks by priority

1. **Semantics before ARIA.** `<button>` for actions, `<a href>` for navigation, `<label>`, `<nav>`, `<main>`, `<h1..h6>` in order. A `<div onClick>` is not focusable and does not respond to Enter/Space: replace it with `<button type="button">`.
2. **Keyboard**: everything interactive is reachable with Tab, activated with Enter/Space and has a **visible focus**. Don't remove `outline` without replacing it. Don't use a positive `tabIndex`.
3. **Accessible names**: icon-only buttons get an `aria-label` (or visually hidden text); fields get a `<label>`; links have text that makes sense out of context (not "click here").
4. **Images**: a descriptive `alt` if they carry information; `alt=""` if they are decorative. Never omit the attribute.
5. **Color and contrast**: text 4.5:1 (3:1 if large); information is not conveyed by color alone (errors, states).
6. **Focus and announcements**: when a dialog opens, move focus inside, trap it and return it on close; use `<dialog>` or a headless library (Radix, React Aria) instead of building it by hand. Important dynamic changes (form errors, results) are announced with `role="status"` / `aria-live="polite"`.
7. **Route navigation** in SPAs: move focus to the main heading or announce the title change.
8. **Motion and timing**: respect `prefers-reduced-motion`; don't end sessions without warning.
9. **Touch targets** of at least 24×24 px (WCAG 2.2), preferably 44 px on mobile.

## ARIA: rules

- The first rule of ARIA is not to use ARIA if a native element exists.
- If you use a role (`role="tablist"`), you must implement its full keyboard pattern. A half-implemented role is worse than none.
- Never put `aria-hidden="true"` on focusable elements.

## How to verify

- Automated tools (axe, `eslint-plugin-jsx-a11y`, Lighthouse) catch ~30-40% of the problems: use them, but they are not enough.
- Manual: go through the screen with the keyboard only; try a screen reader (VoiceOver, NVDA); zoom to 200%.
- If you cannot run these checks, **say so in the report** instead of claiming it complies.
