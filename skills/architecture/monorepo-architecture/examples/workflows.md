# 📚 Casos de Uso y Flujos de Ejemplo — `monorepo-architecture`

## Caso 1: Monorepo nuevo con contratos Zod

> *"Crea un monorepo para acme con una web en Next.js y una API en NestJS que compartan validaciones."*

1. El agente elige `zod`: mismo equipo, proyecto nuevo, solo consumidores TypeScript. Lo explica en una línea.
2. Previsualiza:
   ```bash
   node <skill-dir>/scripts/scaffold-monorepo.mjs --scope acme --contracts zod --dry-run
   ```
   Se crearían 18 archivos: raíz, `packages/tsconfig`, `packages/eslint-config`, `packages/contracts` y `scripts/check-boundaries.mjs`.
3. Tras la confirmación, lo ejecuta sin `--dry-run` y, con permiso, lanza `create-next-app` y `nest new` con los comandos que imprime el script.
4. Conecta las apps: `extends` de tsconfig y `"@acme/contracts": "workspace:*"`.
5. Verifica:
   ```bash
   pnpm install && pnpm turbo run build typecheck && pnpm check:boundaries
   ```

---

## Caso 2: Dominio full-stack (modo Zod)

> *"Añade facturas (invoice) de punta a punta."*

```bash
node <skill-dir>/scripts/scaffold-fullstack-feature.mjs invoice --dry-run
node <skill-dir>/scripts/scaffold-fullstack-feature.mjs invoice
```

Resultado:
- `packages/contracts/src/invoices/invoice.schema.ts` + `index.ts`, y `"./invoices"` añadido a `exports`.
- `apps/api/src/modules/invoices/`: los 18 archivos de `nestjs-architecture`.
- `apps/web/src/features/invoices/`: la feature de `nextjs-architecture`, con modelo y screen iniciales.
- `"@acme/contracts": "workspace:*"` en las dos apps, si faltaba.

Después, el agente:
1. define los campos reales en el contrato;
2. cambia `CreateInvoiceDto` a `createZodDto(createInvoiceSchema)`;
3. usa `createInvoiceSchema` en el formulario de la web;
4. completa cada lado con su skill.

Si `apps/web/src/features/invoices/models/invoices.ts` ya existe, el script aborta y **no escribe nada** en ningún workspace.

---

## Caso 3: Dominio full-stack (modo OpenAPI)

> *"La API la consume también la app móvil. Añade pedidos (order)."*

1. El agente elige `openapi`, porque hay consumidores externos.
   ```bash
   node <skill-dir>/scripts/scaffold-fullstack-feature.mjs order --contracts openapi
   ```
2. Implementa el módulo NestJS con Swagger completo, arranca la API y regenera los tipos:
   ```bash
   pnpm --filter @acme/api-client generate
   ```
3. En la web usa `createApiClient()` de `@acme/api-client/client`, con rutas y payloads tipados.

---

## Caso 4: Corregir violaciones de límites

```bash
$ pnpm check:boundaries
apps/web/src/features/invoices/services/get-invoice.service.ts:3  [relative-escape]  '../../../../../api/src/modules/invoices/entities' leaves web into api; import it by package name.
packages/ui/src/theme.ts:1  [package-imports-app]  @acme/ui imports the app web; apps are never imported (move shared code to packages/).
```

El agente corrige cada una:
- **`relative-escape`:** la web no debe usar la entidad de la API. Usa el tipo `Invoice` de `@acme/contracts/invoices`, o del cliente generado.
- **`package-imports-app`:** mueve el tema de `apps/web` a `packages/ui` y haz que la web lo importe desde ahí.

Vuelve a ejecutar `pnpm check:boundaries` hasta obtener `✔ No boundary violations found.`
