# SRP: responsabilidad única

> Una unidad debe tener **una razón para cambiar**: un único actor o decisión de negocio que pueda pedir cambios en ella.

SRP no significa "hace una sola cosa" (eso es de funciones, ver `clean-code`). Significa que **personas o decisiones distintas** no deben obligar a editar el mismo archivo. Una clase `InvoicePrinter` puede tener veinte métodos y cumplir SRP si todos cambian por el mismo motivo.

## Cómo detectarlo

- El archivo se modifica en commits con motivos no relacionados (cambio de tarifa, cambio de formato de email, cambio de esquema SQL).
- Imports de capas distintas en el mismo archivo: HTTP/framework, ORM o SQL, SDKs de terceros, formato de presentación.
- Nombres como `Manager`, `Helper`, `Service` que acumulan de todo.
- Cada test necesita montar medio sistema para probar una regla.

## Backend

### Antes

```ts
export class OrderService {
  async checkout(dto: CheckoutDto) {
    if (!dto.items.length) throw new Error('empty');                     // validación
    const subtotal = dto.items.reduce((s, i) => s + i.price * i.qty, 0); // regla de precio
    const total = subtotal * 1.21;                                       // regla de impuestos
    const order = await db.query('insert into orders ...', [total]);     // persistencia
    await smtp.send({ to: dto.email, subject: 'Pedido', body: `...${total}` }); // notificación
    return order;
  }
}
```

Cambia por: reglas de impuestos (finanzas), esquema de BD (datos), texto del email (marketing).

### Después

```ts
// pricing.ts: reglas de precio e impuestos, puras y testeables
export const totalWithTax = (items: Item[], vatRate: number) =>
  items.reduce((s, i) => s + i.price * i.qty, 0) * (1 + vatRate);

// order.service.ts: orquesta el caso de uso, no conoce SQL ni SMTP
export class OrderService {
  constructor(private orders: OrderRepository, private notifier: OrderNotifier) {}

  async checkout(dto: CheckoutDto) {
    if (!dto.items.length) throw new EmptyOrderError();
    const order = await this.orders.create({ total: totalWithTax(dto.items, VAT_RATE) });
    await this.notifier.orderConfirmed(order, dto.email);
    return order;
  }
}
```

El servicio sigue siendo uno, pero ahora **orquesta**; cada decisión vive donde su actor puede cambiarla sin tocar las demás.

## Frontend

### Antes: componente con fetch, estado, reglas y UI

```tsx
function Checkout() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => { fetch('/api/cart').then(r => r.json()).then(setItems); }, []);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0) * 1.21;
  return <div>{items.map(/* ... */)} <strong>{total.toFixed(2)} €</strong></div>;
}
```

### Después

```tsx
const totalWithTax = (items: Item[]) => /* regla pura, testeable sin React */;

function useCart() { /* acceso a datos: fetch, caché, errores */ }

function CartSummary({ items }: { items: Item[] }) { /* solo presentación */ }

function Checkout() {
  const { items } = useCart();
  return <CartSummary items={items} total={totalWithTax(items)} />;
}
```

## Cómo refactorizar

1. Identifica las razones de cambio y nómbralas (precio, persistencia, notificación).
2. Extrae primero lo **puro** (cálculos, reglas) a funciones: es lo más barato y lo que más gana en tests.
3. Extrae después lo que toca el exterior (BD, red, correo) detrás de una interfaz pequeña (ver [DIP](dip.md)).
4. El original se queda como **orquestador** con la misma firma pública.

## Falsos positivos

- Una clase larga cuyos métodos cambian siempre juntos: es cohesión, no violación.
- Dividir por tamaño sin criterio produce `OrderValidator`, `OrderCalculator`, `OrderSaver`… que siempre se editan a la vez: has creado acoplamiento disperso, no SRP.
- Un controlador de framework que traduce HTTP a un caso de uso y devuelve la respuesta ya cumple su única responsabilidad.
