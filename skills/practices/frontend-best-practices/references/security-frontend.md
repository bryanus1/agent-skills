# Frontend Security

The frontend is not a trust boundary: everything the client does can be tampered with. Real authorization lives on the server; here the goal is to avoid **exposing** and **executing** hostile content.

## XSS (the most important)

- React escapes interpolated text `{value}` by default. The danger is in bypassing that:
  - `dangerouslySetInnerHTML`, `innerHTML`, `insertAdjacentHTML`, `document.write`.
  - `href`/`src` with user values (`javascript:` URLs): validate the protocol (`https:`/`http:`/`mailto:`).
  - `eval`, `new Function`, `setTimeout("string")`.
- If third-party HTML must be rendered (CMS, Markdown), **sanitize it** with a maintained library (DOMPurify or the one the project already uses) and an allowlist of tags; better still, convert Markdown to React elements (react-markdown) instead of HTML.
- A strict **CSP** policy reduces the damage of an XSS that slips through; configure it on the server/framework.

## Tokens and sessions

- Avoid storing session tokens in `localStorage`/`sessionStorage`: any XSS can read them. Prefer **`HttpOnly; Secure; SameSite` cookies** managed by the server.
- If you use cookies to authenticate, protect mutations against CSRF (SameSite, tokens).
- Don't log tokens or personal data to the console, analytics or error messages.

## Secrets and configuration

- Everything in the bundle is public. Variables with a public prefix (`NEXT_PUBLIC_`, `VITE_`) **are not secrets**; private keys (Stripe secret, database, service tokens) only on the server.
- Don't include internal URLs or admin keys in client code.

## Links, iframes and third parties

- `target="_blank"` with `rel="noopener noreferrer"`.
- Third-party `iframe`s with `sandbox` and minimal permissions.
- External scripts with Subresource Integrity when possible; keep the number of third parties low.
- Validate and limit redirects (`?next=`) to internal routes to avoid open redirects.

## User data

- Don't trust `window.location`, `postMessage` or `localStorage` as input: validate and type what you read (Zod).
- Error messages shown to the user must not reveal internal details.
