# Paquetes Compartidos y Contratos

---

## 1. Paquetes Internos Compilados

Todo paquete de `packages/` con código se compila con `tsc` a `dist/` y expone solo lo que declara en `exports`:

```json
{
  "name": "@acme/contracts",
  "private": true,
  "files": ["dist"],
  "exports": {
    "./common": { "types": "./dist/common/index.d.ts", "default": "./dist/common/index.js" },
    "./invoices": { "types": "./dist/invoices/index.d.ts", "default": "./dist/invoices/index.js" }
  },
  "scripts": { "build": "tsc -p tsconfig.json", "dev": "tsc -p tsconfig.json --watch" }
}
```

**¿Por qué compilados?** NestJS se compila con `tsc` y no transpila código de `node_modules`. Next podría hacerlo con `transpilePackages`, pero entonces los dos consumidores leerían el paquete de forma distinta. Con `dist/`:
- Next (`moduleResolution: Bundler`) y Nest (`moduleResolution: Node16`) resuelven el mismo `exports`;
- `turbo` cachea el build;
- los tipos son los publicados, no los de `src/`.

**Formato de salida.** `library.json` usa `module: Node16` sin `"type": "module"`, así que la salida es CommonJS. Nest la carga con `require()` y Next la empaqueta sin configuración extra.

---

## 2. Modo `zod`: `packages/contracts`

Un esquema por dominio, compartido por la validación de la API y los formularios de la web.

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

### En la API (NestJS)

```ts
// apps/api/src/modules/invoices/dto/create-invoice.dto.ts
import { createZodDto } from 'nestjs-zod';
import { createInvoiceSchema } from '@acme/contracts/invoices';

export class CreateInvoiceDto extends createZodDto(createInvoiceSchema) {}
```

- **Configuración global:** registra `ZodValidationPipe` como pipe global (`{ provide: APP_PIPE, useClass: ZodValidationPipe }`). Para que Swagger documente los DTOs Zod, sigue la guía de `nestjs-zod` de tu versión.
- **Response DTO:** no cambia. `InvoiceResponseDto.fromEntity()` con `@ApiProperty` es obligatorio, como exige `nestjs-architecture`. El contrato Zod `invoiceSchema` describe el mismo payload y sirve a la web para validar respuestas.
- **Dependencias:** `pnpm --filter api add nestjs-zod zod`.

### En la web (Next.js)

```ts
// apps/web/src/features/invoices/schemas/create-invoice-form.schema.ts
import { z } from 'zod';
import { createInvoiceSchema } from '@acme/contracts/invoices';

// Extiende el contrato con reglas solo de UI; nunca lo redefinas.
export const createInvoiceFormSchema = createInvoiceSchema.extend({ acceptTerms: z.literal(true) });
```

`models/` de la feature puede re-exportar los tipos del contrato (`export type { Invoice } from '@acme/contracts/invoices'`) en lugar de duplicarlos.

---

## 3. Modo `openapi`: `packages/api-client`

La API sigue con `class-validator` y Swagger, y los tipos de la web se generan desde el documento OpenAPI.

1. **API:** NestJS expone el documento con `SwaggerModule.setup('api', app, document)`, en `http://localhost:3000/api-json`.
2. **Generación:** con la API en marcha, ejecuta `pnpm --filter @acme/api-client generate`, que llama a `openapi-typescript` y escribe `src/generated/schema.ts`. Commitea el resultado para que CI no dependa de una API viva.
3. **Web:**
   ```ts
   import { createApiClient } from '@acme/api-client/client';

   const api = createApiClient(process.env.NEXT_PUBLIC_API_URL!);
   const { data, error } = await api.GET('/invoices/{id}', { params: { path: { id } } });
   ```
- `src/generated/` no se edita a mano y se excluye del lint.
- **Mantenerlo al día:** regenera el cliente en el mismo PR que cambia un endpoint. Revisa el diff de `schema.ts` como parte de la revisión.

---

## 4. Cambiar de Modo

- **De `openapi` a `zod`:**
  1. Crea `packages/contracts` con `scaffold-package.mjs contracts --kind contracts`.
  2. Migra dominio a dominio: el esquema al contrato, y el DTO de entrada a `createZodDto`.
  3. Elimina `api-client` cuando la web ya no lo importe.
- **De `zod` a `openapi`:** hazlo cuando aparezcan consumidores externos. Mantén los contratos Zod para la web y añade `api-client` para los demás; no hace falta elegir uno solo.

---

## 5. Otros Paquetes (`scaffold-package.mjs`)

| `--kind` | Para qué | Exports |
| :--- | :--- | :--- |
| `lib` | Utilidades puras compartidas (formato, fechas, dinero) | `"."` |
| `contracts` | Esquemas Zod por dominio | `"./common"`, `"./<nouns>"` |
| `api-client` | Cliente generado desde OpenAPI | `"./client"`, `"./schema"` |
| `config` | Archivos de configuración compartidos sin build | `"./*"` |

**Componentes UI compartidos (`packages/ui`):** solo cuando haya dos apps web. Hasta entonces, los componentes viven en `apps/web/src/components`, como indica `nextjs-architecture`.
