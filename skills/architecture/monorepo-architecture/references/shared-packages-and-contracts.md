# Paquetes Compartidos y Contratos Cross-Platform

---

## 1. Paquetes Internos Compilados y Compatibilidad Multi-Bundler

Todo paquete de `packages/` con código TypeScript se compila con `tsc` a `dist/` y expone únicamente sus rutas en `exports`:

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

**¿Por qué compilados a `dist/`?**
- **NestJS (`Node16`)**, **Next.js (`Bundler`)**, **Expo Metro (`unstable_enablePackageExports`)** y **Astro/Vite (`Bundler`)** resuelven el mismo contrato `exports` sin configurar `transpilePackages` ni alias hacia `src/` ajenos.
- `library.json` compila con `module: Node16` (CommonJS + `.d.ts`). Todos los bundlers modernos (Next, Astro/Vite, Metro) y NestJS consumen CJS + tipos sin fricción.
- **Excepción ESM-only:** si algún paquete interno envuelve una dependencia externa publicada solo en ESM, añade `tsup` para emitir salida dual (`.mjs` + `.cjs`) actualizando `exports` con `"import"` y `"require"`.

---

## 2. Catálogo de Paquetes (`scaffold-package.mjs`)

| `--kind` | Plataforma | Para qué sirve | Regla de uso |
| :--- | :--- | :--- | :--- |
| `contracts` | `universal` | Esquemas Zod por dominio (`./common`, `./<nouns>`) | Cero dependencias de React/Next/Nest/RN/Astro |
| `api-client` | `universal` | Cliente tipado OpenAPI + `getHeaders` cross-platform | Regenerar contra Swagger en el mismo PR del cambio |
| `design-tokens` | `universal` | Colores, spacing, radios y tipografía (`tailwindThemeExtend`) | Compartible entre Next.js, Astro y Expo NativeWind |
| `ui-web` | `web` | Componentes React DOM compartidos | Solo cuando existan **2+ apps web** (ej. `web` + `admin` o islas React de `landing`). Nunca importar desde `mobile` |
| `ui-native` | `native` | Primitivas/contratos React Native | Solo cuando existan **2+ apps móviles**. Nunca importar desde `web` o `landing` |
| `lib` | `universal` | Utilidades puras (fechas, dinero, formato, i18n) | Al menos 2 consumidores compatibles |
| `config` | `universal` | Configs compartidas sin compilación (`tsconfig`, `oxc-config`, `eslint-config`) | Sin código de runtime |

---

## 3. Modo `zod`: `packages/contracts`

Un esquema Zod por dominio compartido entre backend y clientes TypeScript (`web`, `mobile` y formularios en islas de `landing`).

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

- **En la API (`apps/api`, NestJS):**
  ```ts
  import { createZodDto } from 'nestjs-zod';
  import { createInvoiceSchema } from '@acme/contracts/invoices';

  export class CreateInvoiceDto extends createZodDto(createInvoiceSchema) {}
  ```
  Mantén `InvoiceResponseDto.fromEntity()` con `@ApiProperty` tal como exige `nestjs-architecture`.
- **En Web (`apps/web`, Next.js) y Mobile (`apps/mobile`, Expo):**
  Extiende el esquema con reglas solo de UI cuando haga falta, nunca lo dupliques:
  ```ts
  import { createInvoiceSchema } from '@acme/contracts/invoices';
  export const createInvoiceFormSchema = createInvoiceSchema.extend({ acceptTerms: z.literal(true) });
  ```
- **En Landing (`apps/landing`, Astro):**
  Útil para validar formularios de contacto, newsletter o waitlist compartidos con endpoints públicos de la API.

---

## 4. Modo `openapi`: `packages/api-client` (Web + Astro + Mobile + Políglotas)

Cuando la API la consumen **app móvil (`apps/mobile`)**, **partners externos** o **servicios políglotas (`services/*`)**, Swagger/OpenAPI es la fuente de verdad:

1. **API (`apps/api` o servicio Python/Go):** expone `/api-json` (o archivo `openapi.json`).
2. **Generación:** `OPENAPI_SCHEMA_URL=http://localhost:3000/api-json pnpm --filter @acme/api-client generate` escribe `src/generated/schema.ts` (commitéalo para que CI no necesite levantar la API).
3. **Consumo cross-platform con `getHeaders`:**
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
     En páginas `.astro` (build/SSR) usa `import.meta.env.PUBLIC_API_URL`; en islas interactivas de cliente usa `createApiClient` igual que en web.

---

## 5. Diseño Compartido con `packages/design-tokens`

Para mantener consistencia visual entre **Next.js (Tailwind)**, **Astro (Tailwind)** y **Expo (NativeWind)** sin mezclar primitivas DOM con nativas:

```ts
// apps/web/tailwind.config.ts | apps/landing/tailwind.config.mjs | apps/mobile/tailwind.config.js
import { tailwindThemeExtend } from '@acme/design-tokens';

export default {
  theme: { extend: tailwindThemeExtend },
};
```

- `design-tokens` es `platform: "universal"` → permitido en `web`, `landing` y `mobile`.
- Los componentes concretos viven en cada app (`apps/web/src/components`, `apps/landing/src/components`, `apps/mobile/src/components`), o en `ui-web` / `ui-native` solo si existen 2+ apps de esa misma plataforma.
