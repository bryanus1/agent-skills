# 🏷️ GitLab Standards, Emojis & Scoped Labels Reference

Esta referencia documenta las reglas estrictas de convenciones para Merge Requests (MRs), Emojis y Labels del grupo de GitLab.

---

## 1. Convención de Títulos de Merge Request (MR)

### Regla Fundamental:
- **Con Issue ID**: `<type>(#<issue-id>): <emoji> <description>`
  - *Ejemplo*: `feat(#42): ✨ nextauth credentials`
  - *Ejemplo*: `fix(#15): 🐛 handle missing pet id`
- **Sin Issue ID**: `<type>: <emoji> <description>` (⚠️ **Sin ningún scope**)
  - *Ejemplo*: `chore: 🔧 upgrade node to 24 alpine`
  - *Ejemplo*: `refactor: ♻️ decouple auth service`
  - *Ejemplo*: `ci: 👷 update runner path variable`

> [!IMPORTANT]
> **Prohibido usar nombres de carpetas o paquetes como scope** (ej. `feat(apps/web): ...` o `fix(src): ...`). El único scope permitido es el GitLab Issue ID en formato `#<id>`.

---

## 2. Mapeo de Emojis por Tipo de Cambio

| Commit / MR Type | Emoji | Significado |
| :--- | :---: | :--- |
| `feat` | ✨ | Nueva funcionalidad o feature |
| `fix` | 🐛 | Corrección de bug o error |
| `hotfix` | 🚑 | Corrección crítica en producción |
| `chore` | 🔧 | Tareas de mantenimiento, dependencias o tooling |
| `refactor` | ♻️ | Refactorización de código sin cambio funcional |
| `docs` | 📝 | Cambios exclusivos en documentación |
| `test` | 🧪 | Tests unitarios, integración o cobertura |
| `ci` | 👷 | Configuración de CI/CD, Docker o pipelines |

---

## 3. Catálogo de Scoped Labels de Grupo

> [!CAUTION]
> **Solo usar labels a nivel grupo**. Prohibido inventar o crear labels a nivel repositorio.

### Composición Obligatoria por MR:
1. **`type::*` (Exactamente 1)**:
   - `type::feature` (para `feat`)
   - `type::bug` (para `fix` / `hotfix`)
   - `type::refactor` (para `refactor` / `perf`)
   - `type::chore` (para `chore`, `ci`, `docs`, `test`, `style`)
2. **`layer::*` (Exactamente 1)**:
   - `layer::frontend` (para aplicaciones web, UI/UX)
   - `layer::backend` (para APIs, base de datos, lógica de servidor)
3. **`domain::*` (Al menos 1 según el módulo)**:
   - `domain::pets` — Mascotas, microchips, expedientes
   - `domain::landing` — Web pública, portal de búsqueda
   - `domain::auth` — Login, sesiones, seguridad
   - `domain::clinical` — Historiales clínicos, vacunas
   - `domain::operations` — Inventario, microchips físicos
   - `domain::users` — Gestión de usuarios, veterinarias
4. **`priority::*` (Opcional)**:
   - `priority::high`, `priority::medium`, `priority::low`
5. **`status::*` (Opcional / Estado)**:
   - `status::todo`, `status::doing`, `status::in-review`

---

## 4. Estructura de Descripción del MR

```markdown
This Merge Request introduces changes for **<short description>**. Closes #<issue-id>

**<Area Title 1>:**
- Bullet point de cambio específico 1
- Bullet point de cambio específico 2

**Testing & Verification:**
- Cobertura de tests validada (>=90%)
- Linter y tipos verificados
```
