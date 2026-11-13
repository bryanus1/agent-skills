# Ejemplo: sesión TDD completa

**Pedido:** "Con TDD, implementa `calculateShipping(order)`: envío gratis desde 50 €, si no 4,99 €; las zonas remotas pagan 10 € extra siempre; un carrito vacío no paga envío."

Proyecto con Vitest; `detect-test-runner.mjs` informa `pnpm exec vitest run <file>` y la convención `*.test.ts` colocada junto al código.

## Lista de tests

```text
[ ] carrito vacío → 0
[ ] subtotal 20 → 4.99
[ ] subtotal 50 (límite exacto) → 0
[ ] zona remota con subtotal 20 → 14.99
[ ] zona remota con subtotal 80 → 10
```

## Ciclo 1 — carrito vacío

🔴 Test:

```ts
import { describe, it, expect } from 'vitest';
import { calculateShipping } from './shipping';

describe('calculateShipping', () => {
  it('no cobra envío a un carrito vacío', () => {
    expect(calculateShipping({ items: [], zone: 'mainland' })).toBe(0);
  });
});
```

Stub en `shipping.ts`: `export function calculateShipping(order: Order): number { throw new Error('not implemented'); }`

`pnpm exec vitest run src/shipping.test.ts` → **falla**: `Error: not implemented`. Es el motivo esperado.

🟢 Fake it: `return 0;` → verde.

🔵 Nada que refactorizar.

## Ciclo 2 — tarifa base

🔴 `it('cobra 4.99 si el subtotal es menor que 50', ...)` con un ítem de 20 € → falla: `expected 0 to be 4.99`.

🟢 Triangulación: ahora hay dos ejemplos, así que se generaliza lo que ambos exigen:

```ts
const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
if (subtotal === 0) return 0;
return 4.99;
```

🔵 Extraer `BASE_RATE = 4.99` y la función `subtotalOf(order)`. Tests en verde. En los tests se extrae `buildOrder({ subtotal, zone })`.

## Ciclo 3 — límite exacto de envío gratis

🔴 `buildOrder({ subtotal: 50 })` → `expected 4.99 to be 0`.

🟢 `if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;` → verde. (Al escribir el test se descubre un caso nuevo: ¿49.999 por redondeo? Se añade a la lista en vez de resolverlo ahora.)

## Ciclos 4 y 5 — zona remota

🔴 Remota con 20 → `expected 4.99 to be 14.99`. 🟢 `+ (order.zone === 'remote' ? REMOTE_SURCHARGE : 0)`.

🔴 Remota con 80 → `expected 0 to be 10` (el `return 0` temprano se saltaba el recargo). 🟢 Reestructurar: calcular la tarifa base y luego sumar el recargo.

🔵 Resultado final legible:

```ts
export function calculateShipping(order: Order): number {
  const subtotal = subtotalOf(order);
  if (subtotal === 0) return 0;
  const base = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : BASE_RATE;
  return base + surchargeFor(order.zone);
}
```

## Reporte

| # | Test | Rojo | Verde | Refactor |
|---|---|---|---|---|
| 1 | carrito vacío → 0 | not implemented | fake it | — |
| 2 | subtotal 20 → 4.99 | expected 0 to be 4.99 | triangulación | `BASE_RATE`, `subtotalOf`, `buildOrder` |
| 3 | subtotal 50 → 0 | expected 4.99 to be 0 | obvia | `FREE_SHIPPING_THRESHOLD` |
| 4 | remota 20 → 14.99 | expected 4.99 to be 14.99 | obvia | — |
| 5 | remota 80 → 10 | expected 0 to be 10 | reestructurar | `surchargeFor(zone)` |

Suite completa: `pnpm exec vitest run` → 5 tests en verde. Pendiente: redondeo de subtotales con decimales (añadido a la lista, no pedido).
