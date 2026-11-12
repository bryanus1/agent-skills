# Patrón de datos: servicios + TanStack Query

En móvil no hay Server Actions: el flujo es `service` (I/O HTTP + validación) → `hook` (estado/caché TanStack Query) → `screen`.

## Cliente HTTP base (`src/config/api-client.ts`)

Un único cliente HTTP tipado y reutilizable en toda la app:

```ts
// src/config/api-client.ts
export interface IApiResponse<T> {
  readonly data: T;
  readonly status: number;
}

export const apiClient = {
  async get<T>(path: string): Promise<IApiResponse<T>> {
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return { data: (await res.json()) as T, status: res.status };
  },
  async post<T>(path: string, body: unknown): Promise<IApiResponse<T>> {
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return { data: (await res.json()) as T, status: res.status };
  },
};
```

---

## Servicio con validación de contrato

Cada servicio encapsula I/O y valida la respuesta con su esquema Zod correspondiente antes de retornar el tipo del modelo.

```ts
// src/features/billing/services/get-invoices/get-invoices.service.ts
import { apiClient } from '@/config/api-client';
import type { IInvoice } from '@/features/billing/models';
import { invoiceListSchema } from '@/features/billing/schemas';

export async function getInvoices(): Promise<readonly IInvoice[]> {
  const response = await apiClient.get<unknown>('/invoices');
  return invoiceListSchema.parse(response.data);
}
```

---

## Key Factory jerárquica (`hooks/<entity>-keys/`)

Las keys de TanStack Query nunca se declaran dentro de un hook individual ni como strings sueltos. Viven en su propia subcarpeta hoja para que todas las queries y mutaciones las compartan sin acoplar hooks entre sí.

```ts
// src/features/billing/hooks/invoice-keys/invoice.keys.ts
export interface IInvoiceFilters {
  readonly status?: 'pending' | 'paid' | 'overdue';
}

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters?: IInvoiceFilters) => [...invoiceKeys.lists(), filters ?? {}] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
};
```

```ts
// src/features/billing/hooks/invoice-keys/index.ts
export { invoiceKeys, type IInvoiceFilters } from './invoice.keys';
```

---

## Hooks de consulta (`useQuery`)

Los hooks importan la key factory y el servicio mediante alias `@/features/...`:

```ts
// src/features/billing/hooks/use-invoices/use-invoices.hook.ts
import { useQuery } from '@tanstack/react-query';
import { invoiceKeys, type IInvoiceFilters } from '@/features/billing/hooks/invoice-keys';
import { getInvoices } from '@/features/billing/services/get-invoices';

export function useInvoices(filters?: IInvoiceFilters) {
  return useQuery({
    queryKey: invoiceKeys.list(filters),
    queryFn: getInvoices,
  });
}
```

---

## Hooks de mutación (`useMutation`)

Invalidan mediante la clave granular de la factory (`invoiceKeys.lists()` o `invoiceKeys.all`):

```ts
// src/features/billing/hooks/use-create-invoice/use-create-invoice.hook.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceKeys } from '@/features/billing/hooks/invoice-keys';
import { createInvoice } from '@/features/billing/services/create-invoice';
import type { ICreateInvoiceInput } from '@/features/billing/schemas';

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ICreateInvoiceInput) => createInvoice(input),
    onSuccess: () => {
      // Invalida solo listas, preservando los detalles cacheados
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}
```

---

## Reglas críticas de datos

1. **Sin llamadas de red en componentes ni screens:** la UI solo consume hooks.
2. **Validación estricta de respuestas:** los servicios usan `schema.parse()` para atrapar cambios de contrato del backend antes de que lleguen a la UI.
3. **Key factories independientes:** cada entidad tiene su factory en `hooks/<entity>-keys/` con jerarquía `all → lists() → list(filters) → details() → detail(id)`.
4. **Imports absolutos con alias:** `@/features/<feature>/...`, nunca rutas relativas `../../` entre diferentes capas.
5. **Testing de hooks:** usar `renderHook` con un `QueryClientProvider` configurado con `retry: false`.
