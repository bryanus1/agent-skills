# Forms and Validation

## Checks

- **Validate on the client and on the server.** Client validation is ergonomics; server validation is security. Share the schema (Zod) if the stack allows it.
- **Errors next to their field**, linked with `aria-describedby` and `aria-invalid`, with text that says how to fix it; not just a change in border color.
- **Submitting state**: disable or ignore the second submit while the request is in flight; show progress.
- **Don't lose what the user typed** if the submit fails; keep the values and show the error.
- **Visible labels** (`<label htmlFor>`), correct types and `autocomplete` (`type="email"`, `autocomplete="email"`), `inputMode` on mobile.
- **Server success and errors** communicated (a message, focus), not only with a toast that disappears.
- Avoid validating on every keystroke fields the user is still typing; validate on blur and on submit, and revalidate live after an error.

## Controlled vs uncontrolled

With many fields, prefer the project's library (React Hook Form) or uncontrolled forms with `FormData` over a `useState` per field with a render on every key.

```tsx
async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
  if (!parsed.success) return setErrors(parsed.error.flatten().fieldErrors);
  setStatus('submitting');
  const res = await save(parsed.data);
  setStatus(res.ok ? 'success' : 'error');
}
```

## Uploads and sensitive data

Validate file type and size before uploading (and again on the server). Don't log sensitive field values (passwords, cards) to the console or analytics.
