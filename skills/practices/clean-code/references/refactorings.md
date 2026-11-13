# Catálogo de refactorings

Transformaciones pequeñas que conservan el comportamiento. Aplica una cada vez y ejecuta los tests entre pasos. Los ejemplos están en TypeScript.

## Contenido

1. [Extraer función](#extraer-función)
2. [Guard clauses](#guard-clauses)
3. [Objeto de parámetros](#objeto-de-parámetros)
4. [Separar argumento bandera](#separar-argumento-bandera)
5. [Constante con nombre](#constante-con-nombre)
6. [Variable explicativa](#variable-explicativa)
7. [Tabla de búsqueda en lugar de condicionales](#tabla-de-búsqueda-en-lugar-de-condicionales)
8. [Separar consulta y comando](#separar-consulta-y-comando)
9. [Dividir bucle / pipeline](#dividir-bucle--pipeline)
10. [Error de dominio en lugar de error genérico](#error-de-dominio-en-lugar-de-error-genérico)
11. [Extraer hook (frontend)](#extraer-hook-frontend)
12. [Renombrar](#renombrar)

## Extraer función

**Cuándo:** una función tiene secciones, comentarios que explican bloques o mezcla niveles de abstracción.

```ts
// Antes
function printInvoice(invoice: Invoice) {
  // calcular total
  let total = 0;
  for (const line of invoice.lines) total += line.price * line.qty;
  // imprimir
  console.log(`Factura ${invoice.id}: ${total.toFixed(2)} €`);
}

// Después
function printInvoice(invoice: Invoice) {
  console.log(`Factura ${invoice.id}: ${formatEuros(totalOf(invoice))}`);
}
const totalOf = (invoice: Invoice) => invoice.lines.reduce((sum, l) => sum + l.price * l.qty, 0);
const formatEuros = (amount: number) => `${amount.toFixed(2)} €`;
```

El nombre extraído debe decir *qué* hace, no *cómo*. Si solo se te ocurre un nombre como `doStuffPart2`, el corte está mal.

## Guard clauses

**Cuándo:** anidamiento profundo por validaciones o casos especiales.

```ts
// Antes
function payout(user: User) {
  if (user) {
    if (user.isActive) {
      if (user.balance > 0) {
        return transfer(user);
      }
    }
  }
  return null;
}

// Después
function payout(user: User | null) {
  if (!user || !user.isActive) return null;
  if (user.balance <= 0) return null;
  return transfer(user);
}
```

## Objeto de parámetros

**Cuándo:** más de 3 parámetros, o parámetros que siempre viajan juntos.

```ts
// Antes
searchFlights('MAD', 'BCN', '2026-03-01', '2026-03-05', 2, true);

// Después
searchFlights({ from: 'MAD', to: 'BCN', departure: '2026-03-01', return: '2026-03-05', passengers: 2, flexibleDates: true });
```

Cambiar la firma de una función exportada rompe a sus llamadores: actualiza todos o mantén temporalmente la firma antigua delegando en la nueva.

## Separar argumento bandera

```ts
// Antes
function getPrice(product: Product, isMember: boolean) { ... }

// Después
function getRegularPrice(product: Product) { ... }
function getMemberPrice(product: Product) { ... }
```

Si la bandera es un modo con más de dos valores, usa una unión de literales (`mode: 'regular' | 'member' | 'wholesale'`).

## Constante con nombre

```ts
// Antes
if (subtotal >= 50) shipping = 0;

// Después
const FREE_SHIPPING_THRESHOLD_EUR = 50;
if (subtotal >= FREE_SHIPPING_THRESHOLD_EUR) shipping = 0;
```

Incluye la unidad en el nombre cuando no sea obvia (`_MS`, `_EUR`, `_KG`).

## Variable explicativa

```ts
// Antes
if (order.status === 'paid' && Date.now() - order.paidAt < 14 * 24 * 3600 * 1000 && !order.refunded) { ... }

// Después
const REFUND_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const isWithinRefundWindow = Date.now() - order.paidAt < REFUND_WINDOW_MS;
const isRefundable = order.status === 'paid' && isWithinRefundWindow && !order.refunded;
if (isRefundable) { ... }
```

## Tabla de búsqueda en lugar de condicionales

**Cuándo:** cadenas de `if`/`switch` que solo mapean un valor a otro.

```ts
// Antes
function statusLabel(status: Status) {
  return status === 'pending' ? 'Pendiente' : status === 'paid' ? 'Pagado' : status === 'refunded' ? 'Reembolsado' : 'Desconocido';
}

// Después
const STATUS_LABELS: Record<Status, string> = { pending: 'Pendiente', paid: 'Pagado', refunded: 'Reembolsado' };
const statusLabel = (status: Status) => STATUS_LABELS[status];
```

Con `Record<Status, string>` el compilador avisa si falta un estado. Cuando cada caso tiene *comportamiento* distinto (no solo un valor), considera Strategy o polimorfismo.

## Separar consulta y comando

```ts
// Antes: "get" que además escribe
function getCart(userId: string) {
  const cart = carts.get(userId) ?? createCart(userId);
  analytics.track('cart_viewed', { userId });
  return cart;
}

// Después
function getOrCreateCart(userId: string) { return carts.get(userId) ?? createCart(userId); }
// el tracking se hace explícitamente donde se muestra el carrito
```

## Dividir bucle / pipeline

```ts
// Antes
let total = 0;
const names: string[] = [];
for (const u of users) {
  if (u.active) {
    total += u.spent;
    names.push(u.name.toUpperCase());
  }
}

// Después
const activeUsers = users.filter((u) => u.active);
const total = activeUsers.reduce((sum, u) => sum + u.spent, 0);
const names = activeUsers.map((u) => u.name.toUpperCase());
```

En rutas calientes con colecciones grandes, mide antes de cambiar un bucle único por varios recorridos.

## Error de dominio en lugar de error genérico

```ts
// Antes
if (invoice.paid) throw new Error('error');

// Después
export class InvoiceAlreadyPaidError extends Error {
  constructor(readonly invoiceId: string) {
    super(`Invoice ${invoiceId} is already paid`);
    this.name = 'InvoiceAlreadyPaidError';
  }
}
if (invoice.paid) throw new InvoiceAlreadyPaidError(invoice.id);
```

La capa HTTP traduce el error de dominio al código adecuado (409) en un único sitio.

## Extraer hook (frontend)

```tsx
// Antes: el componente gestiona fetch, estados y render
function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => { fetchOrders().then(setOrders).catch(setError); }, []);
  if (error) return <ErrorState error={error} />;
  return <OrderList orders={orders} />;
}

// Después
function useOrders() {
  const [state, setState] = useState<{ orders: Order[]; error: Error | null }>({ orders: [], error: null });
  useEffect(() => {
    let cancelled = false;
    fetchOrders()
      .then((orders) => !cancelled && setState({ orders, error: null }))
      .catch((error) => !cancelled && setState({ orders: [], error }));
    return () => { cancelled = true; };
  }, []);
  return state;
}

function Orders() {
  const { orders, error } = useOrders();
  if (error) return <ErrorState error={error} />;
  return <OrderList orders={orders} />;
}
```

Si el proyecto ya usa una librería de datos (TanStack Query, SWR, RTK Query), el refactor correcto es usarla, no escribir otro hook a mano.

## Renombrar

El refactor más barato y uno de los más valiosos. Usa el renombrado del IDE o del language server (actualiza todas las referencias) en lugar de buscar y reemplazar texto. Para exports públicos, comprueba los usos fuera del archivo antes de renombrar.
