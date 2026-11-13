# Ejemplos antes/después

## Backend: handler que lo hace todo

### Antes

```ts
export async function handle(req: Request, res: Response) {
  try {
    const d = req.body;
    if (d.items && d.items.length > 0) {
      let t = 0;
      for (const i of d.items) {
        if (i.qty > 0) {
          t += i.price * i.qty;
        }
      }
      if (d.coupon) {
        const c = await db.query('select * from coupons where code = $1', [d.coupon]);
        if (c.rows.length) {
          t = t - t * c.rows[0].pct / 100;
        }
      }
      const o = await db.query('insert into orders(total) values($1) returning id', [t]);
      res.status(201).json({ id: o.rows[0].id, total: t });
    } else {
      res.status(400).json({ error: 'bad' });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: 'error' });
  }
}
```

**Smells:** función larga con tres niveles de abstracción (HTTP, reglas de negocio, SQL); nombres de una letra; anidamiento de 4 niveles; número mágico `100`; error tragado con `console.log` y mensaje genérico; validación ad hoc; un cupón inexistente se ignora en silencio.

### Después

```ts
// HTTP: traduce petición ↔ caso de uso
export async function createOrderHandler(req: Request, res: Response) {
  const input = createOrderSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'INVALID_ORDER', details: input.error.flatten() });

  const order = await createOrder(input.data, { coupons, orders });
  return res.status(201).json(order);
}
// los errores inesperados los gestiona el middleware de errores, con log estructurado

// Caso de uso: reglas de negocio, sin SQL ni HTTP
export async function createOrder(input: CreateOrderInput, deps: { coupons: CouponRepository; orders: OrderRepository }) {
  const subtotal = subtotalOf(input.items);
  const discount = input.couponCode ? await discountFor(input.couponCode, subtotal, deps.coupons) : 0;
  return deps.orders.create({ total: subtotal - discount });
}

const subtotalOf = (items: OrderItem[]) => items.reduce((sum, item) => sum + item.price * item.qty, 0);

async function discountFor(code: string, subtotal: number, coupons: CouponRepository) {
  const coupon = await coupons.findByCode(code);
  if (!coupon) throw new CouponNotFoundError(code);
  return subtotal * percentToRatio(coupon.percentOff);
}

const percentToRatio = (percent: number) => percent / 100;
```

Nota: el "después" **cambia un comportamiento** (un cupón inexistente ahora es un error en lugar de ignorarse). En un refactor real ese cambio se reporta y se confirma con el usuario antes de aplicarlo, en un paso aparte y con su test.

## Frontend: componente con lógica mezclada

### Antes

```tsx
export function UserList({ users, flag }: { users: any[]; flag: boolean }) {
  const [filtered, setFiltered] = useState<any[]>([]);
  useEffect(() => {
    setFiltered(users.filter((u) => (flag ? u.status === 1 : true)));
  }, [users, flag]);
  return (
    <ul>
      {filtered.map((u) => (
        <li key={u.id}>
          {u.name} {u.role === 'a' ? '(admin)' : u.role === 'e' ? '(editor)' : ''}
        </li>
      ))}
    </ul>
  );
}
```

**Smells:** `any`; argumento bandera `flag`; estado derivado sincronizado con `useEffect` (render doble y riesgo de desincronización); número mágico `1`; ternario anidado en el JSX; códigos de rol crípticos.

### Después

```tsx
type Role = 'admin' | 'editor' | 'viewer';
type User = { id: string; name: string; role: Role; status: UserStatus };

const ROLE_BADGES: Record<Role, string> = { admin: '(admin)', editor: '(editor)', viewer: '' };

export function UserList({ users, onlyActive = false }: { users: User[]; onlyActive?: boolean }) {
  const visibleUsers = onlyActive ? users.filter(isActive) : users;
  return (
    <ul>
      {visibleUsers.map((user) => (
        <li key={user.id}>
          {user.name} {ROLE_BADGES[user.role]}
        </li>
      ))}
    </ul>
  );
}

const isActive = (user: User) => user.status === UserStatus.Active;
```

Si los códigos `'a'`/`'e'` vienen así de la API, el mapeo a `Role` se hace en la capa de datos (adaptador), no en el componente.
