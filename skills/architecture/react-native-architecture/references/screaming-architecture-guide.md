# Guía de Screaming Architecture para React Native

## Árbol de referencia

```
src/
├── app/                        # Expo Router: SOLO rutas delgadas (sin tests)
│   ├── _layout.tsx
│   └── billing/
│       └── index.tsx           # re-exporta la screen de la feature
├── components/common/          # UI compartida
│   └── user-card/{user-card.tsx, user-card.test.tsx, index.ts}
├── config/                     # constantes, cliente HTTP, env (sin tests)
└── features/
    └── billing/                # sin index.ts en la raíz
        ├── components/<name>/  # {name}.tsx, {name}.test.tsx, index.ts
        ├── hooks/use-<action>/ # use-<action>.hook.ts, test, index.ts
        ├── models/             # <entity>.ts planos + index.ts
        ├── schemas/            # <name>.schema.ts planos + index.ts
        ├── screens/<name>/     # {name}.tsx, test, index.ts
        ├── services/<verb>-<noun>/ # *.service.ts, test, index.ts
        └── utils/              # funciones puras + tests + index.ts
```

## Sufijos y nombres

| Capa | Archivo | Identificador |
| --- | --- | --- |
| Modelo | `invoice.ts` | `IInvoice` |
| Esquema | `create-invoice.schema.ts` | `createInvoiceSchema` |
| Hook | `use-invoices.hook.ts` | `useInvoices` |
| Servicio | `get-invoices.service.ts` | `getInvoices` |
| Componente / screen | `invoice-card.tsx` | `InvoiceCard` |

Carpetas y archivos en `kebab-case`; componentes en `PascalCase`; interfaces con prefijo `I`.

## Barrels

Una carpeta tiene `index.ts` solo si contiene implementación directamente. Importa siempre desde esa carpeta hoja, nunca desde la raíz de la feature ni desde agrupadores.

## Tests

Jest (`jest-expo`) + `@testing-library/react-native`. Un `.test.ts(x)` adyacente por componente, hook, servicio y util. Cobertura mínima 90 %; sin tests para `models/`, `schemas/`, `config/`, `app/` ni `index.ts`.
