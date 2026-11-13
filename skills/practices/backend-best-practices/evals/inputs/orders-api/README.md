# Fixture: orders-api

Módulo de pedidos con problemas deliberados (inyección SQL, falta de autorización, mass assignment, N+1, errores con 200, sin límite).

- `src/db.ts` simula una base de datos en memoria con una mini interpretación de SQL: con parámetros (`$1`) compara por igualdad exacta; una consulta con el valor interpolado que contenga `' OR '` devuelve todas las filas (simula la inyección).
- Requiere Node con soporte de TypeScript "strip-only": **sin parameter properties ni enums**. Tests: `npm test`.
