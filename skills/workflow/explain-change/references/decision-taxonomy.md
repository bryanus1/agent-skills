# Taxonomía de Decisiones e Informe (`explain-change`)

Usa esta guía para clasificar qué decidió la IA fuera de la propuesta y presentar el informe priorizado por necesidad de validación humana.

---

## 🔍 6 Categorías de Decisiones Implícitas

| Categoría | Qué buscar en el diff | Ejemplo típico |
| :--- | :--- | :--- |
| **1. Alcance extra** | Archivos tocados que no corresponden a ninguna tarea ni requisito; refactors de estilo en módulos ajenos; endpoints/botones no pedidos. | Reescribió `src/utils/date.ts` y renombró funciones existentes "para limpiar". |
| **2. Contratos y datos** | Nuevos campos en API/BD, migraciones añadidas, cambio en códigos HTTP, payloads, tipos exportados o formatos de respuesta. | Devolvió `200` con `{ error }` en lugar de `422`, o añadió columna `metadata jsonb`. |
| **3. Comportamiento y defaults** | Límites numéricos, timeouts, reintentos, paginación, políticas de cache, manejo silencioso de errores (`catch` vacío / fallback) o mensajes al usuario no definidos. | Fijó un límite de 500 filas, timeout de 5 s o devolvió `[]` si falla la query. |
| **4. Arquitectura y dependencias** | Librerías instaladas en `package.json`/lockfiles, patrones o abstracciones nuevas, cambio del enfoque acordado en `design.md`. | Instaló `json2csv` en lugar de usar el serializador existente, o creó un adapter extra. |
| **5. Seguridad, permisos y config** | Reglas RLS, middlewares/guards, validaciones relajadas (`optional()`, `z.any()`), CORS, nuevas variables de entorno o flags. | Añadió `PROCESS_TIMEOUT_MS` en config y marcó el campo `email` como opcional. |
| **6. Atajos, compromisos y deuda** | `TODO`/`FIXME`, casts (`as any`, `@ts-ignore`), tests saltados (`it.skip`), mocks excesivos, tareas marcadas `[x]` en `tasks.md` sin estar completas. | Marcó la tarea de test como hecha pero solo testeó el caso feliz con mock total. |

---

## 🚦 Criterios de Prioridad

- 🔴 **Requiere tu validación:** cambios en contratos públicos, BD/migraciones, seguridad/permisos, dependencias nuevas, alcance extra grande o decisiones que contradicen `proposal.md` / `design.md`.
- 🟡 **Conviene revisar:** supuestos funcionales (límites, mensajes, ordenamiento, fallbacks), variables de entorno nuevas, refactors colaterales o atajos/deuda técnica (`TODO`, tests incompletos).
- 🟢 **Detalle menor de implementación:** decisiones internas coherentes con la propuesta (nombres de variables locales, división interna de helpers privados, orden de imports). Agrúpalas en 1–3 viñetas breves al final para no enterrar lo importante.

---

## 📄 Plantilla Canónica del Informe

```markdown
### Veredicto: <Fiel a la propuesta | Con decisiones menores | Con decisiones que requieren validación | Desalineado con la propuesta>
**Propuesta contrastada:** <ruta OpenSpec / ítem IDD / plan>
**Cambio inspeccionado:** <archivos modificados/nuevos en working tree o rama contra base>

### 🔴 Decisiones que requieren tu validación
1. **[<Categoría>] <Título corto de la decisión>** (`archivo:línea`)
   - **Qué decidió la IA:** <descripción concreta de lo implementado>
   - **Frente a la propuesta:** <"No estaba en proposal.md" | "Contradice design.md § X">
   - **Por qué probablemente lo hizo e impacto:** <motivo técnico y efecto en producto/sistema>
   - **Alternativa si no te convence:** <opción directa>

### 🟡 Decisiones que conviene revisar
- **[<Categoría>] <Resumen>** (`archivo:línea`) — <frente a la propuesta + impacto breve>

### 🟢 Detalles menores de implementación
- <Resumen agrupado de decisiones internas razonables que no cambian comportamiento ni contrato>

### 📋 Puntos de la propuesta omitidos, parciales o desviados
- **Omitidos / parciales:** <requisitos o tareas marcadas `[x]` con huecos reales, o "Ninguno">
- **Desviaciones ya registradas:** <las documentadas en `### Desviaciones` / comentarios IDD, o "Ninguna">

### Siguiente paso
¿Qué decisiones **aceptas** tal cual (puedo documentarlas en `<design.md / plan>` si confirmas) y cuáles quieres que **ajustemos o revirtamos**?
```

---

## 📌 Ejemplo Completo

```markdown
### Veredicto: Con decisiones que requieren validación
**Propuesta contrastada:** `openspec/changes/export-invoices-csv/` (`proposal.md`, `design.md`, `specs/export/spec.md`, `tasks.md`)
**Cambio inspeccionado:** 5 archivos modificados, 1 nuevo (sin commitear tras `/opsx:apply`)

### 🔴 Decisiones que requieren tu validación
1. **[Arquitectura y dependencias] Instaló la librería `papaparse` no contemplada en `design.md`** (`package.json:18`, `src/invoices/export.ts:3`)
   - **Qué decidió la IA:** Añadió `papaparse` y `@types/papaparse` al proyecto en vez de usar `toCsv` de `src/shared/csv.ts` indicado en `design.md`.
   - **Frente a la propuesta:** Contradice `design.md` ("Reutilizar el helper interno `toCsv` sin añadir dependencias").
   - **Por qué probablemente lo hizo e impacto:** Evitó ajustar el escape de comillas en `toCsv`, pero introduce una dependencia externa nueva y cambia el lockfile.
   - **Alternativa si no te convence:** Desinstalar `papaparse`, corregir el escape en `src/shared/csv.ts` y reutilizarlo.

2. **[Comportamiento y defaults] Limitó la exportación a 500 filas y devuelve `200` vacío si hay error de lectura** (`src/invoices/export.ts:29-41`)
   - **Qué decidió la IA:** Fijó `MAX_EXPORT_ROWS = 500` y envolvió la consulta en un `try/catch` que devuelve CSV vacío con cabecera.
   - **Frente a la propuesta:** `specs/export/spec.md` no definía límite de filas ni ese fallback silencioso.
   - **Por qué probablemente lo hizo e impacto:** Evitó timeouts en consultas grandes, pero un usuario con >500 facturas recibirá un archivo incompleto sin aviso de truncado o error.
   - **Alternativa si no te convence:** Subir o hacer configurable el límite y devolver `422` o cabecera de aviso cuando se supere.

### 🟡 Decisiones que conviene revisar
- **[Alcance extra] Refactorizó funciones de formato de fecha en `src/shared/dates.ts:12-34`** — No estaba pedido en `tasks.md`; aunque mantiene la firma pública, toca un módulo usado por otros reportes.
- **[Atajos y deuda] Añadió `// TODO: validar permiso de rol admin` en `src/invoices/export.ts:15`** — Marcó la tarea 2.1 como `[x]` en `tasks.md`, pero dejó pendiente restringir el acceso por rol.

### 🟢 Detalles menores de implementación
- Creó el helper privado `sanitizeCsvCell` dentro de `src/invoices/export.ts:52` para prevenir inyección de fórmulas en Excel (`=`, `+`, `-`, `@`).

### 📋 Puntos de la propuesta omitidos, parciales o desviados
- **Omitidos / parciales:** El escenario "Exportación sin resultados devuelve `204` o aviso" de `specs/export/spec.md` quedó devolviendo CSV solo con cabeceras `200 OK`.
- **Desviaciones ya registradas:** Ninguna.

### Siguiente paso
¿Qué decisiones **aceptas** tal cual (puedo documentarlas en `openspec/changes/export-invoices-csv/design.md` si confirmas) y cuáles quieres que **ajustemos o revirtamos**?
```
