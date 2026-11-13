# ISP: segregación de interfaces

> Ningún cliente debería depender de métodos (o props) que no usa. Prefiere **interfaces pequeñas y específicas del cliente** a una interfaz grande de propósito general.

## Cómo detectarlo

- Una interfaz con muchos miembros de los que cada cliente usa dos o tres.
- Implementaciones con métodos vacíos o que lanzan "no soportado".
- Mocks de test de 15 métodos para probar algo que usa uno.
- Un cambio en un método de la interfaz obliga a recompilar o revisar clientes que no lo usan.
- En frontend: componentes con 20 props donde cada consumidor usa 4; props "opcionales" que solo tienen sentido en ciertas combinaciones.

## Backend

### Antes

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
  constructor(private users: UserRepository) {} // solo necesita findByEmail
}
```

Probar `LoginService` obliga a implementar o mockear los seis métodos.

### Después

La interfaz la define **el consumidor**, con lo que necesita:

```ts
// login.service.ts
export interface UserByEmailFinder { findByEmail(email: string): Promise<User | null>; }

export class LoginService {
  constructor(private users: UserByEmailFinder) {}
}

// El repositorio concreto implementa varias interfaces pequeñas sin cambios:
class PgUserRepository implements UserByEmailFinder, UserWriter, UserReportReader { /* ... */ }
```

En TypeScript, la tipificación estructural permite que `PgUserRepository` se pase directamente: no hace falta declarar `implements` salvo para documentar. El test ahora es `{ findByEmail: async () => user }`.

## Frontend

### Antes

```tsx
interface TableProps {
  rows: Row[]; columns: Column[];
  onRowClick?: ...; onSelect?: ...; selectable?: boolean;
  exportable?: boolean; onExport?: ...; showToolbar?: boolean; // …
}
```

### Después: componer en lugar de acumular props

```tsx
<DataTable rows={rows} columns={columns}>
  <DataTable.Toolbar><ExportButton onExport={...} /></DataTable.Toolbar>
  <DataTable.Selection onChange={...} />
</DataTable>
```

Cada pieza declara solo sus props. También sirve dividir un **contexto grande** en varios (`AuthUserContext`, `AuthActionsContext`) para que los componentes que solo leen no se rendericen por cambios de acciones, y pasar a los hijos **solo los datos que necesitan**, no el objeto entero (`<Avatar src={user.avatarUrl} />` en lugar de `<Avatar user={user} />`).

## Cómo refactorizar

1. Lista qué miembros usa realmente cada cliente.
2. Crea una interfaz por cliente (o por rol: lectura, escritura, informes), nombrada por lo que **hace** el cliente con ella.
3. Haz que la implementación concreta satisfaga todas; cambia los clientes para depender de la pequeña.
4. Si una interfaz grande se usa en tests, comprueba que los dobles ahora son triviales: es la prueba de que la segregación funcionó.

## Cuándo no aplicarlo

- Una interfaz pequeña que ya usan todos los clientes por completo.
- Dividir por división: diez interfaces de un método para un único cliente son ruido.
- Librerías externas cuya interfaz no controlas: envuélvelas en un adaptador propio con la interfaz mínima (ver [DIP](dip.md)) en lugar de segregarlas.
