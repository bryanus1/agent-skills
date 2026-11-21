# TDD in the Frontend

## What to test at each level

| Level | Typical tool | What it covers |
|---|---|---|
| Unit | Vitest / Jest | Pure functions: formatting, validation, reducers, selectors, calculations |
| Component / hook | Testing Library (`@testing-library/react`, `/vue`, `/svelte`) + Vitest/Jest with `jsdom` or `happy-dom` | What the user sees and does: rendering, interaction, loading and error states |
| Network | MSW (Mock Service Worker) | Simulated HTTP responses at the network level, without mocking `fetch` by hand |
| E2E | Playwright / Cypress | Complete critical flows (login, checkout). Few and stable |

Start the TDD cycle at the lowest level that can express the behavior. Extracting a component's logic into a pure function often makes it trivial to test.

## Components: test like the user

- Query elements by role and accessible name: `getByRole('button', { name: /save/i })`. Then by label (`getByLabelText`) and by text. `getByTestId` is the last resort.
- Interact with `@testing-library/user-event` (`await user.click(...)`, `await user.type(...)`), not `fireEvent` except in special cases.
- For async content use `findBy*` or `waitFor`, never `setTimeout` in the test.
- Do not check internal state, child props, CSS class names or hook calls. If a visually identical refactor breaks the test, the test was coupled to the implementation.
- *Snapshots* do not work as a first TDD test: they express no behavior and get accepted without being read. Use them, if at all, for small, stable serialized outputs.

```tsx
it('shows an error when the email is invalid', async () => {
  const user = userEvent.setup();
  render(<SignupForm onSubmit={vi.fn()} />);

  await user.type(screen.getByLabelText(/email/i), 'not-an-email');
  await user.click(screen.getByRole('button', { name: /create account/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/invalid email/i);
});
```

## Hooks

Test hooks with `renderHook` only if they hold their own logic (debounce, state machines). If the hook only composes others, test the component that uses it.

```ts
it('returns the value after the delay', () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), { initialProps: { value: 'a' } });

  rerender({ value: 'ab' });
  expect(result.current).toBe('a');
  act(() => vi.advanceTimersByTime(300));
  expect(result.current).toBe('ab');
  vi.useRealTimers();
});
```

## Remote data

- With MSW, define handlers per test (`server.use(http.get('/api/users', () => HttpResponse.json([...])))`) to cover success, empty and error.
- Test all three states: loading, data and error. The error state is the one most often forgotten.

## E2E (Playwright)

- One test per critical business flow, not per screen.
- Role-based selectors (`page.getByRole`) and the locators' implicit waits; no `waitForTimeout`.
- Isolated data per test (a user created through the API in `beforeEach`), so tests can run in parallel.
