# Patrones de comportamiento

## Contenido

1. [Strategy](#strategy)
2. [Observer / eventos](#observer--eventos)
3. [State](#state)
4. [Command](#command)
5. [Template Method](#template-method)

## Strategy

**Problema:** varias formas intercambiables de hacer lo mismo (calcular una tarifa, validar, exportar, ordenar), elegidas en tiempo de ejecución, y un `switch` que se repite o crece.

**Escala de soluciones, de menos a más pesada. Usa la primera que baste:**

1. **Tabla de datos** si las variantes solo difieren en valores (`{ standard: 4.99, express: 9.99 }`).
2. **Tabla de funciones** si difieren en comportamiento sin estado.
3. **Clases con interfaz** si cada variante necesita estado o dependencias propias.

```ts
// 2. Tabla de funciones
type PricingRule = (order: Order) => number;

const PRICING: Record<Tier, PricingRule> = {
  basic: (o) => o.subtotal,
  pro: (o) => o.subtotal * 0.9,
  enterprise: (o) => Math.max(o.subtotal * 0.8, MIN_ENTERPRISE_FEE),
};

const priceFor = (order: Order) => PRICING[order.tier](order);
```

```ts
// 3. Clases, cuando hay estado o dependencias
interface PaymentMethod { pay(amountCents: number): Promise<PaymentResult>; }
class CardPayment implements PaymentMethod { constructor(private gateway: CardGateway) {} /* ... */ }
class BankTransferPayment implements PaymentMethod { constructor(private bank: BankApi) {} /* ... */ }
```

**Cuándo no:** un `switch` pequeño, estable y en un solo sitio; una sola variante.

## Observer / eventos

**Problema:** varios módulos necesitan reaccionar a un hecho (`OrderPlaced`) sin que quien lo origina los conozca.

**Cuándo sí:** efectos secundarios independientes (email, analítica, inventario) que no deben bloquear ni acoplarse al flujo principal; UI que se suscribe a un estado.

**Cuándo no:** hay un único interesado (un callback o una llamada directa es más claro), o el orden y la transaccionalidad importan (los eventos hacen el flujo implícito y difícil de seguir).

```ts
type Handler<E> = (event: E) => void | Promise<void>;

class EventBus<Events extends Record<string, unknown>> {
  private handlers: { [K in keyof Events]?: Handler<Events[K]>[] } = {};
  on<K extends keyof Events>(name: K, handler: Handler<Events[K]>) { (this.handlers[name] ??= []).push(handler); }
  async emit<K extends keyof Events>(name: K, event: Events[K]) { for (const h of this.handlers[name] ?? []) await h(event); }
}
```

Cuidados: define cómo se tratan los errores de un manejador (¿rompen el flujo?), evita bucles de eventos, **devuelve una función para desuscribirse** (fugas de memoria en UI) y no uses eventos para flujos que son una secuencia de negocio explícita. En NestJS: `@nestjs/event-emitter`; en el navegador: `EventTarget`/`useSyncExternalStore`.

## State

**Problema:** el comportamiento de un objeto cambia según su estado y las transiciones válidas son un requisito de negocio (pedido: `draft → paid → shipped → delivered`).

**Alternativa simple:** un `enum`/unión de literales más una tabla de transiciones permitidas.

```ts
type OrderStatus = 'draft' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

function transition(order: Order, to: OrderStatus): Order {
  if (!TRANSITIONS[order.status].includes(to)) throw new InvalidTransitionError(order.status, to);
  return { ...order, status: to };
}
```

**Cuándo escalar a clases State o a una máquina de estados (`xstate`):** cada estado tiene lógica propia y sustancial, hay estados anidados/paralelos o efectos asociados a transiciones. En UI, formularios con múltiples pasos o flujos asíncronos (`idle | loading | success | error`) se modelan mejor con **uniones discriminadas** que con booleanos sueltos (`isLoading`, `isError`):

```ts
type State<T> = { status: 'idle' } | { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: Error };
```

## Command

**Problema:** convertir una acción en un objeto para ponerla en cola, registrarla, reintentarla, deshacerla o ejecutarla más tarde.

**Cuándo sí:** deshacer/rehacer en un editor, colas de trabajos, auditoría de acciones, macros, reintentos.

**Cuándo no:** una llamada directa basta. No lo uses para "desacoplar" una función de su único llamador.

```ts
interface Command { execute(): Promise<void>; undo?(): Promise<void>; }

class RenameFile implements Command {
  constructor(private fs: FileSystem, private from: string, private to: string) {}
  execute() { return this.fs.rename(this.from, this.to); }
  undo() { return this.fs.rename(this.to, this.from); }
}
```

En un backend, los *jobs* de BullMQ/SQS son comandos serializados: `{ type: 'SendInvoice', invoiceId }` más un manejador.

## Template Method

**Problema:** un proceso con pasos fijos y algunos pasos variables.

**En TS/JS prefiere pasar los pasos variables como parámetros (composición) en lugar de heredar:**

```ts
async function importFile<T>(file: File, steps: { parse(raw: string): T[]; validate(row: T): void; persist(rows: T[]): Promise<void> }) {
  const rows = steps.parse(await file.text());
  rows.forEach(steps.validate);
  await steps.persist(rows);
}
```

**Versión clásica con herencia** (clase base abstracta con `abstract parse()`), válida si el proyecto ya usa jerarquías y los pasos comparten estado, pero tiene el coste de acoplar subclases a la base (riesgo de violar LSP). Si ves una jerarquía de un solo nivel con dos subclases, probablemente una función que reciba los pasos sea más simple.
