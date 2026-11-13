# Ejemplo: revisión de un módulo de pedidos

**Pedido:** "Revisa `orders-api.ts` y aplica buenas prácticas de backend."

## Código de partida (resumido)

```ts
export async function listOrders(req: Req) {
  const rows = await db.query(`SELECT * FROM orders WHERE status = '${req.query.status}'`);   // línea 8
  for (const o of rows) o.items = await db.query(`SELECT * FROM items WHERE order_id = '${o.id}'`);  // línea 9
  return { status: 200, body: rows };
}

export async function getOrder(req: Req) {
  const [order] = await db.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  return { status: 200, body: order };                                                         // línea 16
}

export async function createOrder(req: Req) {
  try {
    const order = await db.insert('orders', { ...req.body });                                  // línea 21
    return { status: 200, body: order };
  } catch (err) {
    return { status: 200, body: { error: err.message, stack: err.stack } };                    // línea 25
  }
}
```

## Hallazgos

| # | Severidad | Área | Ubicación | Problema y efecto | Acción |
|---|---|---|---|---|---|
| 1 | Crítico | Seguridad | orders-api.ts:8,9 | SQL por interpolación con `req.query.status`: inyección SQL | Consulta parametrizada |
| 2 | Crítico | Seguridad | orders-api.ts:16 | `getOrder` no comprueba que el pedido sea del usuario autenticado (IDOR) | Comprobar propiedad; 404 si no es suyo |
| 3 | Crítico | Seguridad | orders-api.ts:21 | `{ ...req.body }` copia al pedido cualquier campo, incl. `userId` o `status` (*mass assignment*) | Validar y construir el objeto campo a campo; `userId` de la sesión |
| 4 | Importante | API | orders-api.ts:25 | Error con 200 y `err.stack` en el cuerpo: oculta fallos a los clientes y filtra detalles internos | 400/500 con mensaje genérico; registrar el detalle — **cambia el contrato** |
| 5 | Importante | Datos | orders-api.ts:9 | N+1: una consulta de items por pedido | Una consulta con `= ANY($1)` y agrupar |
| 6 | Importante | API | orders-api.ts:8 | Listado sin límite | `limit` por defecto 50, tope 100 |
| 7 | Menor | Logs | — | Sin registro de errores | Solo mencionado |

## Decisiones de no aplicar

- **No se añade capa de repositorio ni DTOs generales**: el módulo tiene tres funciones; la parametrización y una función de validación bastan.
- **No se introduce caché**: no hay medición que lo justifique.
- **No se añade transacción a `createOrder`**: hoy solo hace una escritura. Se añadirá cuando cree los items en la misma operación.

## Aviso de contrato

Los cambios 4 y 6 modifican códigos de estado y tamaño de respuesta. Se aplican solo tras confirmarlo con el usuario; si no, se dejan como recomendación.

## Reporte (resumen)

- **Aplicado:** 1, 2, 3 y 5; tests ✅ 5/5. **Pendiente de confirmación:** 4 y 6 (cambian el contrato).
- **No verificado:** rendimiento con volumen real de datos y la existencia del índice sobre `orders.status`.
