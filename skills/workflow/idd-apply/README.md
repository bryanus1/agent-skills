# ⚙️ IDD Apply (`idd-apply`)

> **Fase 3 del flujo IDD (Issue-Driven Development): `idd-explore` → `idd-plan` → `idd-apply`. Implementa el plan tarea por tarea, marca cada casilla en el mismo ítem del tracker (o en el `.md` local), se detiene ante desviaciones y cierra con la verificación definida en el plan.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `idd-apply` |
| **Categoría** | `workflow` |
| **Versión** | `1.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Depende de** | [`idd-explore`](../idd-explore/README.md) (adaptadores), [`idd-plan`](../idd-plan/README.md) (plantilla del plan) |

---

## 🧭 El flujo IDD

| Fase | Skill | Qué produce | ¿Toca código? |
|---|---|---|---|
| 1. Explore | [`idd-explore`](../idd-explore/README.md) | Ficha de 7 secciones | No |
| 2. Plan | [`idd-plan`](../idd-plan/README.md) | Plan detallado | No |
| 3. Apply | **`idd-apply`** | Código + tareas marcadas | Sí |

---

## 📦 Instalación

```bash
npx skills add bryanus1/agent-skills --skill idd-explore --skill idd-plan --skill idd-apply
```

---

## 🔁 Cómo trabaja

1. Localiza el plan (tracker o `docs/specs/*.md`) y valida que tenga requisitos, tareas y verificación.
2. Te muestra las tareas pendientes y pide un único OK para ir actualizando el progreso.
3. Ejecuta cada tarea con el cambio mínimo y la verifica. En el tracker publica un comentario de progreso por grupo de tareas (sin reescribir la descripción); en local marca `- [x]` en el archivo.
4. Si algo no cuadra con el plan, se detiene, te propone el ajuste y, con tu OK, lo registra (en el comentario de progreso o, en local, en el plan).
5. Ejecuta la sección **Verificación**, te muestra el resumen y, con tu OK, consolida el plan en una sola edición: casillas marcadas, desviaciones y `Estado: implementado`.

No hace commit, push ni cierra el issue salvo que se lo pidas. Formato de estados y desviaciones: [references/apply-checklist.md](references/apply-checklist.md).

---

## 💡 Ejemplos

### 1. Plan en Linear
> *"Implementa el plan de ENG-104"*

Lee el plan del issue, ejecuta las tareas, comenta el progreso con `save_comment` y, al cerrar, consolida la descripción con `save_issue`.

### 2. Continuar un plan a medias
> *"Continúa con el plan de #42"*

Lee las casillas del plan y los comentarios `🔄 Progreso IDD` para saber qué está hecho, y sigue desde la primera tarea pendiente.

### 3. Plan local
> *"Aplica el plan"*

Busca en `docs/specs/` los planes sin terminar; si hay varios, te pregunta cuál.

---

## 📚 Documentación

- **[`SKILL.md`](SKILL.md)**: instrucciones operativas y reglas críticas.
- **[Checklist de ejecución](references/apply-checklist.md)**: estados, casillas, desviaciones y resumen de cierre.
