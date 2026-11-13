# Test doubles

Un *test double* sustituye a una dependencia real durante un test. Elegir el tipo correcto evita tests frágiles que se rompen con cada refactor.

## Tipos

| Tipo | Qué hace | Úsalo para |
|---|---|---|
| **Dummy** | Se pasa pero nunca se usa | Rellenar parámetros obligatorios |
| **Stub** | Devuelve respuestas fijas | Controlar entradas indirectas (lo que la dependencia devuelve) |
| **Spy** | Registra cómo se le llamó | Verificar salidas indirectas cuando no hay otro efecto observable |
| **Mock** | Spy con expectativas preprogramadas | Protocolos donde la interacción *es* el comportamiento (enviar un email, publicar un evento) |
| **Fake** | Implementación funcional simplificada | Repositorios en memoria, reloj controlable, cola en memoria |

## Reglas de uso

1. **Dobla solo los bordes del sistema**: red, base de datos, sistema de archivos, reloj, aleatoriedad, servicios de terceros. La lógica de dominio propia se prueba real.
2. **Prefiere fakes a mocks.** Un `InMemoryOrderRepository` permite verificar el estado final (`repo.findById(id)`) en lugar de verificar llamadas (`expect(repo.save).toHaveBeenCalledWith(...)`), que acopla el test a la implementación.
3. **Verifica interacciones solo cuando la interacción es el resultado.** "Se envió un email de bienvenida" sí; "se llamó a `calculateTax` antes que a `applyDiscount`" no.
4. **No mockees lo que no te pertenece.** En lugar de mockear `axios` o el SDK de Stripe, crea un adaptador propio (`PaymentGateway`) con una interfaz pequeña y dobla esa interfaz. Prueba el adaptador real con tests de integración.
5. **Si necesitas más de 2–3 dobles para un test**, la unidad tiene demasiadas dependencias. Es una señal de diseño (ver SRP), no un problema del test.

## Ejemplos (TypeScript)

### Fake de repositorio

```ts
export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
}

export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();
  async save(order: Order) { this.orders.set(order.id, structuredClone(order)); }
  async findById(id: string) { return this.orders.get(id) ?? null; }
}

it('persiste el pedido confirmado', async () => {
  const repo = new InMemoryOrderRepository();
  const service = new OrderService(repo);

  const order = await service.confirm(buildDraftOrder({ id: 'o-1' }));

  expect(await repo.findById('o-1')).toMatchObject({ status: 'confirmed' });
});
```

### Reloj inyectable (en vez de mockear `Date`)

```ts
type Clock = () => Date;

export function isCouponValid(coupon: Coupon, now: Clock = () => new Date()) {
  return coupon.expiresAt.getTime() > now().getTime();
}

it('rechaza un cupón caducado', () => {
  const now = () => new Date('2026-01-10T00:00:00Z');
  expect(isCouponValid({ expiresAt: new Date('2026-01-09T23:59:59Z') }, now)).toBe(false);
});
```

Si el código ya usa `Date` global y no puedes inyectar, usa los fake timers del runner (`vi.useFakeTimers()` / `vi.setSystemTime()`, `jest.useFakeTimers()`, o `mock.timers` en `node:test`) y restáuralos en `afterEach`.

### Spy cuando la interacción es el resultado

```ts
it('envía el email de bienvenida al registrarse', async () => {
  const mailer = { send: vi.fn().mockResolvedValue(undefined) };
  const signup = new SignupService(new InMemoryUserRepository(), mailer);

  await signup.register({ email: 'ana@example.com' });

  expect(mailer.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'ana@example.com', template: 'welcome' }));
});
```
