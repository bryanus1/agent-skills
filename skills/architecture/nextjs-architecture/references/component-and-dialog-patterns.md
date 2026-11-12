# Patrones de Componentes, FormDialog y Documentación TSDoc

Este documento define el ciclo de vida, descubrimiento, modularización y documentación de componentes de UI en Next.js.

---

## 1. Protocolo de Descubrimiento de Componentes (3-Tier Sequence)

Antes de crear cualquier componente visual (sea compartido o específico de una feature), el desarrollador o agente debe seguir rigurosamente esta secuencia de validación en 3 niveles:

```mermaid
flowchart TD
    A["¿Necesitas un Componente UI?"] --> B{"Nivel 1: ¿Existe en src/components/*\no en la feature actual?"}
    B -- "Sí" --> C["Reutilizar o Extender\nel Componente Existente"]
    B -- "No" --> D{"Nivel 2: ¿Existe en la\nlibrería base (shadcn/ui)?"}
    D -- "Sí" --> E["Instalar vía CLI:\npnpm dlx shadcn@latest add <name>\ny adaptar estilos de tokens"]
    D -- "No" --> F["Nivel 3: Crear Componente Custom\ncon subcarpeta encapsulada,\nTSDoc y test con Vitest"]
```

1. **Nivel 1 — Comprobar componentes existentes**:
   - Revisar `src/components/ui/` (primitivas base), `src/components/common/` (compuestos reutilizables) o los componentes dentro de la feature actual (`src/features/<feature>/components/`).
   - Si existe, se reutiliza o parametriza con props opcionales.
2. **Nivel 2 — Instalar desde el registro base (`shadcn/ui`)**:
   - Si no existe en el proyecto, validar si está disponible en `shadcn/ui` (ej. `dialog`, `badge`, `table`, `sheet`, `popover`).
   - Instalar mediante `pnpm dlx shadcn@latest add <component>` y adaptar variantes y tokens de color al diseño de la aplicación.
3. **Nivel 3 — Construir Componente Custom**:
   - Solo si no existe ni localmente ni en el registro base, se genera un nuevo componente respetando el estándar de subcarpeta (`<name>/<name>.tsx`, `<name>/<name>.test.tsx`, `<name>/index.ts`), interfaces documentadas y estilos semánticos.

---

## 2. Arquitectura de Diálogos Modales: Estándar `FormDialog`

Todos los formularios modales de creación, edición, confirmación o envío de entidades deben estructurarse bajo el patrón **FormDialog**.

### 2.1 Contenedor Base Reutilizable (`src/components/common/form-dialog/form-dialog.tsx`)
El contenedor `FormDialog` envuelve la primitiva `Dialog` de `shadcn/ui`:

```tsx
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/**
 * Propiedades para {@link FormDialog}.
 */
export interface IFormDialogProps {
  /** Título principal del encabezado modal. */
  readonly title: string;
  /** Subtítulo o instrucciones opcionales del modal. */
  readonly description?: string;
  /** Icono decorativo opcional en el encabezado. */
  readonly icon?: React.ReactNode;
  /** Estado de apertura en modo controlado. */
  readonly open?: boolean;
  /** Callback al cambiar el estado de apertura. */
  readonly onOpenChange?: (open: boolean) => void;
  /** Elemento disparador opcional; pasar null cuando se controla desde el padre. */
  readonly trigger?: React.ReactNode | null;
  /** Contenido del formulario dentro del modal. */
  readonly children: React.ReactNode;
}

/**
 * Contenedor modal estandarizado para formularios de creación y edición.
 */
export function FormDialog({
  title,
  description,
  icon,
  open,
  onOpenChange,
  trigger,
  children,
}: Readonly<IFormDialogProps>): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
```

### 2.2 Subcarpeta de Entidad `*-form-dialog`
Cada formulario modal de entidad reside en su subcarpeta dedicada terminada en `-form-dialog` dentro de la feature:

```text
src/features/billing/components/invoice-form-dialog/
├── index.ts
├── invoice-form-dialog.test.tsx
└── invoice-form-dialog.tsx
```

### 2.3 Conexión Completa: `FormDialog` + Esquema Zod + Hook
1. **Interface de Props (`I<Entity>FormDialogProps`)**:
   ```tsx
   'use client';

   import React, { useState } from 'react';
   import { FormDialog } from '@/components/common/form-dialog';
   import { useCreateInvoice } from '@/features/billing/hooks/use-create-invoice';
   import type { IInvoice } from '@/features/billing/models';
   import { createInvoiceSchema } from '@/features/billing/schemas';

   export interface IInvoiceFormDialogProps {
     /** Controla la visibilidad del modal en modo controlado. */
     readonly open?: boolean;
     /** Callback ejecutado al cambiar el estado de apertura. */
     readonly onOpenChange?: (open: boolean) => void;
     /** Disparador opcional; null cuando se abre desde una tabla o estado padre. */
     readonly trigger?: React.ReactNode | null;
     /** Entidad opcional para modo edición. Si es null/undefined, opera en modo creación. */
     readonly initialData?: IInvoice | null;
     /** Callback al completar exitosamente la operación. */
     readonly onSuccess?: () => void;
   }

   export function InvoiceFormDialog({
     open,
     onOpenChange,
     trigger,
     initialData,
     onSuccess,
   }: Readonly<IInvoiceFormDialogProps>): React.JSX.Element {
     const { execute, isPending } = useCreateInvoice();
     const [error, setError] = useState<string | null>(null);

     const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
       event.preventDefault();
       const formData = new FormData(event.currentTarget);
       const parsed = createInvoiceSchema.safeParse({
         customerId: formData.get('customerId'),
         amount: formData.get('amount'),
         currency: formData.get('currency') ?? 'USD',
       });

       if (!parsed.success) {
         setError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
         return;
       }

       setError(null);
       execute(parsed.data, () => {
         onOpenChange?.(false);
         onSuccess?.();
       });
     };

     return (
       <FormDialog
         title={initialData ? 'Editar Factura' : 'Nueva Factura'}
         description="Completa los datos fiscales de la factura."
         open={open}
         onOpenChange={onOpenChange}
         trigger={trigger}
       >
         <form onSubmit={handleSubmit} className="space-y-4 py-2">
           {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
           {/* Campos del formulario o subcomponente presentacional */}
           <div className="flex justify-end gap-2 pt-4">
             <button type="button" onClick={() => onOpenChange?.(false)} className="px-4 py-2 text-sm border rounded-md">
               Cancelar
             </button>
             <button type="submit" disabled={isPending} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md">
               Guardar
             </button>
           </div>
         </form>
       </FormDialog>
     );
   }
   ```
2. **Subformularios Presentacionales**: Si el formulario es extenso o tiene múltiples pasos, el diálogo delega los campos a un componente presentacional puro (`invoice-form.tsx`), manteniendo el diálogo enfocado en el ciclo de vida del modal.

---

## 3. Estándar de Documentación TSDoc

Todos los componentes exportados en `src/components/common/` y `src/features/**/components/` (incluidas pantallas y secciones) deben incluir bloques **TSDoc** rigurosos.

### Plantilla de Documentación:

```tsx
import React from 'react';

/**
 * Propiedades para {@link MetricCard}.
 */
export interface IMetricCardProps {
  /** Título principal de la tarjeta de métricas. */
  readonly title: string;
  /** Valor numérico o texto representativo de la métrica. */
  readonly value: string | number;
  /** Porcentaje de cambio respecto al período anterior. */
  readonly trendPercentage?: number;
  /** Icono visual representativo. */
  readonly icon?: React.ReactNode;
  /** Callback opcional al interactuar con la tarjeta. */
  readonly onClick?: () => void;
}

/**
 * Renderiza una tarjeta de resumen métrico con indicador de tendencia e icono.
 *
 * @param props - Opciones de configuración descritas en {@link IMetricCardProps}.
 * @returns Elemento JSX renderizado.
 *
 * @example
 * ```tsx
 * import { MetricCard } from '@/components/common/metric-card';
 *
 * export function Example() {
 *   return (
 *     <MetricCard
 *       title="Facturación Mensual"
 *       value="$12,450"
 *       trendPercentage={8.4}
 *     />
 *   );
 * }
 * ```
 */
export function MetricCard({
  title,
  value,
  trendPercentage,
  icon,
  onClick,
}: Readonly<IMetricCardProps>): React.JSX.Element {
  return (
    <div
      role="button"
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {trendPercentage !== undefined && (
        <p className="mt-1 text-xs text-muted-foreground">
          {trendPercentage >= 0 ? `+${trendPercentage}%` : `${trendPercentage}%`} vs mes anterior
        </p>
      )}
    </div>
  );
}
```
