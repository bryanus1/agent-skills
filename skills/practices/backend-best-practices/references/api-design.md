# Diseño de API, validación y errores

## Contenido
1. [Validar en el borde](#validar-en-el-borde)
2. [Códigos de estado](#códigos-de-estado)
3. [Formato de errores](#formato-de-errores)
4. [Paginación y filtros](#paginación-y-filtros)
5. [Idempotencia](#idempotencia)
6. [Versionado y compatibilidad](#versionado-y-compatibilidad)

## Validar en el borde

Toda entrada externa (cuerpo, query, parámetros, cabeceras, mensajes de cola) se valida y se tipa **al entrar**, con el mecanismo del proyecto (Zod, class-validator, JSON Schema). Después, el código interno trabaja con datos ya válidos.

- Rechaza campos desconocidos o ignóralos de forma explícita; nunca copies el cuerpo entero a la entidad (*mass assignment*: un cliente enviaría `role: "admin"`).
- Limita tamaños (cuerpo, longitud de cadenas, número de elementos de arrays).
- Valida el **significado**, no solo el tipo (cantidad > 0, fecha futura, email válido).

## Códigos de estado

| Situación | Código |
|---|---|
| Éxito con cuerpo / creado / sin contenido | 200 / 201 (+ `Location`) / 204 |
| Entrada inválida | 400 (o 422 si el proyecto distingue validación semántica) |
| No autenticado | 401 |
| Autenticado sin permiso | 403 (o 404 si no debes revelar que el recurso existe) |
| No existe | 404 |
| Conflicto (duplicado, versión desfasada) | 409 |
| Demasiadas peticiones | 429 (+ `Retry-After`) |
| Fallo inesperado del servidor | 500 |
| Dependencia externa caída | 502/503/504 |

Un **200 con `{ "error": ... }`** rompe a los clientes y a los monitores; usa el código real. Elige los códigos de forma consistente con lo que el proyecto ya usa.

## Formato de errores

- Una forma uniforme (por ejemplo Problem Details, RFC 9457): `type`/`code`, `message` legible, `details` por campo cuando aplique.
- **Nunca** devuelvas `err.stack`, mensajes del ORM, SQL, rutas del servidor ni versiones. Registra el detalle en el log con un id de correlación y devuelve ese id al cliente.
- Distingue **errores esperados** (validación, no encontrado, conflicto: tipados y mapeados a 4xx) de **inesperados** (500, capturados por un manejador global).
- Un `catch` que se traga el error sin registrarlo es un bug oculto.

## Paginación y filtros

- Todo listado tiene **límite máximo** (`limit` por defecto y tope). Un `SELECT *` sin `LIMIT` sobre una tabla que crece es una caída futura.
- Paginación por **cursor** para datos que cambian o son grandes; por offset solo si son pocos y estables.
- Orden determinista (incluye un desempate por id).
- Filtros y ordenaciones contra una **lista permitida** de columnas (nunca interpolar el nombre recibido).

## Idempotencia

- `GET`, `PUT`, `DELETE` deben ser idempotentes por definición.
- Para `POST` que cobran, envían o crean recursos y que el cliente puede reintentar, acepta una **`Idempotency-Key`** y guarda el resultado asociado a la clave.

## Versionado y compatibilidad

- Cambios **aditivos** (campos nuevos opcionales) son compatibles; renombrar, eliminar o cambiar tipo/semántica no lo son: versiona o migra con un periodo de convivencia.
- Documenta el contrato (OpenAPI) y mantenlo cerca del código.
