# Adaptadores de Proveedores (IDD)

Comandos y herramientas para leer y escribir ítems en cada proveedor. Los usan las tres fases del flujo IDD (`idd-explore`, `idd-plan`, `idd-apply`).

**Prioridad:** el tracker es la fuente de verdad. El archivo local solo se usa si no hay tracker disponible.

---

## 🔍 Detección del Proveedor

| Entrada del usuario | Proveedor | Herramienta |
|---|---|---|
| `https://www.notion.so/...`, ID de página | **Notion** | Notion MCP |
| `ENG-104`, `https://linear.app/...` | **Linear** | Linear MCP |
| `#42`, `owner/repo#42`, `https://github.com/<o>/<r>/issues/42` | **GitHub Issues** | `gh issue` |
| `https://github.com/orgs/<o>/projects/N`, `https://github.com/users/<u>/projects/N` | **GitHub Projects** | `gh project` + `gh issue` |
| Ruta `.md`, texto pegado, Jira u otro sin integración | **Local** | sistema de archivos |

Si la entrada no es un ítem de tracker, comprobar qué tracker está disponible (MCP de Notion/Linear conectado, o `gh auth status` correcto) y **ofrecer** crear el ítem ahí antes de recurrir al archivo local.

---

## 1. Notion

- **Leer:** `notion-fetch` con la URL o el ID de la página.
- **Actualizar el cuerpo:** `notion-update-page` con el contenido Markdown (añadir o reemplazar la sección correspondiente; conservar el resto).
- **Crear:** `notion-create-pages` en la base de datos o página padre que indique el usuario (preguntar si no se conoce).
- **Comentar:** `notion-create-comment` en la página (progreso de `idd-apply`).
- **Casillas:** las tareas se escriben como to-dos (`- [ ]`); se consolidan editando la página al cerrar.

## 2. Linear

- **Leer:** `get_issue` con `{ "id": "ENG-104" }`; el detalle está en `description`. Para comentarios, `list_comments`.
- **Actualizar:** `save_issue` con `{ "id": "ENG-104", "description": "<markdown completo>" }`. En descripciones largas, usar el modo `patch` si está disponible.
- **Crear:** `save_issue` sin `id`, con `team` (obligatorio) y `title`. Revisar antes con `list_issues` que no exista uno igual.
- **Comentar:** `save_comment` con `issueId` y `body` (progreso de `idd-apply`).

## 3. GitHub Issues

```bash
gh issue view 42 --json number,title,body,state,labels       # leer
gh issue edit 42 --body-file <tmp-body.md>                    # reemplazar el cuerpo
gh issue create --title "<título>" --body-file <tmp-body.md>  # crear
gh issue comment 42 --body-file <tmp-comment.md>              # comentar (progreso de idd-apply)
gh issue view 42 --comments                                   # leer comentarios al retomar
```

Usar siempre `--body-file` (evita problemas de escape). Escribir el archivo temporal fuera del repo y borrarlo al terminar.

## 4. GitHub Projects

```bash
gh project item-list <N> --owner <owner> --format json        # localizar el ítem
gh project item-add <N> --owner <owner> --url <issue-url>     # añadir una issue nueva al proyecto
```

- Si el ítem tiene issue enlazada, leer y escribir esa issue con los comandos de GitHub Issues.
- Si es un *draft item*, editarlo con `gh project item-edit --id <item-id> --title "<título>" --body "<markdown>"` (no admite `--body-file`). Para cuerpos largos, proponer antes convertirlo en issue.
- Requiere el scope `project` en `gh` (`gh auth refresh -s project`); si falta, indicárselo al usuario en vez de ejecutarlo.

## 5. Local (respaldo)

- **Un archivo por cambio:** `docs/specs/<YYYY-MM-DD>-<slug>.md` (slug en kebab-case derivado del título).
- `idd-explore` lo crea con la ficha; `idd-plan` añade debajo `## 🛠️ Plan de Implementación`; `idd-apply` marca las casillas.
- Para Jira u otros trackers sin integración: además de guardar el archivo, mostrar el bloque Markdown listo para copiar.

---

## ✍️ Regla común de escritura

Antes de escribir en cualquier proveedor: mostrar el contenido completo, decir **dónde** se va a escribir y esperar la confirmación explícita del usuario. Al actualizar, conservar las secciones existentes que no son de esta fase.

La mayoría de proveedores **reemplazan el cuerpo completo** (`gh issue edit`, `save_issue`). Por eso: volver a leer el cuerpo actual justo antes de escribir, cambiar solo la sección propia (ficha, `## 🛠️ Plan de Implementación` o sus casillas) y enviar el cuerpo entero. Si el cuerpo cambió desde la última lectura, partir de la versión nueva.
