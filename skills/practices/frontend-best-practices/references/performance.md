# Rendimiento

**Mide primero.** Sin una métrica o un perfil, una optimización es una hipótesis. Herramientas: React DevTools Profiler, Lighthouse, WebPageTest, `web-vitals` en producción. Métricas clave: **LCP** (< 2,5 s), **INP** (< 200 ms), **CLS** (< 0,1).

## Carga (lo que suele pesar más)

- **Imágenes**: formato moderno (WebP/AVIF), tamaños responsivos (`srcset`/`sizes` o el componente de imagen del framework), `width`/`height` para evitar saltos de diseño, `loading="lazy"` fuera de pantalla y prioridad solo a la imagen principal (LCP).
- **JavaScript**: dividir por ruta y cargar bajo demanda lo pesado (editores, gráficos, mapas) con `import()`/`lazy`; revisar el bundle (analizador) antes de añadir librerías grandes; importar solo lo que se usa (evita `import _ from 'lodash'`).
- **Fuentes**: `font-display: swap`, subconjunto de caracteres, precarga de la fuente crítica.
- **Datos**: no pedir más de lo que se muestra; paginar; cachear; en SSR, evitar cascadas de peticiones secuenciales (lanzarlas en paralelo).
- **Terceros** (analítica, chats): cargarlos diferidos; cada uno cuesta.

## Renderizado

- **Listas largas** (cientos+): paginación o virtualización (TanStack Virtual, react-window).
- **Renders innecesarios**: primero corrige la causa (estado demasiado alto, valores recreados que se pasan a hijos memoizados, contexto con un valor que cambia siempre). Solo entonces `memo`, `useMemo`, `useCallback`, y comprueba con el Profiler que mejoró.
- **Trabajo costoso** en el hilo principal (ordenar, filtrar miles de elementos, parsear): `useDeferredValue`/`startTransition` para mantener la entrada fluida, o mover a un Web Worker.
- **Inputs con búsqueda**: debounce de las peticiones, no del estado del input.
- **Layout**: evita leer y escribir el DOM alternadamente (layout thrashing); anima `transform`/`opacity`, no `width`/`top`.

## Cuándo no optimizar

Componentes que renderizan en menos de unos milisegundos, pantallas con pocos elementos, código que se ejecuta una vez. La complejidad de memoización mal mantenida suele costar más que lo que ahorra.
