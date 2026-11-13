---
name: tdd-workflow
version: 1.0.0
description: >-
  Desarrollo guiado por tests (TDD): ciclo Red → Green → Refactor con lista de tests, triangulación y test doubles, para frontend y backend. Úsala al implementar una feature o corregir un bug "con TDD", "test first" o "escribiendo los tests primero", o al reproducir un bug con un test que falle antes de arreglarlo.
tags: [tdd, testing, unit-tests, red-green-refactor, vitest, jest, best-practices]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - tdd
  - test driven development
  - desarrollo guiado por tests
  - test first
  - escribe los tests primero
  - red green refactor
  - reproducir bug con un test
  - test que falle primero
  - implementa con tdd
requirements:
  tools: [view_file, replace_file_content, run_command]
---

# TDD Workflow (Red → Green → Refactor)

## 🎯 Propósito

Guiar la implementación con tests escritos **antes** que el código de producción, en ciclos cortos y verificables. Cada ciclo deja evidencia: un test que falló por la razón correcta, el cambio mínimo que lo hizo pasar y un refactor con la suite en verde.

El objetivo no es "tener tests". Es diseñar con feedback rápido: un test difícil de escribir es una señal de diseño (demasiadas dependencias, responsabilidades mezcladas, efectos ocultos). Escúchala antes de forzar el test con mocks.

## ⚡ Cuándo Activar esta Skill

- El usuario pide implementar algo "con TDD", "test first", "escribiendo los tests primero" o "red-green-refactor".
- Hay que corregir un bug: primero se reproduce con un test que falla.
- Hay que cambiar código sin tests: primero se fijan tests de caracterización (ver Flujo C).
- El usuario pide practicar una kata o enseñar TDD paso a paso.

No la actives para "añade tests a este código" sin intención de cambiarlo: eso es escribir tests, no TDD (puedes usar sus reglas de diseño de tests, pero sin el ciclo).

## 📋 Flujo de Trabajo Paso a Paso

### Paso 0 — Detectar el entorno de tests

```bash
node <skill-dir>/scripts/detect-test-runner.mjs
```

`<skill-dir>` es el directorio que contiene este `SKILL.md`. Ejecútalo desde la raíz del proyecto (o del paquete, en un monorepo). Devuelve el runner, el comando para correr un solo archivo y la convención de nombres y ubicación de los tests existentes (`--json` para salida estructurada).

- **Sigue la convención detectada** (sufijo `.spec.ts` o `.test.ts`, carpeta `test/` o colocado junto al código). No inventes una nueva.
- Si no hay runner, propón uno (Vitest para TS/JS moderno, Jest si el proyecto ya usa su ecosistema, `node:test` si no quieres dependencias) y **pide confirmación antes de instalar nada**.
- Ejecuta la suite una vez antes de empezar. Si ya hay tests rojos, repórtalo: no puedes distinguir tus fallos de los heredados.

### Paso 1 — Escribir la lista de tests

Antes de tocar código, escribe la lista de comportamientos a cubrir, del más simple al más complejo. Inclúyela en tu respuesta o como comentario temporal en el archivo de test.

```text
[ ] carrito vacío → envío 0
[ ] pedido < 50 € → tarifa base 4,99
[ ] pedido ≥ 50 € → envío gratis
[ ] zona remota → recargo de 10 € incluso con envío gratis
[ ] peso negativo → lanza ValidationError
```

- Un ítem = un comportamiento observable desde la API pública, no un método interno.
- Incluye bordes (vacío, cero, límite exacto, null, errores) y no solo el camino feliz.
- La lista está viva: cuando descubras un caso nuevo, añádelo; no lo resuelvas a la vez que otro.

### Paso 2 — 🔴 Red: un test que falla por la razón correcta

1. Elige el ítem **más simple** que aún no esté hecho.
2. Escribe un solo test con estructura Arrange / Act / Assert y un nombre que describa el comportamiento (`devuelve envío gratis cuando el subtotal llega a 50`).
3. Si el símbolo no existe, crea el stub mínimo (firma vacía, `throw new Error('not implemented')`) para que el test **compile y falle en la aserción**, no en un import roto.
4. Ejecuta **solo ese archivo** con el comando de archivo detectado.
5. Lee el fallo. Debe decir exactamente lo que esperas ("expected 0, received undefined"). Si falla por otra razón, arregla el test antes de seguir. Si pasa sin cambios, el test no aporta nada o el comportamiento ya existía: dilo y pasa al siguiente.

### Paso 3 — 🟢 Green: el cambio mínimo

Haz pasar el test con el menor cambio posible, eligiendo una de estas tres estrategias:

| Estrategia | Cuándo usarla |
|---|---|
| **Fake it** (devolver una constante) | No ves aún la generalización. El siguiente test la forzará. |
| **Triangulación** | Con un segundo ejemplo distinto, generaliza solo lo que ambos tests exigen. |
| **Implementación obvia** | La solución es evidente y corta. Escríbela, pero si el test falla, vuelve a pasos más pequeños. |

Ejecuta el archivo de test: todo en verde. No añadas lógica que ningún test exija ("ya que estoy…"): apúntalo en la lista.

### Paso 4 — 🔵 Refactor con la suite en verde

- Elimina duplicación (entre código y test también: las constantes mágicas del Green suelen esconderla), mejora nombres, extrae funciones.
- Refactoriza también los tests: helpers de construcción (`buildOrder({ subtotal: 49 })`), nada de lógica condicional dentro de un test.
- Tras cada refactor, ejecuta los tests. Si algo se pone rojo, deshaz el último paso en lugar de depurar.
- Nunca cambies comportamiento en esta fase: si hace falta, es un nuevo ítem de la lista.

### Paso 5 — Repetir y cerrar

1. Tacha el ítem y vuelve al Paso 2 hasta vaciar la lista.
2. Ejecuta la **suite completa** (no solo tu archivo), y el typecheck/lint si el proyecto los tiene.
3. Reporta con el formato de la sección "Reporte final".

### Flujo B — Corregir un bug

1. Escribe un test que reproduzca el bug con los datos del reporte. Ejecútalo y **confirma que falla** mostrando la salida.
2. Si no logras reproducirlo, no "arregles" a ciegas: reporta qué probaste y pide más datos.
3. Aplica la corrección mínima, ejecuta el test (verde) y luego la suite completa.
4. Busca casos hermanos del mismo bug (otros formatos, límites) y añádelos a la lista.

### Flujo C — Cambiar código sin tests (legacy)

1. Escribe **tests de caracterización**: fijan lo que el código hace hoy, aunque parezca incorrecto. Nombra los sospechosos como tales (`conserva el comportamiento actual: redondea hacia abajo`).
2. Si el código no es testeable (dependencias duras de BD, reloj, red), introduce una costura mínima (parámetro con valor por defecto, inyección por constructor) sin cambiar comportamiento.
3. Con la red de seguridad en verde, aplica el ciclo normal para el cambio pedido.

## 🧪 Diseño de buenos tests

- **Prueba comportamiento, no implementación.** Usa la API pública; no verifiques métodos privados ni el orden de llamadas internas. Un refactor no debería romper tests.
- **Un motivo para fallar por test.** Varias aserciones están bien si describen el mismo comportamiento.
- **Deterministas.** Controla tiempo, aleatoriedad, zona horaria y red. Inyecta un reloj (`now: () => Date`) en lugar de mockear `Date` global cuando el diseño lo permita.
- **Test doubles solo en los bordes** (I/O, red, BD, reloj, servicios externos). Prefiere *fakes* en memoria a mocks con expectativas. No mockees lo que no te pertenece: envuelve la librería en un adaptador y mockea el adaptador. Detalles en [Test doubles](references/test-doubles.md).
- **Nivel adecuado:** lógica de dominio → unitario; contrato con BD/HTTP → integración; flujo crítico de usuario → e2e (pocos). Guía por stack: [Frontend](references/frontend-testing.md) y [Backend](references/backend-testing.md).
- **Datos explícitos y mínimos** en el test: solo lo relevante para el comportamiento, el resto con builders o valores por defecto.

## ⚠️ Reglas Críticas

- **Nada de código de producción sin un test rojo que lo pida** mientras trabajes en modo TDD. Si escribes algo sin test (configuración, wiring), dilo explícitamente.
- **Ejecuta el test y mira el rojo de verdad.** Un test que nunca viste fallar no demuestra nada. No afirmes "falla" o "pasa" sin haber ejecutado el comando.
- **No modifiques un test para que pase** salvo que el test estuviera mal; si lo cambias, explica por qué en el reporte.
- **No borres, saltes (`.skip`, `xit`) ni debilites aserciones** para dejar la suite en verde.
- **Pasos pequeños.** Si llevas más de unos minutos en rojo, el paso era demasiado grande: deshaz y divídelo.
- **No instales dependencias ni cambies la configuración de tests sin confirmación del usuario.**
- **Reporta con honestidad**: si la suite tenía fallos previos o no pudiste ejecutar los tests, dilo con la salida real.

## 📤 Reporte final

```markdown
### Ciclos TDD
| # | Test (comportamiento) | Rojo (motivo del fallo) | Verde (estrategia) | Refactor |
|---|---|---|---|---|
| 1 | carrito vacío → envío 0 | expected 0, received undefined | fake it | — |
| 2 | subtotal ≥ 50 → gratis | expected 0, received 4.99 | triangulación | extraer FREE_SHIPPING_THRESHOLD |

### Resultado
- Suite completa: `<comando>` → N tests, todos en verde.
- Pendiente / fuera de alcance: …
```

## 📚 Referencias

- [Test doubles: dummy, stub, spy, mock y fake](references/test-doubles.md)
- [Testing en frontend (componentes, hooks, e2e)](references/frontend-testing.md)
- [Testing en backend (servicios, HTTP, base de datos)](references/backend-testing.md)
- [Ejemplo completo de una sesión TDD](examples/tdd-session.md)

## 🛠️ Scripts

- `scripts/detect-test-runner.mjs`: detecta vitest, jest, mocha, `node:test`, playwright, cypress, pytest, `go test` y `cargo test`, el gestor de paquetes y la convención de tests. Solo lectura. Opciones: `--cwd <dir>`, `--json`, `--help`.
