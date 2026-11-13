---
name: solid-principles
version: 1.0.0
description: >-
  Aplica y revisa los principios SOLID (SRP, OCP, LSP, ISP, DIP) a nivel de clase, módulo y componente, en backend y frontend: detecta violaciones, refactoriza con tests y decide cuándo NO aplicarlos. Úsala al diseñar o revisar clases, servicios, hooks o componentes con demasiadas responsabilidades o acoplamiento.
tags: [solid, srp, ocp, lsp, isp, dip, design, refactoring, best-practices]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - solid
  - principios solid
  - single responsibility
  - responsabilidad única
  - open closed
  - inversión de dependencias
  - dependency inversion
  - esta clase hace demasiado
  - este servicio tiene demasiadas responsabilidades
  - refactor to solid
requirements:
  tools: [view_file, replace_file_content, run_command]
---

# SOLID Principles

## 🎯 Propósito

Aplicar SOLID como **herramienta de diagnóstico y de decisión**, no como ritual. Cada principio responde a un dolor concreto (cambios que se propagan, tests imposibles, extensiones que obligan a editar código existente). Si ese dolor no existe, aplicar el principio solo añade capas.

Esta skill opera a nivel de **clase, módulo y componente**. Para legibilidad dentro de una función usa `clean-code`; para elegir un patrón concreto (Strategy, Adapter, Repository…) usa `design-patterns`; para la estructura de carpetas del proyecto, las skills de arquitectura.

## ⚡ Cuándo Activar esta Skill

- El usuario menciona SOLID o uno de sus principios, o pide "aplicar principios de diseño".
- Una clase, servicio, hook o componente "hace demasiado", es difícil de testear o cambia por motivos no relacionados.
- Añadir una variante (otro método de pago, otro proveedor, otro tipo de usuario) obliga a editar un `if`/`switch` en varios sitios.
- Se revisa código nuevo con dependencias creadas dentro de la clase (`new Stripe()`, `fetch` directo en la lógica de negocio).

## 📋 Flujo de Trabajo Paso a Paso

### 1. Delimitar y leer

Identifica el alcance (un archivo, un módulo, un componente). Lee el código y sus tests, y las convenciones del proyecto: cómo inyecta dependencias, si usa contenedor DI (NestJS, Angular, tsyringe) o composición manual, estilo funcional o de clases. **Las convenciones del proyecto ganan**: en React o en código funcional, los principios se expresan con funciones, hooks y composición, no con jerarquías de clases.

### 2. Diagnosticar por señales, no por etiquetas

Recorre la tabla y anota solo lo que encuentres con evidencia concreta (`archivo:línea`).

| Principio | Señal de violación | Pregunta de diagnóstico |
|---|---|---|
| **SRP** | Descripción con "y" (`valida Y guarda Y envía email`); imports de capas distintas (HTTP, SQL, SDK de terceros); el archivo cambia por motivos ajenos entre sí | ¿Cuántas razones (actores o decisiones) tienen para cambiar esta unidad? |
| **OCP** | `switch`/`if` sobre un tipo repetido en varios sitios; añadir una variante obliga a editar código estable | ¿Puedo añadir un caso nuevo sin tocar lo existente? |
| **LSP** | Subclase que lanza `NotImplemented`, que ignora un método o que endurece precondiciones; `instanceof` en el código cliente | ¿Funciona el cliente igual con cualquier implementación? |
| **ISP** | Interfaz o props con muchos miembros de los que cada cliente usa pocos; mocks enormes en tests; métodos que lanzan "no soportado" | ¿Depende cada cliente solo de lo que usa? |
| **DIP** | `new` de infraestructura dentro de la lógica de negocio; el dominio importa del ORM, del SDK o de `process.env` | ¿La regla de negocio puede probarse sin red ni BD? |

Detalles, ejemplos de backend y frontend y refactors por principio: [SRP](references/srp.md), [OCP](references/ocp.md), [LSP](references/lsp.md), [ISP](references/isp.md), [DIP](references/dip.md).

### 3. Decidir si merece la pena (obligatorio)

Para cada violación, antes de tocar nada, responde:

1. **¿Duele hoy?** ¿Cambios que se propagan, bugs repetidos, tests imposibles, conflictos de merge constantes? Si no, y no hay una segunda variante a la vista, **no apliques el principio**; anótalo como observación.
2. **¿Cuántas variantes reales hay?** Una sola implementación no justifica una interfaz. Con dos, considera abstraer; con tres, abstrae (regla de tres).
3. **¿Cuál es la solución más simple?** Muchas veces basta extraer una función o mover un parámetro; una jerarquía de clases es el último recurso.
4. **¿Qué coste añade?** Más archivos, más indirección, más cosas que leer. Debe pagar por sí mismo.

Resume la decisión: **Aplicar**, **Aplazar** (esperar a la segunda variante) o **No aplicar** (con la razón).

### 4. Red de seguridad

Un refactor de diseño cambia la estructura, no el comportamiento. Ejecuta los tests existentes y anota el estado de partida. Si no cubren el código afectado, escribe tests de caracterización antes (si la skill `tdd-workflow` está disponible, sigue su Flujo C). Sin tests, limita el cambio a movimientos mecánicos y avisa del riesgo.

### 5. Refactorizar en pasos pequeños

- Un principio y una violación cada vez; tests entre pasos.
- Empieza por el cambio que más aísla: normalmente **extraer una dependencia detrás de una interfaz pequeña** (DIP + ISP) o **extraer una responsabilidad** (SRP).
- Mantén la API pública (exports, firmas, rutas, props) salvo que el usuario lo pida; si un cambio la rompe, avísalo antes.
- Las interfaces las define **el consumidor** y con lo que necesita, no copiando la API de la implementación.
- La composición se concentra en un punto (la raíz de la aplicación, el módulo de DI, el proveedor de contexto), no se reparte por el código.

### 6. Verificar y reportar

Ejecuta tests, typecheck y lint si el proyecto los tiene. Reporta con el formato de la sección "Reporte" e incluye también las decisiones de **No aplicar** y **Aplazar**: son parte del valor de la revisión.

## 🚫 Cuándo NO aplicar SOLID

- **Una sola implementación sin razón para variar**: `interface PaymentGateway` con una única clase `StripeGateway` y sin segundo proveedor en el horizonte es ruido, salvo que la interfaz sea la costura necesaria para testear.
- **Scripts, prototipos y código de usar y tirar.**
- **Funciones puras pequeñas**: ya cumplen SRP y DIP por construcción.
- **Cuando el framework ya impone la forma** (un controlador de Nest, una página de Next): no luches contra la convención para satisfacer un principio.
- **Para reducir líneas**: SOLID suele aumentar el número de archivos; si el único objetivo es "menos código", usa `clean-code`.

## ⚠️ Reglas Críticas

- **No añadas abstracciones sin una razón concreta** (variación real, costura de test o un dolor demostrable). Cita la razón en el reporte.
- **Refactorizar no cambia el comportamiento.** Sin tests que lo respalden, no lo afirmes; ejecuta los tests antes y después e informa del resultado real.
- **No cambies la API pública sin avisar** y sin confirmación.
- **No fuerces jerarquías de clases en código funcional** (React, hooks, módulos de funciones): usa composición y funciones.
- **No instales dependencias** (contenedores DI, librerías) sin confirmación; la inyección por constructor o por parámetro basta casi siempre.
- **No toques lo que no se pidió**: lo demás va a "Fuera de alcance".
- **Los principios se justifican por su efecto**, no por su nombre. "Esto viola SRP" no es un hallazgo; "este archivo cambia por tres motivos distintos, ver commits X e Y" sí lo es.

## 📤 Reporte

```markdown
### Resumen
<1–2 frases: estado del diseño y las 1–3 violaciones de más impacto>

### Diagnóstico
| Principio | Ubicación | Evidencia | ¿Duele hoy? | Decisión |
|---|---|---|---|---|
| SRP | src/orders/order.service.ts:12-90 | Valida, calcula impuestos, persiste y envía email; cambió por 3 motivos en 3 commits | Sí | Aplicar |
| DIP | src/orders/order.service.ts:8 | `new SmtpMailer()` dentro del servicio; el test envía correos reales | Sí | Aplicar |
| OCP | src/pricing.ts:30 | `switch (tier)` solo en un sitio, 3 casos estables | No | No aplicar |

### Cambios aplicados
1. <refactor> — tests: ✅ N/N

### Aplazado / fuera de alcance
- <qué esperar a que exista una segunda variante, bugs vistos, decisiones para el usuario>
```

## 📚 Referencias

- [SRP: responsabilidad única](references/srp.md)
- [OCP: abierto/cerrado](references/ocp.md)
- [LSP: sustitución de Liskov](references/lsp.md)
- [ISP: segregación de interfaces](references/isp.md)
- [DIP: inversión de dependencias](references/dip.md)
- [Ejemplo completo: servicio de pedidos](examples/order-service.md)
