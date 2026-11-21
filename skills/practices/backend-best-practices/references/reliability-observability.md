# Reliability and Observability

## Reliability

- **Timeouts on everything external** (HTTP, DB, queues). Without a timeout, a slow third party exhausts your connections and takes you down too.
- **Retries** with exponential backoff and jitter, a bounded number of attempts, and **only for idempotent operations** or ones with an idempotency key. A blind retry of a charge doubles the charge.
- **Circuit breaker / degradation**: if a non-essential dependency fails, respond without it instead of going down entirely.
- **Event loop (Node)**: don't block it with CPU work (large hashes, huge JSON, heavy loops); delegate to workers or a queue. Avoid `*Sync` calls on request paths.
- **Graceful shutdown**: on `SIGTERM`, stop accepting requests, finish the ones in flight, close connections and exit.
- **Background tasks** (emails, reports) outside the request cycle, with a queue and retries; if they lose reliability by being "fire and forget" (a `promise` with no `await` or `catch`), report it as a finding.
- **Configuration**: environment variables validated at startup (fail fast if one is missing), with no production values as defaults.
- **Duplicate events and data**: message consumers must tolerate duplicates (idempotency, the outbox pattern to publish reliably; see `design-patterns`).

## Observability

- **Structured logs** (JSON) with level, message, `requestId`/`traceId`, user (id, not personal data) and the necessary context. A `console.log("error")` does not help at 3 a.m.
- **The right level**: `error` for what needs action, `warn` for recoverable anomalies, `info` for relevant business events, `debug` disabled in production.
- **Do not log** secrets, tokens, passwords or full bodies with personal data.
- **Correlation**: generate or propagate an id per request (`X-Request-Id`, traceparent) and return it in error responses.
- **Metrics**: request rate, errors and latency (p50/p95/p99) per endpoint; saturation (DB connections, queue).
- **Health checks**: `/health` (alive) and `/ready` (ready for traffic, checking critical dependencies) without exposing internal details.
- Distributed **traces** (OpenTelemetry) when there are several services.
- Alerts based on user-facing symptoms (errors, latency), not only on CPU.
