# Rutas delgadas con Expo Router

`src/app/` define la navegación por archivos; la UI y la lógica viven en `src/features/`.

## Ruta mínima

```tsx
// src/app/billing/index.tsx
import { BillingHome } from '@/features/billing/screens/billing-home';

export default BillingHome;
```

`scaffold-feature.mjs billing --with-starter --with-route` genera exactamente esto.

## Rutas dinámicas y parámetros

Extrae el parseo a `utils/` de la feature (con test) y deja la ruta como adaptador:

```tsx
// src/app/billing/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { InvoiceDetail } from '@/features/billing/screens/invoice-detail';
import { parseInvoiceParams } from '@/features/billing/utils';

export default function InvoiceRoute() {
  const params = parseInvoiceParams(useLocalSearchParams());
  return <InvoiceDetail id={params.id} />;
}
```

## Layouts

`_layout.tsx` solo compone providers (`QueryClientProvider`, tema) y `Stack`/`Tabs`. Los providers con lógica propia van en `src/config/` o en una feature, no inline.

## Reglas

- Sin lógica de negocio, `useQuery` ni estilos en `src/app/**`.
- Sin archivos `.test.tsx` dentro de `src/app/` (Expo Router los trataría como rutas).
- Las screens no importan de `expo-router` salvo que necesiten navegación; prefiere recibir callbacks por props.
