---
name: idd-explore
version: 2.0.0
description: >-
  Fase Explore del flujo IDD (Issue-Driven Development). Refina issues de Notion, Linear, GitHub Issues/Projects o notas locales con solo título o ideas sueltas: explora el repo, extrae restricciones y reglas, preserva estimaciones y deja una ficha lista para idd-plan.
tags: [workflow, idd, sdd, issue-tracking, triage, specification, linear, notion, github-issues]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - triage issue
  - refinar issue
  - refine issue
  - analizar ticket
  - preparar ticket
  - explorar requerimiento
  - linear triage
  - github issue triage
  - idd explore
requirements:
  tools: [view_file, replace_file_content, run_command]
---

# IDD Explore (Issue Triage)

## 🎯 Propósito

Primera fase del flujo **IDD (Issue-Driven Development)**: `idd-explore` → `idd-plan` → `idd-apply`.

Transforma issues vagos, mínimos (solo título) o con notas informales ("brain dumps") en una ficha técnica estructurada, cruzando el requerimiento con la realidad del repositorio local y preservando intactos los metadatos de estimación y calendario.

**La herramienta de seguimiento es la fuente de verdad** (Notion, Linear, GitHub Issues/Projects). Solo si no hay ninguna disponible se usa un archivo Markdown local en `docs/specs/`.

---

## ⚡ Cuándo Activar esta Skill

Activa esta skill cuando el usuario:
- Proporcione un ítem de un tracker (`ENG-104`, `#42`, URL de Notion, Linear o GitHub Projects) pidiendo refinarlo, analizarlo o prepararlo.
- Diga *"refina este issue"*, *"haz triage de ENG-104"*, *"explora este requerimiento"* o *"prepara el ticket"*.
- Pegue notas sueltas o una ruta `.md` y quiera convertirlas en un requerimiento claro antes de planificar.

No la uses para generar el plan de implementación (eso es `idd-plan`) ni para escribir código (eso es `idd-apply`).

---

## 📋 Flujo de Trabajo Paso a Paso

### Paso 1: Detectar la Fuente e Ingerir el Requerimiento
Detectar el origen según la entrada (detalle en [references/adapters.md](references/adapters.md)):

| Entrada | Fuente | Lectura |
|---|---|---|
| URL `notion.so/...` o ID de página | **Notion** | Notion MCP `notion-fetch` |
| `ENG-104`, URL de Linear | **Linear** | Linear MCP `get_issue` |
| `#42`, `owner/repo#42`, URL de issue | **GitHub Issues** | `gh issue view` |
| URL `github.com/.../projects/N` o ítem de proyecto | **GitHub Projects** | `gh project item-list` → issue enlazada |
| Ruta `.md` o texto pegado | **Local** | leer el archivo o el texto |

Extraer título, cuerpo y estado actual.

### Paso 2: Análisis de Notas y Extracción de Restricciones
1. Clasificar el contenido:
   - **Caso A (vacío / solo título):** inferir alcance desde el codebase y el título.
   - **Caso B (notas desestructuradas):** extraer restricciones arquitectónicas, reglas de negocio y casos de borde, y metadatos de gestión (estimación, fechas, fase, comandos sugeridos).
2. **Preservación estricta:** ningún dato de estimación, fase o fecha se descarta.

### Paso 3: Exploración de Solo Lectura del Codebase
1. Búsqueda dirigida por título y palabras clave.
2. Identificar archivos y módulos impactados, patrones existentes, tipos y esquemas vinculados.
3. **No editar código** en esta fase.

### Paso 4: Formular la Ficha (7 Secciones)
Seguir exactamente [references/issue-template.md](references/issue-template.md):
`🎯 Objetivo` · `🛡️ Restricciones Arquitectónicas` · `📋 Reglas de Negocio Clave` · `🧭 Contexto Técnico en el Repo` · `📦 Alcance Propuesto` · `🗓️ Metadatos & Planificación` · `❓ Preguntas / Decisiones Abiertas`.

### Paso 5: Puerta de Revisión
1. Mostrar la ficha completa en el chat e indicar dónde se va a guardar.
2. **Esperar la confirmación explícita del usuario antes de cualquier escritura.**

### Paso 6: Persistir (el tracker primero)
1. **La entrada era un ítem de tracker:** escribir la ficha en la descripción del ítem o en el cuerpo de la página de Notion.
2. **La entrada era texto o `.md`, pero hay un tracker conectado** (MCP de Notion o Linear, o `gh` autenticado): ofrecer crear el ítem ahí y crearlo solo si el usuario acepta.
3. **No hay tracker:** guardar en `docs/specs/<YYYY-MM-DD>-<slug>.md` (un único archivo por cambio, que `idd-plan` y `idd-apply` ampliarán después).

### Paso 7: Siguiente Paso
Cerrar con:
> *"La ficha está lista. Cuando quieras, usa **idd-plan** sobre este mismo ítem para generar el plan de implementación."*

---

## ⚠️ Reglas Críticas

1. **Nunca editar código fuente del proyecto**: esta fase es de especificación, no de implementación.
2. **Puerta de revisión obligatoria**: no escribir en el tracker ni en disco sin mostrar el borrador y obtener confirmación.
3. **Preservar metadatos de gestión**: estimaciones, ventanas de tiempo y fases van siempre a `🗓️ Metadatos & Planificación`.
4. **Verificar rutas**: en `🧭 Contexto Técnico en el Repo` solo aparecen rutas cuya existencia se comprobó. No inventar rutas.
5. **No duplicar**: si el ítem ya existe en un tracker, se actualiza ese ítem; no se crea además un `.md` local.
6. **Enlaces relativos**: los enlaces internos de la skill son siempre relativos (ej. `[adapters](references/adapters.md)`).

---

## 📚 Referencias

- [Plantilla de la ficha](references/issue-template.md): las 7 secciones y un ejemplo completo.
- [Adaptadores de proveedores](references/adapters.md): lectura y escritura en Notion, Linear, GitHub Issues/Projects y local.
