# Guía de Screaming Architecture (Feature-Driven / Domain-First)

Esta guía define el estándar de organización de directorios, límites de capas, convenciones de nomenclatura y políticas de importación para aplicaciones modernas en Next.js (App Router).

---

## 1. Principio Fundamental: Screaming Architecture

La estructura de carpetas del proyecto debe "gritar" el dominio del negocio antes que los detalles técnicos del framework.
- **Orientado al Dominio**: Cada capacidad de negocio vive en un módulo autónomo dentro de `src/features/<feature-name>/`.
- **Desacoplamiento Estricto**: La capa visual (`screens/`, `components/`), los contratos de datos (`models/`), la validación (`schemas/`), la orquestación (`hooks/`) y la comunicación con servicios (`services/`) están claramente separadas.
- **Thin App Router**: Los archivos bajo `src/app/**` actúan únicamente como despachadores de rutas. Su función es montar pantallas (`screens`), proveer metadatos (`Metadata`) y configurar layouts, sin contener lógica de negocio ni estado.
- **Server Components por Defecto**: Las pantallas (`screens/`) y componentes (`components/`) son **React Server Components (RSC)** por defecto. La directiva `'use client'` se empuja exclusivamente hacia las hojas interactivas (`*-form-dialog`, controles con estado local o consumidores de hooks).

---

## 2. Árbol de Directorios Estándar

```text
├── e2e/                  # Especificaciones E2E con Playwright (<feature>.spec.ts)
└── src/
    ├── app/              # Capa de routing delgada (layout.tsx, page.tsx, route.ts)
    ├── config/           # Configuración global (env, constantes, feature flags)
    ├── contexts/         # Subcarpetas de contextos React globales (ej: auth, theme)
    ├── features/         # Módulos de dominio de negocio
    │   └── <feature-name>/   # e.g., landing, auth, billing, users
    │       ├── components/   # Componentes UI exclusivos de la feature
    │       │   └── sections/ # Subcomponentes de secciones de página (opcional)
    │       ├── hooks/        # Hooks de React específicos de la feature
    │       ├── models/       # Modelos de dominio planos (con index.ts)
    │       ├── schemas/      # Esquemas de validación Zod planos (con index.ts)
    │       ├── screens/      # Pantallas completas ensambladas
    │       ├── services/     # Server Actions / llamadas API ('use server' o fetch)
    │       └── utils/        # Utilidades de feature y lógica extraída de rutas/layouts (con tests + index.ts)
    ├── components/       # Elementos UI compartidos y agnósticos de dominio
    │   ├── ui/           # Primitivas base (ej. componentes de shadcn/ui)
    │   ├── common/       # Componentes compuestos compartidos (FormDialog, Logo, etc.)
    │   └── icons/        # Subcarpetas de iconos SVG (con componente + index.ts)
    ├── hooks/            # Hooks de React globales y agnósticos (ej: use-debounce)
    ├── lib/              # Utilidades compartidas (ej: utils.ts, client config)
    ├── models/           # Modelos de dominio globales y compartidos (archivos planos)
    └── types/            # Declaraciones de tipos ambientales de TypeScript
```

---

## 3. Patrón de Encapsulación en Subcarpeta & Sufijos

### 3.1 Estándar de Subcarpeta Encapsulada
Cada componente, screen, hook, servicio, contexto e icono reside en su propia subcarpeta dedicada con nombre en `kebab-case`. La subcarpeta contiene:
1. **Archivo de implementación**: `<entity-name>.<suffix>.<ext>`
2. **Archivo de test colocalizado (Vitest)**: `<entity-name>.<suffix>.test.<ext>`
3. **Local barrel file**: `index.ts` que exporta únicamente esa entidad (`export * from './<entity-name>.<suffix>';`).

#### Ejemplo de Hook:
```text
src/features/billing/hooks/use-invoices/
├── index.ts
├── use-invoices.hook.test.ts
└── use-invoices.hook.ts
```

#### Ejemplo de Componente:
```text
src/features/billing/components/invoice-card/
├── index.ts
├── invoice-card.test.tsx
└── invoice-card.tsx
```

### 3.2 Carpetas Hoja de Archivos Planos (`models/`, `schemas/`, `utils/`)
Los modelos de dominio (`models/`), los esquemas de validación (`schemas/`) y las funciones utilitarias (`utils/`) residen directamente como **archivos planos** dentro de su respectiva carpeta, acompañados de un único `index.ts`:

```text
src/features/billing/models/
├── index.ts
├── invoice.ts
└── payment-method.ts

src/features/billing/schemas/
├── index.ts
├── create-invoice.schema.ts
└── invoice-filter.schema.ts

src/features/billing/utils/
├── index.ts
├── parse-billing-search-params.test.ts
└── parse-billing-search-params.ts
```

- **Sin subcarpetas individuales**: No se crean subcarpetas individuales por modelo, esquema o utilidad.
- **Política de tests en carpetas planas**:
  - `models/` y `schemas/` son contratos declarativos y esquemas puros; **no** llevan archivos `.test.ts`.
  - `utils/` contiene lógica pura y transformaciones; **sí** lleva su archivo `.test.ts` adyacente a cada utilidad.
- **Barrel local**: Al ser carpetas hoja con archivos directos, `models/index.ts`, `schemas/index.ts` y `utils/index.ts` reexportan todos sus miembros para un consumo limpio.

### 3.3 Tabla de Sufijos y Convenciones

| Capa / Tipo | Casing de Subcarpeta | Sufijo de Archivo | Sufijo de Test (Vitest) | Ejemplo de Ruta |
| :--- | :--- | :--- | :--- | :--- |
| **Componente React** | `kebab-case` | `.tsx` | `.test.tsx` | `billing-header/billing-header.tsx` |
| **Screen (Pantalla)** | `kebab-case` | `.tsx` | `.test.tsx` | `billing-overview/billing-overview.tsx` |
| **Form Dialog** | `kebab-case` (`*-form-dialog`) | `.tsx` | `.test.tsx` | `invoice-form-dialog/invoice-form-dialog.tsx` |
| **Hook de React** | `kebab-case` | `.hook.ts` | `.hook.test.ts` | `use-invoices/use-invoices.hook.ts` |
| **Esquema Zod** | *Carpeta Hoja* | `.schema.ts` | — | `schemas/create-invoice.schema.ts` + `schemas/index.ts` |
| **Servicio / Action** | `kebab-case` | `.service.ts` | `.service.test.ts` | `create-invoice/create-invoice.service.ts` |
| **Contexto React** | `kebab-case` | `.context.tsx` | `.context.test.tsx` | `billing/billing.context.tsx` |
| **Modelos de Dominio** | *Carpeta Hoja* | `.ts` | — | `models/invoice.ts` + `models/index.ts` |
| **Utilidades** | *Carpeta Hoja* | `.ts` | `.test.ts` | `utils/parse-billing-params.ts` + `utils/index.ts` |
| **Icono SVG** | `kebab-case` | `.tsx` | — | `icons/credit-card/credit-card.tsx` |
| **Test E2E (Playwright)** | *Raíz `e2e/`* | `.spec.ts` | `.spec.ts` | `e2e/billing.spec.ts` |

---

## 4. Política de Barrel Files: Regla de la Hoja Terminal (*Leaf-Folder Policy*)

El estándar sigue un principio estricto y predecible:

> **Regla de Oro**:
> - Una carpeta **SOLO** debe tener `index.ts` si contiene **directamente archivos de implementación** (carpeta hoja).
> - Si una carpeta contiene **subcarpetas** (carpetas intermedias o contenedoras), **NUNCA** debe tener `index.ts`.

### 4.1 Matriz de Barrels

| Ruta de Directorio | ¿Contiene Subcarpetas o Archivos? | ¿Lleva `index.ts`? | Motivo |
| :--- | :--- | :---: | :--- |
| `src/features/<feature>/` | Contiene subcarpetas (`components/`, `hooks/`, etc.) | ❌ **NO** | Carpeta raíz contenedora de feature. Rompe tree-shaking. |
| `src/features/<feature>/components/` | Contiene subcarpetas de componentes | ❌ **NO** | Agrupador intermedio. |
| `src/features/<feature>/components/invoice-card/` | Contiene archivos (`invoice-card.tsx`, `.test.tsx`) | ✅ **SÍ** | Carpeta hoja con archivos directos. |
| `src/features/<feature>/components/sections/` | Contiene subcarpetas (`hero/`, `pricing/`) | ❌ **NO** | Agrupador intermedio de secciones. |
| `src/features/<feature>/components/sections/hero/` | Contiene archivos directos (`hero.tsx`, `.test.tsx`) | ✅ **SÍ** | Carpeta hoja final. |
| `src/features/<feature>/models/` | Contiene archivos directos (`invoice.ts`, `customer.ts`) | ✅ **SÍ** | Carpeta hoja con archivos directos. |
| `src/features/<feature>/schemas/` | Contiene archivos directos (`create-invoice.schema.ts`) | ✅ **SÍ** | Carpeta hoja con archivos directos. |
| `src/features/<feature>/utils/` | Contiene archivos directos (`parse-params.ts`, etc.) | ✅ **SÍ** | Carpeta hoja con archivos directos. |
| `src/features/<feature>/hooks/` | Contiene subcarpetas (`use-invoices/`, etc.) | ❌ **NO** | Agrupador intermedio (no colocar archivos sueltos aquí). |
| `src/features/<feature>/hooks/use-invoices/` | Contiene archivos directos (`.hook.ts`, `.test.ts`) | ✅ **SÍ** | Carpeta hoja final. |

### 4.2 Convención de Importaciones
Las importaciones siempre deben usar el alias `@/*` apuntando a la carpeta hoja que posee el `index.ts`:

```typescript
// ✅ CORRECTO: Importar desde la carpeta hoja que posee index.ts
import { BillingOverview } from '@/features/billing/screens/billing-overview';
import { useInvoices } from '@/features/billing/hooks/use-invoices';
import { createInvoice } from '@/features/billing/services/create-invoice';
import { IInvoice, IPaymentMethod } from '@/features/billing/models';
import { createInvoiceSchema } from '@/features/billing/schemas';
import { parseBillingSearchParams } from '@/features/billing/utils';
import { FormDialog } from '@/components/common/form-dialog';

// ❌ PROHIBIDO: Importar desde contenedores padre sin barrel o saltar el barrel de utils/models/schemas
import { BillingOverview, useInvoices } from '@/features/billing';
import { FormDialog } from '@/components/common';
import { InvoiceCard } from '@/features/billing/components';
import { parseBillingSearchParams } from '@/features/billing/utils/parse-billing-search-params';
```

---

## 5. Convenciones de Identificadores en Código

| Entidad | Casing | Regla / Prefijo | Ejemplo |
| :--- | :--- | :--- | :--- |
| **Componentes & Screens** | `PascalCase` | Sustantivo descriptivo | `InvoiceCard`, `BillingOverview` |
| **Form Dialogs** | `PascalCase` | Sufijo `FormDialog` | `InvoiceFormDialog`, `PaymentFormDialog` |
| **Hooks de React** | `camelCase` | Prefijo `use` | `useInvoices`, `useDebounce` |
| **Esquemas Zod** | `camelCase` | Sufijo `Schema` | `createInvoiceSchema`, `loginSchema` |
| **Servicios / Actions** | `camelCase` | Verbo + sustantivo | `createInvoice`, `getInvoices` |
| **Interfaces de Dominio** | `PascalCase` | Prefijo `I` | `IInvoice`, `IPaymentMethod` |
| **Tipos y Enums** | `PascalCase` | Sustantivo | `InvoiceStatus`, `PaymentGateway` |
| **Utilidades y Helpers** | `camelCase` | Verbo / Acción | `formatCurrency`, `cn` |
| **Constantes Globales** | `UPPER_SNAKE_CASE` | Inmutable | `DEFAULT_PAGE_SIZE`, `MAX_ATTACHMENT_MB` |

---

## 6. Política de Testing Dual: Vitest (Unit) + Playwright (E2E)

### 6.1 Exclusiones de Pruebas Unitarias (Vitest)
Para evitar tests redundantes sobre código declarativo o pegamento de enrutamiento, las siguientes carpetas **NO llevan pruebas unitarias (`.test.tsx` / `.test.ts`)**:
- **`src/app/`**: Capa de entrega delgada (Thin App Router). Se verifica de extremo a extremo con **Playwright** en `e2e/`.
- **`src/config/`**: Constantes inmutables, feature flags y validación de variables de entorno estáticas.
- **`models/`**: Interfaces, tipos y enums de TypeScript sin lógica en tiempo de ejecución.
- **`schemas/`**: Esquemas declarativos de validación Zod (se ejercitan en los tests de los servicios y hooks que los consumen).

### 6.2 Extracción Obligatoria de Lógica de Rutas a `utils/`
En Next.js 15+, `params` y `searchParams` son promesas (`Promise<...>`). Si una página o layout requiere procesar datos (extraer y transformar query params, formatear metadatos dinámicos o verificar condiciones de redirección):

1. **Extraer la lógica a una función pura en `src/features/<feature>/utils/<util-name>.ts`** (y reexportarla en `utils/index.ts`).
2. **Escribir pruebas unitarias con Vitest en `utils/<util-name>.test.ts`** asegurando cobertura $\ge 90\%$.
3. **Consumir desde el barrel `@/features/<feature>/utils` en `page.tsx`**:
   ```tsx
   // src/app/(dashboard)/billing/page.tsx
   import type { Metadata } from 'next';
   import { BillingOverview } from '@/features/billing/screens/billing-overview';
   import { parseBillingSearchParams } from '@/features/billing/utils';

   interface IPageProps {
     readonly searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
   }

   export async function generateMetadata({ searchParams }: IPageProps): Promise<Metadata> {
     const resolvedParams = await searchParams;
     const { pageTitle } = parseBillingSearchParams(resolvedParams);
     return { title: pageTitle };
   }

   export default async function BillingPage({ searchParams }: IPageProps) {
     const resolvedParams = await searchParams;
     const filters = parseBillingSearchParams(resolvedParams);

     return <BillingOverview initialFilters={filters} />;
   }
   ```
