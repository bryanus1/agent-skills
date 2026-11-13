# Severidad, deduplicación y formato del informe

## Escala común

| Severidad | Criterio | Efecto en el veredicto |
|---|---|---|
| **Crítico** | Vulnerabilidad explotable, pérdida o corrupción de datos, tests rotos que ocultan una regresión, bloqueo de usuarios (teclado/lector), secretos expuestos | **Requiere cambios** |
| **Importante** | Bug probable, comportamiento nuevo sin tests, N+1 o ausencia de transacción en ruta caliente, accesibilidad parcial, violación de diseño que ya duele | Requiere cambios o **Listo con cambios menores** si es acotado y reversible |
| **Menor** | Legibilidad, nombres, consistencia, micro-optimizaciones | No bloquea |

Si una lente usa otra escala, tradúcela a esta. Si dudas entre dos niveles, elige el menor y explica la duda; no infles severidades para que el informe parezca más útil.

## Veredicto

- **Listo para PR**: sin Críticos ni Importantes; tests pasan.
- **Listo con cambios menores**: solo Menores, o Importantes acotados.
- **Requiere cambios**: al menos un Crítico, tests fallando o varios Importantes.

Sin tests ejecutados, el veredicto no puede ser "Listo para PR": di que no se pudo verificar.

## Reglas de formato

- Una fila por hallazgo, con `archivo:línea`, efecto concreto y corrección sugerida breve.
- Ordenados por severidad y, dentro de ella, por impacto.
- Hasta ~15 hallazgos se listan; con más, los 10 principales y el resto agrupado ("7 hallazgos menores de nombres en `src/utils/`").
- **Bien hecho**: una línea, solo si aporta (un buen test, una decisión acertada).
- **Fuera de alcance**: lo preexistente, lo que requiere medir o decidir.
- Nunca incluyas secretos ni datos personales encontrados durante la revisión: describe dónde están y recomienda rotarlos.

## Plan de correcciones

Agrupa los hallazgos por la skill que los arregla, en este orden de aplicación:

1. Críticos (cada uno con su skill dueña y un test que lo reproduzca).
2. Tests faltantes (`tdd-workflow`), antes de refactorizar.
3. Diseño (`solid-principles`, `design-patterns`) con la red de tests ya presente.
4. Limpieza (`clean-code`).

Termina preguntando qué aplicar. Si el usuario acepta, delega en la skill correspondiente y sigue **su** flujo y reporte.
