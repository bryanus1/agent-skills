# Data Flow: Server Actions vs TanStack Query

This guide defines the guidelines and implementation patterns for the data layer in Next.js (App Router), balancing **Server Actions** (with server-side Zod validation) and **TanStack Query** (respecting the `services/` layer and the leaf-folder barrel policy).

---

## 1. Overall Data Flow Architecture

```text
[ UI Component / Screen ]
             │
             ├────────────────────────────────────────────┐
             ▼                                            ▼
    [ TanStack Query Hook Mode ]               [ Server Action Hook Mode ]
 (hooks/use-<noun> → useQuery/useMutation)    (hooks/use-<verb>-<noun> → useTransition)
             │                                            │
             ▼                                            ▼
 [ services/<verb>-<noun>.service.ts ]        [ services/<verb>-<noun>.service.ts ]
       (fetch / API Client)                   ('use server' + Zod safeParse + fetch/DB)
```

> **Critical Rule**: components and hooks **never** call `fetch` directly. Every HTTP call or data access lives in `src/features/<feature>/services/<verb>-<noun>/`.

---

## 2. Decision Matrix: when to use each pattern?

| Scenario | Recommended Approach | Technical Reason |
| :--- | :--- | :--- |
| **Initial Pages / SEO** | **Server Components (RSC)** | Server rendering with streaming and zero client JavaScript for the initial load. |
| **Form Mutations / CRUD** | **Server Actions (`'use server'`)** | Server-side Zod validation, secure access to `cookies()` and native revalidation (`revalidatePath` / `revalidateTag`). |
| **Interactive Dashboards / Tables** | **TanStack Query (`useQuery`)** | Client caching, reactive pagination, background polling and request deduplication. |
| **Mutations with Local Optimistic Cache** | **TanStack Query (`useMutation`)** | Automatic query key invalidation or optimistic client cache updates. |

---

## 3. Pattern 1: Server Actions with Server-Side Zod Validation

Server Actions are public HTTP `POST` endpoints: they must **always** validate their arguments on the server with a schema from `schemas/` before running logic or external calls.

### 3.1 Zod Schema (`src/features/billing/schemas/create-invoice.schema.ts`)
```typescript
import { z } from 'zod';

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid('Invalid customer'),
  amount: z.coerce.number().positive('The amount must be greater than 0'),
  currency: z.enum(['USD', 'EUR', 'COP']),
});

export type TCreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
```
*(Re-exported in `src/features/billing/schemas/index.ts`)*

### 3.2 Server Action Service (`src/features/billing/services/create-invoice/create-invoice.service.ts`)
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
 * Server Action that validates and creates a new invoice.
 */
export async function createInvoice(
  input: TCreateInvoiceInput,
): Promise<IServiceResponse<IInvoice>> {
  const parsed = createInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid invoice data',
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
        error: errorPayload.message || 'Failed to process the invoice',
      };
    }

    const data: IInvoice = await response.json();
    revalidatePath('/billing');
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected network error',
    };
  }
}
```

### 3.3 Orchestration Hook (`src/features/billing/hooks/use-create-invoice/use-create-invoice.hook.ts`)
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
        toast.success('Invoice created successfully');
        onSuccess?.();
      } else {
        toast.error(result.error || 'Something went wrong');
      }
    });
  };

  return { execute, isPending, createdInvoice };
}
```

---

## 4. Pattern 2: Services + Custom Hooks with TanStack Query

To respect the **Leaf-Folder Rule**, `hooks/` contains only subfolders (`use-*/`) and **never** loose files such as `hooks/query-keys.ts`. The *Query Key Factory* is exported from the main query hook (`hooks/use-invoices`) through its `index.ts`.

### 4.1 Read Service (`src/features/billing/services/get-invoices/get-invoices.service.ts`)
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
  if (!res.ok) throw new Error('Failed to fetch the invoice list');
  return res.json();
}
```

### 4.2 Query Hook + Key Factory (`src/features/billing/hooks/use-invoices/use-invoices.hook.ts`)
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

### 4.3 Encapsulated Mutation Hook (`src/features/billing/hooks/use-delete-invoice/use-delete-invoice.hook.ts`)
Each additional hook lives in its own subfolder and imports `invoiceKeys` from `@/features/billing/hooks/use-invoices`:

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
      toast.success('Invoice deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete');
    },
  });
}
```

---

## 5. Interactive Shell (UI Shell Feedback)

For screens or buttons that represent features still in development or mocked:
- Never leave buttons unresponsive or with stuck states.
- Give accessible feedback with `toast.info('Coming soon')` from `sonner`.
- Cleanly reset any loading or pending state.
