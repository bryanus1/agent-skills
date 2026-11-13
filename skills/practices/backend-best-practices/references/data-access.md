# Acceso a datos

## Contenido
1. [Consultas seguras](#consultas-seguras)
2. [N+1 y consultas en bucle](#n1-y-consultas-en-bucle)
3. [Transacciones y concurrencia](#transacciones-y-concurrencia)
4. [Índices y rendimiento](#índices-y-rendimiento)
5. [Migraciones](#migraciones)

## Consultas seguras

- **Siempre parametrizadas**: `db.query('SELECT … WHERE id = $1', [id])`. Concatenar o interpolar valores en SQL es inyección, también en `ORDER BY` y nombres de columna (usa lista permitida).
- Con ORM, evita las funciones "raw" con interpolación; si son necesarias, usa los parámetros del propio ORM.
- Selecciona solo las columnas necesarias; no expongas filas completas del ORM como respuesta (filtran campos internos como `passwordHash`): mapea a un DTO de salida.

## N+1 y consultas en bucle

**Señal:** un `for`/`map` que hace una consulta por elemento.

```ts
// Evitar: 1 + N consultas
const orders = await db.query('SELECT * FROM orders WHERE user_id = $1', [userId]);
for (const o of orders) o.items = await db.query('SELECT * FROM items WHERE order_id = $1', [o.id]);

// Preferir: 2 consultas (o un JOIN)
const items = await db.query('SELECT * FROM items WHERE order_id = ANY($1)', [orders.map(o => o.id)]);
```

Con ORM: carga anticipada (`include`, `relations`, `joinedload`) o un `DataLoader` en GraphQL. Confirma con el log de consultas, no por intuición.

## Transacciones y concurrencia

- Varios cambios que deben confirmarse o revertirse juntos van en **una transacción** (crear pedido + descontar stock). Sin ella, un fallo a mitad deja datos inconsistentes.
- Mantén las transacciones **cortas** y sin llamadas de red dentro.
- **Condiciones de carrera** (comprobar y luego escribir): usa restricciones únicas, `UPDATE … WHERE stock >= n`, bloqueo optimista (columna de versión) o bloqueo de fila, en lugar de "leer, decidir en código, escribir".
- Las restricciones de integridad (`UNIQUE`, `FOREIGN KEY`, `NOT NULL`, `CHECK`) las impone la base de datos; la validación del código no las sustituye.
- Dinero: enteros en la unidad mínima o `DECIMAL`, nunca `float`.

## Índices y rendimiento

- Indexa las columnas de **filtros, joins y ordenaciones reales** de consultas frecuentes; verifica con `EXPLAIN (ANALYZE)`.
- Un índice compuesto respeta el orden de las columnas (igualdad primero, rango después).
- Cada índice encarece las escrituras: no añadas "por si acaso".
- Cuidado con funciones sobre la columna en el `WHERE` (`WHERE lower(email) = …` no usa un índice simple), `LIKE '%x'` y `OFFSET` enormes.
- Pool de conexiones con tamaño acotado; libera siempre la conexión (`finally`).

## Migraciones

- Versionadas, repetibles y revisadas; nunca editar una migración ya aplicada.
- **Compatibles hacia atrás** en despliegues sin parada: añadir columna nullable → desplegar código → rellenar → hacer obligatoria; eliminar columnas en un despliegue posterior al que deja de usarlas.
- Operaciones peligrosas en tablas grandes (añadir índice sin `CONCURRENTLY` en Postgres, cambiar tipos) requieren plan; confirmar con el usuario antes de ejecutarlas contra datos reales.
