# Monorepo Structure Guide

---

## 1. Standard Multi-App Tree

```
<repo>/
├── apps/                               # Deployable JS/TS apps. Nobody imports them.
│   ├── web/                            # Next.js App Router → nextjs-architecture
│   │   ├── src/app/                    # thin routing
│   │   ├── src/features/<nouns>/       # screaming architecture
│   │   ├── package.json                # monorepo: { layer: "app", type: "web", platform: "web" }
│   │   └── tsconfig.json               # extends "@acme/tsconfig/nextjs.json"
│   ├── api/                            # NestJS Modular Monolith → nestjs-architecture
│   │   ├── src/modules/<nouns>/        # 18 files per module
│   │   ├── package.json                # monorepo: { layer: "app", type: "api", platform: "node" }
│   │   └── tsconfig.json               # extends "@acme/tsconfig/nestjs.json"
│   ├── mobile/                         # Expo + React Native → react-native-architecture
│   │   ├── src/app/                    # thin Expo Router
│   │   ├── src/features/<nouns>/       # mobile screaming architecture
│   │   ├── metro.config.js             # watchFolders + nodeModulesPaths + exports
│   │   ├── package.json                # monorepo: { layer: "app", type: "mobile", platform: "native" }
│   │   └── tsconfig.json               # extends "@acme/tsconfig/expo.json"
│   ├── landing/                        # Astro Marketing / SEO → astro-architecture
│   │   ├── src/pages/                  # static routes / islands
│   │   ├── src/components/sections/    # Zero-JS blocks
│   │   ├── package.json                # monorepo: { layer: "app", type: "landing", platform: "astro" }
│   │   └── tsconfig.json               # extends "@acme/tsconfig/astro.json"
│   └── worker/                         # Node.js Worker / CLI / Cron (optional)
├── services/                           # Optional polyglot services (Python/Go/Rust)
│   └── ml-service/                     # package.json shim for Turborepo + OpenAPI
├── packages/                           # Internal libraries compiled to dist/.
│   ├── tsconfig/                       # base, library, node, nestjs, nextjs, expo, astro, react-spa
│   ├── oxc-config/                     # base.json (.oxlintrc) + oxfmt.json
│   ├── eslint-config/                  # optional (--linter eslint|both)
│   ├── contracts/                      # modo zod: src/<nouns>/ → export "./<nouns>" (universal)
│   ├── api-client/                     # modo openapi: src/generated + src/client (universal)
│   ├── design-tokens/                  # colors, spacing and typography (universal)
│   ├── ui-web/                         # React DOM components (only 2+ web/landing apps)
│   └── ui-native/                      # React Native components (only 2+ mobile apps)
├── scripts/check-boundaries.mjs        # boundary and platform validator (vendored)
├── package.json                        # private; scripts = turbo run <task>
├── pnpm-workspace.yaml                 # apps/*, packages/* (and services/* if there are polyglot services)
└── turbo.json                          # task pipeline
```

---

## 2. Responsibilities and Platforms

| Location | Platform | Contains | Does not contain |
| :--- | :--- | :--- | :--- |
| `apps/web` | `web` | Next.js UI, RSC/Client, hooks, HTTP calls to the API | Server business logic, the API's DB, RN code |
| `apps/api` | `node` | Domain modules, repositories, business rules, Swagger | UI components, code imported by other apps |
| `apps/mobile` | `native` | Expo Router screens, NativeWind, `expo-secure-store`, hooks | DOM APIs (`window`, `localStorage`), `ui-web` packages |
| `apps/landing` | `astro` | Zero-JS `.astro` pages, SEO, interactive islands, Content Collections | API business logic, `native` or server/ORM packages |
| `apps/worker` / `spa` / `docs` | `node` / `web` / `astro` | Async processes, an admin SPA or documentation | Duplicated logic that should live in `packages/*` |
| `services/<name>` | `node` | Python/Go/Rust services integrated through OpenAPI and a Turborepo shim | JS/TS code imports between workspaces |
| `packages/contracts` | `universal` | Zod schemas and pure inferred types | Imports from React, Next, Nest, Expo or Astro |
| `packages/api-client` | `universal` | Generated OpenAPI types and a cross-platform `createApiClient` | Hand-written code in `src/generated/` |
| `packages/design-tokens` | `universal` | Palette, spacing, radii and typography for Tailwind and NativeWind | JSX, DOM or platform components |
| `packages/ui-web` / `ui-native` | `web` / `native` | Primitives shared by 2+ apps on the same platform | Code for a single app, or a DOM+RN mix |

---

## 3. Naming

- **Internal packages:** `@<scope>/<name>` in kebab-case (`@acme/contracts`, `@acme/design-tokens`, `@acme/oxc-config`). The scope comes from the root `package.json`'s `name`.
- **Apps and services:** a short name without a scope (`web`, `api`, `mobile`, `landing`, `admin`, `worker`). Filter them with `pnpm --filter mobile`.
- **Domains:** the same name everywhere:
  - `apps/api/src/modules/invoices` ↔ `apps/web/src/features/invoices` ↔ `apps/mobile/src/features/invoices` ↔ `packages/contracts/src/invoices`.
  - Plural folders and singular internal files.

---

## 4. Connecting an App (with `scaffold-app.mjs`)

1. **Create the app with its official CLI** (only after the user confirms, because it downloads packages):
   - **Web (Next.js):** `pnpm create next-app@latest apps/web --ts --app --src-dir --eslint --import-alias "@/*" --use-pnpm --skip-install --yes`
   - **API (NestJS):** `pnpm dlx @nestjs/cli new api --directory apps/api --package-manager pnpm --skip-git --skip-install`
   - **Mobile (Expo):** `pnpm dlx create-expo-app@latest apps/mobile --template tabs`
   - **Landing (Astro):** `pnpm create astro@latest apps/landing -- --template minimal --typescript strict --no-install --no-git`
   - **SPA (Vite):** `pnpm create vite@latest apps/admin --template react-ts`
2. **Connect the app to the monorepo**:
   ```bash
   node <skill-dir>/scripts/scaffold-app.mjs <name> --type <web|api|mobile|landing|spa|docs|worker|polyglot> --dry-run
   node <skill-dir>/scripts/scaffold-app.mjs <name> --type <preset> --force   # after reviewing the diff if package.json already exists
   ```
   This sets up:
   - `tsconfig.json` extending `@<scope>/tsconfig/<preset>.json` and keeping `@/*` → `./src/*`;
   - `.oxlintrc.json` (and/or `eslint.config.mjs`) and uniform scripts (`build`, `dev`, `lint`, `format:check`, `typecheck`, `test`);
   - `"monorepo": { "layer": "app", "type": "<preset>", "platform": "<platform>" }` and `workspace:*` dependencies;
   - a monorepo-ready `metro.config.js` if `--type mobile`.
3. **Verify**: `pnpm install && pnpm turbo run typecheck --filter <name>... && pnpm check:boundaries`.

---

## 5. Integrating into an Existing Repository

`scaffold-monorepo.mjs` aborts if the root `package.json` already exists. Do not use `--force` blindly; migrate step by step:

1. **Workspaces:** create `pnpm-workspace.yaml` and move each existing project to `apps/<name>` (or `services/<name>`) with `git mv` to keep the history.
2. **Root:** add `turbo.json` and the `turbo run` scripts to the root `package.json`.
3. **Shared packages:** generate `tsconfig`, `oxc-config` and `contracts`/`api-client` in a temporary directory with `scaffold-monorepo.mjs`, and copy them over.
4. **Connect apps:** apply the `tsconfig.json` `extends`, add `monorepo.platform` to the `package.json` files, and add `metro.config.js` if there is an Expo app.
5. **Validation:** run `pnpm check:boundaries` and fix the violations before enabling it in CI.

---

## 6. Extending with New Repo Types

The archetype engine lives in `scripts/lib/presets.mjs` (`APP_PRESETS`). To support a new stack (e.g. `sveltekit`, `remix`, `fastify`, `tauri`):

1. **Add the preset to `APP_PRESETS`**, defining `id`, `platform` (`universal|web|native|node|astro`), `defaultDir`, `tsconfigPreset`, `envVars`, `turboOutputs`, `createCommand` and `skill` (if it has its own skill).
2. **Add its `tsconfig`** in `tsconfigPackageFiles()` inside `scripts/lib/templates.mjs` if it needs specific compiler options.
3. **If it is not Node (Python, Go, Rust)**: use `--type polyglot`, put the code in `services/<name>/`, wrap its native commands (`uv run pytest`, `go test ./...`, `cargo test`) in the shim `package.json` scripts and share contracts through OpenAPI.
