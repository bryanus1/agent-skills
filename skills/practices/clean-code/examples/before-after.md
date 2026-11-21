# Before/After Examples

## Backend: a handler that does everything

### Before

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

**Smells:** a long function with three abstraction levels (HTTP, business rules, SQL); one-letter names; 4 levels of nesting; magic number `100`; error swallowed with `console.log` and a generic message; ad hoc validation; a non-existent coupon is silently ignored.

### After

```ts
// HTTP: translates request ↔ use case
export async function createOrderHandler(req: Request, res: Response) {
  const input = createOrderSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'INVALID_ORDER', details: input.error.flatten() });

  const order = await createOrder(input.data, { coupons, orders });
  return res.status(201).json(order);
}
// unexpected errors are handled by the error middleware, with a structured log

// Use case: business rules, no SQL or HTTP
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

Note: the "after" **changes a behavior** (a non-existent coupon is now an error instead of being ignored). In a real refactor that change is reported and confirmed with the user before it is applied, in a separate step with its own test.

## Frontend: a component with mixed logic

### Before

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

**Smells:** `any`; the `flag` flag argument; derived state synced with `useEffect` (double render and risk of getting out of sync); magic number `1`; nested ternary in the JSX; cryptic role codes.

### After

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

If the `'a'`/`'e'` codes come from the API like that, the mapping to `Role` happens in the data layer (an adapter), not in the component.
