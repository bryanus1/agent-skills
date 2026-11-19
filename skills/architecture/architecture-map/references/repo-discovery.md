# Checklist de Descubrimiento del Repo (`architecture-map`)

Explora el repositorio de arriba hacia abajo en **solo lectura**, priorizando manifiestos, entrypoints y esquemas antes que archivos individuales de detalle.

---

## 🚫 Exclusiones Obligatorias

No leas ni copies contenido de:
- Secretos y entorno real: `.env`, `.env.local`, `.env.*.local`, `.env.production`, `*.pem`, `*.key`, `credentials*`, `secrets*`.
- Dependencias y artefactos generados: `node_modules/`, `.venv/`, `vendor/`, `target/`, `dist/`, `build/`, `.next/`, `.astro/`, `.expo/`, `.turbo/`.
- Lockfiles completos (`pnpm-lock.yaml`, `package-lock.json`, `Cargo.lock`) o binarios.

---

## 🔎 Exploración en 7 Capas

### 1. Topología y Manifiestos
- Árbol superficial (`ls` / `find` con profundidad máxima 2–3 excluyendo directorios ignorados).
- Detección de monorepo: `pnpm-workspace.yaml`, `turbo.json`, `nx.json`, `lerna.json`, workspaces en `package.json` o `Cargo.toml`.
- Manifiestos raíz y por app: `package.json`, `tsconfig.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Gemfile`, `composer.json`.
- Extrae: runtime, lenguaje, framework principal, gestor de paquetes y scripts disponibles.

### 2. Apps, Módulos y Fronteras
- Monorepo: inspeccionar `apps/*` y `packages/*` (o `services/*`, `libs/*`) para ver quién consume a quién.
- App única: revisar `src/` (`app/`, `pages/`, `modules/`, `features/`, `domain/`, `api/`, `cmd/`, `internal/`).
- Identificar entrypoints reales (`main.ts`, `index.ts`, `app/layout.tsx`, `server.ts`, `cli.ts`) y la capa de enrutado o API pública (REST, GraphQL, tRPC, Server Actions, CLI commands).

### 3. Datos y Persistencia (si aplica)
- ORM / clientes de datos: `prisma/schema.prisma`, `drizzle.config.*` + esquemas, `typeorm`, `sqlalchemy`, `alembic/`, `supabase/migrations/`, `*.sql`.
- Caché, mensajería o tareas en segundo plano: Redis, BullMQ, queues, cron jobs, workers, almacenamiento de objetos (S3, Supabase Storage, R2).
- Identifica entidades centrales y dónde vive el estado persistente (no hace falta listar cada columna secundaria).

### 4. Autenticación, Seguridad y Permisos (si aplica)
- Proveedores e integraciones de identidad (Auth.js/NextAuth, Clerk, Supabase Auth, Cognito, OAuth/JWT propio).
- Guards, middlewares de sesión/roles (RBAC), verificación de ownership o políticas RLS en SQL.

### 5. Integraciones Externas y Variables de Entorno
- Clientes HTTP o SDKs de terceros (pagos como Stripe, email como Resend/SES, LLM/IA, analytics, observabilidad como Sentry/OTel, webhooks entrantes/salientes).
- Nombres de variables de entorno: leer únicamente `.env.example` / `.env.template` o esquemas de validación (`env.ts`, `config.py`, `process.env.*`). Agrupar por servicio sin inventar valores.

### 6. Flujos Clave (1 a 3 recorridos)
- Trazar de extremo a extremo los flujos principales del sistema (p. ej. *request HTTP -> validación -> servicio -> repositorio -> BD*, o *webhook externo -> verificación -> cola -> notificación*), verificando nombres reales de archivos y funciones.

### 7. Testing, CI/CD y Despliegue
- Frameworks de test y comandos reales (`package.json`, `vitest.config.*`, `jest.config.*`, `playwright.config.*`, `pytest.ini`).
- Pipelines y despliegue: `.github/workflows/*.yml`, `Dockerfile*`, `docker-compose*`, `vercel.json`, `fly.toml`, `netlify.toml`, `terraform/`.
