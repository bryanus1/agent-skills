# Guía de Estructura del Monorepo

---

## 1. Árbol Estándar Multi-App

```
<repo>/
├── apps/                               # Desplegables JS/TS. Nadie los importa.
│   ├── web/                            # Next.js App Router → nextjs-architecture
│   │   ├── src/app/                    # routing delgado
│   │   ├── src/features/<nouns>/       # screaming architecture
│   │   ├── package.json                # monorepo: { layer: "app", type: "web", platform: "web" }
│   │   └── tsconfig.json               # extends "@acme/tsconfig/nextjs.json"
│   ├── api/                            # NestJS Modular Monolith → nestjs-architecture
│   │   ├── src/modules/<nouns>/        # 18 archivos por módulo
│   │   ├── package.json                # monorepo: { layer: "app", type: "api", platform: "node" }
│   │   └── tsconfig.json               # extends "@acme/tsconfig/nestjs.json"
│   ├── mobile/                         # Expo + React Native → react-native-architecture
│   │   ├── src/app/                    # Expo Router delgado
│   │   ├── src/features/<nouns>/       # screaming architecture móvil
│   │   ├── metro.config.js             # watchFolders + nodeModulesPaths + exports
│   │   ├── package.json                # monorepo: { layer: "app", type: "mobile", platform: "native" }
│   │   └── tsconfig.json               # extends "@acme/tsconfig/expo.json"
│   ├── landing/                        # Astro Marketing / SEO → astro-architecture
│   │   ├── src/pages/                  # rutas estáticas / islas
│   │   ├── src/components/sections/    # bloques Zero-JS
│   │   ├── package.json                # monorepo: { layer: "app", type: "landing", platform: "astro" }
│   │   └── tsconfig.json               # extends "@acme/tsconfig/astro.json"
│   └── worker/                         # Node.js Worker / CLI / Cron (opcional)
├── services/                           # Servicios políglotas opcionales (Python/Go/Rust)
│   └── ml-service/                     # package.json shim para Turborepo + OpenAPI
├── packages/                           # Librerías internas compiladas a dist/.
│   ├── tsconfig/                       # base, library, node, nestjs, nextjs, expo, astro, react-spa
│   ├── oxc-config/                     # base.json (.oxlintrc) + oxfmt.json
│   ├── eslint-config/                  # opcional (--linter eslint|both)
│   ├── contracts/                      # modo zod: src/<nouns>/ → export "./<nouns>" (universal)
│   ├── api-client/                     # modo openapi: src/generated + src/client (universal)
│   ├── design-tokens/                  # colores, spacing y tipografía (universal)
│   ├── ui-web/                         # componentes React DOM (solo 2+ apps web/landing)
│   └── ui-native/                      # componentes React Native (solo 2+ apps móviles)
├── scripts/check-boundaries.mjs        # validador de límites y plataformas (vendorizado)
├── package.json                        # privado; scripts = turbo run <task>
├── pnpm-workspace.yaml                 # apps/*, packages/* (y services/* si hay políglotas)
└── turbo.json                          # pipeline de tareas
```

---

## 2. Responsabilidades y Plataformas

| Ubicación | Plataforma | Contiene | No contiene |
| :--- | :--- | :--- | :--- |
| `apps/web` | `web` | UI Next.js, RSC/Client, hooks, llamadas HTTP a la API | Lógica de negocio del servidor, DB de la API, código RN |
| `apps/api` | `node` | Módulos de dominio, repositorios, reglas de negocio, Swagger | Componentes UI, código importado por otras apps |
| `apps/mobile` | `native` | Pantallas Expo Router, NativeWind, `expo-secure-store`, hooks | APIs DOM (`window`, `localStorage`), paquetes `ui-web` |
| `apps/landing` | `astro` | Páginas `.astro` Zero-JS, SEO, islas interactivas, Content Collections | Lógica de negocio API, paquetes `native` o servidor/ORM |
| `apps/worker` / `spa` / `docs` | `node` / `web` / `astro` | Procesos asíncronos, admin SPA o documentación | Lógica duplicada que debería vivir en `packages/*` |
| `services/<name>` | `node` | Servicios Python/Go/Rust integrados vía OpenAPI y shim Turborepo | Imports de código JS/TS entre workspaces |
| `packages/contracts` | `universal` | Esquemas Zod y tipos inferidos puros | Imports de React, Next, Nest, Expo o Astro |
| `packages/api-client` | `universal` | Tipos OpenAPI generados y `createApiClient` cross-platform | Código manual en `src/generated/` |
| `packages/design-tokens` | `universal` | Paleta, spacing, radios, tipografía para Tailwind y NativeWind | JSX, DOM o componentes de plataforma |
| `packages/ui-web` / `ui-native` | `web` / `native` | Primitivas compartidas por 2+ apps de la misma plataforma | Código de una sola app o mezcla DOM+RN |

---

## 3. Nombres

- **Paquetes internos:** `@<scope>/<name>` en kebab-case (`@acme/contracts`, `@acme/design-tokens`, `@acme/oxc-config`). El scope sale del `name` del `package.json` raíz.
- **Apps y servicios:** nombre corto sin scope (`web`, `api`, `mobile`, `landing`, `admin`, `worker`). Se filtran con `pnpm --filter mobile`.
- **Dominios:** el mismo nombre en todos los lados:
  - `apps/api/src/modules/invoices` ↔ `apps/web/src/features/invoices` ↔ `apps/mobile/src/features/invoices` ↔ `packages/contracts/src/invoices`.
  - Carpetas en plural y archivos internos en singular.

---

## 4. Conectar una App (Con `scaffold-app.mjs`)

1. **Crea la app con su CLI oficial** (solo tras confirmación del usuario, porque descarga paquetes):
   - **Web (Next.js):** `pnpm create next-app@latest apps/web --ts --app --src-dir --eslint --import-alias "@/*" --use-pnpm --skip-install --yes`
   - **API (NestJS):** `pnpm dlx @nestjs/cli new api --directory apps/api --package-manager pnpm --skip-git --skip-install`
   - **Mobile (Expo):** `pnpm dlx create-expo-app@latest apps/mobile --template tabs`
   - **Landing (Astro):** `pnpm create astro@latest apps/landing -- --template minimal --typescript strict --no-install --no-git`
   - **SPA (Vite):** `pnpm create vite@latest apps/admin --template react-ts`
2. **Conecta la app al monorepo**:
   ```bash
   node <skill-dir>/scripts/scaffold-app.mjs <name> --type <web|api|mobile|landing|spa|docs|worker|polyglot> --dry-run
   node <skill-dir>/scripts/scaffold-app.mjs <name> --type <preset> --force   # tras revisar el diff si ya existe package.json
   ```
   Esto deja configurados:
   - `tsconfig.json` extendiendo `@<scope>/tsconfig/<preset>.json` y conservando `@/*` → `./src/*`;
   - `.oxlintrc.json` (y/o `eslint.config.mjs`) y scripts homogéneos (`build`, `dev`, `lint`, `format:check`, `typecheck`, `test`);
   - `"monorepo": { "layer": "app", "type": "<preset>", "platform": "<platform>" }` y dependencias `workspace:*`;
   - `metro.config.js` listo para monorepo si `--type mobile`.
3. **Verifica**: `pnpm install && pnpm turbo run typecheck --filter <name>... && pnpm check:boundaries`.

---

## 5. Integrar en un Repositorio Existente

`scaffold-monorepo.mjs` aborta si el `package.json` raíz ya existe. No uses `--force` a ciegas; migra por pasos:

1. **Workspaces:** crea `pnpm-workspace.yaml` y mueve cada proyecto existente a `apps/<name>` (o `services/<name>`) con `git mv` para conservar el historial.
2. **Raíz:** añade `turbo.json` y los scripts `turbo run` al `package.json` raíz.
3. **Paquetes compartidos:** genera `tsconfig`, `oxc-config` y `contracts`/`api-client` en un directorio temporal con `scaffold-monorepo.mjs`, y cópialos.
4. **Conectar apps:** aplica los `extends` de `tsconfig.json`, añade `monorepo.platform` en los `package.json` y `metro.config.js` si hay app Expo.
5. **Validación:** ejecuta `pnpm check:boundaries` y corrige las violaciones antes de activarlo en CI.

---

## 6. Extender con Nuevos Tipos de Repo

El motor de arquetipos vive en `scripts/lib/presets.mjs` (`APP_PRESETS`). Para soportar un stack nuevo (ej. `sveltekit`, `remix`, `fastify`, `tauri`):

1. **Añade el preset en `APP_PRESETS`** definiendo `id`, `platform` (`universal|web|native|node|astro`), `defaultDir`, `tsconfigPreset`, `envVars`, `turboOutputs`, `createCommand` y `skill` (si tiene skill propia).
2. **Añade su `tsconfig`** en `tsconfigPackageFiles()` dentro de `scripts/lib/templates.mjs` si requiere opciones específicas de compilador.
3. **Si es no-Node (Python, Go, Rust)**: usa `--type polyglot`, ubica el código en `services/<name>/`, envuelve sus comandos nativos (`uv run pytest`, `go test ./...`, `cargo test`) en los scripts del `package.json` shim y comparte contratos vía OpenAPI.
