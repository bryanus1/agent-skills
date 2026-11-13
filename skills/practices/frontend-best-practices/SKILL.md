---
name: frontend-best-practices
version: 1.0.0
description: >-
  Revisa y mejora código frontend (React/Next.js y afines) con buenas prácticas verificables: estado y efectos, datos remotos, formularios, accesibilidad, rendimiento y seguridad. Prioriza hallazgos por impacto y corrige solo lo que duele. Úsala al revisar o escribir componentes, hooks y páginas.
tags: [frontend, react, nextjs, accessibility, performance, security, best-practices]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - buenas prácticas frontend
  - frontend best practices
  - revisa este componente
  - review react component
  - accesibilidad
  - mejorar rendimiento react
  - useEffect
  - revisión de frontend
requirements:
  tools: [view_file, replace_file_content, run_command]
---

# Frontend Best Practices

## 🎯 Propósito

Revisar y mejorar código de interfaz con **criterios verificables y priorizados**, no con listas genéricas. Cada hallazgo cita evidencia (`archivo:línea`), su impacto (usuario, seguridad, mantenimiento) y una corrección proporcionada. Lo que ya está bien se deja como está.

Cubre seis áreas: **estado y efectos, datos remotos, formularios, accesibilidad, rendimiento y seguridad**. No decide la estructura de carpetas (skills de arquitectura: `nextjs-architecture`, `react-native-architecture`, `astro-architecture`), ni la legibilidad interna de funciones (`clean-code`), ni responsabilidades de clases (`solid-principles`), ni los patrones (`design-patterns`). Para tests usa `tdd-workflow`.

## ⚡ Cuándo Activar esta Skill

- El usuario pide revisar, endurecer o "aplicar buenas prácticas" a componentes, hooks o páginas.
- Se escribe un componente nuevo con datos remotos, formularios o HTML de contenido externo.
- Hay síntomas: re-renders de más, parpadeos, datos desactualizados, bucles de `useEffect`, fallos de accesibilidad o de Lighthouse.

## 📋 Flujo de Trabajo Paso a Paso

### 1. Leer el contexto

Identifica framework y versión (React 18/19, Next App Router o Pages, Vite…), librería de datos (TanStack Query, SWR, RTK Query), de formularios (React Hook Form, Zod…), de estilos y de tests. **Usa lo que el proyecto ya tiene**; no introduzcas librerías sin confirmar. Distingue componentes de servidor y de cliente si el framework los tiene.

### 2. Revisar por áreas, con la lista de comprobación

| Área | Comprobaciones clave | Detalle |
|---|---|---|
| **Estado y efectos** | Estado derivado calculado en el render, no copiado con `useEffect`; efectos solo para sincronizar con sistemas externos; dependencias correctas; limpieza de suscripciones y peticiones; claves estables en listas | [react-state-effects](references/react-state-effects.md) |
| **Datos remotos** | Estado de servidor separado del de UI; carga, error y vacío tratados; sin `fetch` en `useEffect` si hay librería de datos; cancelación o ignorar respuestas obsoletas | [react-state-effects](references/react-state-effects.md) |
| **Formularios** | Validación en cliente **y** servidor; errores asociados a su campo; estado de envío y doble envío; no perder datos al fallar | [forms-and-data](references/forms-and-data.md) |
| **Accesibilidad** | HTML semántico antes que ARIA; todo interactivo con teclado y foco visible; nombres accesibles; `alt`, etiquetas, contraste; foco tras diálogos y rutas | [accessibility](references/accessibility.md) |
| **Rendimiento** | Medir antes de optimizar; no renderizar listas enormes sin virtualizar; imágenes dimensionadas y diferidas; código dividido por ruta; `memo`/`useMemo` solo con evidencia | [performance](references/performance.md) |
| **Seguridad** | Sin HTML sin sanear (`dangerouslySetInnerHTML`); tokens fuera de `localStorage` si hay alternativa; sin secretos en el bundle; URLs de usuario validadas; enlaces `target=_blank` con `rel` | [security-frontend](references/security-frontend.md) |

Limítate a las áreas relevantes para el alcance pedido y a los archivos que se pidieron.

### 3. Priorizar

Clasifica cada hallazgo y ordénalos:

- **Crítico**: seguridad explotable (XSS), pérdida de datos, bloqueo de usuarios (teclado/lector de pantalla imposible).
- **Importante**: bugs de estado o datos (carreras, estados sin manejar), problemas medibles de rendimiento, accesibilidad parcial.
- **Menor**: consistencia, nombres, micro-optimizaciones. Menciónalos sin corregir si no se pidió.

### 4. Corregir con red de seguridad

Con tests existentes, ejecútalos antes y después. Sin tests de la zona, describe el cambio de comportamiento esperado y, si es un bug, escribe primero un test que lo reproduzca (flujo de `tdd-workflow`). Un cambio por hallazgo; mantén props y exports públicos salvo que se pida lo contrario.

### 5. Verificar y reportar

Ejecuta tests, typecheck y lint si existen. Para accesibilidad y rendimiento, indica qué **no pudiste verificar** sin navegador (lector de pantalla, Lighthouse, rendimiento real) y cómo comprobarlo. Reporta con el formato de abajo.

## 🚫 Cuándo NO sobre-optimizar

- **`useMemo`/`useCallback`/`memo` en todas partes** sin un problema medido: añaden ruido y a veces coste.
- **Reescribir un componente que funciona** para adoptar otra librería o estilo.
- **Accesibilidad con ARIA añadida a mano** cuando un `<button>` o `<label>` lo resuelve.
- **Componentes pequeños y correctos**: si no hay hallazgos reales, dilo; "sin cambios necesarios" es un resultado válido.

## ⚠️ Reglas Críticas

- **Evidencia primero**: cada hallazgo con `archivo:línea` y su efecto concreto; nada de "podría ser más limpio".
- **Seguridad no se aplaza**: un `dangerouslySetInnerHTML` con datos no confiables se reporta como crítico aunque no lo hayan pedido; saneamiento con la librería que ya use el proyecto o, si no hay, propón una y pide confirmación.
- **No cambies comportamiento visible** (textos, estilos, flujos) sin avisarlo.
- **No inventes métricas**: no afirmes mejoras de rendimiento sin medirlas.
- **No instales dependencias** sin confirmación.
- **Respeta las convenciones del proyecto** (estilos, estructura, librerías) y las skills de arquitectura si están presentes.
- **No toques lo que no se pidió**: lo demás va a "Fuera de alcance".

## 📤 Reporte

```markdown
### Resumen
<estado general y los 1–3 hallazgos de más impacto>

### Hallazgos
| # | Severidad | Área | Ubicación | Problema y efecto | Acción |
|---|---|---|---|---|---|
| 1 | Crítico | Seguridad | UserCard.tsx:42 | `dangerouslySetInnerHTML` con `bio` del usuario: XSS almacenado | Corregido (sanear / renderizar texto) |
| 2 | Importante | Datos | UserList.tsx:15 | `fetch` en efecto sin cancelación: respuesta antigua pisa la nueva | Corregido |
| 3 | Menor | Estilo | — | Nombres inconsistentes | Solo mencionado |

### Cambios aplicados
1. <cambio> — tests: ✅ N/N

### No verificado / fuera de alcance
- <qué requiere navegador, medición o decisión del usuario>
```

## 📚 Referencias

- [Estado, efectos y datos remotos](references/react-state-effects.md)
- [Formularios y validación](references/forms-and-data.md)
- [Accesibilidad](references/accessibility.md)
- [Rendimiento](references/performance.md)
- [Seguridad en el frontend](references/security-frontend.md)
- [Ejemplo de revisión completa](examples/review-user-list.md)
