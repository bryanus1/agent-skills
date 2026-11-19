# Fuentes de la Propuesta (`explain-change`)

Guía para localizar y leer la propuesta o plan original antes de contrastarlo contra el código implementado.

---

## 1. OpenSpec (`/opsx:apply` / `openspec/changes/`)

- **Dónde buscar:** carpeta `openspec/changes/<nombre-del-cambio>/` en la raíz del repo.
- **Qué excluir:** ignora `openspec/changes/archive/` por defecto (salvo que el usuario pida auditar un cambio ya archivado).
- **Archivos que forman la propuesta completa:**
  1. `proposal.md` — intención, alcance y qué queda fuera.
  2. `design.md` — decisiones técnicas y alternativas acordadas.
  3. `specs/**/*.md` — requisitos y escenarios esperados.
  4. `tasks.md` — lista de tareas e ítems marcados como completados (`- [x]`).
- **Si hay varios cambios activos:** lista los directorios dentro de `openspec/changes/` (excluyendo `archive/`) y pregunta al usuario cuál auditar. Si la rama actual o los archivos tocados apuntan claramente a uno, proponlo para confirmar.

---

## 2. Flujo IDD (`idd-plan` / `idd-apply`)

Lee la sección `## 🛠️ Plan de Implementación` (y la ficha previa si existe) desde el proveedor correspondiente:

| Entrada o rastro | Proveedor | Cómo leer |
|---|---|---|
| URL `notion.so/...` o ID de página | **Notion** | `notion-fetch` sobre la página |
| `ENG-104` o URL de Linear | **Linear** | `get_issue` (cuerpo) + `list_comments` (para ver `🔄 Progreso IDD` y desviaciones registradas) |
| `#42`, `owner/repo#42` o URL de issue | **GitHub Issues** | `gh issue view <n> --json title,body,comments` |
| URL de GitHub Projects o ítem | **GitHub Projects** | `gh project item-list` → leer issue enlazada o cuerpo del draft item |
| Archivo local | **Local** | `docs/specs/<YYYY-MM-DD>-<slug>.md` |

**Importante en IDD:**
- Revisa siempre la subsección `### Desviaciones` del plan y los comentarios `🔄 Progreso IDD` publicados durante `idd-apply`.
- Si una decisión diferente al plan ya figura ahí como acordada con el usuario, repórtala en una línea bajo *"Desviaciones ya registradas"* para no mezclarla con decisiones silenciosas nuevas.

---

## 3. Plan Genérico o Referencia Directa

- **Plan en el chat:** si el cambio vino de un plan aprobado en la misma conversación, úsalo como referencia declarando explícitamente que se compara contra el plan de la sesión.
- **Archivo `.md` o descripción de PR/issue:** si el usuario pasa una ruta (`docs/rfc-auth.md`, `PLAN.md`) o un PR (`gh pr view <n> --json title,body`), léelo íntegro antes de revisar el diff.

---

## 4. Desempate y Ausencia de Propuesta

- Si el usuario indica explícitamente un origen (p. ej. *"después de /opsx:apply en export-csv"* o *"contra ENG-104"*), usa ese origen directamente.
- Si existen a la vez cambios activos en `openspec/changes/` y archivos en `docs/specs/`, pregunta cuál corresponde al trabajo en curso.
- Si **no existe ninguna propuesta ni plan verificable**, detente y responde qué buscaste, pidiendo al usuario que indique el archivo, ticket o resumen contra el que contrastar el diff.
