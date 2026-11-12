# 📚 Casos de Uso y Flujos de Ejemplo — `monorepo-architecture`

## Caso 1: Monorepo Completo (Web + API + Mobile + Landing)

> *"Crea un monorepo para acme con web Next.js, API NestJS, app móvil Expo y landing Astro usando OpenAPI."*

1. El agente elige `openapi`: hay app móvil y múltiples consumidores externos.
2. Previsualiza la estructura raíz:
   ```bash
   node <skill-dir>/scripts/scaffold-monorepo.mjs --scope acme --contracts openapi --apps web,api,mobile,landing --dry-run
   ```
3. Tras confirmación, lo ejecuta sin `--dry-run`. Genera `turbo.json` con outputs de Next/Nest/Expo/Astro, `.npmrc` con hoisting para React/Expo, `packages/tsconfig` (8 presets), `packages/oxc-config`, `packages/api-client` y `scripts/check-boundaries.mjs`.
4. Con permiso del usuario, ejecuta los CLIs de cada framework y conecta cada app con `scaffold-app.mjs`:
   ```bash
   node <skill-dir>/scripts/scaffold-app.mjs web --type web --force
   node <skill-dir>/scripts/scaffold-app.mjs api --type api --force
   node <skill-dir>/scripts/scaffold-app.mjs mobile --type mobile --force
   node <skill-dir>/scripts/scaffold-app.mjs landing --type landing --force
   ```
5. Opcionalmente crea `packages/design-tokens` para compartir paleta/espaciado entre Next.js, Astro y NativeWind:
   ```bash
   node <skill-dir>/scripts/scaffold-package.mjs design-tokens --kind design-tokens
   ```
6. Verifica todo:
   ```bash
   pnpm install && pnpm check:boundaries && pnpm turbo run lint format:check typecheck test build
   ```

---

## Caso 2: Añadir Mobile o Worker a un Monorepo Existente

> *"Ya tengo apps/web y apps/api; agrega una app móvil en Expo y un worker Node para colas."*

```bash
node <skill-dir>/scripts/scaffold-app.mjs mobile --type mobile --dry-run
node <skill-dir>/scripts/scaffold-app.mjs mobile --type mobile
node <skill-dir>/scripts/scaffold-app.mjs worker --type worker
```

- `apps/mobile` recibe `package.json` (`platform: "native"`), `tsconfig.json` (`@acme/tsconfig/expo.json`), `.oxlintrc.json` y `metro.config.js` listo para pnpm workspaces.
- `apps/worker` recibe `package.json` (`platform: "node"`), `tsconfig.json` (`@acme/tsconfig/node.json`) y `src/index.ts` + `src/index.test.ts` listos para ejecutar en Vitest y Turborepo.

---

## Caso 3: Dominio Cross-Platform (API + Web + Mobile)

> *"Añade facturas (invoice) en la API, la web y la app móvil compartiendo validación Zod."*

```bash
node <skill-dir>/scripts/scaffold-fullstack-feature.mjs invoice --targets api,web,mobile --dry-run
node <skill-dir>/scripts/scaffold-fullstack-feature.mjs invoice --targets api,web,mobile
```

Resultado atómico:
- `packages/contracts/src/invoices/invoice.schema.ts` + `index.ts` + subpath `"./invoices"` en `exports`.
- `apps/api/src/modules/invoices/`: 18 archivos de `nestjs-architecture`.
- `apps/web/src/features/invoices/`: feature de `nextjs-architecture`.
- `apps/mobile/src/features/invoices/`: feature de `react-native-architecture`.
- `"@acme/contracts": "workspace:*"` añadido en las tres apps si faltaba.

Si cualquiera de los destinos tiene un conflicto de archivo, el script aborta sin escribir nada en ningún workspace.

---

## Caso 4: Servicio Políglota (Python / Go) en el Pipeline

> *"Agrega un microservicio de recomendaciones en Python (FastAPI) que se integre en Turborepo y exponga OpenAPI."*

```bash
node <skill-dir>/scripts/scaffold-app.mjs recommender --type polyglot --dry-run
node <skill-dir>/scripts/scaffold-app.mjs recommender --type polyglot
```

- Añade `- "services/*"` a `pnpm-workspace.yaml`.
- Crea `services/recommender/package.json` con `monorepo.platform: "node"` y scripts delegando a `uv`/`pytest`/`ruff` para que `pnpm turbo run lint test` incluya al servicio.
- El cliente JS/TS consume su contrato vía `packages/api-client` sin mezclar runtimes.

---

## Caso 5: Corregir Violaciones de Límites y Plataformas

```bash
$ pnpm check:boundaries
apps/mobile/src/features/invoices/screens/list.tsx:4  [platform-mismatch]  mobile (platform: native) cannot import @acme/ui-web (platform: web); allowed: universal, native.
apps/landing/src/pages/index.astro:3  [undeclared]  @acme/design-tokens is not declared in apps/landing/package.json (add "@acme/design-tokens": "workspace:*").
```

Corrección:
- **`platform-mismatch`:** elimina `@acme/ui-web` de `apps/mobile`; usa componentes nativos de `apps/mobile/src/components` y comparte únicamente tokens desde `@acme/design-tokens` (`universal`).
- **`undeclared` en `.astro`:** ejecuta `pnpm --filter landing add @acme/design-tokens@workspace:*`.
- Vuelve a ejecutar `pnpm check:boundaries` hasta obtener `✔ No boundary violations found.`
