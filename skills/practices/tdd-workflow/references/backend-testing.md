# TDD en backend

## Qué probar en cada nivel

| Nivel | Qué cubre | Dobles |
|---|---|---|
| Unitario (dominio / casos de uso) | Reglas de negocio, validaciones, cálculos, transiciones de estado | Fakes en memoria para repositorios, reloj y servicios externos |
| Integración | Repositorios contra una BD real (contenedor o BD de test), adaptadores HTTP contra un servidor simulado | Ninguno en el componente bajo prueba |
| HTTP / contrato | Rutas, validación de entrada, códigos de estado, formato de errores, auth | Casos de uso reales con fakes en los bordes, o la app completa con BD de test |
| E2E | Flujos completos entre servicios | Mínimos |

El ciclo TDD suele empezar **desde fuera hacia dentro**: un test HTTP que describe el contrato (rojo), y luego tests unitarios para cada regla de negocio que aparece al implementarlo. Para lógica de dominio pura, empieza directamente por el unitario.

## Casos de uso / servicios

- Inyecta dependencias por constructor; en el test pasa fakes (`InMemoryUserRepository`, `FixedClock`).
- Verifica el resultado y el estado final, no la secuencia de llamadas.
- Cubre explícitamente los errores de dominio (`InsufficientStockError`, `CouponExpiredError`) con `await expect(promise).rejects.toThrow(...)`.

```ts
it('rechaza la reserva si no hay stock', async () => {
  const stock = new InMemoryStockRepository({ 'sku-1': 0 });
  const reserve = new ReserveStock(stock);

  await expect(reserve.execute({ sku: 'sku-1', qty: 1 })).rejects.toThrow(InsufficientStockError);
});
```

## NestJS

- Unitario: instancia la clase directamente (`new InvoiceService(fakeRepo)`); no necesitas `Test.createTestingModule` para lógica pura.
- Integración del módulo: `Test.createTestingModule({ imports: [InvoiceModule] }).overrideProvider(PAYMENT_GATEWAY).useValue(fakeGateway).compile()`.
- HTTP: `app = moduleRef.createNestApplication(); await app.init();` y `request(app.getHttpServer()).post('/invoices').send(dto).expect(201)` con `supertest`. Aplica en el test los mismos `ValidationPipe`/filtros globales que en `main.ts`, o el contrato probado no será el real.

## Express / Fastify / Hono

- Exporta la app sin llamar a `listen` para poder usar `supertest` (Express) o `app.inject()` (Fastify) / `app.request()` (Hono).

## Base de datos

- Repositorios: tests de integración contra el motor real (Testcontainers o una BD de test), no contra SQLite si producción es Postgres.
- Aísla cada test: transacción con rollback, truncado en `beforeEach` o esquema por worker.
- No mockees el ORM. Si un caso de uso necesita el repositorio, usa el fake en memoria en el unitario y deja el ORM para el test de integración del repositorio.

## Contrato de errores HTTP

Por cada endpoint, prueba al menos: éxito, entrada inválida (400/422 con detalle de campos), no encontrado (404), no autorizado (401/403) y conflicto si aplica (409). Comprueba el formato del cuerpo de error, no solo el código.
