# 🏷️ GitHub Standards: Títulos, Emojis, Labels y Cuerpo del PR

Convenciones que aplica `scripts/create_pr.sh` y que el agente debe respetar al usar `gh` manualmente.

---

## 1. Título del Pull Request

- **Con issue**: `<type>(#<issue-id>): <emoji> <description>`
  - `feat(#42): ✨ login form`
  - `fix(#15): 🐛 handle expired session`
- **Sin issue**: `<type>: <emoji> <description>` (⚠️ **sin scope**)
  - `chore: 🔧 upgrade node to 22`
  - `refactor: ♻️ decouple auth service`

> [!IMPORTANT]
> El único scope permitido es el número de issue (`#42`). Prohibido usar carpetas, apps o paquetes como scope (`feat(apps/web): ...`, `fix(api): ...`).

`create_pr.sh` deriva tipo, issue y descripción del nombre de la rama: `feat/42-login-form` → `feat(#42): ✨ login form`.

---

## 2. Tipos, Emojis y Label de Tipo

GitHub no tiene *scoped labels*; el tipo se refleja con los labels que GitHub crea por defecto en todo repositorio nuevo.

| Rama / tipo | Prefijo | Emoji | Label de tipo |
| :--- | :--- | :---: | :--- |
| `feat/`, `feature/` | `feat` | ✨ | `enhancement` |
| `fix/`, `bugfix/` | `fix` | 🐛 | `bug` |
| `hotfix/` | `fix` | 🚑 | `bug` |
| `perf/` | `perf` | ⚡ | `enhancement` |
| `refactor/` | `refactor` | ♻️ | — |
| `docs/` | `docs` | 📝 | `documentation` |
| `test/` | `test` | 🧪 | — |
| `ci/` | `ci` | 👷 | — |
| otro | `chore` | 🔧 | — |

---

## 3. Labels de Dominio

- Formato: `domain: <nombre>` (ej. `domain: auth`, `domain: billing`).
- Los dominios son propios de cada proyecto. Defínelos en `.gh-domains` en la raíz del repositorio, uno por línea (se permiten comentarios con `#`):
  ```text
  # .gh-domains
  auth        # Login, sesiones, seguridad
  billing     # Facturación y pagos
  ```
- Sin `.gh-domains`, se acepta cualquier dominio en kebab-case, pero el label igualmente debe existir en GitHub.
- Un maintainer crea los labels una sola vez:
  ```bash
  gh label create "domain: auth" --color 0E8A16 --description "Login, sesiones, seguridad"
  ```

> [!CAUTION]
> `gh pr create --label` falla si el label no existe. `create_pr.sh` lo comprueba antes con `gh label list` y aborta con la lista de labels faltantes. El agente **no** debe crearlos por su cuenta.

---

## 4. Cuerpo del PR

```markdown
This Pull Request introduces changes for **<short description>**.

Closes #<issue-id>

**Summary of Changes:**
- <commit subject 1>
- <commit subject 2>

**Testing & Verification:**
- [ ] Tests pass locally
- [ ] Linter and type checks pass
```

- `Closes #<id>` (o `Fixes`/`Resolves`) cierra el issue automáticamente al fusionar en la rama por defecto.
- Si el repositorio tiene `.github/pull_request_template.md`, se añade tras el resumen en lugar de la sección de testing por defecto.

---

## 5. Fusión

| Estrategia | Comando | Cuándo |
| :--- | :--- | :--- |
| Squash | `gh pr merge <n> --squash --delete-branch` | Por defecto: un commit con el título del PR |
| Rebase | `gh pr merge <n> --rebase --delete-branch` | Historial lineal con commits atómicos ya limpios |
| Merge commit | `gh pr merge <n> --merge` | Ramas de integración o release |
| Auto-merge | `gh pr merge <n> --auto --squash` | Fusiona sola cuando pasen los checks requeridos |

Nunca uses `--admin` para saltarte protecciones de rama.
