# 📚 Use Cases and Example Workflows — `monorepo-architecture`

## Case 1: Full Monorepo (Web + API + Mobile + Landing)

> *"Create a monorepo for acme with a Next.js web app, a NestJS API, an Expo mobile app and an Astro landing using OpenAPI."*

1. The agent picks `openapi`: there is a mobile app and several external consumers.
2. It previews the root structure:
   ```bash
   node <skill-dir>/scripts/scaffold-monorepo.mjs --scope acme --contracts openapi --apps web,api,mobile,landing --dry-run
   ```
3. After confirmation, it runs it without `--dry-run`. It generates `turbo.json` with Next/Nest/Expo/Astro outputs, `.npmrc` with hoisting for React/Expo, `packages/tsconfig` (8 presets), `packages/oxc-config`, `packages/api-client` and `scripts/check-boundaries.mjs`.
4. With the user's permission, it runs each framework's CLI and connects each app with `scaffold-app.mjs`:
   ```bash
   node <skill-dir>/scripts/scaffold-app.mjs web --type web --force
   node <skill-dir>/scripts/scaffold-app.mjs api --type api --force
   node <skill-dir>/scripts/scaffold-app.mjs mobile --type mobile --force
   node <skill-dir>/scripts/scaffold-app.mjs landing --type landing --force
   ```
5. Optionally, it creates `packages/design-tokens` to share palette/spacing across Next.js, Astro and NativeWind:
   ```bash
   node <skill-dir>/scripts/scaffold-package.mjs design-tokens --kind design-tokens
   ```
6. It verifies everything:
   ```bash
   pnpm install && pnpm check:boundaries && pnpm turbo run lint format:check typecheck test build
   ```

---

## Case 2: Add Mobile or a Worker to an Existing Monorepo

> *"I already have apps/web and apps/api; add an Expo mobile app and a Node worker for queues."*

```bash
node <skill-dir>/scripts/scaffold-app.mjs mobile --type mobile --dry-run
node <skill-dir>/scripts/scaffold-app.mjs mobile --type mobile
node <skill-dir>/scripts/scaffold-app.mjs worker --type worker
```

- `apps/mobile` gets `package.json` (`platform: "native"`), `tsconfig.json` (`@acme/tsconfig/expo.json`), `.oxlintrc.json` and a `metro.config.js` ready for pnpm workspaces.
- `apps/worker` gets `package.json` (`platform: "node"`), `tsconfig.json` (`@acme/tsconfig/node.json`) and `src/index.ts` + `src/index.test.ts`, ready to run in Vitest and Turborepo.

---

## Case 3: Cross-Platform Domain (API + Web + Mobile)

> *"Add invoices to the API, the web app and the mobile app, sharing Zod validation."*

```bash
node <skill-dir>/scripts/scaffold-fullstack-feature.mjs invoice --targets api,web,mobile --dry-run
node <skill-dir>/scripts/scaffold-fullstack-feature.mjs invoice --targets api,web,mobile
```

Atomic result:
- `packages/contracts/src/invoices/invoice.schema.ts` + `index.ts` + the `"./invoices"` subpath in `exports`.
- `apps/api/src/modules/invoices/`: the 18 files from `nestjs-architecture`.
- `apps/web/src/features/invoices/`: a `nextjs-architecture` feature.
- `apps/mobile/src/features/invoices/`: a `react-native-architecture` feature.
- `"@acme/contracts": "workspace:*"` added to all three apps if missing.

If any destination has a file conflict, the script aborts without writing anything in any workspace.

---

## Case 4: Polyglot Service (Python / Go) in the Pipeline

> *"Add a recommendations microservice in Python (FastAPI) that plugs into Turborepo and exposes OpenAPI."*

```bash
node <skill-dir>/scripts/scaffold-app.mjs recommender --type polyglot --dry-run
node <skill-dir>/scripts/scaffold-app.mjs recommender --type polyglot
```

- Adds `- "services/*"` to `pnpm-workspace.yaml`.
- Creates `services/recommender/package.json` with `monorepo.platform: "node"` and scripts delegating to `uv`/`pytest`/`ruff`, so `pnpm turbo run lint test` includes the service.
- The JS/TS client consumes its contract through `packages/api-client` without mixing runtimes.

---

## Case 5: Fixing Boundary and Platform Violations

```bash
$ pnpm check:boundaries
apps/mobile/src/features/invoices/screens/list.tsx:4  [platform-mismatch]  mobile (platform: native) cannot import @acme/ui-web (platform: web); allowed: universal, native.
apps/landing/src/pages/index.astro:3  [undeclared]  @acme/design-tokens is not declared in apps/landing/package.json (add "@acme/design-tokens": "workspace:*").
```

Fix:
- **`platform-mismatch`:** remove `@acme/ui-web` from `apps/mobile`; use native components from `apps/mobile/src/components` and share only tokens from `@acme/design-tokens` (`universal`).
- **`undeclared` in `.astro`:** run `pnpm --filter landing add @acme/design-tokens@workspace:*`.
- Run `pnpm check:boundaries` again until you get `✔ No boundary violations found.`
