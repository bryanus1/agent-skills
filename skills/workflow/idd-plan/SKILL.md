---
name: idd-plan
version: 1.0.0
description: >-
  Fase Plan del flujo IDD (Issue-Driven Development). Convierte un ítem de Notion, Linear, GitHub Issues/Projects o un .md local en un plan de implementación detallado: requisitos con escenarios, diseño, archivos verificados, tareas y verificación. No toca código.
tags: [workflow, idd, sdd, planning, specification, linear, notion, github-issues]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - planifica el issue
  - crear plan de implementación
  - plan this issue
  - spec this
  - idd plan
requirements:
  tools: [view_file, replace_file_content, run_command]
  skills: [idd-explore]
---

# IDD Plan

## 🎯 Propósito

Segunda fase del flujo **IDD (Issue-Driven Development)**: `idd-explore` → **`idd-plan`** → `idd-apply`.

Produce un plan **muy detallado y verificable** antes de escribir una sola línea de código, siguiendo los principios de Spec-Driven Development: la especificación va primero, cada requisito tiene escenarios comprobables y cada tarea se enlaza a un requisito. El plan se guarda **en el mismo ítem del tracker** (o en el `.md` local si no hay tracker) y se convierte en la fuente de verdad para `idd-apply`.

---

## ⚡ Cuándo Activar esta Skill

Activa esta skill cuando el usuario:
- Pida planificar, especificar o diseñar la implementación de un ítem (`ENG-104`, `#42`, URL de Notion o de GitHub Projects, ruta `.md`).
- Diga *"planifica este issue"*, *"haz el plan de implementación"*, *"spec this"* o *"idd plan"*.
- Acabe de terminar `idd-explore` y quiera pasar a la siguiente fase.

Si el requerimiento es tan vago que no se pueden escribir requisitos, sugiere primero `idd-explore`.

---

## 📋 Flujo de Trabajo Paso a Paso

### Paso 1: Localizar la Fuente
Detectar el proveedor como en la fase Explore (Notion, Linear, GitHub Issues/Projects, local). Los comandos exactos están en `<skill-dir>/../idd-explore/references/adapters.md` (`<skill-dir>` es el directorio que contiene este `SKILL.md`); resumen en la sección "Dónde se guarda" de [references/plan-template.md](references/plan-template.md).

### Paso 2: Leer el Requerimiento
1. Leer título, cuerpo y comentarios relevantes.
2. Si ya existe la ficha de `idd-explore`, reutilizarla como base (objetivo, restricciones, reglas, alcance, metadatos).
3. Si ya existe una sección `## 🛠️ Plan de Implementación`, tratar la petición como una **revisión** del plan, no como uno nuevo.

### Paso 3: Explorar el Repo (Solo Lectura)
1. Localizar los módulos, archivos, tipos, tests y patrones que el cambio tocará o debe imitar.
2. Identificar utilidades existentes que se puedan reutilizar en lugar de escribir código nuevo.
3. Identificar cómo se verifica el proyecto (scripts de test, lint, build).
4. **No editar ningún archivo del proyecto.**

### Paso 4: Aclarar lo Esencial
Preguntar solo lo que cambie el alcance, el comportamiento observable, la compatibilidad o los criterios de aceptación. Para detalles menores, asumir algo razonable y registrarlo en **Supuestos**.

### Paso 5: Elegir el Tamaño del Plan
- **Plan corto** (cambio pequeño: un solo módulo, hasta 3 tareas, sin cambios de datos, API pública ni dependencias): solo **Contexto**, **Requisitos** (1 o 2, con escenario), **Tareas** y **Verificación**. Usar la variante "Plan corto" de la plantilla.
- **Plan completo**: el resto de casos.
- **Dividir**: si el plan supera unas 12 tareas o mezcla entregables independientes, proponer partirlo en varios ítems (uno por entregable, cada uno con su propio plan y enlazados entre sí). No dividir ni crear ítems sin confirmación.

Ante la duda entre corto y completo, usar el completo.

### Paso 6: Redactar el Plan
Seguir exactamente [references/plan-template.md](references/plan-template.md):
1. **Contexto**: por qué y para qué.
2. **Requisitos**: agrupados en `ADDED` / `MODIFIED` / `REMOVED`; cada uno con "DEBE…" y al menos un escenario *Dado / Cuando / Entonces*.
3. **Diseño y decisiones**: enfoque elegido y la alternativa descartada en una línea.
4. **Archivos afectados**: solo rutas verificadas (o marcadas como `(nuevo)`).
5. **Tareas**: `- [ ] 1.1 …`, pequeñas, ordenadas, cada una con su requisito (`→ R1`).
6. **Verificación**: comandos y comprobaciones concretas por escenario.
7. **Fuera de alcance**, **Supuestos**, **Preguntas abiertas** y **Metadatos** (preservar estimación, fase, fechas y enlace a la fuente).

### Paso 7: Puerta de Revisión
1. Mostrar el plan completo en el chat e indicar dónde se va a guardar.
2. **Esperar la confirmación explícita del usuario** antes de escribir.

### Paso 8: Persistir (el tracker primero)
1. **Ítem de tracker:** añadir o reemplazar la sección `## 🛠️ Plan de Implementación` en la descripción del ítem o en el cuerpo de la página. Conservar la ficha de `idd-explore` y el resto del contenido.
2. **Texto o `.md`, pero con tracker conectado:** ofrecer crear el ítem ahí; crearlo solo si el usuario acepta.
3. **Sin tracker:** añadir la sección al archivo `docs/specs/<YYYY-MM-DD>-<slug>.md` (crearlo si no existe).

### Paso 9: Detenerse
No empezar la implementación, aunque la petición original lo insinúe. Cerrar con:
> *"El plan está listo en <ubicación>. Cuando quieras, usa **idd-apply** para implementarlo."*

---

## ⚠️ Reglas Críticas

1. **No editar código del proyecto**: esta fase solo produce el plan.
2. **Puerta de revisión obligatoria**: nada se escribe en el tracker ni en disco sin confirmación explícita.
3. **Rutas verificadas**: no inventar archivos; lo nuevo se marca `(nuevo)`.
4. **Requisitos comprobables**: cada requisito tiene al menos un escenario; cada escenario se cubre en Verificación.
5. **Tareas trazables**: cada tarea apunta a un requisito y es lo bastante pequeña para completarse y verificarse sola.
6. **Un solo lugar por cambio**: no duplicar el plan en el tracker y en un `.md` local.
7. **Preservar metadatos**: estimaciones, fases y fechas de la fuente se mantienen.
8. **Proporcional al cambio**: plan corto para cambios pequeños; proponer dividir los planes de más de unas 12 tareas.

---

## 📚 Referencias

- [Plantilla del plan](references/plan-template.md): estructura canónica, reglas de redacción y ejemplo.
- Adaptadores de proveedores: `<skill-dir>/../idd-explore/references/adapters.md` (se instala con `idd-explore`).
