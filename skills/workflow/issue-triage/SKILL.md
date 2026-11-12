---
name: issue-triage
version: 1.0.2
description: >-
  Refina issues de Linear o GitHub con solo título o notas desestructuradas. Explora el repo local, extrae restricciones y reglas, preserva estimaciones y fechas, y actualiza la descripción con una especificación técnica estructurada.
tags: [workflow, project-management, issue-tracking, linear, github-issues, triage, specification]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - triage issue
  - refinar issue
  - refine issue
  - analizar ticket
  - preparar ticket
  - linear triage
  - github issue triage
requirements:
  tools: [view_file, replace_file_content, run_command]
---

# Issue Triage

## 🎯 Propósito

La skill `issue-triage` transforma issues vagos, mínimos (solo título) o con notas informales ("brain dumps") en especificaciones técnicas estructuradas y listas para implementación. Opera de manera agnóstica frente a cualquier gestor de tareas (**Linear**, **GitHub Issues** o modo manual), cruzando el requerimiento con la realidad del repositorio local y preservando intactos todos los metadatos de estimación y calendario.

---

## ⚡ Cuándo Activar esta Skill

Activa esta skill cuando el usuario:
- Proporcione el identificador o enlace de un ticket (ej. `ENG-104`, `#42`) solicitando refinarlo, analizarlo o prepararlo.
- Diga frases como *"refina este issue"*, *"haz triage de ENG-104"*, *"mira qué hay que hacer en este ticket"*, o *"prepara el issue para implementación"*.
- Tenga un ticket con solo título o con un párrafo informal de notas técnicas y quiera dejarlo documentado en el tracker antes de implementarlo en el futuro.

---

## 📋 Flujo de Trabajo Paso a Paso

El agente debe ejecutar determinísticamente los siguientes pasos:

### Paso 1: Detección del Proveedor e Ingesta del Issue
1. Analizar el identificador o URL proporcionado:
   - **Linear:** Formato tipo `ENG-104`, `PROJ-12` o URL de Linear. Invocar herramienta Linear MCP (`get_issue`) u Orca CLI.
   - **GitHub:** Formato `#42`, `owner/repo#42` o URL de GitHub. Ejecutar `gh issue view <id> --json number,title,body,state`.
   - **Manual:** Si el usuario pega texto directamente o no hay CLI/MCP disponible, usar el texto proporcionado.
2. Extraer `title`, `body` (o `description`) y estado actual del ticket.
3. Consultar [references/adapters.md](references/adapters.md) para ver los comandos y opciones exactas de cada proveedor.

### Paso 2: Análisis de Notas y Extracción de Restricciones
1. Clasificar el estado del contenido:
   - **Caso A (Vacío / Solo título):** Proceder a inferir alcance desde el codebase y el título.
   - **Caso B (Notas desestructuradas / "Brain dump"):** Extraer y clasificar minuciosamente:
     - **Restricciones arquitectónicas:** Límites backend vs. frontend, modelos de datos, servicios o funciones obligatorias.
     - **Reglas de negocio:** Casos de borde, validaciones, diferencias conceptuales (ej. días hábiles vs. calendario).
     - **Metadatos de gestión:** Estimaciones de horas/puntos, fechas límite o ventanas de entrega, fases o epics, y comandos sugeridos.
2. **REGLA ESTRICTA DE PRESERVACIÓN:** Ningún dato de estimación, fase o fecha de entrega debe descartarse o perderse durante el triage.

### Paso 3: Exploración de Solo Lectura del Codebase Local
1. Realizar una búsqueda dirigida en el repositorio basada en el título y palabras clave del ticket.
2. Identificar:
   - Rutas de archivos y módulos existentes que serán impactados o extendidos.
   - Patrones arquitectónicos utilizados en el proyecto (ej. Supabase Edge Functions, Zustand, repositorios, librerías de fechas).
   - Tipos de datos o esquemas de base de datos vinculados.
3. **Restricción:** La exploración debe ser estrictamente de solo lectura. **No editar código del proyecto** en esta fase.

### Paso 4: Formulación de la Ficha Estándar (7 Secciones)
Construir el borrador en Markdown siguiendo exactamente la estructura definida en [references/issue-template.md](references/issue-template.md):
1. `## 🎯 Objetivo`: Problema que resuelve y valor esperado.
2. `## 🛡️ Restricciones Arquitectónicas`: Ubicación obligatoria (backend/frontend), seguridad y rendimiento.
3. `## 📋 Reglas de Negocio Clave`: Reglas explícitas y casos de borde extraídos.
4. `## 🧭 Contexto Técnico en el Repo`: Archivos y dependencias reales verificados en el codebase.
5. `## 📦 Alcance Propuesto`: Checkboxes de entregables dentro del alcance (`In Scope`) y lista de exclusiones (`Out of Scope`).
6. `## 🗓️ Metadatos & Planificación`: Estimación, ventana temporal, fase y notas de planificación.
7. `## ❓ Preguntas / Decisiones Abiertas`: Dudas técnicas o de negocio no resueltas.

### Paso 5: Puerta de Revisión Interactiva (Safe Review Gate)
1. Presentar la ficha completa en el chat al usuario.
2. Preguntar explícitamente:
   > *"¿Deseas que actualice la descripción del issue con este contenido o prefieres ajustar algún detalle?"*
3. **Esperar la confirmación del usuario antes de ejecutar cualquier comando de escritura.**

### Paso 6: Persistencia en el Proveedor de Origen
Una vez confirmado por el usuario:
- **Linear:** Ejecutar Linear MCP `save_issue({ id: "<id>", description: "<markdown>" })`.
- **GitHub:** Ejecutar `gh issue edit <id> --body-file <temp-file>`.
- **Manual:** Presentar el bloque de código Markdown listo para copiar y pegar en Jira, Notion u otro sistema.

---

## ⚠️ Reglas Críticas

1. **Nunca editar código fuente del proyecto**: La labor de triage es de especificación y alineación previa, no de implementación.
2. **Puerta de revisión obligatoria**: Jamás actualizar un issue remoto sin antes mostrar el borrador completo en el chat y obtener la confirmación explícita del usuario.
3. **Preservar siempre metadatos de gestión**: Si el ticket original incluía estimaciones (`Estimación: 16 h`), ventanas de tiempo o fases, deben incluirse en la sección `🗓️ Metadatos & Planificación`.
4. **Verificación de rutas**: Solo incluir en `🧭 Contexto Técnico en el Repo` rutas y archivos cuya existencia haya sido verificada en el repositorio local. No inventar rutas.
5. **Enlaces relativos**: Los enlaces internos dentro de la skill deben ser siempre relativos (ej. `[adapters](references/adapters.md)`), nunca rutas absolutas del sistema.

---

## 📚 Referencias

- [Plantilla Estándar de Issue Triage](references/issue-template.md): Definición canónica de las 7 secciones y ejemplo completo.
- [Guía de Adaptadores de Proveedores](references/adapters.md): Comandos y llamadas MCP para Linear, GitHub y modo manual.
