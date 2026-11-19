---
name: explain-change
version: 1.0.0
description: >-
  Tras implementar un cambio con IA (/opsx:apply, idd-apply o cualquier plan), contrasta el diff real contra la propuesta original y resume qué decisiones tomó la IA que no estaban especificadas: supuestos, alcance extra, contratos, dependencias y atajos. Solo lectura.
tags: [workflow, openspec, idd, sdd, ai-audit, diff-analysis, traceability]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - explicar-cambio
  - explicar cambio
  - qué decidió la ia
  - decisiones fuera de la propuesta
  - después de /opsx:apply
  - auditar cambios contra la propuesta
  - explain change
  - undeclared decisions
requirements:
  tools: [run_command, view_file]
  bins: [git]
---

# Explain Change (`explicar-cambio`)

## 🎯 Propósito

Auditar lo que realmente quedó implementado después de que una IA ejecutara `/opsx:apply`, `idd-apply` o cualquier plan de trabajo. Contrasta el diff real contra la propuesta original y resume **solo las decisiones que la IA tomó por su cuenta** sin estar especificadas: supuestos, valores por defecto, contratos alterados, dependencias nuevas, alcance extra y atajos.

Es **estrictamente de solo lectura**: te da visibilidad antes de dar por bueno el cambio o abrir un PR, sin modificar código ni reescribir documentos sin tu confirmación.

---

## ⚡ Cuándo Activar esta Skill

Activa esta skill cuando el usuario:
- Termine de ejecutar `/opsx:apply`, `idd-apply` o una implementación asistida y pregunte qué hizo o decidió la IA (*"explicar-cambio"*, *"¿qué decisiones tomó la IA que no estaban en la propuesta?"*, *"audita el cambio contra el plan"*).
- Quiera verificar fidelidad entre una spec/plan (OpenSpec, IDD o documento `.md`) y el código en disco o en la rama actual.

**No la uses** si el usuario pide implementar el plan (`idd-apply`) o evaluar calidad/bugs generales sin compararlo contra una propuesta (`code-quality-review` o `pr-plain-review`).

---

## 📋 Flujo de Trabajo Paso a Paso

### Paso 1: Localizar la Propuesta Original
Seguir [references/proposal-sources.md](references/proposal-sources.md) según el flujo que use el proyecto:
1. **OpenSpec:** buscar el cambio activo en `openspec/changes/<nombre>/` (`proposal.md`, `design.md`, `specs/**/*.md` y `tasks.md`), excluyendo `openspec/changes/archive/` salvo petición explícita. Si hay varios cambios activos, preguntar cuál auditar (puedes proponer el que coincide con la rama o archivos modificados, pidiendo confirmación).
2. **IDD:** leer la ficha y la sección `## 🛠️ Plan de Implementación` (junto con `### Desviaciones` y los comentarios `🔄 Progreso IDD` posteriores) en Notion, Linear, GitHub Issues/Projects o `docs/specs/*.md`.
3. **Genérico:** usar el plan acordado en la conversación, un archivo `.md` indicado o la descripción del issue/PR.
4. **Sin propuesta contrastable:** si no existe ninguna spec, plan o descripción previa verificable, detenerse y pedir al usuario contra qué documento o requisitos comparar; nunca inventar una propuesta.

### Paso 2: Recoger el Cambio Real Implementado (Solo Lectura)
Inspeccionar lo que realmente existe en el repositorio:
```bash
git status --short
git diff --stat
git diff
git ls-files --others --exclude-standard
```
Si la implementación ya fue commiteada en la rama actual, comparar también contra la rama base (`main`, `master` o `develop`):
```bash
git log <base>..HEAD --oneline
git diff <base>...HEAD
```
Para archivos nuevos o con cambios estructurales, leer el archivo completo cuando haga falta entender dependencias, tipos o efectos secundarios.

### Paso 3: Contrastar Propuesta vs. Código Real (en Dos Direcciones)
1. **En el código, pero NO en la propuesta (decisiones implícitas):** revisar cada archivo modificado/añadido y clasificar cualquier decisión no declarada en las 6 categorías de [references/decision-taxonomy.md](references/decision-taxonomy.md):
   - *Alcance extra* (archivos, refactors o funcionalidades fuera de la propuesta).
   - *Contratos y datos* (migraciones, esquemas, endpoints, códigos HTTP o tipos públicos no especificados).
   - *Comportamiento y valores por defecto* (límites, timeouts, fallbacks, mensajes de error o casos borde elegidos por la IA).
   - *Arquitectura y dependencias* (paquetes añadidos, patrones o capas ausentes en el diseño).
   - *Seguridad, permisos y configuración* (auth, RLS, validaciones relajadas/endurecidas, variables de entorno).
   - *Atajos, compromisos y deuda* (`TODO`s, `as any`, tests omitidos/debilitados, tareas marcadas como hechas parcialmente).
2. **En la propuesta, pero NO hecho o distinto:** distinguir con claridad entre **desviaciones ya documentadas/acordadas** (p. ej. en `### Desviaciones` o comentarios `🔄 Progreso IDD`) y **omisiones o cambios silenciosos**.

### Paso 4: Priorizar por Necesidad de Validación Humana
1. Filtrar todo lo que **sí** estaba especificado en la propuesta para centrarse únicamente en el **delta no declarado**.
2. Clasificar cada decisión según [references/decision-taxonomy.md](references/decision-taxonomy.md):
   - 🔴 **Requiere tu validación:** afecta seguridad, datos, contratos públicos, dependencias, alcance grande o dinero.
   - 🟡 **Conviene revisar:** supuestos de negocio/UX, límites arbitrarios, refactors colaterales o deuda técnica.
   - 🟢 **Detalle menor de implementación:** decisiones locales razonables (nombres internos, helpers privados), agrupadas en resumen sin ruido.

### Paso 5: Entregar Informe y Opciones de Cierre
1. Presentar el informe con el formato canónico de [references/decision-taxonomy.md](references/decision-taxonomy.md).
2. Si el código implementó exactamente la propuesta sin decisiones ocultas relevantes, declararlo limpiamente como **Fiel a la propuesta** sin fabricar hallazgos.
3. Cerrar preguntando qué decisiones **acepta** (ofreciendo registrarlas en `design.md` o en `### Desviaciones` del plan solo tras confirmación) y cuáles desea **revertir o ajustar**.

---

## ⚠️ Reglas Críticas

1. **Solo lectura por defecto:** no modificar código fuente, tests, `design.md` ni issues/PRs durante la auditoría.
2. **Regla anti-autojustificación:** aunque tú mismo hayas ejecutado `/opsx:apply` o `idd-apply` en turnos previos, audita el diff en disco como un **tercero escéptico**. No confíes en tu recuerdo ni justifiques un cambio si no está escrito explícitamente en la propuesta.
3. **Foco estricto en el delta:** no resumas lo que ya estaba pedido en la propuesta; el valor de esta skill es sacar a la luz únicamente lo que **no** estaba especificado o lo que se desvió.
4. **Evidencia trazable:** cada hallazgo debe citar `archivo:línea` y la sección o requisito de la propuesta frente al que diverge o añade algo.
5. **No inventar propuesta:** si no hay propuesta/plan contrastable, pedirlo antes de evaluar.
6. **Honestidad ante fidelidad total:** si la IA siguió la propuesta sin apartarse ni improvisar decisiones relevantes, decirlo sin rellenar con trivialidades.

---

## 📚 Referencias

- [Fuentes de la propuesta](references/proposal-sources.md): cómo localizar y leer propuestas de OpenSpec, IDD (Notion, Linear, GitHub, local) y planes genéricos.
- [Taxonomía de decisiones e informe](references/decision-taxonomy.md): las 6 categorías, criterios 🔴/🟡/🟢, plantilla del informe y ejemplo completo.
