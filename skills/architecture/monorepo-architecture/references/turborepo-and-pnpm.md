# Turborepo y pnpm Workspaces

---

## 1. pnpm Workspaces

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
  - "services/*"   # opcional, cuando existen servicios políglotas
```

- **Dependencias internas:** siempre con el protocolo `workspace:*`.
  ```bash
  pnpm --filter web add @acme/contracts@workspace:*
  pnpm --filter mobile add @acme/design-tokens@workspace:*
  ```
- **Dependencias externas:** añádelas al workspace que las usa (`pnpm --filter api add @nestjs/swagger`, `pnpm --filter mobile add expo-secure-store`), no a la raíz. La raíz solo lleva tooling global (`turbo`, `typescript`, `oxlint`, `oxfmt`).
- **Versión de pnpm:** `packageManager` en el `package.json` raíz la fija (`Corepack` y `Turborepo 2` la exigen). `engine-strict=true` en `.npmrc` hace cumplir `engines.node`.
- **Scripts postinstall en pnpm 10:** pnpm 10 bloquea por defecto `postinstall` de dependencias (`esbuild`, `sharp`, `@prisma/client`). Si una app los necesita, apruébalos con `pnpm approve-builds` tras confirmar con el usuario.

### Consideraciones Especiales para Expo / React Native (`apps/mobile`)

Metro y pnpm requieren evitar copias duplicadas de `react` / `react-native` y habilitar resolución de `exports`:

1. **`.npmrc` en la raíz** (generado automáticamente por `scaffold-monorepo.mjs --apps ...,mobile`):
   ```ini
   engine-strict=true
   public-hoist-pattern[]=*react*
   public-hoist-pattern[]=*expo*
   ```
2. **`apps/mobile/metro.config.js`** (generado por `scaffold-app.mjs mobile --type mobile`):
   - `config.watchFolders = [monorepoRoot]` para vigilar cambios en `packages/*/dist`.
   - `config.resolver.nodeModulesPaths` apuntando tanto a `apps/mobile/node_modules` como a `<root>/node_modules`.
   - `config.resolver.unstable_enablePackageExports = true` para respetar `exports` de `@acme/contracts`, `@acme/api-client` y `@acme/design-tokens`.

---

## 2. Pipeline de Turborepo

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "env": ["NEXT_PUBLIC_API_URL", "EXPO_PUBLIC_API_URL", "PUBLIC_API_URL", "PUBLIC_SITE_URL"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**", ".astro/**", ".expo/**"]
    },
    "dev": { "dependsOn": ["^build"], "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "format:check": {},
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"], "outputs": ["coverage/**"] }
  }
}
```

- **`^build`:** compila los paquetes internos en `dist/` antes de ejecutar `build`, `lint`, `typecheck` o `test` de los consumidores.
- **`outputs`:** incluye `.next/**` (Next.js), `dist/**` (paquetes, NestJS, Astro, Vite, Worker) y `.expo/**` (Expo).
- **OXC en Turborepo:** `oxlint` y `oxfmt` corren en milisegundos por workspace; `lint` depende de `^build` para que los tipos compilados de `packages/*` estén listos al validar imports.
- **`dev`:** ejecuta primero `^build`. Si editas paquetes internos en paralelo mientras corres Next.js, Astro o Expo, ejecuta también su watch (`pnpm --filter @acme/contracts dev`).

---

## 3. Filtros Útiles

```bash
pnpm turbo run build --filter web                  # solo Next.js web
pnpm turbo run build --filter landing...           # Astro landing y sus dependencias internas
pnpm turbo run typecheck --filter mobile...        # Expo mobile y sus paquetes
pnpm turbo run test --filter ...@acme/contracts    # contracts y todas las apps que dependen de él
pnpm turbo run lint --filter '[origin/main]'       # solo workspaces modificados respecto a main
```

---

## 4. Variables de Entorno por Plataforma

| App | Prefijo público (cliente) | Archivo local | Regla en `turbo.json` |
| :--- | :--- | :--- | :--- |
| `apps/web` (Next.js) | `NEXT_PUBLIC_*` | `apps/web/.env.local` | Declarar en `tasks.build.env` |
| `apps/mobile` (Expo) | `EXPO_PUBLIC_*` | `apps/mobile/.env` | Declarar en `tasks.build.env` |
| `apps/landing` (Astro) | `PUBLIC_*` | `apps/landing/.env` | Declarar en `tasks.build.env` |
| `apps/admin` (Vite SPA) | `VITE_*` | `apps/admin/.env` | Declarar en `tasks.build.env` |
| `apps/api` / `worker` | Sin prefijo público | `apps/api/.env` | Secretos solo en servidor, nunca en `packages/` |

---

## 5. Problemas Frecuentes

| Síntoma | Causa | Solución |
| :--- | :--- | :--- |
| `Cannot find module '@acme/contracts/invoices'` | Paquete sin compilar o falta entrada en `exports` | `pnpm turbo run build --filter @acme/contracts` y revisa `exports` |
| Metro (Expo) no resuelve `@acme/contracts/invoices` | Falta `watchFolders` o `unstable_enablePackageExports` | Regenera `apps/mobile/metro.config.js` con `scaffold-app.mjs` |
| `Invalid hook call` en Expo dentro del monorepo | Hay dos copias de `react` en `node_modules` | Añade `public-hoist-pattern[]=*react*` en `.npmrc` y re-instala |
| Astro falla al importar un paquete interno en SSR | `exports` apunta a `src/` o Vite necesita pre-bundling | Compila a `dist/` y mantén `exports` estándar (`types` + `default`) |
| La API falla resolviendo subpaths | `tsconfig` de la API usa `moduleResolution: node10` | Extiende `@acme/tsconfig/nestjs.json` (`Node16`) |
| Caché con resultados obsoletos | Faltan `outputs` o `env` en `turbo.json` | Decláralos y ejecuta `turbo run <task> --force` una vez |
