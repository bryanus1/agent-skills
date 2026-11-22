# Screaming Architecture Guide (Feature-Driven / Domain-First)

This guide defines the standard for directory organization, layer boundaries, naming conventions and import policies for modern Next.js (App Router) applications.

---

## 1. Core Principle: Screaming Architecture

The project's folder structure must "scream" the business domain before the framework's technical details.
- **Domain-Oriented**: each business capability lives in a self-contained module inside `src/features/<feature-name>/`.
- **Strict Decoupling**: the visual layer (`screens/`, `components/`), data contracts (`models/`), validation (`schemas/`), orchestration (`hooks/`) and service communication (`services/`) are clearly separated.
- **Thin App Router**: files under `src/app/**` act only as route dispatchers. Their job is to mount screens (`screens`), provide metadata (`Metadata`) and configure layouts, with no business logic or state.
- **Server Components by Default**: screens (`screens/`) and components (`components/`) are **React Server Components (RSC)** by default. The `'use client'` directive is pushed only to interactive leaves (`*-form-dialog`, controls with local state or hook consumers).

---

## 2. Standard Directory Tree

```text
├── e2e/                  # Playwright E2E specs (<feature>.spec.ts)
└── src/
    ├── app/              # Thin routing layer (layout.tsx, page.tsx, route.ts)
    ├── config/           # Global configuration (env, constants, feature flags)
    ├── contexts/         # Subfolders for global React contexts (e.g. auth, theme)
    ├── features/         # Business domain modules
    │   └── <feature-name>/   # e.g., landing, auth, billing, users
    │       ├── components/   # UI components exclusive to the feature
    │       │   └── sections/ # Page section subcomponents (optional)
    │       ├── hooks/        # React hooks specific to the feature
    │       ├── models/       # Flat domain models (with index.ts)
    │       ├── schemas/      # Flat Zod validation schemas (with index.ts)
    │       ├── screens/      # Fully assembled screens
    │       ├── services/     # Server Actions / API calls ('use server' or fetch)
    │       └── utils/        # Feature utilities and logic extracted from routes/layouts (with tests + index.ts)
    ├── components/       # Shared, domain-agnostic UI elements
    │   ├── ui/           # Base primitives (e.g. shadcn/ui components)
    │   ├── common/       # Shared composite components (FormDialog, Logo, etc.)
    │   └── icons/        # SVG icon subfolders (with component + index.ts)
    ├── hooks/            # Global, agnostic React hooks (e.g. use-debounce)
    ├── lib/              # Shared utilities (e.g. utils.ts, client config)
    ├── models/           # Global, shared domain models (flat files)
    └── types/            # Ambient TypeScript type declarations
```

---

## 3. Subfolder Encapsulation Pattern & Suffixes

### 3.1 Encapsulated Subfolder Standard
Each component, screen, hook, service, context and icon lives in its own dedicated subfolder named in `kebab-case`. The subfolder contains:
1. **Implementation file**: `<entity-name>.<suffix>.<ext>`
2. **Colocated test file (Vitest)**: `<entity-name>.<suffix>.test.<ext>`
3. **Local barrel file**: an `index.ts` that exports only that entity (`export * from './<entity-name>.<suffix>';`).

#### Hook example:
```text
src/features/billing/hooks/use-invoices/
├── index.ts
├── use-invoices.hook.test.ts
└── use-invoices.hook.ts
```

#### Component example:
```text
src/features/billing/components/invoice-card/
├── index.ts
├── invoice-card.test.tsx
└── invoice-card.tsx
```

### 3.2 Flat-File Leaf Folders (`models/`, `schemas/`, `utils/`)
Domain models (`models/`), validation schemas (`schemas/`) and utility functions (`utils/`) live directly as **flat files** inside their folder, alongside a single `index.ts`:

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

- **No individual subfolders**: no subfolder is created per model, schema or utility.
- **Test policy in flat folders**:
  - `models/` and `schemas/` are declarative contracts and pure schemas; they have **no** `.test.ts` files.
  - `utils/` contains pure logic and transformations; it **does** have a `.test.ts` next to each utility.
- **Local barrel**: as leaf folders with direct files, `models/index.ts`, `schemas/index.ts` and `utils/index.ts` re-export all their members for clean consumption.

### 3.3 Suffixes and Conventions Table

| Layer / Type | Subfolder Casing | File Suffix | Test Suffix (Vitest) | Path Example |
| :--- | :--- | :--- | :--- | :--- |
| **React component** | `kebab-case` | `.tsx` | `.test.tsx` | `billing-header/billing-header.tsx` |
| **Screen** | `kebab-case` | `.tsx` | `.test.tsx` | `billing-overview/billing-overview.tsx` |
| **Form Dialog** | `kebab-case` (`*-form-dialog`) | `.tsx` | `.test.tsx` | `invoice-form-dialog/invoice-form-dialog.tsx` |
| **React hook** | `kebab-case` | `.hook.ts` | `.hook.test.ts` | `use-invoices/use-invoices.hook.ts` |
| **Zod schema** | *Leaf folder* | `.schema.ts` | — | `schemas/create-invoice.schema.ts` + `schemas/index.ts` |
| **Service / Action** | `kebab-case` | `.service.ts` | `.service.test.ts` | `create-invoice/create-invoice.service.ts` |
| **React context** | `kebab-case` | `.context.tsx` | `.context.test.tsx` | `billing/billing.context.tsx` |
| **Domain models** | *Leaf folder* | `.ts` | — | `models/invoice.ts` + `models/index.ts` |
| **Utilities** | *Leaf folder* | `.ts` | `.test.ts` | `utils/parse-billing-params.ts` + `utils/index.ts` |
| **SVG icon** | `kebab-case` | `.tsx` | — | `icons/credit-card/credit-card.tsx` |
| **E2E test (Playwright)** | *`e2e/` root* | `.spec.ts` | `.spec.ts` | `e2e/billing.spec.ts` |

---

## 4. Barrel File Policy: the Leaf-Folder Rule

The standard follows a strict, predictable principle:

> **Golden Rule**:
> - A folder has an `index.ts` **ONLY** if it **directly contains implementation files** (a leaf folder).
> - If a folder contains **subfolders** (intermediate or container folders), it **NEVER** has an `index.ts`.

### 4.1 Barrel Matrix

| Directory Path | Contains Subfolders or Files? | Has an `index.ts`? | Reason |
| :--- | :--- | :---: | :--- |
| `src/features/<feature>/` | Contains subfolders (`components/`, `hooks/`, etc.) | ❌ **NO** | Feature root container. Breaks tree-shaking. |
| `src/features/<feature>/components/` | Contains component subfolders | ❌ **NO** | Intermediate grouper. |
| `src/features/<feature>/components/invoice-card/` | Contains files (`invoice-card.tsx`, `.test.tsx`) | ✅ **YES** | Leaf folder with direct files. |
| `src/features/<feature>/components/sections/` | Contains subfolders (`hero/`, `pricing/`) | ❌ **NO** | Intermediate section grouper. |
| `src/features/<feature>/components/sections/hero/` | Contains direct files (`hero.tsx`, `.test.tsx`) | ✅ **YES** | Final leaf folder. |
| `src/features/<feature>/models/` | Contains direct files (`invoice.ts`, `customer.ts`) | ✅ **YES** | Leaf folder with direct files. |
| `src/features/<feature>/schemas/` | Contains direct files (`create-invoice.schema.ts`) | ✅ **YES** | Leaf folder with direct files. |
| `src/features/<feature>/utils/` | Contains direct files (`parse-params.ts`, etc.) | ✅ **YES** | Leaf folder with direct files. |
| `src/features/<feature>/hooks/` | Contains subfolders (`use-invoices/`, etc.) | ❌ **NO** | Intermediate grouper (do not put loose files here). |
| `src/features/<feature>/hooks/use-invoices/` | Contains direct files (`.hook.ts`, `.test.ts`) | ✅ **YES** | Final leaf folder. |

### 4.2 Import Convention
Imports must always use the `@/*` alias pointing to the leaf folder that owns the `index.ts`:

```typescript
// ✅ CORRECT: import from the leaf folder that owns index.ts
import { BillingOverview } from '@/features/billing/screens/billing-overview';
import { useInvoices } from '@/features/billing/hooks/use-invoices';
import { createInvoice } from '@/features/billing/services/create-invoice';
import { IInvoice, IPaymentMethod } from '@/features/billing/models';
import { createInvoiceSchema } from '@/features/billing/schemas';
import { parseBillingSearchParams } from '@/features/billing/utils';
import { FormDialog } from '@/components/common/form-dialog';

// ❌ FORBIDDEN: importing from parent containers without a barrel, or skipping the utils/models/schemas barrel
import { BillingOverview, useInvoices } from '@/features/billing';
import { FormDialog } from '@/components/common';
import { InvoiceCard } from '@/features/billing/components';
import { parseBillingSearchParams } from '@/features/billing/utils/parse-billing-search-params';
```

---

## 5. Identifier Conventions in Code

| Entity | Casing | Rule / Prefix | Example |
| :--- | :--- | :--- | :--- |
| **Components & Screens** | `PascalCase` | Descriptive noun | `InvoiceCard`, `BillingOverview` |
| **Form Dialogs** | `PascalCase` | `FormDialog` suffix | `InvoiceFormDialog`, `PaymentFormDialog` |
| **React hooks** | `camelCase` | `use` prefix | `useInvoices`, `useDebounce` |
| **Zod schemas** | `camelCase` | `Schema` suffix | `createInvoiceSchema`, `loginSchema` |
| **Services / Actions** | `camelCase` | Verb + noun | `createInvoice`, `getInvoices` |
| **Domain interfaces** | `PascalCase` | `I` prefix | `IInvoice`, `IPaymentMethod` |
| **Types and Enums** | `PascalCase` | Noun | `InvoiceStatus`, `PaymentGateway` |
| **Utilities and helpers** | `camelCase` | Verb / action | `formatCurrency`, `cn` |
| **Global constants** | `UPPER_SNAKE_CASE` | Immutable | `DEFAULT_PAGE_SIZE`, `MAX_ATTACHMENT_MB` |

---

## 6. Dual Testing Policy: Vitest (Unit) + Playwright (E2E)

### 6.1 Unit Test Exclusions (Vitest)
To avoid redundant tests over declarative code or routing glue, the following folders have **NO unit tests (`.test.tsx` / `.test.ts`)**:
- **`src/app/`**: thin delivery layer (Thin App Router). It is verified end to end with **Playwright** in `e2e/`.
- **`src/config/`**: immutable constants, feature flags and static environment variable validation.
- **`models/`**: TypeScript interfaces, types and enums with no runtime logic.
- **`schemas/`**: declarative Zod validation schemas (exercised in the tests of the services and hooks that consume them).

### 6.2 Mandatory Extraction of Route Logic to `utils/`
In Next.js 15+, `params` and `searchParams` are promises (`Promise<...>`). If a page or layout needs to process data (extracting and transforming query params, formatting dynamic metadata or checking redirect conditions):

1. **Extract the logic to a pure function in `src/features/<feature>/utils/<util-name>.ts`** (and re-export it in `utils/index.ts`).
2. **Write Vitest unit tests in `utils/<util-name>.test.ts`**, ensuring $\ge 90\%$ coverage.
3. **Consume it from the `@/features/<feature>/utils` barrel in `page.tsx`**:
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
