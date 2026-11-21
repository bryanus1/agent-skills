# Example: reviewing a user list component

**Request:** "Review `UserList.tsx` and apply frontend best practices."

## Starting code (abridged)

```tsx
export function UserList({ query }: { query: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [visible, setVisible] = useState<User[]>([]);

  useEffect(() => {                                   // line 6
    fetch(`/api/users?q=${query}`).then(r => r.json()).then(setUsers);
  }, [query]);

  useEffect(() => {                                   // line 10
    setVisible(users.filter(u => u.active));
  }, [users]);

  return (
    <ul>
      {visible.map((u, i) => (
        <li key={i} onClick={() => open(u.id)}>       // line 17
          <img src={u.avatar} />                      // line 18
          <div dangerouslySetInnerHTML={{ __html: u.bio }} />   // line 19
        </li>
      ))}
    </ul>
  );
}
```

## Findings

| # | Severity | Area | Location | Problem and effect | Action |
|---|---|---|---|---|---|
| 1 | Critical | Security | UserList.tsx:19 | `bio` is user text injected as HTML: stored XSS | Render it as text `{u.bio}` (the design has no rich formatting) |
| 2 | Critical | Accessibility | UserList.tsx:17 | `<li onClick>` cannot be operated with a keyboard or screen reader | `<button type="button">` inside the `<li>` |
| 3 | Important | Data | UserList.tsx:6 | `fetch` in an effect with no cancellation or error handling: when typing fast, an old response can overwrite the new one; a failure leaves the list empty without notice | `AbortController`, loading and error state |
| 4 | Important | State | UserList.tsx:10 | `visible` is derived state: double render and possible desync | Compute `users.filter(...)` during render |
| 5 | Important | State | UserList.tsx:17 | `key={i}` breaks state on filter/reorder | `key={u.id}` |
| 6 | Important | Accessibility | UserList.tsx:18 | `<img>` without `alt` | `alt=""` (decorative: the name is next to it) |
| 7 | Minor | Data | UserList.tsx:7 | `query` without `encodeURIComponent` | Encode the parameter |

## Decisions not to apply

- **TanStack Query is not introduced**: the project doesn't use it and the component has a single request; `AbortController` solves the race. It is recommended if more requests appear.
- **No `useMemo`** on the filter: the list is small and no measurement justifies it.
- **No virtualization**: the API returns pages of 20 items.

## Result (excerpt)

```tsx
useEffect(() => {
  const controller = new AbortController();
  setStatus('loading');
  fetch(`/api/users?q=${encodeURIComponent(query)}`, { signal: controller.signal })
    .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    .then((data: User[]) => { setUsers(data); setStatus('success'); })
    .catch(e => { if (e.name !== 'AbortError') setStatus('error'); });
  return () => controller.abort();
}, [query]);

const visible = users.filter(u => u.active);
```

## Report (summary)

- **Applied:** 7 findings fixed; tests: ✅ 3/3.
- **Not verified:** a screen reader walkthrough and the visible focus of the new button (needs a browser).
- **Out of scope:** the empty-state design (a product decision).
