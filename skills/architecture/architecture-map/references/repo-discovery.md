# Repo Discovery Checklist (`architecture-map`)

Explore the repository top-down in **read-only** mode, prioritizing manifests, entry points and schemas over individual detail files.

---

## 🚫 Mandatory Exclusions

Do not read or copy content from:
- Secrets and real environment: `.env`, `.env.local`, `.env.*.local`, `.env.production`, `*.pem`, `*.key`, `credentials*`, `secrets*`.
- Dependencies and generated artifacts: `node_modules/`, `.venv/`, `vendor/`, `target/`, `dist/`, `build/`, `.next/`, `.astro/`, `.expo/`, `.turbo/`.
- Full lockfiles (`pnpm-lock.yaml`, `package-lock.json`, `Cargo.lock`) or binaries.

---

## 🔎 Exploration in 7 Layers

### 1. Topology and Manifests
- A shallow tree (`ls` / `find` with a maximum depth of 2–3, excluding ignored directories).
- Monorepo detection: `pnpm-workspace.yaml`, `turbo.json`, `nx.json`, `lerna.json`, workspaces in `package.json` or `Cargo.toml`.
- Root and per-app manifests: `package.json`, `tsconfig.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Gemfile`, `composer.json`.
- Extract: runtime, language, main framework, package manager and available scripts.

### 2. Apps, Modules and Boundaries
- Monorepo: inspect `apps/*` and `packages/*` (or `services/*`, `libs/*`) to see who consumes whom.
- Single app: review `src/` (`app/`, `pages/`, `modules/`, `features/`, `domain/`, `api/`, `cmd/`, `internal/`).
- Identify the real entry points (`main.ts`, `index.ts`, `app/layout.tsx`, `server.ts`, `cli.ts`) and the routing layer or public API (REST, GraphQL, tRPC, Server Actions, CLI commands).

### 3. Data and Persistence (if applicable)
- ORM / data clients: `prisma/schema.prisma`, `drizzle.config.*` + schemas, `typeorm`, `sqlalchemy`, `alembic/`, `supabase/migrations/`, `*.sql`.
- Cache, messaging or background tasks: Redis, BullMQ, queues, cron jobs, workers, object storage (S3, Supabase Storage, R2).
- Identify the core entities and where persistent state lives (no need to list every secondary column).

### 4. Authentication, Security and Permissions (if applicable)
- Identity providers and integrations (Auth.js/NextAuth, Clerk, Supabase Auth, Cognito, custom OAuth/JWT).
- Guards, session/role middleware (RBAC), ownership checks or RLS policies in SQL.

### 5. External Integrations and Environment Variables
- HTTP clients or third-party SDKs (payments such as Stripe, email such as Resend/SES, LLM/AI, analytics, observability such as Sentry/OTel, incoming/outgoing webhooks).
- Environment variable names: read only `.env.example` / `.env.template` or validation schemas (`env.ts`, `config.py`, `process.env.*`). Group them by service without inventing values.

### 6. Key Flows (1 to 3 paths)
- Trace the system's main flows end to end (e.g. *HTTP request -> validation -> service -> repository -> DB*, or *external webhook -> verification -> queue -> notification*), checking the real names of files and functions.

### 7. Testing, CI/CD and Deployment
- Test frameworks and real commands (`package.json`, `vitest.config.*`, `jest.config.*`, `playwright.config.*`, `pytest.ini`).
- Pipelines and deployment: `.github/workflows/*.yml`, `Dockerfile*`, `docker-compose*`, `vercel.json`, `fly.toml`, `netlify.toml`, `terraform/`.
