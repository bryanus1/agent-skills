# 📚 Casos de Uso y Flujos de Ejemplo — `glab-cli`

## Caso 1: Crear MR con Issue ID asociado

Estás en la rama `feat/42-pet-registration` de un proyecto Next.js cuyo `.glab-domains` contiene:

```text
auth
pets
users
```

```bash
# Previsualizar título y labels, y después crear el MR:
bash <skill-dir>/scripts/create_mr.sh --domain pets --priority high --dry-run
bash <skill-dir>/scripts/create_mr.sh --domain pets --priority high
```

Con `--domain billing`, el script fallaría porque `billing` no está en `.glab-domains`.

**Resultado generado**:
- **Título**: `feat(#42): ✨ pet registration`
- **Labels**: `type::feature,layer::frontend,domain::pets,priority::high`
- **Descripción**:
  ```markdown
  This Merge Request introduces changes for **pet registration**. Closes #42

  **Summary of Changes:**
  - feat: add pet registration form and validation schema
  - test: add unit tests for pet registration screen

  **Testing & Verification:**
  - Local test suites verified successfully.
  - Code style, linter, and type checks passed.
  ```

---

## Caso 2: Crear MR sin Issue ID (Sin Scope en el Título)

Estás en la rama `chore/upgrade-zod`:

```bash
bash <skill-dir>/scripts/create_mr.sh --domain operations
```

**Resultado generado**:
- **Título**: `chore: 🔧 upgrade zod` *(⚠️ Sin paréntesis de scope)*
- **Labels**: `type::chore,layer::backend,domain::operations`
- **Descripción**:
  ```markdown
  This Merge Request introduces changes for **upgrade zod**.

  **Summary of Changes:**
  - chore: upgrade zod dependency to latest version

  **Testing & Verification:**
  - Local test suites verified successfully.
  - Code style, linter, and type checks passed.
  ```

---

## Caso 3: Diagnosticar un Pipeline Fallido en CI

Cuando un pipeline falla en GitLab CI:

```bash
# 1. Ver estado general
bash <skill-dir>/scripts/diagnose_pipeline.sh

# 2. Inspeccionar logs del job fallido
bash <skill-dir>/scripts/diagnose_pipeline.sh --job lint --lines 40
```
