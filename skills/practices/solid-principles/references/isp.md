# ISP: Interface Segregation

> No client should depend on methods (or props) it does not use. Prefer **small, client-specific interfaces** to one large general-purpose interface.

## How to detect it

- An interface with many members, of which each client uses two or three.
- Implementations with empty methods or methods that throw "not supported".
- 15-method test mocks to check something that uses one.
- A change to one interface method forces you to recompile or review clients that don't use it.
- In the frontend: components with 20 props where each consumer uses 4; "optional" props that only make sense in certain combinations.

## Backend

### Before

```ts
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
  countActive(): Promise<number>;
  exportAll(): Promise<User[]>;
}

class LoginService {
  constructor(private users: UserRepository) {} // only needs findByEmail
}
```

Testing `LoginService` forces you to implement or mock all six methods.

### After

The interface is defined by **the consumer**, with what it needs:

```ts
// login.service.ts
export interface UserByEmailFinder { findByEmail(email: string): Promise<User | null>; }

export class LoginService {
  constructor(private users: UserByEmailFinder) {}
}

// The concrete repository implements several small interfaces without changes:
class PgUserRepository implements UserByEmailFinder, UserWriter, UserReportReader { /* ... */ }
```

In TypeScript, structural typing lets you pass `PgUserRepository` directly: you don't need to declare `implements` except as documentation. The test is now `{ findByEmail: async () => user }`.

## Frontend

### Before

```tsx
interface TableProps {
  rows: Row[]; columns: Column[];
  onRowClick?: ...; onSelect?: ...; selectable?: boolean;
  exportable?: boolean; onExport?: ...; showToolbar?: boolean; // …
}
```

### After: compose instead of piling up props

```tsx
<DataTable rows={rows} columns={columns}>
  <DataTable.Toolbar><ExportButton onExport={...} /></DataTable.Toolbar>
  <DataTable.Selection onChange={...} />
</DataTable>
```

Each piece declares only its own props. It also helps to split a **large context** into several (`AuthUserContext`, `AuthActionsContext`) so components that only read don't re-render on action changes, and to pass children **only the data they need**, not the whole object (`<Avatar src={user.avatarUrl} />` instead of `<Avatar user={user} />`).

## How to refactor

1. List which members each client actually uses.
2. Create one interface per client (or per role: read, write, reporting), named after what the client **does** with it.
3. Make the concrete implementation satisfy all of them; change the clients to depend on the small one.
4. If a large interface is used in tests, check that the doubles are now trivial: that is the proof the segregation worked.

## When not to apply it

- A small interface that every client already uses in full.
- Splitting for its own sake: ten one-method interfaces for a single client are noise.
- External libraries whose interface you don't control: wrap them in your own adapter with the minimal interface (see [DIP](dip.md)) instead of segregating them.
