# Enrutado de lentes y fusión

## Cómo decidir

`collect-scope.mjs` propone las lentes según rutas y extensiones. Es una heurística: **ajústala leyendo el código**. Un archivo en `utils/` puede ser backend; un `.ts` bajo `components/` puede ser pura lógica sin UI.

| Lente | Se activa cuando | Se omite cuando |
|---|---|---|
| `clean-code` | Hay código fuente cambiado | Solo docs, config o assets |
| `frontend-best-practices` | Componentes, hooks, páginas, estilos, formularios | No hay UI |
| `backend-best-practices` | Endpoints, servicios, consultas, migraciones, workers | No hay servidor ni datos |
| `solid-principles` | Clases o módulos nuevos o muy modificados, dependencias creadas dentro de la lógica, `switch` repetidos | Cambios pequeños en funciones sueltas |
| `design-patterns` | Se introduce un patrón, una variante nueva en un `switch`, una integración externa, o el usuario lo menciona | No hay variación ni integración |
| `tdd-workflow` | Cambia comportamiento (siempre que haya código fuente) | Refactor puro con tests que ya lo cubren |

## Qué mirar en cada lente durante una revisión

Se usan sus propias comprobaciones, aquí solo el orden recomendado para ahorrar esfuerzo:

1. **Backend/frontend (seguridad y datos primero)**: lo crítico condiciona el veredicto.
2. **tdd-workflow**: ¿el cambio tiene tests que fallarían si el comportamiento se rompe? Un test que no puede fallar no cuenta.
3. **solid-principles / design-patterns**: solo sobre código nuevo o modificado; pasan por su filtro de proporcionalidad.
4. **clean-code**: lo último y lo más barato; no debe ahogar los hallazgos importantes.

## Propiedad de los hallazgos (deduplicación)

Cuando varias lentes señalan lo mismo, asigna un único dueño:

| Hallazgo | Dueño | Mencionar también como contexto |
|---|---|---|
| Función enorme que mezcla capas (HTTP + SQL + email) | `solid-principles` (SRP/DIP) | `clean-code` (long-function) |
| `switch` repetido por tipo | `design-patterns` | `solid-principles` (OCP) |
| Dependencia `new` dentro de la lógica que impide testear | `solid-principles` (DIP) | `tdd-workflow` |
| Cambio de comportamiento sin test | `tdd-workflow` | — |
| Inyección, XSS, secretos, autorización ausente | `backend`/`frontend` | — (siempre crítico) |
| Nombres, números mágicos, comentarios obsoletos | `clean-code` | — |
| `useEffect` que copia estado derivado | `frontend` | `clean-code` |
| N+1, falta de transacción, índice ausente | `backend` | — |

## Contradicciones típicas

- **`design-patterns` propone abstraer / `clean-code` pide simplicidad.** Decide con la regla de proporcionalidad: ¿existe ya la segunda variante? Si no, gana la simplicidad; anota el patrón como "aplazado".
- **`solid-principles` quiere una interfaz / el framework ya inyecta.** Gana la convención del framework.
- **`backend` pide validación y capas / `clean-code` pide menos código.** La seguridad y la integridad de datos ganan; no añadas capas que no las aporten.
- **`tdd-workflow` pide tests / el cambio es un script desechable.** Declara el riesgo, no insistas.

## Si falta una skill

Si una skill hermana no está instalada, no la inventes: revisa ese aspecto con criterio general y breve, márcalo en el informe como "sin la skill X" y recomienda instalarla (`npx skills add bryanus1/agent-skills --skill <nombre>`).
