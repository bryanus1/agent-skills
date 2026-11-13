---
name: code-quality-review
version: 1.0.0
description: >-
  Revisión de calidad de un cambio (rama, PR o rutas) que orquesta las skills de practices: delimita el alcance, elige las lentes según lo que cambió (clean-code, SOLID, patrones, TDD, frontend, backend) y entrega un único informe priorizado y sin duplicados. Por defecto solo revisa; no modifica.
tags: [code-review, quality, review, orchestrator, best-practices]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - revisa mi código
  - revisión de calidad
  - code quality review
  - review this branch
  - revisa este pr
  - antes de abrir el pr
  - revisión completa del cambio
  - quality review
requirements:
  tools: [run_command, view_file]
  bins: [node, git]
  skills: [clean-code, solid-principles, design-patterns, tdd-workflow, frontend-best-practices, backend-best-practices]
---

# Code Quality Review

## 🎯 Propósito

Dar **una sola revisión coherente** de un cambio, aplicando solo las lentes que corresponden a lo que se tocó y sin repetir el mismo hallazgo desde tres ángulos. Esta skill no añade criterios propios: **decide qué lentes usar, en qué orden, y fusiona sus resultados** en un informe priorizado.

Es de **solo lectura por defecto**. Corrige únicamente si el usuario lo pide, y entonces delega la corrección en la skill dueña del hallazgo (con sus tests y su reporte).

Las lentes son las skills hermanas de `practices`. Si alguna no está instalada, sigue con las demás y dilo en el informe.

## ⚡ Cuándo Activar esta Skill

- "Revisa mi rama / mi PR / estos archivos" o "antes de abrir el PR".
- Se pide una revisión general sin decir qué aspecto (limpieza, diseño, seguridad…).
- Quieres un informe único en lugar de invocar cada skill por separado.

**No la uses** si el usuario pide un aspecto concreto ("¿cumple SOLID?", "¿es seguro este endpoint?"): activa directamente esa skill.

## 📋 Flujo de Trabajo Paso a Paso

### 1. Delimitar el alcance

```bash
node <skill-dir>/scripts/collect-scope.mjs                 # rama actual contra main/master/develop + cambios sin commitear
node <skill-dir>/scripts/collect-scope.mjs --working       # solo lo que aún no está commiteado
node <skill-dir>/scripts/collect-scope.mjs --base origin/main --json
node <skill-dir>/scripts/collect-scope.mjs -- src/orders   # sin git: clasifica las rutas indicadas
```

El script (solo lectura) lista los archivos por área, las líneas cambiadas, las lentes recomendadas y avisos (código sin tests, cambio enorme). Confirma el alcance con lo que pidió el usuario; **no revises archivos fuera de él**. Si el script no detecta cambios (por ejemplo, los archivos están ignorados por git o el directorio no es el repositorio del cambio) pero el usuario indicó archivos o rutas, trabaja con esas rutas tal cual y dilo en el informe. Si el cambio supera ~800 líneas, propón revisarlo por áreas.

### 2. Elegir las lentes

Usa la tabla de [lens-routing](references/lens-routing.md). Resumen:

| Si el cambio… | Lente |
|---|---|
| toca código fuente | `clean-code` (siempre) |
| toca interfaz (componentes, hooks, páginas, estilos) | `frontend-best-practices` |
| toca endpoints, servicios, consultas o migraciones | `backend-best-practices` |
| añade o cambia varias clases/módulos/dependencias | `solid-principles` |
| introduce una variante, integración o patrón (o lo necesita) | `design-patterns` |
| cambia comportamiento | `tdd-workflow` (¿hay tests que lo cubran?) |

No apliques una lente "por completitud": cada una que se añade debe estar justificada por algo del cambio.

### 3. Recoger evidencia objetiva primero

Antes de opinar, ejecuta lo que el proyecto ya tiene (solo lectura sobre el código):

- Tests: usa `node <skill-dir>/../tdd-workflow/scripts/detect-test-runner.mjs` para saber el comando y ejecútalo. Anota el resultado real; si fallan o no se pueden ejecutar, es un hallazgo.
- Typecheck y lint si existen.
- Señales de limpieza: `node <skill-dir>/../clean-code/scripts/detect-smells.mjs <archivos del alcance>`. Son pistas heurísticas, no veredictos.

### 4. Aplicar cada lente sobre el alcance

Para cada lente elegida, sigue **su** SKILL.md (sus tablas de comprobación, severidades y reglas de "cuándo no") pero solo para **diagnosticar**, no para modificar. Lee el código completo de los archivos en el alcance, no solo el diff: muchos defectos están en cómo el cambio interactúa con lo que ya existía.

### 5. Fusionar, deduplicar y priorizar

Sigue [severity-and-report](references/severity-and-report.md):

- **Un hallazgo, un dueño**: si dos lentes ven lo mismo (p. ej. una función enorme es smell y también viola SRP), repórtalo una vez, en la lente cuya acción lo resuelve, y menciona la otra como contexto.
- **Orden global** por severidad, no por lente ni por archivo: todos los Críticos primero (seguridad, pérdida de datos, bloqueo de usuarios), luego todos los Importantes, luego los Menores. Numera después de ordenar.
- **Máximo útil**: si hay más de ~15 hallazgos, muestra los 10 mejores y agrupa el resto por tema.
- **Lo que está bien** se dice en una línea; "sin hallazgos relevantes" es un resultado válido.
- **Contradicciones entre lentes** (p. ej. `design-patterns` sugiere abstraer, `clean-code` pide simplicidad): decide con la regla de proporcionalidad (¿duele hoy? ¿hay segunda variante?) y explica la decisión.

### 6. Reportar y ofrecer siguientes pasos

Entrega el informe de abajo. Cierra con un **plan de correcciones ordenado** (qué skill arreglaría cada grupo) y pregunta qué aplicar. No modifiques nada sin confirmación.

## 🚫 Cuándo NO usar esta skill

- Aspecto único y claro: usa la skill específica.
- Cambios triviales (typo, texto, versión): basta una lectura rápida; di "sin hallazgos".
- Si el usuario quiere implementar, no revisar: usa las skills de arquitectura o `tdd-workflow`.

## ⚠️ Reglas Críticas

- **Solo lectura por defecto**: no edites, no commitees, no hagas push; no ejecutes nada que modifique datos o dependencias.
- **Alcance estricto**: revisa lo que cambió (y lo necesario para entenderlo); lo preexistente va a "Fuera de alcance", salvo que sea crítico para seguridad.
- **Evidencia**: cada hallazgo con `archivo:línea`, efecto concreto y su lente. Nada de "podría mejorarse".
- **Los resultados de tests y linters son los reales**: si no pudiste ejecutarlos, dilo; no los supongas.
- **Sin duplicados ni relleno**: no repitas el hallazgo de otra lente ni listes comprobaciones que pasaron.
- **Seguridad no se silencia**: un hallazgo crítico se reporta aunque la revisión pidiera otro aspecto.
- **Proporcionalidad**: no propongas patrones, capas ni abstracciones que la skill dueña desaconseja (ver sus secciones "Cuándo NO").
- **No instales dependencias** ni cambies configuración sin confirmación.

## 📤 Informe

```markdown
### Veredicto
<Listo para PR | Listo con cambios menores | Requiere cambios> — <1–2 frases>

### Alcance y evidencia
- Alcance: <rama contra main | rutas>, <N archivos, +X −Y>
- Lentes aplicadas: clean-code, backend-best-practices (omitidas: frontend — no hay cambios de UI)
- Tests: ✅ 12/12 (`npm test`) | ❌ 2 fallan | no ejecutados (motivo)
- Typecheck / lint: ✅ | no configurado

### Hallazgos (por prioridad)
| # | Sev. | Lente | Ubicación | Problema y efecto | Corrección sugerida |
|---|---|---|---|---|---|
| 1 | Crítico | backend | src/orders.ts:21 | SQL por interpolación: inyección | Consulta parametrizada |
| 2 | Importante | tdd | src/orders.ts | Cambia el cálculo de impuestos sin test nuevo | Añadir test del caso exento |
| 3 | Menor | clean-code | src/utils.ts:8 | Nombre `data2` poco descriptivo | Renombrar |

### Bien hecho
<una línea>

### Fuera de alcance / no verificado
- <preexistente, necesita navegador, medición o decisión del usuario>

### Plan de correcciones sugerido
1. <hallazgos 1 → backend-best-practices>
2. <hallazgo 2 → tdd-workflow>
¿Aplico alguno?
```

## 📚 Referencias

- [Enrutado de lentes y fusión](references/lens-routing.md)
- [Severidad, deduplicación y formato del informe](references/severity-and-report.md)
- [Ejemplo de revisión completa](examples/review-orders-branch.md)

## 🛠️ Scripts

- `scripts/collect-scope.mjs`: clasifica los archivos cambiados y recomienda lentes (solo lectura; `--help` para opciones).
