# Thin Routes with Expo Router

`src/app/` defines file-based navigation; the UI and logic live in `src/features/`.

## Minimal route

```tsx
// src/app/billing/index.tsx
import { BillingHome } from '@/features/billing/screens/billing-home';

export default BillingHome;
```

`scaffold-feature.mjs billing --with-starter --with-route` generates exactly this.

## Dynamic routes and parameters

Extract the parsing to the feature's `utils/` (with a test) and leave the route as an adapter:

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

`_layout.tsx` only composes providers (`QueryClientProvider`, theme) and `Stack`/`Tabs`. Providers with their own logic go in `src/config/` or in a feature, not inline.

## Rules

- No business logic, `useQuery` or styles in `src/app/**`.
- No `.test.tsx` files inside `src/app/` (Expo Router would treat them as routes).
- Screens do not import from `expo-router` unless they need navigation; prefer receiving callbacks through props.
