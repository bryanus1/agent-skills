# Turborepo y pnpm Workspaces

---

## 1. pnpm Workspaces

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

- **Dependencias internas:** siempre con el protocolo `workspace:*`. pnpm enlaza la carpeta local y al publicar lo sustituye por la versión real.
  ```bash
  pnpm --filter web add @acme/contracts@workspace:*
  ```
- **Dependencias externas:** se añaden al workspace que las usa (`pnpm --filter api add @nestjs/swagger`), no a la raíz. La raíz solo tiene tooling global: `turbo` y `typescript`.
- **Versión de pnpm:** `packageManager` en el `package.json` raíz la fija, y Corepack y Turborepo 2 la exigen. `engine-strict=true` en `.npmrc` hace cumplir `engines.node`.
- **Scripts de build de dependencias:** pnpm 10 no ejecuta por defecto los scripts `postinstall` de las dependencias. Si alguna los necesita (p. ej. `esbuild`, `@prisma/client`), apruébalos con `pnpm approve-builds` y confírmalo con el usuario.

---

## 2. Pipeline de Turborepo

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**", "!.next/cache/**"] },
    "dev": { "dependsOn": ["^build"], "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"], "outputs": ["coverage/**"] }
  }
}
```

- **`^build`:** antes de la tarea de un workspace, compila sus dependencias internas. Es lo que permite consumir `dist/` de los paquetes.
- **`outputs`:** lo que Turborepo guarda en caché y restaura. Si falta, los builds cacheados no restauran archivos.
- **`dev`:** es persistente y no se cachea. `dependsOn: ["^build"]` compila los paquetes una vez; para recompilarlos en caliente, ejecuta también su `dev` (`tsc --watch`).

---

## 3. Filtros Útiles

```bash
pnpm turbo run build --filter web             # solo la web
pnpm turbo run build --filter web...          # la web y todo lo que necesita
pnpm turbo run test --filter ...@acme/contracts   # contracts y todo lo que depende de él
pnpm turbo run lint --filter '[origin/main]'  # solo workspaces cambiados desde main
pnpm --filter @acme/contracts build           # script directo, sin turbo ni caché
```

---

## 4. Variables de Entorno

- **Declaración:** las variables que afectan a un build se declaran en la tarea (`"env": ["NEXT_PUBLIC_API_URL"]`) o en `globalEnv`. Si no, la caché puede servir un build hecho con otro valor.
- **Archivos:** cada app carga su propio `.env`: Next desde `apps/web/.env.local` y Nest con `@nestjs/config` desde `apps/api/.env`. Nunca pongas secretos en `packages/`.

```json
{ "tasks": { "build": { "dependsOn": ["^build"], "env": ["NEXT_PUBLIC_API_URL"], "outputs": ["dist/**", ".next/**", "!.next/cache/**"] } } }
```

---

## 5. Problemas Frecuentes

| Síntoma | Causa | Solución |
| :--- | :--- | :--- |
| `Cannot find module '@acme/contracts/invoices'` | El paquete no está compilado, o falta la entrada en `exports` | `pnpm turbo run build --filter @acme/contracts`; revisa `exports` |
| El import funciona en la web y falla en la API | La API usa `moduleResolution: node10`, que ignora `exports` | Extiende `@acme/tsconfig/nestjs.json` (Node16) |
| `Could not resolve workspace protocol` | La dependencia `workspace:*` apunta a un nombre que no existe | Comprueba el `name` del paquete |
| Turborepo pide `packageManager` | Falta el campo en el `package.json` raíz | Añade `"packageManager": "pnpm@<versión>"` |
| Caché con resultados obsoletos | Faltan `outputs` o `env` en la tarea | Decláralos y ejecuta `turbo run <task> --force` una vez |
