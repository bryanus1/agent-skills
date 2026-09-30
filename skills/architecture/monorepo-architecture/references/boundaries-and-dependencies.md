# Límites y Dependencias

`check-boundaries.mjs` analiza los imports (`import`, `export ... from`, `require()`, `import()`) de todos los archivos `.ts/.tsx/.js/.mjs/.cjs` de cada workspace. Ignora `node_modules`, `dist`, `.next`, `.turbo` y `coverage`.

---

## 1. Reglas y Cómo Corregirlas

| Regla | Ejemplo prohibido | Corrección |
| :--- | :--- | :--- |
| `app-import` | `apps/admin` → `import { x } from 'web'` | Mueve el código compartido a `packages/<lib>` e impórtalo desde ambas apps |
| `package-imports-app` | `packages/ui` → `import { theme } from 'web/src/theme'` | Invierte la dependencia: `theme` vive en el paquete y la app lo importa |
| `relative-escape` | `apps/web/src/a.ts` → `import '../../../packages/contracts/src/invoices'` | `import ... from '@acme/contracts/invoices'` y declara la dependencia |
| `undeclared` | `apps/api` importa `@acme/contracts` sin tenerlo en su `package.json` | `pnpm --filter api add @acme/contracts@workspace:*` |
| `deep-import` | `import ... from '@acme/contracts/src/invoices'` | Usa el subpath expuesto (`@acme/contracts/invoices`) o añade la entrada a `exports` |
| `cycle` | `@acme/a` depende de `@acme/b` y `@acme/b` de `@acme/a` | Extrae lo común a un tercer paquete del que dependan ambos |

---

## 2. Uso

```bash
pnpm check:boundaries                                  # script raíz generado por scaffold-monorepo
node scripts/check-boundaries.mjs --json               # salida para herramientas
node scripts/check-boundaries.mjs --apps-dir services  # si las apps no viven en apps/
```

La salida es `archivo:línea [regla] mensaje` y el script sale con código 1 si hay violaciones.

---

## 3. Integración en CI

```yaml
# .github/workflows/ci.yml (fragmento)
- run: pnpm install --frozen-lockfile
- run: pnpm check:boundaries
- run: pnpm turbo run lint typecheck test build
```

Ejecútalo antes de `turbo run`: es instantáneo y no necesita builds.

---

## 4. Límites del Análisis

- **Solo detecta specifiers literales.** `import(variable)` y los `require` construidos dinámicamente no se analizan.
- **Paquetes internos:** solo valida los que declara `pnpm-workspace.yaml`. Las dependencias externas no declaradas las detectan pnpm (modo estricto) y el typecheck.
- **Alias `@/`:** los de cada app no se validan. Mientras apunten al `src/` de la propia app, no pueden cruzar workspaces. Nunca configures `paths` hacia otro workspace.
