# Guía de Screaming Architecture para React Native

## Árbol de referencia

```
src/
├── app/                        # Expo Router: SOLO rutas delgadas (sin lógica ni tests)
│   ├── _layout.tsx
│   └── billing/
│       └── index.tsx           # re-exporta la screen de la feature
├── components/common/          # UI compartida por múltiples features
│   └── user-card/{user-card.tsx, user-card.test.tsx, index.ts}
├── config/                     # constantes, cliente HTTP, env
├── lib/                        # utilidades transversales agnósticas de dominio
└── features/
    └── billing/                # sin index.ts en la raíz
        ├── components/<name>/  # {name}.tsx, {name}.test.tsx, index.ts
        ├── hooks/<entity>-keys/# <entity>.keys.ts, index.ts (sin test)
        ├── hooks/use-<action>/ # use-<action>.hook.ts, test, index.ts
        ├── models/             # <entity>.ts planos + index.ts
        ├── schemas/            # <name>.schema.ts planos + index.ts
        ├── screens/<name>/     # {name}.tsx, test, index.ts
        ├── services/<verb>-<noun>/ # *.service.ts, test, index.ts
        ├── stores/<name>/      # (opcional Zustand) <name>.store.ts, test, index.ts
        └── utils/              # funciones puras + tests + index.ts
```

## Sufijos y nombres

| Capa | Archivo | Identificador |
| --- | --- | --- |
| Modelo | `invoice.ts` | `IInvoice` |
| Esquema | `create-invoice.schema.ts` | `createInvoiceSchema` |
| Key factory | `invoice.keys.ts` | `invoiceKeys` |
| Hook | `use-invoices.hook.ts` | `useInvoices` |
| Servicio | `get-invoices.service.ts` | `getInvoices` |
| Componente / screen | `invoice-card.tsx` | `InvoiceCard` |
| Store (Zustand) | `billing-ui.store.ts` | `useBillingUiStore` |

Carpetas y archivos en `kebab-case`; componentes en `PascalCase`; interfaces con prefijo `I`.

## Barrels (Leaf-Folder Barrel Policy)

Una carpeta tiene `index.ts` solo si contiene archivos de implementación directamente. Importa siempre desde esa carpeta hoja, nunca desde la raíz de la feature ni desde agrupadores (`components/`, `hooks/`, `screens/`, etc.).

```typescript
// ✅ CORRECTO
import { useInvoices } from '@/features/billing/hooks/use-invoices';
import { invoiceKeys } from '@/features/billing/hooks/invoice-keys';
import { IInvoice } from '@/features/billing/models';

// ❌ PROHIBIDO: carpetas contenedoras o raíz
import { useInvoices, IInvoice } from '@/features/billing';
import { InvoiceCard } from '@/features/billing/components';
```

## Calidad y Tests

- **Linter y Formatter:** **Oxlint** para análisis estático ultra-rápido con reglas arquitectónicas (`no-restricted-imports`) y **Oxfmt** con ordenamiento automático de Tailwind (`sortTailwindcss: true`).
- **Test Runner:** Jest (`jest-expo`) + `@testing-library/react-native`.
- **Cobertura $\ge 90\%$:** test adyacente obligatorio (`.test.ts(x)`) para cada componente, hook, servicio, store y util.
- **Exclusiones de cobertura:** `models/`, `schemas/`, `hooks/*-keys/`, `src/app/**`, barrels `index.ts` y archivos de constantes puras (`src/config/env.ts`, `src/config/constants.ts`). Los módulos con lógica I/O o interceptores en `src/config/` (como `api-client.ts`) sí requieren tests unitarios.
