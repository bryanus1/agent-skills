# Catálogo de Archivos Críticos (`pr-plain-review`)

Guía de referencia para detectar archivos y cambios de alto impacto en un PR antes de aprobarlo. Ante cualquier coincidencia (por ruta o por contenido del diff), **lee el archivo completo** en la rama del PR para verificar cómo interactúa con el resto del sistema.

---

## 0. Propiedad y `CODEOWNERS`

Comprueba si existe `.github/CODEOWNERS`, `CODEOWNERS` o `docs/CODEOWNERS`.
- Si algún archivo tocado coincide con un patrón con dueños asignados, indícalo junto al archivo crítico (p. ej. *"Requiere revisión de `@team-security` según `CODEOWNERS`"*).

---

## 1. Migraciones y Esquema de Datos

- **Rutas habituales:**
  - `migrations/`, `supabase/migrations/`, `prisma/migrations/`, `drizzle/`, `alembic/`, `db/migrate/`, `*.sql`, `schema.prisma`, `schema.ts`, `models/` con cambios de columnas.
- **Señales en el diff:**
  - `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, `DELETE FROM`.
  - `ALTER COLUMN ... TYPE`, `RENAME COLUMN`, `ADD COLUMN ... NOT NULL` sin `DEFAULT`.
  - `CREATE INDEX` sin `CONCURRENTLY` en tablas grandes (posible bloqueo de escritura).
  - Cambios en `prisma/schema.prisma` o esquemas Drizzle sin su archivo de migración correspondiente (o migraciones editadas después de aplicarse).
- **Qué confirmar antes de aprobar:**
  - ¿Se pierden datos existentes o fallará la versión en producción mientras despliega (deploy sin downtime)?
  - ¿Existe plan de rollback o requiere restaurar backup?

---

## 2. RLS, Políticas y Permisos

- **Rutas habituales:**
  - Políticas Supabase/Postgres (`*.sql`), `rls`, `policies`, `permissions`, `rbac`, `acl`, `guards`, `middlewares/auth*`, `rules` (Firestore/Storage).
- **Señales en el diff:**
  - `DISABLE ROW LEVEL SECURITY`, `DROP POLICY`, `ALTER POLICY`.
  - Políticas permisivas (`USING (true)`, `WITH CHECK (true)` en tablas con datos de usuario o multi-tenant).
  - Funciones `SECURITY DEFINER` sin `SET search_path` fijo o expuestas a roles públicos (`anon`, `authenticated`).
  - Uso de `service_role`, llaves administrativas o bypass de tenant/ownership en endpoints cliente o Server Actions.
  - Cambios en roles, scopes o matriz de permisos (`admin`, `owner`, `member`).
- **Qué confirmar antes de aprobar:**
  - ¿Un usuario autenticado o anónimo puede leer/modificar filas de otro usuario u organización?
  - ¿Las operaciones sensibles siguen validando permisos en servidor y no solo en interfaz?

---

## 3. Términos Legales, Privacidad y Copy Sensible

- **Rutas habituales:**
  - `terms*`, `tos*`, `privacy*`, `legal*`, `cookies*`, `consent*`, `gdpr*`, `dpa*`, `compliance*`, `pricing*`, `plans*`, `faq*` de facturación, plantillas de emails legales.
- **Señales en el diff:**
  - Modificaciones en condiciones de uso, política de privacidad, retención/borrado de datos, cesión a terceros o subprocesadores.
  - Cambios en textos de consentimiento, checkboxes obligatorios u opt-in/opt-out de comunicaciones.
  - Cambios en precios mostrados, ciclos de renovación, política de cancelación o reembolso.
- **Qué confirmar antes de aprobar:**
  - ¿El cambio fue revisado por producto/legal o refleja exactamente lo acordado?
  - ¿Exige re-aceptación de términos o actualización de fecha de vigencia?

---

## 4. Autenticación, Sesiones y Secretos

- **Rutas habituales:**
  - `auth*`, `login*`, `oauth*`, `sso*`, `jwt*`, `session*`, `middleware*`, `cors*`, `.env*`, `config/secrets*`.
- **Señales en el diff:**
  - Cambios en expiración de tokens, cookies (`httpOnly`, `secure`, `sameSite`), flujo de reset de contraseña o verificación de email.
  - Eliminación o relajación de verificación de firma en webhooks (`stripe-signature`, HMAC).
  - Apertura de CORS (`origin: '*'`, `credentials: true` combinado con orígenes amplios).
  - Credenciales, tokens, claves privadas o archivos `.env` reales incluidos por error en el commit.
- **Qué confirmar antes de aprobar:**
  - ¿Alguna ruta privada quedó pública o accesible sin sesión válida?
  - Si se filtró un secreto en el historial del PR, **no basta con borrarlo en otro commit**: hay que rotarlo antes de aprobar.

---

## 5. Pagos, Facturación y Estado Financiero

- **Rutas habituales:**
  - `billing*`, `payments*`, `checkout*`, `stripe*`, `webhooks/stripe*`, `subscriptions*`, `invoices*`, `credits*`, `refunds*`.
- **Señales en el diff:**
  - Cálculo de precios, descuentos, impuestos o prorrateo movido al cliente o sin validación de catálogo en servidor.
  - Webhooks sin verificación de idempotencia (doble acreditación o doble cobro al reintentar).
  - Cambios en máquinas de estado de suscripción (`trialing`, `active`, `past_due`, `canceled`) o acceso tras impago.
- **Qué confirmar antes de aprobar:**
  - ¿Se validan importes y monedas en el servidor?
  - ¿Qué pasa si el proveedor de pagos envía el mismo evento dos veces?

---

## 6. Infraestructura, CI/CD y Dependencias Críticas

- **Rutas habituales:**
  - `.github/workflows/*`, `Dockerfile*`, `docker-compose*`, `terraform/`, `infra/`, `k8s/`, `vercel.json`, `fly.toml`, `netlify.toml`, `package.json` + lockfiles (`pnpm-lock.yaml`, `package-lock.json`, `Cargo.lock`, `poetry.lock`).
- **Señales en el diff:**
  - Cambios en pipelines de deploy a producción, permisos `permissions: write-all` en Actions o secretos expuestos a PRs de forks (`pull_request_target`).
  - Nuevas dependencias con acceso a red/sistema, upgrades major de framework/ORM/auth o eliminación de pasos de test/lint en CI.
- **Qué confirmar antes de aprobar:**
  - ¿Un fallo o cambio en este archivo puede romper despliegues o debilitar las puertas de CI?
