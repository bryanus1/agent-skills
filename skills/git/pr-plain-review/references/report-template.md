# Plantilla del Informe y Matriz de Riesgo (`pr-plain-review`)

Usa esta estructura para entregar la revisión previa a aprobar. Mantén un tono directo, sin jerga innecesaria y respaldado por rutas reales.

---

## 📊 Matriz de Niveles de Riesgo

| Nivel | Criterio | Veredicto habitual |
| :--- | :--- | :--- |
| **Bajo** | Cambio acotado, reversible con `git revert`, sin archivos críticos o con cambios triviales/documentales y checks claros. | `Aprobar` |
| **Medio** | Toca lógica de negocio relevante o configuración con impacto controlado; requiere confirmar algún caso borde o verificar checks. | `Aprobar con notas` |
| **Alto** | Toca archivos críticos (migraciones, RLS, auth, pagos, términos, CI) con riesgo de regresión, impacto irreversible parcial o cambios no explicados en la descripción. | `Pedir cambios antes de aprobar` |
| **Bloqueante** | Exposición de datos/bypass de RLS o auth, pérdida de datos sin respaldo, secreto filtrado en el diff, fallo grave en pagos o CI roto en zona crítica. | `No aprobar aún` |

---

## 📄 Plantilla Canónica

```markdown
### Veredicto: <Aprobar | Aprobar con notas | Pedir cambios antes de aprobar | No aprobar aún>
**Riesgo global:** <Bajo | Medio | Alto | Bloqueante> — <resumen de 1 frase con el motivo principal>
**Reversibilidad:** <Fácil (basta `git revert`) | Parcial (<qué queda atrás>) | Irreversible (<motivo>)>

### Qué cambió (en lenguaje llano)
- <Efecto concreto 1 para usuarios, datos u operación>
- <Efecto concreto 2>

### Por qué cambió
<Motivo según título, descripción e issue enlazada — o "No especificado en el PR">
> **Desalineación detectada (si aplica):** <cambios en el diff que no estaban explicados en la descripción del PR>

### Archivos críticos tocados
| Categoría | Archivo | Qué toca (en llano) | Reversibilidad |
|---|---|---|---|
| <Categoría> | `ruta/archivo` | <impacto concreto> | <Reversible / Irreversible / Requiere rollback manual> |

*(Si no hay ninguno: "Ninguno detectado (revisadas las 6 categorías críticas: migraciones, RLS/permisos, legal/términos, auth/secretos, pagos e infra/CI).")*

### Riesgos y puntos a revisar antes de aprobar
1. **[<Severidad>] <Resumen del riesgo>** (`archivo:línea`)
   - **Qué podría pasar:** <escenario concreto>
   - **Qué confirmar o pedir:** <acción concreta antes de pulsar Approve>

### Checks, tests y lo que no se pudo verificar
- **CI / Checks:** <resultado real o "No visible / sin configurar">
- **Tests en zonas críticas:** <sí añade / no cubre X>
- **No verificado / alcance:** <archivos omitidos en PR gigante, comportamiento en runtime, aprobación legal pendiente>
```

---

## 📌 Ejemplo Completo

```markdown
### Veredicto: Pedir cambios antes de aprobar
**Riesgo global:** Alto — Elimina una columna en producción y relaja una regla de acceso en la tabla de suscripciones sin mencionarlo en la descripción del PR.
**Reversibilidad:** Irreversible en datos (si se aplica la migración, los datos de `legacy_plan` se pierden).

### Qué cambió (en lenguaje llano)
- Añade la opción de suscripción anual en la pantalla de precios y en el flujo de pago con Stripe.
- Guarda el periodo de facturación en la base de datos y actualiza el texto legal de renovación automática.
- Permite a cualquier usuario autenticado consultar la tabla de planes desde la app.

### Por qué cambió
Según la descripción del PR #88 ("Plan anual de suscripción"), busca habilitar pagos anuales con 20 % de descuento para Q4.
> **Desalineación detectada:** El PR no menciona la eliminación de `legacy_plan` en la migración ni el cambio en la política de acceso (RLS) de `subscriptions`.

### Archivos críticos tocados
| Categoría | Archivo | Qué toca (en llano) | Reversibilidad |
|---|---|---|---|
| Migraciones | `supabase/migrations/20261115_annual_plan.sql` | Añade `billing_interval` y borra la columna `legacy_plan` | Irreversible (pierde datos) |
| RLS / Permisos | `supabase/migrations/20261115_annual_plan.sql` | Amplía la política `SELECT` de `subscriptions` | Reversible con nueva migración |
| Términos legales | `content/legal/terms.mdx` | Actualiza la cláusula de renovación anual y cancelación | Fácil (`git revert`) |
| Pagos | `src/billing/checkout.ts` | Calcula el precio anual antes de crear la sesión de Stripe | Fácil (`git revert`) |

### Riesgos y puntos a revisar antes de aprobar
1. **[Crítico] Posible exposición de suscripciones de otros clientes** (`supabase/migrations/20261115_annual_plan.sql:19`)
   - **Qué podría pasar:** La nueva política RLS (regla que decide quién puede leer qué filas en la base de datos) usa `USING (true)` sobre `subscriptions` en lugar de filtrar por `auth.uid() = user_id`. Cualquier usuario con sesión podría leer estados de pago ajenos.
   - **Qué confirmar o pedir:** Restringir la política a `auth.uid() = user_id` antes de aprobar.
2. **[Alto] Borrado destructivo de columna en el mismo deploy** (`supabase/migrations/20261115_annual_plan.sql:7`)
   - **Qué podría pasar:** `DROP COLUMN legacy_plan` elimina datos históricos de inmediato y puede provocar errores en el código antiguo durante el despliegue.
   - **Qué confirmar o pedir:** Verificar si ya no existen registros activos y, si aplica, mover el `DROP` a un PR posterior tras verificar en producción.
3. **[Medio] Cambio en cláusula de renovación** (`content/legal/terms.mdx:42`)
   - **Qué podría pasar:** Modifica el plazo de aviso previo de cancelación de 7 a 15 días.
   - **Qué confirmar o pedir:** Confirmar que legal/producto aprobó esa redacción.

### Checks, tests y lo que no se pudo verificar
- **CI / Checks:** `lint` ✅ · `unit-tests` ✅ (no hay tests de integración contra RLS).
- **Tests en zonas críticas:** `src/billing/checkout.ts` tiene test unitario nuevo; la migración SQL y la política RLS no están cubiertas por tests automáticos.
- **No verificado:** Comportamiento real del webhook de Stripe en sandbox y aprobación externa de `content/legal/terms.mdx`.
```
