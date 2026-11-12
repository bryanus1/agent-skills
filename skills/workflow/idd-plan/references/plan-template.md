# Plantilla del Plan (IDD Plan)

Estructura canónica que genera `idd-plan`. Se añade como sección `## 🛠️ Plan de Implementación` debajo de la ficha de `idd-explore`, en el mismo ítem del tracker o en el mismo `.md` local.

---

## Dónde se guarda

| Situación | Destino |
|---|---|
| La entrada es un ítem de Notion, Linear, GitHub Issues o GitHub Projects | La descripción del ítem o el cuerpo de la página |
| La entrada es texto o `.md` y hay un tracker conectado | Ofrecer crear el ítem en el tracker |
| No hay tracker | `docs/specs/<YYYY-MM-DD>-<slug>.md` |

Comandos de cada proveedor: `<skill-dir>/../idd-explore/references/adapters.md`.

---

## Reglas de redacción

- **Requisitos** con lenguaje normativo: "El sistema DEBE…", "NO DEBE…". Numerados `R1`, `R2`…
- **Delta, no especificación completa**: agrupar en `ADDED` (nuevo), `MODIFIED` (cambia un comportamiento existente; indicar el antes) y `REMOVED` (indicar motivo y migración). Omitir los grupos vacíos.
- **Escenarios** en *Dado / Cuando / Entonces*, observables desde fuera (respuesta, UI, archivo, registro), no detalles internos.
- **Tareas** de 15 min a 2 h cada una, en orden de ejecución, con un verbo al inicio y su requisito (`→ R1`). Agrupar por área (`1.` datos, `2.` lógica, `3.` UI, `4.` tests…).
- **Verificación** ejecutable: comandos reales del proyecto y qué escenario cubre cada uno.
- **Rutas** solo si se comprobó que existen; las nuevas llevan `(nuevo)`.

---

## 📄 Plantilla

```markdown
## 🛠️ Plan de Implementación

> Estado: planificado · Fuente: <enlace o ruta> · Fecha: <YYYY-MM-DD>

### Contexto
<!-- Problema, motivo y resultado esperado, en 2–5 líneas. -->

### Requisitos

#### ADDED
- **R1.** El sistema DEBE …
  - **Escenario:** <nombre>
    - **Dado** …
    - **Cuando** …
    - **Entonces** …

#### MODIFIED
- **R2.** <comportamiento> DEBE … (antes: …)
  - **Escenario:** …

#### REMOVED
- **R3.** Se elimina … — Motivo: … — Migración: …

### Diseño y decisiones
- **Enfoque:** …
- **Reutiliza:** `path/to/util.ts` (`funcionExistente`)
- **Descartado:** <alternativa> — <motivo en una línea>

### Archivos afectados
- `src/...` — <qué cambia>
- `src/...` (nuevo) — <para qué>

### Tareas
1. **<Área>**
   - [ ] 1.1 <Verbo> … → R1
   - [ ] 1.2 … → R1
2. **Tests**
   - [ ] 2.1 … → R1, R2

### Verificación
- [ ] `<comando de test>` — cubre R1 (escenario …)
- [ ] `<comando de lint/build>`
- [ ] Comprobación manual: … — cubre R2

### Fuera de alcance
- …

### Supuestos
- …

### Preguntas abiertas
- … (vacío si no hay ninguna)

### Metadatos
- **Estimación:** … · **Fase:** … · **Ventana:** …
```

---

## ⚡ Plan corto

Para cambios pequeños (un solo módulo, hasta 3 tareas, sin cambios de datos, API pública ni dependencias). Mismas reglas de redacción, menos secciones:

```markdown
## 🛠️ Plan de Implementación

> Estado: planificado · Fuente: <enlace o ruta> · Fecha: <YYYY-MM-DD> · Plan corto

### Contexto
<!-- 1–2 líneas. -->

### Requisitos
- **R1.** El sistema DEBE …
  - **Escenario:** **Dado** … **Cuando** … **Entonces** …

### Tareas
- [ ] 1 <Verbo> … en `src/...` → R1
- [ ] 2 Test de … → R1

### Verificación
- [ ] `<comando de test>` — cubre R1
```

Si al redactarlo aparecen decisiones de diseño, más de 3 tareas o dudas abiertas, pasar al plan completo.

## ✂️ Cuándo dividir

Si el plan supera unas 12 tareas o contiene entregables que se pueden entregar por separado, proponer un ítem por entregable. Cada ítem lleva su propio plan y una línea `Relacionado: <enlace>` en Metadatos. El ítem original queda como índice con la lista de los nuevos.

---

## 📌 Ejemplo

```markdown
## 🛠️ Plan de Implementación

> Estado: planificado · Fuente: ENG-104 · Fecha: 2026-11-12

### Contexto
Los usuarios de facturación necesitan descargar el listado filtrado de facturas en CSV para conciliarlo en su hoja de cálculo. Hoy solo pueden verlo en pantalla.

### Requisitos

#### ADDED
- **R1.** El endpoint `GET /invoices/export` DEBE devolver un CSV con los mismos filtros que `GET /invoices`.
  - **Escenario:** exportación filtrada
    - **Dado** 3 facturas, 2 con estado `paid`
    - **Cuando** se llama a `/invoices/export?status=paid`
    - **Entonces** la respuesta es `text/csv` con cabecera y 2 filas
- **R2.** El endpoint NO DEBE exportar más de 10 000 filas.
  - **Escenario:** límite superado
    - **Dado** un filtro con 12 000 resultados
    - **Cuando** se exporta
    - **Entonces** responde 422 con el mensaje `EXPORT_TOO_LARGE`

### Diseño y decisiones
- **Enfoque:** reutilizar `InvoiceQueryService.find` y serializar con el helper `toCsv` existente.
- **Reutiliza:** `src/shared/csv.ts` (`toCsv`)
- **Descartado:** generar el CSV en el cliente — el listado está paginado y no tiene todas las filas.

### Archivos afectados
- `src/invoices/invoices.controller.ts` — nueva ruta `export`
- `src/invoices/invoices.controller.spec.ts` — tests de R1 y R2

### Tareas
1. **Backend**
   - [ ] 1.1 Añadir la ruta `GET /invoices/export` que reutiliza los filtros → R1
   - [ ] 1.2 Validar el límite de 10 000 filas y devolver 422 → R2
2. **Tests**
   - [ ] 2.1 Test de exportación filtrada → R1
   - [ ] 2.2 Test del límite → R2

### Verificación
- [ ] `pnpm test invoices` — cubre R1 y R2
- [ ] `pnpm lint`

### Fuera de alcance
- Exportación a Excel o PDF.

### Supuestos
- El separador es coma y la codificación UTF-8.

### Preguntas abiertas
- (ninguna)

### Metadatos
- **Estimación:** 4 h · **Fase:** F2 · Reportes
```
