# Patrón de datos: servicios + TanStack Query

En móvil no hay Server Actions: el flujo es `service` (I/O) → `hook` (estado/caché) → `screen`.

## Servicio

```ts
// services/get-invoices/get-invoices.service.ts
import { apiClient } from '@/config/api-client';
import type { IInvoice } from '../../models';

export async function getInvoices(): Promise<IInvoice[]> {
  const response = await apiClient.get<IInvoice[]>('/invoices');
  return response.data;
}
```

## Key factory + query

```ts
// hooks/use-invoices/use-invoices.hook.ts
import { useQuery } from '@tanstack/react-query';
import { getInvoices } from '../../services/get-invoices';

export const invoiceKeys = {
  all: ['invoices'] as const,
  detail: (id: string) => ['invoices', id] as const,
};

export function useInvoices() {
  return useQuery({ queryKey: invoiceKeys.all, queryFn: getInvoices });
}
```

## Mutación

```ts
// hooks/use-create-invoice/use-create-invoice.hook.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInvoice } from '../../services/create-invoice';
import { invoiceKeys } from '../use-invoices';

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invoiceKeys.all }),
  });
}
```

## Reglas

- Los componentes nunca llaman `fetch`; consumen hooks.
- Valida entradas con los esquemas de `schemas/` antes de llamar al servicio.
- Testea hooks con `renderHook` y un `QueryClientProvider` de prueba (`retry: false`).
- Considera `onlineManager` y `persistQueryClient` para soporte offline.
