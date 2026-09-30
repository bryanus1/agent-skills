# Guía de Estructura del Monorepo

---

## 1. Árbol Estándar

```
<repo>/
├── apps/                          # Desplegables. Nadie los importa.
│   ├── web/                       # Next.js App Router → nextjs-architecture
│   │   ├── src/app/               # routing delgado
│   │   ├── src/features/<nouns>/  # screaming architecture
│   │   ├── package.json           # deps: "@acme/contracts": "workspace:*"
│   │   └── tsconfig.json          # extends "@acme/tsconfig/nextjs.json"
│   └── api/                       # NestJS → nestjs-architecture
│       ├── src/modules/<nouns>/   # monolito modular (18 archivos por módulo)
│       ├── package.json
│       └── tsconfig.json          # extends "@acme/tsconfig/nestjs.json"
├── packages/                      # Librerías internas. Compiladas a dist/.
│   ├── tsconfig/                  # base.json, library.json, nestjs.json, nextjs.json
│   ├── eslint-config/             # flat config compartida (export "./base")
│   ├── contracts/                 # modo zod: src/<nouns>/ → export "./<nouns>"
│   └── api-client/                # modo openapi: src/generated + src/client
├── scripts/check-boundaries.mjs   # validador de límites (vendorizado)
├── package.json                   # privado; scripts = turbo run <task>
├── pnpm-workspace.yaml            # apps/*, packages/*
└── turbo.json                     # pipeline de tareas
```

---

## 2. Responsabilidades

| Ubicación | Contiene | No contiene |
| :--- | :--- | :--- |
| `apps/web` | UI, rutas, hooks, llamadas HTTP a la API | Lógica de negocio del servidor, acceso a base de datos de la API |
| `apps/api` | Módulos de dominio, repositorios, reglas de negocio, Swagger | Componentes UI, código importado por la web |
| `packages/contracts` | Esquemas Zod y tipos inferidos de entrada y salida | Lógica de negocio, llamadas HTTP, dependencias de Nest o Next |
| `packages/api-client` | Tipos generados y cliente HTTP tipado | Código escrito a mano dentro de `src/generated/` |
| `packages/<lib>` | Utilidades puras usadas por 2 o más workspaces | Código que solo usa una app |
| `packages/tsconfig`, `packages/eslint-config` | Configuración compartida | Código ejecutable |

---

## 3. Nombres

- **Paquetes internos:** `@<scope>/<name>` en kebab-case (`@acme/contracts`, `@acme/eslint-config`). El scope es el `name` del `package.json` raíz.
- **Apps:** nombre corto sin scope (`web`, `api`, `admin`). Se filtran con `pnpm --filter web`.
- **Dominios:** los mismos nombres a los dos lados.
  - `apps/api/src/modules/invoices` ↔ `apps/web/src/features/invoices` ↔ `packages/contracts/src/invoices`.
  - Carpetas en plural y archivos en singular, igual que en `nestjs-architecture`.

---

## 4. Conectar una App Nueva

1. **Crea la app**, tras confirmación, porque descarga paquetes:
   ```bash
   pnpm create next-app@latest apps/web --ts --app --src-dir --eslint --import-alias "@/*" --use-pnpm --skip-install --yes
   pnpm dlx @nestjs/cli new api --directory apps/api --package-manager pnpm --skip-git --skip-install
   ```
2. **Configura el `tsconfig.json` de la app**: extiende la base compartida y conserva sus `paths` locales.
   ```json
   {
     "extends": "@acme/tsconfig/nextjs.json",
     "compilerOptions": { "paths": { "@/*": ["./src/*"] } },
     "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"]
   }
   ```
   `nest new` genera su propio `tsconfig.json`: sustituye las opciones repetidas por `"extends": "@acme/tsconfig/nestjs.json"` y deja `outDir`, `baseUrl` y `paths`.
3. **Añade las dependencias** internas al `package.json` de la app:
   ```json
   { "dependencies": { "@acme/contracts": "workspace:*" }, "devDependencies": { "@acme/tsconfig": "workspace:*" } }
   ```
4. **Scripts de la app**: deben llamarse `build`, `dev`, `lint`, `typecheck` y `test`, para que `turbo run <task>` los encuentre. Añade `"typecheck": "tsc --noEmit"` si la plantilla no lo trae.
5. **Verifica**: `pnpm install && pnpm turbo run build --filter <app>... && pnpm check:boundaries`.

---

## 5. Integrar en un Repositorio Existente

`scaffold-monorepo.mjs` aborta si el `package.json` raíz ya existe. No uses `--force`: haz la migración por pasos.

1. **Workspaces:** crea `pnpm-workspace.yaml` y mueve cada proyecto a `apps/<name>` con `git mv`, para conservar el historial.
2. **Raíz:** añade `turbo.json` y los scripts `turbo run` al `package.json` raíz, a mano.
3. **Paquetes compartidos:** genera `tsconfig`, `eslint-config` y el paquete de contratos en un directorio temporal con `scaffold-monorepo.mjs`, y cópialos.
4. **Validación:** ejecuta `check-boundaries.mjs` y corrige las violaciones antes de añadirlo a CI.
