# 🛠️ GitHub Actions y Resolución de Problemas

---

## 1. Flujo de Diagnóstico de un Run Fallido

1. Localiza el run: `bash <skill-dir>/scripts/diagnose_run.sh` (último fallido de la rama) o `--pr <n>` para ver los checks de un PR.
2. Lee solo lo que falló: el script usa `gh run view <id> --log-failed`, cuyo formato es `<job>\t<step>\t<línea>`. Con `--job <nombre>` se filtra por la primera columna.
3. Identifica la causa en el log (primer error, no el último) y corrige el código.
4. Verifica en local con el mismo comando del workflow antes de volver a hacer push.
5. Relanza solo si el fallo es transitorio: `gh run rerun <id> --failed`.

---

## 2. Errores Frecuentes

| Síntoma en el log | Causa probable | Acción |
| :--- | :--- | :--- |
| `ERR_PNPM_OUTDATED_LOCKFILE` / `npm ci` falla por lockfile | Lockfile desincronizado con `package.json` | Reinstala en local y commitea el lockfile |
| `Resource not accessible by integration` | Permisos insuficientes de `GITHUB_TOKEN` | Añade `permissions:` al job (p. ej. `contents: write`, `pull-requests: write`) |
| `Error: Input required and not supplied: token` | Secret inexistente o no disponible en PRs de forks | Revisa `gh secret list`; los forks no reciben secrets |
| Job en cola indefinidamente | Runner self-hosted caído o etiqueta `runs-on` inexistente | Revisa `runs-on` y el estado de los runners |
| `The process '/usr/bin/git' failed with exit code 128` | `fetch-depth` insuficiente o credenciales de checkout | `actions/checkout` con `fetch-depth: 0` si el paso necesita historial |
| Tests pasan en local y fallan en CI | Diferencias de versión de Node/SO, zona horaria u orden | Fija versiones en `setup-*` y reproduce con las mismas variables |
| `Process completed with exit code 137` | Memoria agotada (OOM) | Reduce paralelismo o usa un runner con más memoria |

---

## 3. Checks Requeridos y Protección de Ramas

```bash
gh pr checks 57                                          # estado de cada check
gh api repos/{owner}/{repo}/branches/main/protection \
  --jq '.required_status_checks.contexts'                # checks obligatorios
```

- Un PR no se puede fusionar mientras falte un check requerido, aunque los demás estén en verde.
- `gh pr merge --auto --squash` deja el PR programado para fusionarse cuando pasen.
- Nunca uses `gh pr merge --admin` para saltarte la protección.

---

## 4. Ejecutar y Vigilar Workflows

```bash
gh workflow list
gh workflow run ci.yml --ref feat/42-login-form          # requiere trigger workflow_dispatch
gh run watch <run-id> --exit-status                      # sale con error si el run falla
```

---

## 5. Autenticación de `gh`

| Problema | Solución |
| :--- | :--- |
| `gh: To get started with GitHub CLI, please run: gh auth login` | El usuario ejecuta `gh auth login` |
| `HTTP 404` en un repo privado | La cuenta no tiene acceso o falta el scope `repo` |
| `HTTP 403` al fusionar o etiquetar | Rol insuficiente en el repo (se necesita *write* o *maintain*) |
| Workflows no se pueden editar vía API | El token necesita el scope `workflow`: `gh auth refresh -s workflow` |
