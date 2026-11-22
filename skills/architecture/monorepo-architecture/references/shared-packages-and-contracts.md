# Shared Packages and Cross-Platform Contracts

---

## 1. Compiled Internal Packages and Multi-Bundler Compatibility

Every package in `packages/` with TypeScript code compiles with `tsc` to `dist/` and exposes only its routes in `exports`:

```json
{
  "name": "@acme/contracts",
  "private": true,
  "monorepo": { "layer": "package", "platform": "universal" },
  "files": ["dist"],
  "exports": {
    "./common": { "types": "./dist/common/index.d.ts", "default": "./dist/common/index.js" },
    "./invoices": { "types": "./dist/invoices/index.d.ts", "default": "./dist/invoices/index.js" }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsc -p tsconfig.json --watch",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "oxlint --deny-warnings src",
    "format:check": "oxfmt --check src",
    "test": "vitest run --passWithNoTests"
  }
}
```

**Why compile to `dist/`?**
- **NestJS (`Node16`)**, **Next.js (`Bundler`)**, **Expo Metro (`unstable_enablePackageExports`)** and **Astro/Vite (`Bundler`)** resolve the same `exports` contract without configuring `transpilePackages` or aliases into other packages' `src/`.
- `library.json` compiles with `module: Node16` (CommonJS + `.d.ts`). Every modern bundler (Next, Astro/Vite, Metro) and NestJS consume CJS + types without friction.
- **ESM-only exception:** if an internal package wraps an external dependency published only as ESM, add `tsup` to emit dual output (`.mjs` + `.cjs`), updating `exports` with `"import"` and `"require"`.

---

## 2. Package Catalog (`scaffold-package.mjs`)

| `--kind` | Platform | What it is for | Usage rule |
| :--- | :--- | :--- | :--- |
| `contracts` | `universal` | Zod schemas per domain (`./common`, `./<nouns>`) | Zero dependencies on React/Next/Nest/RN/Astro |
| `api-client` | `universal` | Typed OpenAPI client + cross-platform `getHeaders` | Regenerate against Swagger in the same PR as the change |
| `design-tokens` | `universal` | Colors, spacing, radii and typography (`tailwindThemeExtend`) | Shareable across Next.js, Astro and Expo NativeWind |
| `ui-web` | `web` | Shared React DOM components | Only when there are **2+ web apps** (e.g. `web` + `admin`, or `landing` React islands). Never import from `mobile` |
| `ui-native` | `native` | React Native primitives/contracts | Only when there are **2+ mobile apps**. Never import from `web` or `landing` |
| `lib` | `universal` | Pure utilities (dates, money, formatting, i18n) | At least 2 compatible consumers |
| `config` | `universal` | Shared configs with no compilation (`tsconfig`, `oxc-config`, `eslint-config`) | No runtime code |

---

## 3. `zod` Mode: `packages/contracts`

One Zod schema per domain, shared between the backend and TypeScript clients (`web`, `mobile` and forms in `landing` islands).

```ts
// packages/contracts/src/invoices/invoice.schema.ts
import { z } from 'zod';

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  amount: z.number().positive(),
});
export const updateInvoiceSchema = createInvoiceSchema.partial();
export const invoiceSchema = createInvoiceSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
```

- **In the API (`apps/api`, NestJS):**
  ```ts
  import { createZodDto } from 'nestjs-zod';
  import { createInvoiceSchema } from '@acme/contracts/invoices';

  export class CreateInvoiceDto extends createZodDto(createInvoiceSchema) {}
  ```
  Keep `InvoiceResponseDto.fromEntity()` with `@ApiProperty`, as `nestjs-architecture` requires.
- **In Web (`apps/web`, Next.js) and Mobile (`apps/mobile`, Expo):**
  Extend the schema with UI-only rules when needed, never duplicate it:
  ```ts
  import { createInvoiceSchema } from '@acme/contracts/invoices';
  export const createInvoiceFormSchema = createInvoiceSchema.extend({ acceptTerms: z.literal(true) });
  ```
- **In Landing (`apps/landing`, Astro):**
  Useful for validating contact, newsletter or waitlist forms shared with the API's public endpoints.

---

## 4. `openapi` Mode: `packages/api-client` (Web + Astro + Mobile + Polyglot)

When the API is consumed by the **mobile app (`apps/mobile`)**, **external partners** or **polyglot services (`services/*`)**, Swagger/OpenAPI is the source of truth:

1. **API (`apps/api` or a Python/Go service):** exposes `/api-json` (or an `openapi.json` file).
2. **Generation:** `OPENAPI_SCHEMA_URL=http://localhost:3000/api-json pnpm --filter @acme/api-client generate` writes `src/generated/schema.ts` (commit it so CI does not need to start the API).
3. **Cross-platform consumption with `getHeaders`:**
   - **Web (Next.js):**
     ```ts
     import { createApiClient } from '@acme/api-client/client';
     export const api = createApiClient(process.env.NEXT_PUBLIC_API_URL!);
     ```
   - **Mobile (Expo + `expo-secure-store`):**
     ```ts
     import * as SecureStore from 'expo-secure-store';
     import { createApiClient } from '@acme/api-client/client';

     export const api = createApiClient(process.env.EXPO_PUBLIC_API_URL!, {
       getHeaders: async () => {
         const token = await SecureStore.getItemAsync('access_token');
         return token ? { Authorization: `Bearer ${token}` } : {};
       },
     });
     ```
   - **Landing (Astro):**
     In `.astro` pages (build/SSR) use `import.meta.env.PUBLIC_API_URL`; in interactive client islands use `createApiClient` as on web.

---

## 5. Shared Design with `packages/design-tokens`

To keep visual consistency across **Next.js (Tailwind)**, **Astro (Tailwind)** and **Expo (NativeWind)** without mixing DOM and native primitives:

```ts
// apps/web/tailwind.config.ts | apps/landing/tailwind.config.mjs | apps/mobile/tailwind.config.js
import { tailwindThemeExtend } from '@acme/design-tokens';

export default {
  theme: { extend: tailwindThemeExtend },
};
```

- `design-tokens` is `platform: "universal"` → allowed in `web`, `landing` and `mobile`.
- Concrete components live in each app (`apps/web/src/components`, `apps/landing/src/components`, `apps/mobile/src/components`), or in `ui-web` / `ui-native` only if there are 2+ apps on that same platform.
