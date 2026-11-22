# Screaming Architecture Guide for React Native

## Reference tree

```
src/
├── app/                        # Expo Router: ONLY thin routes (no logic or tests)
│   ├── _layout.tsx
│   └── billing/
│       └── index.tsx           # re-exports the feature's screen
├── components/common/          # UI shared by several features
│   └── user-card/{user-card.tsx, user-card.test.tsx, index.ts}
├── config/                     # constants, HTTP client, env
├── lib/                        # cross-cutting, domain-agnostic utilities
└── features/
    └── billing/                # no index.ts at the root
        ├── components/<name>/  # {name}.tsx, {name}.test.tsx, index.ts
        ├── hooks/<entity>-keys/# <entity>.keys.ts, index.ts (no test)
        ├── hooks/use-<action>/ # use-<action>.hook.ts, test, index.ts
        ├── models/             # flat <entity>.ts files + index.ts
        ├── schemas/            # flat <name>.schema.ts files + index.ts
        ├── screens/<name>/     # {name}.tsx, test, index.ts
        ├── services/<verb>-<noun>/ # *.service.ts, test, index.ts
        ├── stores/<name>/      # (optional Zustand) <name>.store.ts, test, index.ts
        └── utils/              # pure functions + tests + index.ts
```

## Suffixes and names

| Layer | File | Identifier |
| --- | --- | --- |
| Model | `invoice.ts` | `IInvoice` |
| Schema | `create-invoice.schema.ts` | `createInvoiceSchema` |
| Key factory | `invoice.keys.ts` | `invoiceKeys` |
| Hook | `use-invoices.hook.ts` | `useInvoices` |
| Service | `get-invoices.service.ts` | `getInvoices` |
| Component / screen | `invoice-card.tsx` | `InvoiceCard` |
| Store (Zustand) | `billing-ui.store.ts` | `useBillingUiStore` |

Folders and files in `kebab-case`; components in `PascalCase`; interfaces with an `I` prefix.

## Barrels (Leaf-Folder Barrel Policy)

A folder has an `index.ts` only if it directly contains implementation files. Always import from that leaf folder, never from the feature root or from groupers (`components/`, `hooks/`, `screens/`, etc.).

```typescript
// ✅ CORRECT
import { useInvoices } from '@/features/billing/hooks/use-invoices';
import { invoiceKeys } from '@/features/billing/hooks/invoice-keys';
import { IInvoice } from '@/features/billing/models';

// ❌ FORBIDDEN: container folders or the root
import { useInvoices, IInvoice } from '@/features/billing';
import { InvoiceCard } from '@/features/billing/components';
```

## Quality and Tests

- **Linter and formatter:** **Oxlint** for ultra-fast static analysis with architectural rules (`no-restricted-imports`) and **Oxfmt** with automatic Tailwind sorting (`sortTailwindcss: true`).
- **Test Runner:** Jest (`jest-expo`) + `@testing-library/react-native`.
- **Coverage $\ge 90\%$:** a mandatory adjacent test (`.test.ts(x)`) for every component, hook, service, store and util.
- **Coverage exclusions:** `models/`, `schemas/`, `hooks/*-keys/`, `src/app/**`, `index.ts` barrels and pure constant files (`src/config/env.ts`, `src/config/constants.ts`). Modules with I/O logic or interceptors in `src/config/` (such as `api-client.ts`) do need unit tests.
