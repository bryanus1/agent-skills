---
name: backend-best-practices
version: 1.0.0
description: >-
  Revisa y mejora código backend (APIs HTTP, servicios, acceso a datos) con buenas prácticas verificables: diseño de API, validación y errores, acceso a datos, seguridad, fiabilidad y observabilidad. Prioriza por impacto y corrige solo lo que duele. Úsala al revisar o escribir endpoints, servicios y consultas.
tags: [backend, api, rest, security, database, observability, best-practices]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - buenas prácticas backend
  - backend best practices
  - revisa este endpoint
  - review api
  - diseño de api
  - seguridad backend
  - n+1
  - revisión de backend
requirements:
  tools: [view_file, replace_file_content, run_command]
---

# Backend Best Practices

## 🎯 Propósito

Revisar y mejorar código de servidor con **criterios verificables y priorizados**. Cada hallazgo cita evidencia (`archivo:línea`), su impacto (seguridad, datos, disponibilidad, mantenimiento) y una corrección proporcionada. Lo que ya está bien se deja como está.

Cubre cinco áreas: **diseño de API y errores, acceso a datos, seguridad, fiabilidad y observabilidad**. No decide la estructura de módulos (`nestjs-architecture`, `monorepo-architecture`), ni la legibilidad interna (`clean-code`), ni responsabilidades de clases (`solid-principles`), ni qué patrón usar (`design-patterns`). Para tests usa `tdd-workflow`.

## ⚡ Cuándo Activar esta Skill

- El usuario pide revisar, endurecer o "aplicar buenas prácticas" a endpoints, servicios, consultas o middleware.
- Se escribe un endpoint o servicio nuevo que recibe entrada externa, toca la base de datos o llama a terceros.
- Hay síntomas: consultas lentas, errores 500 sin explicación, datos inconsistentes, fugas de información, falta de trazabilidad.

## 📋 Flujo de Trabajo Paso a Paso

### 1. Leer el contexto

Identifica lenguaje y framework (NestJS, Express, Fastify, Hono…), ORM o cliente de BD, cómo se validan entradas y se manejan errores hoy, cómo se loguea y cómo se configura. **Usa las convenciones y librerías del proyecto**; no introduzcas otras sin confirmar.

### 2. Revisar por áreas

| Área | Comprobaciones clave | Detalle |
|---|---|---|
| **Diseño de API y errores** | Validación de entrada en el borde; códigos de estado correctos; formato de error uniforme sin filtrar detalles internos; paginación; idempotencia en operaciones repetibles | [api-design](references/api-design.md) |
| **Acceso a datos** | Consultas parametrizadas; sin N+1; transacciones para cambios relacionados; índices para los filtros reales; migraciones seguras | [data-access](references/data-access.md) |
| **Seguridad** | Autenticación y **autorización por recurso**; inyección; secretos fuera del código; límites de tasa; datos sensibles no expuestos ni registrados | [security-backend](references/security-backend.md) |
| **Fiabilidad** | Timeouts en llamadas externas; reintentos con límite y solo si es idempotente; cierre ordenado; sin trabajo pesado bloqueando el bucle de eventos | [reliability-observability](references/reliability-observability.md) |
| **Observabilidad** | Logs estructurados con correlación; sin datos sensibles; métricas y health checks; errores con contexto | [reliability-observability](references/reliability-observability.md) |

Limítate a las áreas relevantes para el alcance pedido y a los archivos que se pidieron.

### 3. Priorizar

- **Crítico**: vulnerabilidad explotable (inyección, falta de autorización, secretos expuestos), pérdida o corrupción de datos.
- **Importante**: errores que devuelven códigos incorrectos o filtran detalles, consultas N+1 o sin índice en rutas calientes, ausencia de transacción, falta de timeouts.
- **Menor**: consistencia de nombres, logs poco útiles, mejoras de formato. Menciónalos sin corregir si no se pidió.

### 4. Corregir con red de seguridad

Ejecuta los tests antes y después. Si el cambio altera el contrato HTTP (códigos de estado, forma de la respuesta, campos), **avísalo antes de aplicarlo**: los clientes dependen de él. Para un bug o una vulnerabilidad, escribe antes un test que la reproduzca (flujo de `tdd-workflow`). Un cambio por hallazgo.

### 5. Verificar y reportar

Ejecuta tests, typecheck y lint si existen. Indica lo que **no pudiste verificar** (rendimiento real con datos de producción, comportamiento bajo carga, políticas de red) y cómo comprobarlo. Reporta con el formato de abajo.

## 🚫 Cuándo NO sobre-ingenierizar

- **Añadir capas** (repositorio, DTO, caso de uso) a un CRUD simple que el framework ya cubre.
- **Caché, colas o microservicios** sin un problema de rendimiento medido.
- **Reintentos en operaciones no idempotentes** (cobros, envíos): crean duplicados.
- **Índices "por si acaso"**: cada índice cuesta en escrituras; basa la decisión en las consultas reales (`EXPLAIN`).
- **Handlers pequeños y correctos**: si no hay hallazgos reales, dilo; "sin cambios necesarios" es un resultado válido.

## ⚠️ Reglas Críticas

- **Evidencia primero**: cada hallazgo con `archivo:línea` y efecto concreto.
- **La seguridad no se aplaza**: una inyección o una autorización ausente se reporta como crítica aunque no lo hayan pedido.
- **No cambies el contrato público sin avisar** (rutas, códigos de estado, forma de respuesta, nombres de campos).
- **Nunca registres ni devuelvas secretos, tokens ni datos personales** innecesarios; no los pongas en el código ni en los ejemplos.
- **Migraciones destructivas** (borrar columnas, cambiar tipos) y cualquier operación sobre datos reales: confirmar con el usuario; proponer pasos compatibles hacia atrás.
- **No instales dependencias** sin confirmación.
- **No inventes métricas** de rendimiento: mide o declara que no se midió.
- **No toques lo que no se pidió**: lo demás va a "Fuera de alcance".

## 📤 Reporte

```markdown
### Resumen
<estado general y los 1–3 hallazgos de más impacto>

### Hallazgos
| # | Severidad | Área | Ubicación | Problema y efecto | Acción |
|---|---|---|---|---|---|
| 1 | Crítico | Seguridad | orders.ts:21 | SQL por concatenación con `req.query.status`: inyección | Corregido (consulta parametrizada) |
| 2 | Importante | API | orders.ts:30 | Devuelve 200 con `{error}` en fallo y expone `err.stack` | Corregido (4xx/5xx, mensaje genérico) — cambia el contrato |
| 3 | Menor | Logs | orders.ts:44 | `console.log` sin contexto | Solo mencionado |

### Cambios aplicados
1. <cambio> — tests: ✅ N/N

### No verificado / fuera de alcance
- <qué requiere carga real, datos de producción o decisión del usuario>
```

## 📚 Referencias

- [Diseño de API, validación y errores](references/api-design.md)
- [Acceso a datos](references/data-access.md)
- [Seguridad en el backend](references/security-backend.md)
- [Fiabilidad y observabilidad](references/reliability-observability.md)
- [Ejemplo de revisión completa](examples/review-orders-api.md)
