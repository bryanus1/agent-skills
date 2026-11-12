# Flujo de Datos: Server Actions vs TanStack Query

Esta guía define las directrices y patrones de implementación para la capa de datos en Next.js (App Router), equilibrando **Server Actions** (con validación Zod en servidor) y **TanStack Query** (respetando la capa `services/` y la política de barrels en hojas).

---

## 1. Arquitectura General del Flujo de Datos

```text
[ Componente UI / Screen ]
             │
             ├────────────────────────────────────────────┐
             ▼                                            ▼
    [ Modo TanStack Query Hook ]               [ Modo Server Action Hook ]
 (hooks/use-<noun> → useQuery/useMutation)    (hooks/use-<verb>-<noun> → useTransition)
             │                                            │
             ▼                                            ▼
 [ services/<verb>-<noun>.service.ts ]        [ services/<verb>-<noun>.service.ts ]
       (fetch / API Client)                   ('use server' + Zod safeParse + fetch/DB)
```

> **Regla Crítica**: Los componentes y los hooks **nunca** invocan `fetch` directamente. Toda llamada HTTP o acceso a datos reside en `src/features/<feature>/services/<verb>-<noun>/`.

---

## 2. Matriz de Decisión: ¿Cuándo usar cada patrón?

| Escenario | Enfoque Recomendado | Razón Técnica |
| :--- | :--- | :--- |
| **Páginas Iniciales / SEO** | **Server Components (RSC)** | Renderizado en servidor con streaming y cero JavaScript de cliente para la carga inicial. |
| **Mutaciones de Formularios / CRUD** | **Server Actions (`'use server'`)** | Validación con Zod en servidor, acceso seguro a `cookies()` y revalidación nativa (`revalidatePath` / `revalidateTag`). |
| **Dashboards Interactivos / Tablas** | **TanStack Query (`useQuery`)** | Caching en cliente, paginación reactiva, polling en segundo plano y deduplicación de peticiones. |
| **Mutaciones con Caché Optimista Local** | **TanStack Query (`useMutation`)** | Invalidación automática de query keys o actualización optimista de caché en cliente. |

---

## 3. Patrón 1: Server Actions con Validación Zod en Servidor

Las Server Actions son endpoints HTTP `POST` públicos: **siempre** deben validar sus argumentos en el servidor con un esquema de `schemas/` antes de ejecutar lógica o llamadas externas.

### 3.1 Esquema Zod (`src/features/billing/schemas/create-invoice.schema.ts`)
```typescript
import { z } from 'zod';

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid('Cliente inválido'),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  currency: z.enum(['USD', 'EUR', 'COP']),
});

export type TCreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
```
*(Reexportado en `src/features/billing/schemas/index.ts`)*

### 3.2 Servicio Server Action (`src/features/billing/services/create-invoice/create-invoice.service.ts`)
```typescript
'use server';

import { revalidatePath } from 'next/cache';
import type { IInvoice } from '@/features/billing/models';
import { createInvoiceSchema, type TCreateInvoiceInput } from '@/features/billing/schemas';

export interface IServiceResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
}

/**
 * Server Action para validar y crear una nueva factura.
 */
export async function createInvoice(
  input: TCreateInvoiceInput,
): Promise<IServiceResponse<IInvoice>> {
  const parsed = createInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos de factura inválidos',
    };
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorPayload.message || 'Error al procesar la factura',
      };
    }

    const data: IInvoice = await response.json();
    revalidatePath('/billing');
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado de red',
    };
  }
}
```

### 3.3 Hook de Orquestación (`src/features/billing/hooks/use-create-invoice/use-create-invoice.hook.ts`)
```typescript
'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { IInvoice } from '@/features/billing/models';
import type { TCreateInvoiceInput } from '@/features/billing/schemas';
import { createInvoice } from '@/features/billing/services/create-invoice';

export function useCreateInvoice() {
  const [isPending, startTransition] = useTransition();
  const [createdInvoice, setCreatedInvoice] = useState<IInvoice | null>(null);

  const execute = (input: TCreateInvoiceInput, onSuccess?: () => void) => {
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

## 4. Patrón 2: Servicios + Custom Hooks con TanStack Query

Para respetar la **Regla de la Hoja Terminal**, `hooks/` solo contiene subcarpetas (`use-*/`) y **nunca** archivos sueltos como `hooks/query-keys.ts`. La *Query Key Factory* se exporta desde el hook principal de consulta (`hooks/use-invoices`) a través de su `index.ts`.

### 4.1 Servicio de Lectura (`src/features/billing/services/get-invoices/get-invoices.service.ts`)
```typescript
import type { IInvoice } from '@/features/billing/models';

export interface IGetInvoicesParams {
  readonly page?: number;
  readonly status?: string;
}

export async function getInvoices(params: IGetInvoicesParams = {}): Promise<IInvoice[]> {
  const { page = 1, status } = params;
  const searchParams = new URLSearchParams({ page: String(page) });
  if (status) searchParams.append('status', status);

  const res = await fetch(`/api/invoices?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Error al obtener el listado de facturas');
  return res.json();
}
```

### 4.2 Hook de Consulta + Key Factory (`src/features/billing/hooks/use-invoices/use-invoices.hook.ts`)
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getInvoices, type IGetInvoicesParams } from '@/features/billing/services/get-invoices';

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: IGetInvoicesParams) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
};

export function useInvoices(params: IGetInvoicesParams = {}) {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => getInvoices(params),
    staleTime: 1000 * 60 * 2,
  });
}
```

### 4.3 Hook de Mutación Encapsulado (`src/features/billing/hooks/use-delete-invoice/use-delete-invoice.hook.ts`)
Cada hook adicional vive en su propia subcarpeta e importa `invoiceKeys` desde `@/features/billing/hooks/use-invoices`:

```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invoiceKeys } from '@/features/billing/hooks/use-invoices';
import { deleteInvoice } from '@/features/billing/services/delete-invoice';

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success('Factura eliminada');
    },
    onError: (err: Error) => {
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
