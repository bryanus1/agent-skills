# Ejemplo: servicio de pedidos

**Pedido:** "Este `OrderService` es un monstruo, ayúdame con SOLID."

## Código de partida

```ts
import nodemailer from 'nodemailer';
import { db } from './db';

export class OrderService {
  async checkout(dto: { email: string; items: { sku: string; price: number; qty: number }[]; coupon?: string; country: string }) {
    if (!dto.items.length) throw new Error('empty');
    let total = 0;
    for (const i of dto.items) total += i.price * i.qty;
    if (dto.coupon === 'WELCOME10') total *= 0.9;
    else if (dto.coupon === 'VIP20') total *= 0.8;
    if (dto.country === 'ES') total *= 1.21;
    else if (dto.country === 'FR') total *= 1.2;
    const { rows } = await db.query('insert into orders(email,total) values($1,$2) returning id', [dto.email, total]);
    await nodemailer.createTransport({ host: process.env.SMTP_HOST }).sendMail({ to: dto.email, subject: 'Pedido ' + rows[0].id, text: 'Total: ' + total });
    return { id: rows[0].id, total };
  }
}
```

## Diagnóstico

| Principio | Ubicación | Evidencia | ¿Duele hoy? | Decisión |
|---|---|---|---|---|
| DIP | líneas 2, 14-15 | El servicio importa `db` y `nodemailer`; para probarlo hay que tener BD y SMTP | Sí: no hay tests | **Aplicar**: interfaces `OrderRepository` y `OrderNotifier` |
| SRP | `checkout` completo | Precios, cupones, impuestos, SQL y email: cinco razones de cambio | Sí: cada campaña toca este archivo | **Aplicar**: extraer cálculo de precio como funciones puras |
| OCP | cupones (líneas 7-8) e impuestos (10-11) | Cadenas `if/else` sobre cupón y país | Parcial: 2 y 2 casos, un solo sitio | **Aplazar**: usar tablas de datos (barato), sin clases |
| LSP / ISP | — | No hay herencia; las interfaces nuevas nacen pequeñas | No | **No aplicar** |

Decisión explícita: **no** crear `CouponStrategy`, `TaxStrategy` ni factorías. Con dos cupones y dos países en un único sitio, una tabla `Record` basta; se reevaluará con una tercera variante o si las reglas empiezan a necesitar lógica propia.

## Resultado

```ts
// pricing.ts: reglas puras, sin I/O
const COUPON_FACTOR: Record<string, number> = { WELCOME10: 0.9, VIP20: 0.8 };
const VAT_BY_COUNTRY: Record<string, number> = { ES: 0.21, FR: 0.2 };

export function priceOrder(items: Item[], coupon: string | undefined, country: string): number {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discounted = subtotal * (coupon ? COUPON_FACTOR[coupon] ?? 1 : 1);
  return discounted * (1 + (VAT_BY_COUNTRY[country] ?? 0));
}

// order.service.ts: orquestación; depende de abstracciones definidas aquí
export interface OrderRepository { create(order: { email: string; total: number }): Promise<{ id: string }>; }
export interface OrderNotifier { orderConfirmed(order: { id: string; total: number }, email: string): Promise<void>; }

export class OrderService {
  constructor(private readonly orders: OrderRepository, private readonly notifier: OrderNotifier) {}

  async checkout(dto: CheckoutDto) {
    if (!dto.items.length) throw new EmptyOrderError();
    const total = priceOrder(dto.items, dto.coupon, dto.country);
    const { id } = await this.orders.create({ email: dto.email, total });
    await this.notifier.orderConfirmed({ id, total }, dto.email);
    return { id, total };
  }
}
```

`PgOrderRepository` y `SmtpOrderNotifier` viven en `infra/` y se componen en `main.ts`. Los tests de `priceOrder` no necesitan nada; los de `OrderService` usan un repositorio en memoria y un notificador espía.

> En un refactor real, el cambio de comportamiento no declarado (un cupón desconocido se ignora igual que antes, pero el error `Error('empty')` pasa a `EmptyOrderError`) se señala en el reporte para que el usuario lo confirme.

## Fuera de alcance

- Redondeo de importes con coma flotante (guardar céntimos como enteros).
- El texto del email está acoplado al total; si marketing quiere plantillas, será otra tarea.
