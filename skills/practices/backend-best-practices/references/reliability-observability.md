# Fiabilidad y observabilidad

## Fiabilidad

- **Timeouts en todo lo externo** (HTTP, BD, colas). Sin timeout, un tercero lento agota tus conexiones y te tumba a ti.
- **Reintentos** con espera exponencial y jitter, límite de intentos y **solo para operaciones idempotentes** o con clave de idempotencia. Un reintento ciego de un cobro duplica el cargo.
- **Disyuntor / degradación**: si una dependencia no esencial falla, responde sin ella en lugar de caer entero.
- **Bucle de eventos (Node)**: no bloquear con trabajo CPU (hash grande, JSON enorme, bucles pesados); delega a workers o a una cola. Evita `*Sync` en rutas de petición.
- **Cierre ordenado**: al recibir `SIGTERM`, deja de aceptar peticiones, termina las en curso, cierra conexiones y sal.
- **Tareas en segundo plano** (correos, informes) fuera del ciclo de la petición, con cola y reintentos; si pierden fiabilidad por ser "fire and forget" (`promise` sin `await` ni `catch`), regístralo como hallazgo.
- **Configuración**: variables de entorno validadas al arrancar (falla rápido si falta una), sin valores de producción por defecto.
- **Eventos y datos duplicados**: los consumidores de mensajes deben tolerar duplicados (idempotencia, patrón outbox para publicar de forma fiable; ver `design-patterns`).

## Observabilidad

- **Logs estructurados** (JSON) con nivel, mensaje, `requestId`/`traceId`, usuario (id, no datos personales) y el contexto necesario. Un `console.log("error")` no ayuda a las 3 de la mañana.
- **Nivel adecuado**: `error` para lo que requiere acción, `warn` para lo anómalo recuperable, `info` para eventos de negocio relevantes, `debug` desactivado en producción.
- **No registres** secretos, tokens, contraseñas ni cuerpos completos con datos personales.
- **Correlación**: genera o propaga un id por petición (`X-Request-Id`, traceparent) y devuélvelo en las respuestas de error.
- **Métricas**: tasa de peticiones, errores y latencia (p50/p95/p99) por endpoint; saturación (conexiones de BD, cola).
- **Health checks**: `/health` (vivo) y `/ready` (listo para tráfico, con comprobación de dependencias críticas) sin exponer detalles internos.
- **Trazas** distribuidas (OpenTelemetry) cuando hay varios servicios.
- Alertas basadas en síntomas del usuario (errores, latencia), no solo en la CPU.
