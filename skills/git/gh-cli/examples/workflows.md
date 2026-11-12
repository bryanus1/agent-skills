# 📚 Casos de Uso y Flujos de Ejemplo — `gh-cli`

## Caso 1: Crear un PR vinculado a un issue

Estás en la rama `feat/42-login-form` y el repo tiene `.gh-domains` con `auth` y `billing`:

```bash
bash <skill-dir>/scripts/create_pr.sh --domain auth --reviewer octocat --dry-run
```

**Previsualización**:
- **Título**: `feat(#42): ✨ login form`
- **Labels**: `enhancement, domain: auth`
- **Cuerpo**:
  ```markdown
  This Pull Request introduces changes for **login form**.

  Closes #42

  **Summary of Changes:**
  - feat: add login form with validation
  - test: cover invalid credentials
  ```

Tras la confirmación del usuario (y si la rama aún no está publicada):

```bash
bash <skill-dir>/scripts/create_pr.sh --domain auth --reviewer octocat --push
```

Si `domain: auth` no existe en GitHub, el script aborta antes de crear nada e indica qué label falta.

---

## Caso 2: PR sin issue

Rama `chore/upgrade-zod`:

```bash
bash <skill-dir>/scripts/create_pr.sh --dry-run
```

**Título**: `chore: 🔧 upgrade zod` (sin scope). Sin label de tipo, porque `chore` no tiene equivalente en los labels por defecto de GitHub.

---

## Caso 3: Diagnosticar un check fallido de un PR

```bash
bash <skill-dir>/scripts/diagnose_run.sh --pr 57 --job lint --lines 40
```

1. Muestra `gh pr checks 57`.
2. Busca el último run fallido de la rama del PR.
3. Imprime solo las líneas fallidas del job `lint`:
   ```text
   lint  Run pnpm lint  src/auth/login.ts:12:7  error  'user' is assigned a value but never used
   ```
4. El agente corrige `src/auth/login.ts`, ejecuta `pnpm lint` en local y hace commit. No relanza el workflow a ciegas.

---

## Caso 4: Revisar y fusionar un PR

```bash
gh pr view 57 --json title,reviewDecision,mergeable --jq '.'
gh pr diff 57
gh pr checks 57
gh pr review 57 --approve --body "LGTM"
gh pr merge 57 --squash --delete-branch    # solo tras confirmación explícita
```

---

## Caso 5: Publicar una release

```bash
bash <skill-dir>/scripts/release_helper.sh draft-notes            # vista previa local
bash <skill-dir>/scripts/release_helper.sh create v1.4.0 --dry-run
bash <skill-dir>/scripts/release_helper.sh create v1.4.0          # tras confirmación
```

GitHub genera las notas a partir de los PRs fusionados desde la release anterior.
