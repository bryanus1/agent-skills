---
name: design-patterns
version: 1.0.0
description: >-
  Elige y aplica patrones de diseño (GoF y modernos: Strategy, Adapter, Factory, Repository, Result, Compound Components, hooks) a partir del problema, no del catálogo, y decide cuándo NO usar ninguno. Úsala al pedir un patrón, al ver ifs/switch repetidos, SDKs acoplados o lógica de UI duplicada, en frontend o backend.
tags: [design-patterns, gof, strategy, adapter, factory, repository, refactoring, best-practices]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - patrón de diseño
  - patrones de diseño
  - design pattern
  - qué patrón uso
  - aplica el patrón strategy
  - patrón repository
  - patrón adapter
  - factory pattern
  - strategy pattern
  - observer pattern
requirements:
  tools: [view_file, replace_file_content, run_command]
---

# Design Patterns

## 🎯 Propósito

Un patrón es una **solución con nombre a un problema recurrente**, y su valor es el vocabulario compartido y el equilibrio de fuerzas ya estudiado. Esta skill parte del problema (qué dolor hay, qué variación existe) y llega al patrón, no al revés. Aplicar un patrón sin el problema es el error más común: produce capas sin beneficio.

Complementa a `solid-principles` (por qué separar y qué depende de qué) y a `clean-code` (legibilidad dentro de las funciones). Para la estructura de carpetas, usa las skills de arquitectura del catálogo.

## ⚡ Cuándo Activar esta Skill

- El usuario pide un patrón por nombre ("aplica Strategy", "usa el patrón Repository") o pregunta "qué patrón uso para…".
- Hay `if`/`switch` sobre un tipo repetidos, SDKs de terceros acoplados a la lógica, objetos con construcción compleja, eventos que muchos módulos necesitan escuchar, o lógica de UI duplicada entre componentes.
- Se revisa un diseño y se quiere saber si un patrón ayudaría (o si sobra el que ya hay).

No la actives para legibilidad local (nombres, funciones largas): usa `clean-code`.

## 📋 Flujo de Trabajo Paso a Paso

### 1. Formular el problema, no la solución

Antes de nombrar ningún patrón, responde por escrito:

1. **¿Qué duele hoy?** (cambio que se propaga, test imposible, duplicación, acoplamiento a un proveedor, construcción repetida).
2. **¿Qué varía y qué es estable?** El patrón aísla lo que varía de lo que no.
3. **¿Cuántas variantes reales existen?** (una, dos, tres o más; ya conocidas o hipotéticas).
4. **¿Qué convenciones tiene el proyecto?** (clases o funciones, contenedor DI, librerías de estado y de datos, framework).

Si el usuario pidió un patrón concreto, comprueba igualmente que encaja con el problema; si no encaja, dilo y propón la alternativa.

### 2. Elegir con la tabla problema → patrón

| Problema | Candidato | Alternativa más simple a considerar primero |
|---|---|---|
| Varias formas de hacer lo mismo, elegidas en tiempo de ejecución (tarifas, exportadores, validadores) | **Strategy** | Tabla `Record<Tipo, función>` |
| Integrar una API/SDK de terceros sin acoplarse a él | **Adapter** (puerto + adaptador) | Función envoltorio |
| Crear objetos cuyo tipo depende de datos o configuración | **Factory** / Factory Method | Función `create(...)` con `switch` |
| Construcción con muchos parámetros opcionales | **Builder** | Objeto de opciones con valores por defecto |
| Añadir comportamiento transversal sin tocar el original (caché, logs, reintentos, auth) | **Decorator** / middleware | Función de orden superior |
| Ocultar un subsistema complejo tras una API simple | **Facade** | Un módulo con una función pública |
| Notificar a varios interesados de un cambio, sin acoplarlos | **Observer** / eventos | Callback directo si hay un único interesado |
| Un proceso con pasos fijos y detalles variables | **Template Method** | Función que recibe los pasos variables como parámetros |
| Cambiar de comportamiento según el estado, con transiciones explícitas | **State** / máquina de estados | `switch` sobre un enum si son pocos estados |
| Encapsular una acción para deshacer, encolar o registrar | **Command** | Función + datos |
| Aislar el acceso a datos de la lógica de negocio | **Repository** | Función de acceso a datos con interfaz |
| Devolver éxito/fallo sin excepciones en flujos esperados | **Result / Either** | Excepciones de dominio tipadas |
| Instancia compartida por toda la app | Módulo/instancia compuesta en la raíz | **Evita Singleton clásico** (estado global, tests difíciles) |
| UI con piezas relacionadas que comparten estado (tabs, accordion, select) | **Compound Components** | Props + `children` |
| Reutilizar lógica con estado entre componentes | **Custom Hook** | Función pura |
| Separar presentación de acceso a datos en UI | **Container/Presentational** o hook + componente | — |

Detalle, forma y ejemplos en TypeScript: [Creacionales](references/creational.md), [Estructurales](references/structural.md), [Comportamiento](references/behavioral.md), [Frontend y backend](references/frontend-backend.md).

### 3. Contrastar con la alternativa más simple (obligatorio)

Para el candidato elegido, responde:

- ¿Una **función** o una **tabla de datos** resuelve el problema con menos piezas? En TypeScript/JavaScript muchos patrones GoF son *funciones de orden superior* o *objetos literales*; una jerarquía de clases suele sobrar.
- ¿Hay **al menos dos variantes reales** o una costura de test necesaria? Con una sola, **aplaza**.
- ¿El patrón **encaja con las convenciones** del proyecto? (No metas clases en un código funcional, ni un contenedor DI donde no lo hay.)
- ¿Cuánto añade? (archivos, indirección, curva de lectura). Debe pagar por sí mismo.

Resultado: **Aplicar**, **Aplazar** (esperar a la segunda variante) o **No aplicar** (alternativa simple). Anótalo con la razón.

### 4. Red de seguridad

Si el patrón se introduce en código existente, es un refactor: ejecuta los tests antes y después. Si no cubren el código afectado, añade tests de caracterización primero (si `tdd-workflow` está disponible, sigue su Flujo C). Si construyes algo nuevo, escribe el test del comportamiento primero.

### 5. Implementar de forma mínima

- **Nombra el patrón en el código** solo cuando ayude (`ShippingStrategy`, `StripeAdapter`, `OrderRepository`); es vocabulario compartido. No lo fuerces en el nombre si la convención del proyecto es otra.
- Define la interfaz **desde el consumidor** y con lo mínimo que necesita (ver ISP en `solid-principles`).
- Concentra la composición (qué implementación se usa) en un único punto, no repartida.
- Mantén la API pública salvo petición expresa, y avisa de cualquier cambio de comportamiento.

### 6. Verificar y reportar

Ejecuta tests, typecheck y lint si existen. Usa el formato de la sección "Reporte"; incluye las decisiones de **No aplicar** y **Aplazar**.

## 🚫 Cuándo NO usar un patrón

- **Una sola implementación y sin segunda a la vista**: la interfaz, la factoría o la estrategia son ruido.
- **Un `switch` pequeño, estable y en un único sitio**: es más legible que N clases.
- **Para parecer "profesional"** o porque "el proyecto debería tener patrones": cada pieza debe justificar su coste.
- **Singleton, Service Locator y estado global**: casi siempre hay una alternativa por inyección o composición.
- **Cuando el framework ya lo resuelve** (middleware de Express/Nest como Decorator/Chain, hooks como Strategy/Observer, ORM como Repository/Unit of Work): usa el mecanismo nativo.
- **Combinaciones decorativas**: apilar Factory + Strategy + Builder para dos casos es sobreingeniería, no diseño.

## ⚠️ Reglas Críticas

- **Parte del problema**, no del patrón. Cita el dolor concreto en el reporte; sin dolor ni variación real, no hay patrón.
- **Pregunta por la alternativa simple antes de añadir clases.** Una función o una tabla vence a una jerarquía casi siempre en TS/JS.
- **No cambies la API pública ni el comportamiento sin avisar.** Un refactor a patrón mantiene el comportamiento; ejecuta los tests antes y después e informa del resultado real.
- **No instales dependencias** (contenedores DI, librerías de eventos, `neverthrow`, `xstate`…) sin confirmación del usuario.
- **Respeta las convenciones del proyecto**: estilo funcional vs clases, contenedor DI existente, librería de estado o de datos ya elegida.
- **No toques lo que no se pidió**: lo demás va a "Aplazado / fuera de alcance".

## 📤 Reporte

```markdown
### Problema
<qué duele, qué varía, cuántas variantes reales>

### Decisión
| Candidato | Alternativa simple | Veredicto | Razón |
|---|---|---|---|
| Strategy | Tabla Record<Carrier, fn> | Aplicar tabla, no clases | 3 variantes sin estado; encaja con el estilo funcional del proyecto |
| Factory | — | No aplicar | Solo un punto de creación |

### Cambios aplicados
1. <cambio> — tests: ✅ N/N

### Aplazado / fuera de alcance
- <qué reevaluar con una segunda variante, riesgos, decisiones para el usuario>
```

## 📚 Referencias

- [Patrones creacionales](references/creational.md): Factory, Builder, evitar Singleton
- [Patrones estructurales](references/structural.md): Adapter, Decorator, Facade
- [Patrones de comportamiento](references/behavioral.md): Strategy, Observer, State, Command, Template Method
- [Frontend y backend](references/frontend-backend.md): Repository, Result, Compound Components, hooks, middleware
- [Ejemplo: de switch repetido a estrategias](examples/strategy-vs-table.md)
