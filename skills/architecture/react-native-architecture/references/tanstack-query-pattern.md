# Data Pattern: Services + TanStack Query

There are no Server Actions on mobile: the flow is `service` (HTTP I/O + validation) → `hook` (TanStack Query state/cache) → `screen`.

## Base HTTP client (`src/config/api-client.ts`)

A single typed HTTP client reused across the whole app:

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

## Service with contract validation

Each service wraps the I/O and validates the response with its matching Zod schema before returning the model type.

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

## Hierarchical Key Factory (`hooks/<entity>-keys/`)

TanStack Query keys are never declared inside an individual hook or as loose strings. They live in their own leaf subfolder so every query and mutation can share them without coupling hooks to each other.

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

## Query hooks (`useQuery`)

Hooks import the key factory and the service through the `@/features/...` alias:

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

## Mutation hooks (`useMutation`)

They invalidate through the factory's granular key (`invoiceKeys.lists()` or `invoiceKeys.all`):

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
      // Invalidates only lists, preserving cached details
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}
```

---

## Critical data rules

1. **No network calls in components or screens:** the UI only consumes hooks.
2. **Strict response validation:** services use `schema.parse()` to catch backend contract changes before they reach the UI.
3. **Independent key factories:** each entity has its factory in `hooks/<entity>-keys/` with the hierarchy `all → lists() → list(filters) → details() → detail(id)`.
4. **Absolute imports with the alias:** `@/features/<feature>/...`, never `../../` relative paths between different layers.
5. **Hook testing:** use `renderHook` with a `QueryClientProvider` configured with `retry: false`.
