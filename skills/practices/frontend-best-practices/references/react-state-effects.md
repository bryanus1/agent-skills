# State, Effects and Remote Data

## Contents

1. [Derived state](#derived-state)
2. [When to use an effect](#when-to-use-an-effect)
3. [Races and cleanup](#races-and-cleanup)
4. [Remote data](#remote-data)
5. [Lists and keys](#lists-and-keys)
6. [Where state lives](#where-state-lives)

## Derived state

**Signal:** `useEffect(() => setX(f(y)), [y])`. Two renders per change, and states that can get out of sync.

```tsx
// Avoid
const [filtered, setFiltered] = useState<User[]>([]);
useEffect(() => setFiltered(users.filter(u => u.active)), [users]);

// Prefer: computed during render
const filtered = users.filter(u => u.active);
// With a high measured cost: useMemo(() => users.filter(...), [users])
```

Rule: if a value can be computed from props or state, **it is not state**. Don't copy props into state either, except for an editable initial value (and then name it `initialX`).

## When to use an effect

An effect syncs the component with something **external** to rendering: subscriptions, timers, DOM listeners, third-party libraries, analytics on mount. It is not for:

- Reacting to a user event: put the logic in the **event handler**.
- Transforming data for rendering: compute it during render.
- Resetting state when a prop changes: use a `key` on the component.
- Fetching data if the project has TanStack Query, SWR or framework loaders.

Dependencies: include everything the effect reads. If the linter (`react-hooks/exhaustive-deps`) warns, fix the cause; don't silence it with a comment.

## Races and cleanup

```tsx
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/users/${id}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setUser)
    .catch(e => { if (e.name !== 'AbortError') setError(e); });
  return () => controller.abort();   // when `id` changes, the previous request is cancelled
}, [id]);
```

Every subscription, timer or listener returns its cleanup. In development, React 18 mounts twice under StrictMode: if the effect breaks, it is missing a cleanup.

## Remote data

- With the project's data library: `useQuery({ queryKey: ['user', id], queryFn })`. It brings caching, retries, cancellation and deduplication.
- Model the async state explicitly: **loading, error, empty, success**. A component that only renders the happy path is a pending bug.
- Keep **server state** (users, orders) and **UI state** (modal open, tab) separate: each with its own tool.
- After a mutation, invalidate or update the cache instead of scattered manual refetches.
- In frameworks with server components, fetch the data on the server and pass it as props; keep the client for interactivity.

## Lists and keys

- A stable, unique `key` (the data's id). `key={index}` breaks internal state on reorder, insert or filter.
- Lists of hundreds of rows or more: paginate or virtualize (see [performance](performance.md)).

## Where state lives

Lift state only up to the nearest common ancestor. Context for "ambient" data (theme, session) that rarely changes; a store (Zustand, Redux) when many distant components share it and it changes often. Don't put in a global store what is local to a form or a dialog.
