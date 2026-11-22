# Boundaries, Platforms and Dependencies

`check-boundaries.mjs` analyzes the imports (`import`, `export ... from`, `require()`, `import()`) of every `.ts/.tsx/.mts/.cts/.js/.jsx/.mjs/.cjs` file and of the frontmatter blocks (`--- ... ---`) and `<script>` of **`.astro`** files in each workspace. It ignores `node_modules`, `dist`, `build`, `.next`, `.astro`, `.expo`, `.turbo`, `coverage` and `out`.

---

## 1. Rules and How to Fix Them

| Rule | Forbidden example | Fix |
| :--- | :--- | :--- |
| `app-import` | `apps/admin` → `import { x } from 'web'` | Move the shared code to `packages/<lib>` and import it from both apps |
| `package-imports-app` | `packages/ui-web` → `import { theme } from 'web/src/theme'` | Invert the dependency: `theme` lives in `packages/design-tokens` |
| `relative-escape` | `apps/mobile/src/a.ts` → `import '../../../packages/contracts/src/invoices'` | Use `@acme/contracts/invoices` and declare it in `package.json` |
| `undeclared` | `apps/landing/src/pages/index.astro` imports `@acme/design-tokens` without declaring it | `pnpm --filter landing add @acme/design-tokens@workspace:*` |
| `deep-import` | `import ... from '@acme/contracts/src/invoices'` | Use the exposed subpath (`@acme/contracts/invoices`) or add it to `exports` |
| `cycle` | `@acme/a` depends on `@acme/b` and `@acme/b` on `@acme/a` | Extract the shared part into a third package both depend on |
| `platform-mismatch` | `apps/mobile` (`native`) imports `@acme/ui-web` (`web`), or `packages/contracts` (`universal`) imports `@acme/ui-web` | Respect the compatibility matrix or move the agnostic logic to a `universal` package |

---

## 2. Platform Compatibility Matrix (`platform-mismatch`)

Each workspace declares its platform in `package.json`:

```json
{
  "name": "@acme/ui-web",
  "monorepo": { "layer": "package", "platform": "web" }
}
```

Allowed values by default:

| Source platform | Platforms it may import |
| :--- | :--- |
| `universal` | `universal` |
| `web` | `universal`, `web` |
| `astro` | `universal`, `web`, `astro` |
| `native` | `universal`, `native` |
| `node` | `universal`, `node` |

### Customization (`monorepo.boundaries.json`)

If you have a repository with legacy packages that lack a `monorepo` field, or you need to extend the rules, create `monorepo.boundaries.json` at the root:

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

## 3. Usage

```bash
pnpm check:boundaries                                         # validates apps/*, services/* and packages/*
node scripts/check-boundaries.mjs --json                      # structured output for CI/agents
node scripts/check-boundaries.mjs --apps-dir apps,services    # folders treated as deployable leaves
```

The output is `file:line [rule] message`, and the script exits with code `1` if it finds at least one violation.

---

## 4. CI Integration

```yaml
# .github/workflows/ci.yml (excerpt)
- run: pnpm install --frozen-lockfile
- run: pnpm check:boundaries
- run: pnpm turbo run lint format:check typecheck test build
```

Run `pnpm check:boundaries` before `turbo run`: it is instant, needs no prior builds and fails early on illegal crossings between platforms or apps.

---

## 5. Analysis Limits

- **Literal specifiers:** dynamic `import(variable)` and `require` are not analyzed.
- **Declared workspaces:** it only validates packages discovered through `pnpm-workspace.yaml`.
- **Polyglot services (`services/*`):** their `.py`/`.go`/`.rs` files are not parsed by the JS AST; their isolation is guaranteed by folder design and the OpenAPI contract.
- **`@/` aliases:** each app's internal aliases cannot point outside its own `src/`.
