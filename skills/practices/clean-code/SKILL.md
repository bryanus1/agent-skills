---
name: clean-code
version: 1.0.0
description: >-
  Clean Code a nivel de función y archivo: nombres, funciones pequeñas, manejo de errores, comentarios y catálogo de code smells → refactor, con detector heurístico. Úsala al limpiar, refactorizar o revisar la legibilidad de código frontend o backend, o al escribir código nuevo que deba quedar mantenible.
tags: [clean-code, refactoring, code-smells, readability, code-review, best-practices]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - clean code
  - código limpio
  - limpia este código
  - refactoriza esta función
  - code smells
  - mejorar legibilidad
  - revisar legibilidad
  - este código es difícil de leer
  - refactor for readability
requirements:
  tools: [view_file, replace_file_content, run_command]
---

# Clean Code

## 🎯 Propósito

Hacer que el código sea fácil de leer, cambiar y probar, a nivel de **función y archivo**: nombres, tamaño y forma de las funciones, manejo de errores, comentarios y duplicación. Ofrece un proceso seguro para refactorizar (comportamiento intacto, pasos pequeños, tests entre pasos) y un detector heurístico que acelera encontrar dónde mirar.

Fuera de alcance: el diseño de clases y módulos (SOLID), la elección de patrones de diseño y la arquitectura de carpetas. Si el problema real está ahí, dilo en el reporte en lugar de forzarlo con refactors locales.

## ⚡ Cuándo Activar esta Skill

- El usuario pide limpiar, refactorizar o "mejorar" código, o dice que es difícil de leer o mantener.
- Se pide una revisión de código centrada en legibilidad y mantenibilidad.
- Se escribe código nuevo y el usuario quiere que siga buenas prácticas.
- Antes de añadir una feature a una función que ya es larga o confusa (preparar el terreno).

## 📋 Flujo de Trabajo Paso a Paso

### 1. Delimitar el alcance y el modo

- **Modo revisión** (solo informe): el usuario pide revisar, opinar o "qué mejorarías". No edites archivos.
- **Modo refactor**: el usuario pide limpiar o refactorizar. Edita, pero solo dentro del alcance pedido (los archivos o funciones nombrados).
- **Modo escritura**: código nuevo. Aplica las reglas de la sección "Reglas de Clean Code" desde el principio.

Lee primero las convenciones del proyecto: linter y formatter (`eslint`, `biome`, `prettier`), `tsconfig` estricto o no, estilo de nombres y de errores existente. **Las convenciones del proyecto ganan a las reglas genéricas** de esta skill.

### 2. Red de seguridad (modo refactor)

Un refactor cambia la estructura sin cambiar el comportamiento, y eso solo se puede afirmar si hay tests.

1. Localiza los tests que cubren el código y ejecútalos. Anota el resultado de partida.
2. Si no hay tests, escribe **tests de caracterización** que fijen el comportamiento actual (entradas representativas, bordes y errores) antes de tocar nada. Si la skill `tdd-workflow` está instalada, sigue su Flujo C.
3. Si escribir tests no es viable, avisa del riesgo y limita el refactor a transformaciones mecánicas seguras (renombrar, extraer variable o función, guard clauses).

### 3. Detectar candidatos

```bash
node <skill-dir>/scripts/detect-smells.mjs <archivos o carpetas>
```

`<skill-dir>` es el directorio que contiene este `SKILL.md`; ejecútalo desde la raíz del proyecto. Señala funciones largas, anidamiento profundo, demasiados parámetros, archivos largos, números mágicos, ternarios anidados y TODO/FIXME (`--json` para salida estructurada; umbrales configurables con `--max-lines`, `--max-depth`, `--max-params`, `--max-file-lines`). Solo analiza JS/TS; en otros lenguajes, revisa a mano con el mismo catálogo.

El script da **señales, no veredictos**. Después lee el código y busca los smells que ninguna métrica detecta: nombres engañosos, abstracciones mezcladas, efectos ocultos, errores silenciados. Usa el [catálogo de smells](references/smells.md).

### 4. Priorizar

Ordena los hallazgos por impacto, no por cantidad:

1. **Riesgo de corrección**: errores tragados, estados mutables compartidos, efectos secundarios ocultos, `null` sin comprobar.
2. **Comprensión**: nombres engañosos, funciones que hacen varias cosas, condicionales complejos, niveles de abstracción mezclados.
3. **Duplicación con riesgo de divergencia**: la misma regla de negocio copiada en varios sitios.
4. **Cosmética**: lo que el formatter o el linter ya resuelven. No lo reportes como hallazgo si hay herramienta para ello; sugiere ejecutarla.

### 5. Refactorizar en pasos pequeños (modo refactor)

- Aplica **una transformación cada vez** del [catálogo de refactorings](references/refactorings.md) y ejecuta los tests tras cada una (o tras cada grupo pequeño y mecánico).
- No mezcles refactor con cambios de comportamiento. Si encuentras un bug, **no lo corrijas en silencio**: repórtalo y pregunta, o corrígelo en un paso separado y declarado, con su test.
- Mantén la API pública (nombres exportados, firmas, rutas) salvo que el usuario lo pida. Si un cambio la afecta, avísalo antes.
- Para cuando el código sea claro. No extraigas abstracciones "por si acaso".

### 6. Reportar

Usa el formato de la sección "Reporte". En modo revisión, cada hallazgo lleva su ubicación `archivo:línea`, el smell, por qué importa en *este* código y el refactor concreto sugerido (con un fragmento antes/después solo cuando aporte).

## 📏 Reglas de Clean Code

**Nombres**
- Revelan intención y dominio: `overdueInvoices`, no `list2` ni `data`. Booleanos como pregunta: `isExpired`, `hasAccess`, `canRetry`.
- Funciones con verbo (`calculateTotal`, `sendInvoice`), clases y tipos con sustantivo. Un concepto, una palabra en todo el código (no mezclar `fetch`, `get` y `retrieve` para lo mismo).
- La longitud del nombre crece con el alcance: `i` vale en un bucle de tres líneas; un export necesita un nombre completo.

**Funciones**
- Hacen una sola cosa en un solo nivel de abstracción. Si puedes extraer un trozo con un nombre que no sea una paráfrasis del código, la función hacía más de una cosa.
- Pocas líneas y poco anidamiento: usa **guard clauses** y returns tempranos en lugar de `if` anidados.
- Pocos parámetros (≤ 3). Más allá, agrupa en un objeto con nombre (`{ from, to, currency }`). Evita los parámetros booleanos que cambian el comportamiento (`render(true)`): separa en dos funciones o usa una opción con nombre.
- Separa comandos de consultas: una función que devuelve un valor no debería además modificar estado de forma inesperada.
- Sin efectos secundarios ocultos: si `getUser()` también escribe en caché o en analytics, el nombre miente.

**Errores**
- No tragues errores (`catch {}` o `catch (e) { console.log(e) }` y seguir). Manéjalos, añade contexto y relanza, o deja que suban.
- Falla pronto con errores específicos del dominio (`InvoiceAlreadyPaidError`) en lugar de `Error('error')` o códigos mágicos de retorno.
- Valida la entrada en los bordes (controladores, formularios, adaptadores) y confía en los tipos dentro del núcleo.
- No uses `null`/`undefined` como señal de error ambigua; usa una excepción, un tipo `Result` o un valor opcional explícito según la convención del proyecto.

**Comentarios**
- El código explica el *qué*; el comentario, el *porqué* (una decisión, una restricción externa, un workaround con enlace al issue).
- Borra el código comentado (git lo recuerda) y los comentarios que repiten el código.
- Un comentario que explica un bloque suele pedir extraer ese bloque a una función con ese nombre.

**Datos y expresiones**
- Sustituye números y cadenas mágicas por constantes con nombre o enums (`FREE_SHIPPING_THRESHOLD`).
- Prefiere inmutabilidad: `const`, copias (`map`, `filter`, spread) en lugar de mutar argumentos.
- Ternarios solo simples; si se anidan, usa `if`/`switch`, un mapa de búsqueda o una función.
- Condiciones complejas → variable o función con nombre (`const isEligibleForRefund = ...`).
- Duplicación: aplica la **regla de tres**. Dos copias pueden ser coincidencia; a la tercera, extrae. Duplicar es más barato que una abstracción equivocada.

**Frontend (componentes)**
- Un componente con demasiadas responsabilidades (fetch + estado + formato + layout) se divide: lógica en hooks o funciones puras, presentación en componentes pequeños.
- No derives en estado lo que puedes calcular en el render; evita `useEffect` para sincronizar estado derivado.
- Props con nombres de dominio y sin "prop drilling" profundo de muchas props sueltas.

**Backend (servicios y handlers)**
- Los controladores/handlers traducen HTTP ↔ dominio: validan, llaman a un caso de uso y mapean la respuesta. La lógica de negocio no vive en ellos.
- No mezcles en una misma función consultas SQL, reglas de negocio y formateo de respuesta.
- Los logs llevan contexto estructurado (`{ orderId, userId }`), nunca datos sensibles.

## ⚠️ Reglas Críticas

- **Refactorizar no cambia el comportamiento.** Sin tests que lo respalden, no afirmes que el comportamiento se conserva.
- **Ejecuta los tests antes y después** de refactorizar, e informa del resultado real. Si fallaban antes, dilo.
- **No corrijas bugs en silencio** dentro de un refactor: repórtalos aparte.
- **No toques lo que no se pidió.** Fuera del alcance, como mucho una nota en "Fuera de alcance".
- **No sobre-abstraigas**: nada de interfaces, factorías o capas nuevas para un único uso. La sencillez también es clean code.
- **No cambies la API pública** (exports, firmas, contratos HTTP) sin avisar y obtener confirmación.
- **Las métricas del script son heurísticas.** Una función de 45 líneas que es una tabla de configuración clara no es un problema.

## 📤 Reporte

```markdown
### Resumen
<1–2 frases: estado general y los 2–3 problemas de más impacto>

### Hallazgos
| Prioridad | Ubicación | Smell | Por qué importa aquí | Refactor |
|---|---|---|---|---|
| Alta | src/orders/report.ts:42 | Error tragado | Un fallo de red devuelve un informe vacío como si fuera válido | Relanzar con contexto o devolver Result |
| Media | src/orders/report.ts:12 | Función larga (88 líneas) | Mezcla consulta, cálculo y formato | Extraer `loadOrders`, `summarize`, `formatRow` |

### Cambios aplicados (modo refactor)
1. <transformación> — tests: ✅ N/N

### Fuera de alcance / pendiente
- <bugs encontrados, problemas de diseño de módulo, decisiones para el usuario>
```

## 📚 Referencias

- [Catálogo de code smells](references/smells.md)
- [Catálogo de refactorings](references/refactorings.md)
- [Ejemplos antes/después en frontend y backend](examples/before-after.md)

## 🛠️ Scripts

- `scripts/detect-smells.mjs`: detector heurístico para JS/TS, de solo lectura. Reglas: `long-function`, `deep-nesting`, `too-many-params`, `long-file`, `magic-number`, `nested-ternary`, `todo-comment`. Opciones: `--json`, `--max-lines`, `--max-depth`, `--max-params`, `--max-file-lines`, `--fail-on-findings`, `--help`.
