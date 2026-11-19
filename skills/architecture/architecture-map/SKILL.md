---
name: architecture-map
version: 1.0.0
description: >-
  Genera o actualiza la página de arquitectura leyendo el repositorio real: stack, diagrama Mermaid, módulos/apps, datos, auth, flujos clave, integraciones y despliegue. Soporta Notion (MCP) y docs/ARCHITECTURE.md local, preservando notas manuales tras confirmar.
tags: [architecture, documentation, diagram, mermaid, notion, onboarding, repo-analysis]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - mapa-arquitectura
  - mapa de arquitectura
  - generar página de arquitectura
  - actualizar página de arquitectura
  - documentar arquitectura del repo
  - architecture map
  - update architecture docs
requirements:
  tools: [view_file, write_to_file, replace_file_content, run_command]
  bins: [git]
---

# Architecture Map (`mapa-arquitectura`)

## 🎯 Propósito

Generar desde cero o mantener al día la **página de arquitectura viva** de un proyecto leyendo el código real del repositorio (en lugar de documentación desactualizada o suposiciones). Produce una vista clara del sistema —stack verificado, diagrama Mermaid, módulos/apps, datos, seguridad, flujos clave, integraciones y despliegue— en **Notion** o en **`docs/ARCHITECTURE.md`**.

---

## ⚡ Cuándo Activar esta Skill

Activa esta skill cuando el usuario:
- Pida crear, generar o actualizar la página o documento de arquitectura (*"mapa-arquitectura"*, *"actualiza la página de arquitectura"*, *"documenta la arquitectura de este repo"*).
- Acabe de fusionar cambios estructurales o de incorporar a alguien y necesite sincronizar `docs/ARCHITECTURE.md` o una página de Notion con el estado real del código.

**No la uses** para diseñar desde cero un proyecto nuevo con estándares prescriptivos de framework (para eso usa `monorepo-architecture`, `nestjs-architecture`, `nextjs-architecture`, `astro-architecture` o `react-native-architecture`).

---

## 📋 Flujo de Trabajo Paso a Paso

### Paso 1: Determinar Destino y Modo (Crear vs. Actualizar)
Seguir [references/destinations.md](references/destinations.md):
1. **Notion (MCP):** si el usuario pasa una URL/ID de Notion o pide escribir en Notion, usar `notion-fetch` si la página ya existe; si es nueva, confirmar en qué página padre o base de datos crearla.
2. **Archivo local:** si no se indica Notion, buscar en orden `docs/ARCHITECTURE.md`, `ARCHITECTURE.md` y `docs/architecture.md` para **actualizar in situ sin duplicar**. Si ninguno existe, proponer `docs/ARCHITECTURE.md` (o preguntar primero si hay Notion MCP conectado y prefiere Notion).
3. **Preservación en modo actualización:** leer el documento actual completo e identificar secciones escritas a mano (ADRs, decisiones de negocio, roadmap, responsables, enlaces externos) para conservarlas intactas.

### Paso 2: Explorar el Repositorio por Capas (Solo Lectura)
Seguir el checklist de [references/repo-discovery.md](references/repo-discovery.md), excluyendo carpetas de build, dependencias y archivos con secretos:
1. **Topología y manifiestos:** monorepo vs. aplicación única, runtimes y gestor de paquetes.
2. **Apps, módulos y fronteras:** entrypoints, rutas principales, paquetes compartidos y dirección de dependencias.
3. **Datos y persistencia:** base de datos, ORM/migraciones, almacenamiento de archivos, caché o colas (solo si existen).
4. **Auth, seguridad y permisos:** proveedores de identidad, middlewares/guards y reglas RLS.
5. **Integraciones y variables de entorno:** SDKs externos y webhooks; listar **solo nombres** de variables desde `.env.example` o código de configuración (**prohibido** leer `.env` reales).
6. **Flujos clave:** trazar 1–3 recorridos principales de extremo a extremo citando rutas verificadas.
7. **Testing, CI/CD y despliegue:** scripts verificados, workflows y artefactos de despliegue.

### Paso 3: Detectar Deriva (Solo en Modo Actualización)
Comparar lo observado en el Paso 2 contra la página existente y listar de forma breve qué quedó obsoleto o nuevo (módulos añadidos/eliminados, cambios de stack, nuevas integraciones, migración de despliegue o comandos cambiados).

### Paso 4: Redactar el Mapa de Arquitectura
Seguir [references/architecture-template.md](references/architecture-template.md):
1. Adaptar las secciones al tamaño real del proyecto (omitir secciones de BD, colas o auth si no existen).
2. Generar un diagrama Mermaid válido (`flowchart TD` o `flowchart LR`), entrecomillando etiquetas con paréntesis, corchetes o barras.
3. Marcar cualquier dato que no pueda inferirse con certeza del código como `[por confirmar]` en lugar de adivinar.
4. Añadir al final el metadato de vigencia (`Última actualización: <YYYY-MM-DD> · Commit: <short-sha>`).

### Paso 5: Puerta de Revisión y Persistencia
1. Mostrar en el chat:
   - El **destino exacto** (URL/página de Notion o ruta local).
   - En creación: el borrador completo.
   - En actualización: el **resumen de deriva**, las **secciones manuales preservadas** y el contenido actualizado.
2. **Esperar confirmación explícita del usuario** antes de crear o editar archivos o páginas de Notion.
3. Si se actualiza en Notion, volver a leer con `notion-fetch` justo antes de `notion-update-page` para no pisar ediciones concurrentes. No editar código fuente ni hacer commits.

---

## ⚠️ Reglas Críticas

1. **Solo hechos verificados en el repo:** cada ruta, comando, módulo o integración documentado debe haber sido comprobado en archivos reales. Lo no verificable se marca `[por confirmar]`.
2. **Cero secretos:** nunca leer `.env`, `.env.local`, `.env.production`, llaves privadas ni credenciales; solo nombres de variables desde `.env.example` o código.
3. **Puerta de confirmación obligatoria:** prohibido escribir en `docs/ARCHITECTURE.md` o en Notion sin mostrar primero la propuesta y recibir confirmación.
4. **Preservación estricta de notas manuales:** nunca borrar ADRs, contexto histórico, enlaces ni notas del equipo que no puedan regenerarse desde el código.
5. **No duplicar destino:** si ya existe `ARCHITECTURE.md` o una página enlazada, actualizarla en lugar de crear una segunda copia paralela.
6. **Nivel arquitectónico:** explicar fronteras, responsabilidades y flujos; evitar listas interminables de cada archivo del repo.
7. **Solo documentación:** no modificar código de la aplicación ni hacer `git commit` o `git push`.

---

## 📚 Referencias

- [Checklist de descubrimiento del repo](references/repo-discovery.md): qué leer por capas y qué archivos ignorar.
- [Plantilla de arquitectura y Mermaid](references/architecture-template.md): estructura canónica, adaptación por tamaño y ejemplo.
- [Destinos y preservación de notas](references/destinations.md): flujo para Notion MCP, Markdown local y fusión segura.
