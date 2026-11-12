---
name: idd-apply
version: 1.0.0
description: >-
  Fase Apply del flujo IDD (Issue-Driven Development). Implementa el plan guardado en Notion, Linear, GitHub Issues/Projects o un .md local: ejecuta las tareas en orden, marca cada casilla al verificarla, se detiene ante desviaciones y cierra con la verificación del plan.
tags: [workflow, idd, sdd, implementation, linear, notion, github-issues]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - aplica el plan
  - implementa el plan
  - apply plan
  - implement the plan
  - continúa el plan
  - idd apply
requirements:
  tools: [view_file, replace_file_content, write_to_file, run_command]
  skills: [idd-explore, idd-plan]
---

# IDD Apply

## 🎯 Propósito

Tercera fase del flujo **IDD (Issue-Driven Development)**: `idd-explore` → `idd-plan` → **`idd-apply`**.

Implementa exactamente lo que dice el plan de `idd-plan`. **El plan es la fuente de verdad**: las tareas se ejecutan en orden y cualquier desviación se acuerda con el usuario antes de seguir.

**Cómo se registra el progreso:**
- **Plan en un tracker:** durante la implementación el progreso va en **comentarios** del ítem; el cuerpo solo se edita una vez, al cerrar. Así no se reescribe la descripción en cada tarea ni se pisan ediciones ajenas.
- **Plan en `.md` local:** las casillas se marcan directamente en el archivo.

---

## ⚡ Cuándo Activar esta Skill

Activa esta skill cuando el usuario:
- Pida implementar, aplicar o continuar un plan (`ENG-104`, `#42`, URL de Notion o de GitHub Projects, ruta `.md`).
- Diga *"aplica el plan"*, *"implementa ENG-104"*, *"continúa con las tareas del plan"* o *"idd apply"*.
- Acabe de aprobar un plan generado con `idd-plan`.

---

## 📋 Flujo de Trabajo Paso a Paso

### Paso 1: Localizar el Plan
1. Detectar el proveedor como en las fases anteriores; los comandos están en `<skill-dir>/../idd-explore/references/adapters.md` (`<skill-dir>` es el directorio que contiene este `SKILL.md`).
2. Si el usuario no indica el ítem y no hay tracker, buscar en `docs/specs/*.md` los archivos con `Estado: planificado` o `Estado: en progreso`. Si hay más de uno, preguntar cuál.
3. Leer la sección `## 🛠️ Plan de Implementación` completa y, si está en un tracker, los comentarios `🔄 Progreso IDD` posteriores: las tareas que figuran ahí como hechas cuentan como `- [x]` aunque el cuerpo aún no lo refleje.

### Paso 2: Validar el Plan
Comprobar que tiene **Requisitos con escenarios**, **Tareas** y **Verificación**. Si falta alguna, o hay **Preguntas abiertas** que bloquean, detenerse y sugerir completar el plan con `idd-plan`.

### Paso 3: Preparar
1. Mostrar el resumen: tareas pendientes (`- [ ]`), ya hechas (`- [x]`) y la primera que se va a ejecutar.
2. Revisar el estado de git (`git status`). Si hay cambios sin relación con el plan, avisar antes de empezar.
3. Si el plan vive en un tracker, pedir **una sola vez** el OK para publicar comentarios de progreso durante la implementación.
4. Marcar el inicio: en el tracker, un primer comentario `🔄 Progreso IDD — en progreso`; en local, cambiar la línea a `Estado: en progreso`.

### Paso 4: Ejecutar Tarea por Tarea
Para cada tarea pendiente, en orden:
1. Leer los archivos implicados y el requisito enlazado (`→ R1`).
2. Hacer el **cambio mínimo** que cumple la tarea, siguiendo los patrones del repo y reutilizando lo indicado en *Diseño y decisiones*.
3. Verificar la tarea (test, build o comprobación concreta).
4. Registrar el avance:
   - **Tracker:** al terminar cada grupo de tareas (y siempre antes de terminar el turno), publicar un comentario `🔄 Progreso IDD` con las tareas completadas y cómo se verificaron. No editar el cuerpo.
   - **Local:** marcar `- [x]` en el archivo al terminar cada tarea.

### Paso 5: Gestionar Desviaciones
Detenerse y preguntar si:
- Una tarea es ambigua, o un archivo o API del plan no existe o funciona distinto.
- Hace falta algo fuera del plan o fuera de alcance.
- Un test falla y la corrección cambia el diseño.

Proponer el ajuste y, tras la confirmación, registrarlo: en el tracker, en el siguiente comentario de progreso (sección *Desviación*); en local, directamente en el plan (tarea nueva, requisito modificado o nota en *Desviaciones*). Luego continuar. No improvisar en silencio.

### Paso 6: Verificación Final
1. Ejecutar cada punto de la sección **Verificación** y marcarlo.
2. Comprobar que cada escenario de los requisitos queda cubierto. Si algo falla, volver al Paso 4 o al 5.

### Paso 7: Cerrar
1. Mostrar el resumen: tareas completadas, archivos cambiados, resultado de la verificación y desviaciones.
2. Con confirmación del usuario, consolidar el plan en su ubicación con **una sola edición**: todas las casillas completadas en `- [x]`, tareas añadidas, `Estado: implementado · <fecha>` y `### Desviaciones` si las hubo. En el tracker, volver a leer el cuerpo justo antes, cambiar solo la sección del plan y dejar un último comentario `✅ IDD — implementado` con el resumen.
3. No hacer commit, push, merge ni cerrar el issue salvo que el usuario lo pida.

---

## ⚠️ Reglas Críticas

1. **El plan manda**: no implementar nada que no esté en el plan ni en su alcance sin acordarlo y reflejarlo primero en el plan.
2. **Nunca marcar una tarea sin verificarla**: si no se pudo verificar, dejarla en `- [ ]` y explicar por qué.
3. **Un solo lugar**: el progreso queda en el ítem donde vive el plan (o en su `.md`); no se crea una copia local si el plan está en el tracker.
4. **En el tracker, el cuerpo se edita una sola vez**: durante la implementación solo se publican comentarios; la consolidación del plan se hace al cerrar.
5. **Confirmación antes de escribir en el tracker**: el usuario aprueba al inicio los comentarios de progreso y, al final, el cierre.
6. **Sin acciones irreversibles no pedidas**: nada de commit, push, merge, cerrar issues ni comandos destructivos (`rm -rf`, `git reset --hard`, `git push --force`).
7. **Reportar con honestidad**: si un test falla o un paso se omitió, decirlo con la salida real.

---

## 📚 Referencias

- [Checklist de ejecución](references/apply-checklist.md): marcas de estado, formato de desviaciones y resumen de cierre.
- Plantilla del plan: `<skill-dir>/../idd-plan/references/plan-template.md`.
- Adaptadores de proveedores: `<skill-dir>/../idd-explore/references/adapters.md`.
