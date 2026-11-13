# Patrones de frontend y backend

## Contenido

**Backend**
1. [Repository](#repository)
2. [Result / Either](#result--either)
3. [Middleware / Chain of Responsibility](#middleware--chain-of-responsibility)
4. [Unit of Work y transacciones](#unit-of-work-y-transacciones)
5. [Idempotencia y Outbox](#idempotencia-y-outbox)

**Frontend**
6. [Custom Hook](#custom-hook)
7. [Compound Components](#compound-components)
8. [Container / Presentational](#container--presentational)
9. [Render props y Slots](#render-props-y-slots)
10. [Adapter de datos y estado remoto](#adapter-de-datos-y-estado-remoto)

---

## Repository

**Problema:** la lógica de negocio no debe conocer SQL, el ORM ni el formato de almacenamiento.

**Cuándo sí:** reglas de negocio no triviales que se prueban sin BD; probable cambio de almacenamiento; varias fuentes de datos. **Cuándo no:** CRUD simple donde el repositorio solo reenvía cada método del ORM (capa vacía) o donde el framework/ORM ya expone un repositorio suficiente.

```ts
// El dominio define lo que necesita, en lenguaje de negocio
export interface OrderRepository {
  findById(id: OrderId): Promise<Order | null>;
  findOverdue(now: Date): Promise<Order[]>;     // consultas con intención, no un `query(sql)` genérico
  save(order: Order): Promise<void>;
}
```

Reglas: métodos con **intención de negocio**; devuelve entidades de dominio, no filas del ORM; una implementación en memoria (`InMemoryOrderRepository`) para tests; los tests de integración del repositorio real contra la BD. No expongas el ORM (`QueryBuilder`) fuera de él.

## Result / Either

**Problema:** distinguir fallos **esperados** de negocio (stock insuficiente, cupón caducado) de errores inesperados, sin depender de excepciones para el flujo normal.

**Cuándo sí:** el llamador debe tratar cada fallo posible y el compilador debería obligarle; fallos frecuentes en el camino normal. **Cuándo no:** el proyecto ya usa excepciones de dominio de forma consistente: **no mezcles dos convenciones**; en ese caso, usa excepciones tipadas.

```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type PlaceOrderError = { type: 'OUT_OF_STOCK'; sku: string } | { type: 'COUPON_EXPIRED'; code: string };

async function placeOrder(input: PlaceOrderInput): Promise<Result<Order, PlaceOrderError>> {
  if (!(await stock.has(input.sku))) return { ok: false, error: { type: 'OUT_OF_STOCK', sku: input.sku } };
  return { ok: true, value: await orders.create(input) };
}

const result = await placeOrder(input);
if (!result.ok) return res.status(409).json(result.error);   // el compilador fuerza a comprobar
```

No instales librerías (`neverthrow`, `fp-ts`) sin confirmar; un tipo de cuatro líneas basta. Los errores **inesperados** (red caída, bug) siguen siendo excepciones.

## Middleware / Chain of Responsibility

**Problema:** un pipeline de pasos independientes para cada petición (auth, validación, logging, rate limit, manejo de errores) que se pueden componer.

Ya lo resuelven Express/Fastify/Hono (`app.use`), NestJS (guards, pipes, interceptors, filters) y los routers de tRPC. **Usa el mecanismo del framework**; no construyas una cadena propia salvo para pipelines fuera de HTTP (importaciones, procesamiento de mensajes).

Reglas: cada paso hace una sola cosa; el orden importa y debe estar documentado (auth antes de validación; manejo de errores el último); no pongas lógica de negocio en middleware.

## Unit of Work y transacciones

**Problema:** varios cambios que deben confirmarse o revertirse juntos.

La mayoría de ORMs ya implementan Unit of Work (Prisma `$transaction`, TypeORM `EntityManager`, Drizzle `transaction`). Define el **límite de la transacción en el caso de uso** y pásala a los repositorios, sin que el dominio conozca el ORM:

```ts
await this.tx.run(async (repos) => {   // `tx` es un puerto; su adaptador usa la transacción del ORM
  await repos.orders.save(order);
  await repos.stock.decrement(order.items);
});
```

**Cuándo no:** operaciones con una sola escritura. No abras una transacción larga alrededor de llamadas de red.

## Idempotencia y Outbox

**Problema:** reintentos o duplicados no deben repetir efectos (cobrar dos veces) y un cambio en BD debe publicar un evento de forma fiable.

- **Idempotency key** guardada con el resultado: si llega de nuevo la misma clave, se devuelve el resultado anterior.
- **Outbox:** escribe el evento en una tabla dentro de la misma transacción que el cambio y un proceso aparte lo publica. Evita el "guardé pero no publiqué".

Aplícalos solo donde el riesgo lo justifique (pagos, integraciones, mensajería); añaden infraestructura.

---

## Custom Hook

**Problema:** reutilizar lógica con estado (suscripciones, formularios, datos remotos, debounce) entre componentes.

```tsx
function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
```

Reglas: un hook expresa **una** preocupación; devuelve una forma estable y pequeña; limpia efectos; si no usa estado ni efectos, es una función normal. Es el equivalente funcional de Strategy/Observer en React.

## Compound Components

**Problema:** un conjunto de piezas relacionadas que comparten estado implícito (Tabs, Accordion, Select, Menu) y cuyo consumidor quiere controlar la composición, en lugar de recibir un API de 20 props.

```tsx
const TabsContext = createContext<{ active: string; setActive(id: string): void } | null>(null);

function Tabs({ defaultTab, children }: { defaultTab: string; children: React.ReactNode }) {
  const [active, setActive] = useState(defaultTab);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}
Tabs.Tab = function Tab({ id, children }: { id: string; children: React.ReactNode }) {
  const ctx = useTabs();
  return <button aria-selected={ctx.active === id} onClick={() => ctx.setActive(id)}>{children}</button>;
};
Tabs.Panel = function Panel({ id, children }: { id: string; children: React.ReactNode }) {
  return useTabs().active === id ? <div role="tabpanel">{children}</div> : null;
};
```

**Cuándo no:** componentes simples con pocas props; compón con `children`. Cuida la accesibilidad (roles, teclado), y considera librerías headless (Radix, React Aria) antes de implementarlo a mano.

## Container / Presentational

**Problema:** mezcla de acceso a datos y presentación en un componente, difícil de probar y de reutilizar.

Hoy se expresa con **hook + componente presentacional**: el hook obtiene/transforma datos; el componente solo recibe props y renderiza (fácil de probar y de mostrar en Storybook).

## Render props y Slots

**Problema:** un componente debe delegar parte del renderizado al consumidor (listas, tablas, virtualización) sin conocer su contenido. Usa `children` como función o props tipo slot (`header`, `footer`, `renderRow`) en lugar de bifurcar con banderas booleanas. Hoy suelen sustituirse por composición con `children` o por hooks; usa render props cuando el componente necesita **pasar datos** al contenido.

## Adapter de datos y estado remoto

**Problema:** los componentes dependen del formato del backend y duplican fetch, caché y estados de carga.

- Convierte la respuesta a un modelo de UI en **un solo sitio** (`toUser(dto)`), a la salida de la capa de datos.
- Usa la librería de datos que ya tenga el proyecto (TanStack Query, SWR, RTK Query) en lugar de reimplementar caché e invalidación con `useEffect`.
- Modela los estados asíncronos como unión discriminada (`idle | loading | success | error`), no como booleanos sueltos.
- Mantén el **estado del servidor** (datos remotos) separado del **estado de UI** (modales, filtros): cada uno tiene su herramienta.
