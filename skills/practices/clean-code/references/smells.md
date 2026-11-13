# Catálogo de code smells

Cada smell lleva: cómo reconocerlo, por qué importa y el refactor habitual (ver [refactorings](refactorings.md)). La columna **Script** indica si `detect-smells.mjs` lo señala.

## Contenido

1. [Funciones](#funciones)
2. [Nombres](#nombres)
3. [Condicionales y flujo](#condicionales-y-flujo)
4. [Datos](#datos)
5. [Errores](#errores)
6. [Acoplamiento y cambios](#acoplamiento-y-cambios)
7. [Frontend](#frontend)
8. [Tests](#tests)

## Funciones

| Smell | Reconocerlo | Por qué importa | Refactor | Script |
|---|---|---|---|---|
| Función larga | No cabe en una pantalla; tiene "secciones" con comentarios | Obliga a retener demasiado contexto | Extraer función | ✅ `long-function` |
| Demasiados parámetros | > 3, o varios del mismo tipo seguidos (`(string, string, string)`) | Llamadas ilegibles y fáciles de equivocar | Objeto de parámetros, preservar objeto entero | ✅ `too-many-params` |
| Argumento bandera | `fn(data, true)` cambia lo que hace la función | Son dos funciones disfrazadas | Separar en dos funciones u opción con nombre | — |
| Niveles de abstracción mezclados | `sendInvoice()` junto a manipulación de bytes de PDF | Cuesta ver la intención | Extraer función por nivel | — |
| Efecto secundario oculto | Un `get`/`is`/`calculate` que también escribe | El nombre miente; causa bugs al reordenar llamadas | Separar consulta y comando, renombrar | — |
| Código muerto | Funciones, ramas o parámetros sin uso; código comentado | Ruido y falsas pistas | Eliminar | parcial (`todo-comment`) |

## Nombres

| Smell | Reconocerlo | Refactor |
|---|---|---|
| Nombre genérico | `data`, `info`, `item`, `tmp`, `handle`, `manager`, `utils` en un alcance amplio | Renombrar con el concepto de dominio |
| Nombre engañoso | `users` es un `Map`; `isValid` lanza excepciones; `getX` hace I/O | Renombrar o cambiar comportamiento para que coincida |
| Codificación de tipos | `strName`, `IUserInterface`, `arrItems` (salvo convención del proyecto) | Renombrar |
| Inconsistencia | `fetchUser`, `getOrder`, `retrieveInvoice` para la misma operación | Unificar vocabulario |
| Booleano negativo | `isNotDisabled`, `!notFound` | Nombre positivo (`isEnabled`) |

## Condicionales y flujo

| Smell | Reconocerlo | Refactor | Script |
|---|---|---|---|
| Anidamiento profundo | `if` dentro de `for` dentro de `if`… (flecha hacia la derecha) | Guard clauses, extraer función | ✅ `deep-nesting` |
| Condición compleja | `if (a && (b \|\| !c) && d.length > 0)` | Extraer variable o función con nombre | — |
| Ternario anidado | `a ? b : c ? d : e` | `if`/`switch`, tabla de búsqueda | ✅ `nested-ternary` |
| `switch` repetido por tipo | El mismo `switch (kind)` en varios sitios | Polimorfismo o mapa de estrategias (ver skill de patrones) | — |
| Bucle que hace varias cosas | Un `for` que filtra, transforma y acumula a la vez | Pipeline `filter`/`map`/`reduce` o dividir el bucle | — |

## Datos

| Smell | Reconocerlo | Refactor | Script |
|---|---|---|---|
| Número/cadena mágica | `if (status === 3)`, `* 0.21`, `'ADMIN'` repetido | Constante con nombre, enum, unión de literales | ✅ `magic-number` |
| Obsesión por primitivos | Emails, importes y fechas como `string`/`number` sueltos con validación repetida | Value object o tipo con marca (`type Email = string & { __brand }`) | — |
| Grupo de datos | Los mismos 3 campos viajan juntos por varias funciones | Extraer tipo u objeto | — |
| Mutación de argumentos | La función modifica el objeto recibido | Devolver una copia nueva | — |
| Estado global mutable | Variables de módulo modificadas desde varias funciones | Encapsular, inyectar | — |

## Errores

| Smell | Reconocerlo | Refactor |
|---|---|---|
| Error tragado | `catch {}`, `catch (e) { console.log(e) }` y seguir como si nada | Manejar, relanzar con contexto o dejar subir |
| Error genérico | `throw new Error('error')`, `return -1` como fallo | Errores de dominio específicos o tipo `Result` |
| Null ambiguo | `return null` significa "no encontrado", "error" o "no autorizado" según el caso | Distinguir con tipos o errores explícitos |
| Validación dispersa | La misma comprobación en cada capa | Validar en el borde, tipos fuertes dentro |

## Acoplamiento y cambios

| Smell | Reconocerlo | Refactor |
|---|---|---|
| Código duplicado | La misma lógica en 3+ sitios (regla de tres) | Extraer función/módulo |
| Cambio divergente | Un archivo cambia por motivos no relacionados (UI y reglas de precio) | Separar por responsabilidad (ver SOLID/SRP) |
| Cirugía de escopeta | Un cambio pequeño obliga a tocar muchos archivos | Reunir la lógica relacionada |
| Envidia de funcionalidad | Una función usa más datos de otro objeto que del suyo | Mover la función a donde están los datos |
| Cadena de mensajes | `order.customer.address.country.code` | Ocultar delegado, método con intención |
| Archivo largo | Cientos de líneas con varios conceptos | Dividir por concepto | 

## Frontend

| Smell | Reconocerlo | Refactor |
|---|---|---|
| Componente dios | Fetch, estado, validación, formato y layout en un componente de 300 líneas | Extraer hooks, funciones puras y subcomponentes |
| Estado derivado en estado | `useState` + `useEffect` para algo calculable desde props/estado | Calcular en el render (`useMemo` si es costoso) |
| Prop drilling | Props que atraviesan 3+ niveles sin usarse | Composición (`children`), contexto acotado |
| Lógica en JSX | Ternarios y `map` con lógica de negocio dentro del markup | Extraer a variables o funciones antes del `return` |
| Efectos sin limpieza | `useEffect` con suscripciones o timers sin cleanup | Devolver la función de limpieza |

## Tests

| Smell | Reconocerlo | Refactor |
|---|---|---|
| Test que prueba implementación | Verifica llamadas internas o estado privado | Probar comportamiento observable |
| Test con lógica | `if`/`for` dentro del test | Casos separados o tabla de casos (`it.each`) |
| Datos irrelevantes | 30 campos de fixture para probar uno | Builder con valores por defecto |
| Test frágil por tiempo | Depende de `Date.now()` o `setTimeout` reales | Reloj inyectado o fake timers |
