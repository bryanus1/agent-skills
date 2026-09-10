# Flujo de Datos: Server Actions vs TanStack Query

Esta guía define las directrices y patrones de implementación para la capa de datos en Next.js (App Router), equilibrando Server Actions y TanStack Query.

---

## 1. Arquitectura General del Flujo de Datos

```text
[ Componente UI / Screen ]
            │
            ├─────────────────────────────────────────┐
            ▼                                         ▼
   [ Modo React Query Hook ]              [ Modo Server Action Hook ]
(Client-side caching, polling)           (useTransition / useActionState)
            │                                         │
            ▼                                         ▼
   [ api-client / fetch ]                [ Service ('use server') ]
            │                                         │
            ▼                                         ▼
   [ Backend REST API ]                  [ Backend / DB nativo ]
```

---

## 2. Matriz de Decisión: ¿Cuándo usar cada patrón?

| Escenario | Enfoque Recomendado | Razón Técnica |
| :--- | :--- | :--- |
| **Páginas Iniciales / SEO** | **Server Components (RSC)** | Renderizado en servidor con streaming y sin JavaScript del cliente para la carga inicial. |
| **Mutaciones de Formularios / CRUD** | **Server Actions (`'use server'`)** | Integración nativa con Progressive Enhancement, `useActionState`, validación del lado del servidor y revalidación de caché de Next.js (`revalidatePath` / `revalidateTag`). |
| **Dashboards Interactivos / Tablas** | **TanStack Query (`useQuery`)** | Caching en cliente, paginación reactiva, polling en segundo plano, debounce en tiempo real y deduplicación de peticiones. |
| **Mutaciones con Caché Optimista Local** | **TanStack Query (`useMutation`)** | Capacidad nativa de actualización optimista de caché en cliente y rollback en caso de error. |
| **Transacciones Seguras / Cookies** | **Server Actions (`'use server'`)** | Acceso seguro a `cookies()` de Next.js y headers de autenticación sin exponer tokens al bundle del cliente. |

---

## 3. Patrón 1: Server Actions con Native `fetch`

### 3.1 Estructura del Servicio (`src/features/<feature>/services/`)
El archivo vive en su propia subcarpeta: `create-invoice/create-invoice.service.ts` con `'use server'`:

```typescript
'use server';

import { IInvoice } from '../models/invoice';

export interface ICreateInvoiceInput {
  readonly customerId: string;
  readonly amount: number;
  readonly currency: string;
}

export interface IServiceResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
}

/**
 * Server Action para crear una nueva factura en el backend.
 */
export async function createInvoice(
  input: ICreateInvoiceInput
): Promise<IServiceResponse<IInvoice>> {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      cache: 'no-store', // Política explícita de caché
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorPayload.message || 'Error al procesar la factura',
      };
    }

    const data: IInvoice = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado de red',
    };
  }
}
```

### 3.2 Orquestación en Hook con `useTransition`
```typescript
'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createInvoice, ICreateInvoiceInput } from '../services/create-invoice';
import { IInvoice } from '../models/invoice';

export function useCreateInvoice() {
  const [isPending, startTransition] = useTransition();
  const [createdInvoice, setCreatedInvoice] = useState<IInvoice | null>(null);

  const execute = (input: ICreateInvoiceInput, onSuccess?: () => void) => {
    startTransition(async () => {
      const result = await createInvoice(input);
      if (result.success && result.data) {
        setCreatedInvoice(result.data);
        toast.success('Factura generada exitosamente');
        onSuccess?.();
      } else {
        toast.error(result.error || 'Ocurrió un fallo');
      }
    });
  };

  return { execute, isPending, createdInvoice };
}
```

---

## 4. Patrón 2: Custom Hooks con TanStack Query

### 4.1 Query Key Factory (`src/features/<feature>/hooks/query-keys.ts`)
Centralizar las claves de caché para evitar typos e invalidaciones inconsistentes:

```typescript
export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: { status?: string; page: number }) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
};
```

### 4.2 Hook Encapsulado (`use-invoices.hook.ts`)
```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invoiceKeys } from './query-keys';
import { IInvoice } from '../models/invoice';

interface IUseInvoicesParams {
  readonly page?: number;
  readonly status?: string;
}

export function useInvoices(params: IUseInvoicesParams = {}) {
  const { page = 1, status } = params;

  return useQuery({
    queryKey: invoiceKeys.list({ page, status }),
    queryFn: async (): Promise<IInvoice[]> => {
      const searchParams = new URLSearchParams({ page: String(page) });
      if (status) searchParams.append('status', status);

      const res = await fetch(`/api/invoices?${searchParams.toString()}`);
      if (!res.ok) throw new Error('Error al obtener el listado de facturas');
      return res.json();
    },
    staleTime: 1000 * 60 * 2, // 2 minutos de caché fresca
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No fue posible eliminar la factura');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success('Factura eliminada');
    },
    onError: (err) => {
      toast.error(err.message || 'Error al eliminar');
    },
  });
}
```

---

## 5. Cascarón Interactivo (UI Shell Feedback)

Para pantallas o botones que representen funcionalidades en desarrollo o mockeables:
- Nunca dejar botones sin respuesta o con estados colgados.
- Emitir feedback accesible con `toast.info('Funcionalidad próximamente disponible')` de `sonner`.
- Resetear limpiamente cualquier estado de carga o pending.
