# Límites, Plataformas y Dependencias

`check-boundaries.mjs` analiza los imports (`import`, `export ... from`, `require()`, `import()`) de todos los archivos `.ts/.tsx/.mts/.cts/.js/.jsx/.mjs/.cjs` y de los bloques frontmatter (`--- ... ---`) y `<script>` de archivos **`.astro`** en cada workspace. Ignora `node_modules`, `dist`, `build`, `.next`, `.astro`, `.expo`, `.turbo`, `coverage` y `out`.

---

## 1. Reglas y Cómo Corregirlas

| Regla | Ejemplo prohibido | Corrección |
| :--- | :--- | :--- |
| `app-import` | `apps/admin` → `import { x } from 'web'` | Mueve el código compartido a `packages/<lib>` e impórtalo desde ambas apps |
| `package-imports-app` | `packages/ui-web` → `import { theme } from 'web/src/theme'` | Invierte la dependencia: `theme` vive en `packages/design-tokens` |
| `relative-escape` | `apps/mobile/src/a.ts` → `import '../../../packages/contracts/src/invoices'` | Usa `@acme/contracts/invoices` y decláralo en `package.json` |
| `undeclared` | `apps/landing/src/pages/index.astro` importa `@acme/design-tokens` sin declararlo | `pnpm --filter landing add @acme/design-tokens@workspace:*` |
| `deep-import` | `import ... from '@acme/contracts/src/invoices'` | Usa el subpath expuesto (`@acme/contracts/invoices`) o añádelo a `exports` |
| `cycle` | `@acme/a` depende de `@acme/b` y `@acme/b` de `@acme/a` | Extrae lo común a un tercer paquete del que dependan ambos |
| `platform-mismatch` | `apps/mobile` (`native`) importa `@acme/ui-web` (`web`), o `packages/contracts` (`universal`) importa `@acme/ui-web` | Respeta la matriz de compatibilidad o mueve la lógica agnóstica a un paquete `universal` |

---

## 2. Matriz de Compatibilidad de Plataformas (`platform-mismatch`)

Cada workspace declara su plataforma en `package.json`:

```json
{
  "name": "@acme/ui-web",
  "monorepo": { "layer": "package", "platform": "web" }
}
```

Valores permitidos por defecto:

| Plataforma origen | Plataformas que puede importar |
| :--- | :--- |
| `universal` | `universal` |
| `web` | `universal`, `web` |
| `astro` | `universal`, `web`, `astro` |
| `native` | `universal`, `native` |
| `node` | `universal`, `node` |

### Personalización (`monorepo.boundaries.json`)

Si tienes un repositorio con paquetes heredados sin campo `monorepo` o necesitas ampliar reglas, crea `monorepo.boundaries.json` en la raíz:

```json
{
  "platforms": {
    "@acme/legacy-web-kit": "web"
  },
  "allow": {
    "web": ["universal", "web"]
  }
}
```

---

## 3. Uso

```bash
pnpm check:boundaries                                         # valida apps/*, services/* y packages/*
node scripts/check-boundaries.mjs --json                      # salida estructurada para CI/agentes
node scripts/check-boundaries.mjs --apps-dir apps,services    # carpetas tratadas como hojas desplegables
```

La salida es `archivo:línea [regla] mensaje` y el script termina con código `1` si encuentra al menos una violación.

---

## 4. Integración en CI

```yaml
# .github/workflows/ci.yml (fragmento)
- run: pnpm install --frozen-lockfile
- run: pnpm check:boundaries
- run: pnpm turbo run lint format:check typecheck test build
```

Ejecuta `pnpm check:boundaries` antes de `turbo run`: es instantáneo, no requiere builds previos y falla temprano ante cruces ilegales entre plataformas o apps.

---

## 5. Límites del Análisis

- **Specifiers literales:** `import(variable)` y `require` dinámicos no se analizan.
- **Workspaces declarados:** solo valida paquetes descubiertos por `pnpm-workspace.yaml`.
- **Servicios políglotas (`services/*`):** sus archivos `.py`/`.go`/`.rs` no se parsean por AST JS; su aislamiento se garantiza por diseño de carpetas y contrato OpenAPI.
- **Alias `@/`:** los alias internos de cada app no pueden apuntar fuera de su propio `src/`.
