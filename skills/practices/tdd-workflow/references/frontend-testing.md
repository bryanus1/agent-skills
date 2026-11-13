# TDD en frontend

## Qué probar en cada nivel

| Nivel | Herramienta típica | Qué cubre |
|---|---|---|
| Unitario | Vitest / Jest | Funciones puras: formateo, validación, reducers, selectores, cálculos |
| Componente / hook | Testing Library (`@testing-library/react`, `/vue`, `/svelte`) + Vitest/Jest con `jsdom` o `happy-dom` | Lo que el usuario ve y hace: render, interacción, estados de carga y error |
| Red | MSW (Mock Service Worker) | Respuestas HTTP simuladas a nivel de red, sin mockear `fetch` a mano |
| E2E | Playwright / Cypress | Flujos críticos completos (login, checkout). Pocos y estables |

Empieza el ciclo TDD por el nivel más bajo que pueda expresar el comportamiento. Extraer la lógica de un componente a una función pura suele hacerla trivial de testear.

## Componentes: probar como el usuario

- Busca elementos por rol y nombre accesible: `getByRole('button', { name: /guardar/i })`. Después por label (`getByLabelText`) y por texto. `getByTestId` es el último recurso.
- Interactúa con `@testing-library/user-event` (`await user.click(...)`, `await user.type(...)`), no con `fireEvent` salvo casos especiales.
- Para contenido asíncrono usa `findBy*` o `waitFor`, nunca `setTimeout` en el test.
- No compruebes estado interno, props de hijos, nombres de clases CSS ni llamadas a hooks. Si un refactor visualmente idéntico rompe el test, el test estaba acoplado a la implementación.
- Los *snapshots* no sirven como primer test de TDD: no expresan un comportamiento y se aceptan sin leer. Úsalos, si acaso, para salidas serializadas estables y pequeñas.

```tsx
it('muestra un error cuando el email no es válido', async () => {
  const user = userEvent.setup();
  render(<SignupForm onSubmit={vi.fn()} />);

  await user.type(screen.getByLabelText(/email/i), 'no-es-email');
  await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/email no válido/i);
});
```

## Hooks

Prueba hooks con `renderHook` solo si contienen lógica propia (debounce, máquinas de estado). Si el hook solo compone otros, prueba el componente que lo usa.

```ts
it('devuelve el valor tras el retardo', () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), { initialProps: { value: 'a' } });

  rerender({ value: 'ab' });
  expect(result.current).toBe('a');
  act(() => vi.advanceTimersByTime(300));
  expect(result.current).toBe('ab');
  vi.useRealTimers();
});
```

## Datos remotos

- Con MSW define handlers por test (`server.use(http.get('/api/users', () => HttpResponse.json([...])))`) para cubrir éxito, vacío y error.
- Prueba los tres estados: cargando, datos y error. El estado de error es el que más se olvida.

## E2E (Playwright)

- Un test por flujo de negocio crítico, no por pantalla.
- Selectores por rol (`page.getByRole`), esperas implícitas de los locators; nada de `waitForTimeout`.
- Datos aislados por test (usuario creado vía API en el `beforeEach`), para poder ejecutar en paralelo.
