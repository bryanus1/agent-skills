---
name: pr-plain-review
version: 1.0.0
description: >-
  Revisión previa a aprobar un PR o rama en lenguaje llano: explica qué cambió, por qué, qué archivos críticos tocó (migraciones, RLS, términos legales, auth, pagos, infra) y qué riesgo ve. Solo lectura; no modifica código ni aprueba sin confirmación.
tags: [git, pull-request, code-review, risk-analysis, migrations, rls, pre-approval]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - revisar-pr
  - revisar pr antes de aprobar
  - resumen del pr en lenguaje llano
  - qué cambia este pr
  - archivos críticos del pr
  - pr plain review
  - review pr before approving
requirements:
  tools: [run_command, view_file]
  bins: [git]
---

# PR Plain Review (`revisar-pr`)

## 🎯 Propósito

Dar a quien va a aprobar un Pull Request o Merge Request una lectura rápida y honesta en **lenguaje llano** antes de pulsar *Approve*: qué cambia realmente para el usuario, los datos y la operación; por qué se hizo; qué archivos críticos tocó; y qué riesgo real asume el equipo al aprobar.

Es **estrictamente de solo lectura**: no edita código, no publica comentarios ni aprueba o fusiona PRs sin confirmación explícita.

---

## ⚡ Cuándo Activar esta Skill

Activa esta skill cuando el usuario:
- Pida revisar un PR, MR o rama **antes de aprobar** o hacer merge (*"revisar-pr"*, *"revisa este PR antes de aprobarlo"*, *"¿qué cambia este PR y qué riesgo tiene?"*).
- Quiera una explicación en **lenguaje llano / de negocio** de un diff técnico o comprobar si tocó zonas sensibles (migraciones, RLS, términos legales, auth, pagos, infraestructura).

**Cuándo derivar a otra skill:**
- Si pide una auditoría técnica profunda de código (Clean Code, SOLID, patrones, TDD): usa `code-quality-review`.
- Si pide crear un PR, diagnosticar GitHub Actions o publicar un release: usa `gh-cli`.

---

## 📋 Flujo de Trabajo Paso a Paso

### Paso 1: Obtener Diff y Contexto (Solo Lectura)
1. Identificar el origen según la petición:
   - **PR de GitHub:** leer metadatos y diff sin modificar nada:
     ```bash
     gh pr view <n> --json number,title,body,baseRefName,headRefName,files,commits,statusCheckRollup,labels,isDraft
     gh pr diff <n>
     gh pr view <n> --comments
     ```
   - **MR de GitLab:** `glab mr view <n>` y `glab mr diff <n>`.
   - **Rama local o diff pegado:** inspeccionar `git log <base>..HEAD --oneline`, `git diff --stat <base>...HEAD` y `git diff <base>...HEAD` (detectando `main`, `master` o `develop` si no se indica base).
2. Leer cualquier issue o spec enlazada en el cuerpo del PR (`Closes #...`, ID de tracker) si está accesible para entender la intención original.
3. **PRs grandes (>40 archivos o >1500 líneas):** agrupar los archivos por área, leer completos todos los archivos críticos y una muestra representativa del resto, y declarar explícitamente al inicio del informe qué se revisó en detalle y qué en resumen.

### Paso 2: Traducir el "Qué" y Contrastar el "Por Qué"
1. Explicar el efecto observable del cambio en lenguaje llano (qué cambia para usuarios finales, clientes, datos guardados, costes o equipo de soporte). Si un término técnico es inevitable (p. ej. *RLS*, *migración*, *webhook*), explicar su impacto práctico en una frase.
2. Contrastar el **título, la descripción y los comentarios** del PR contra el diff real:
   - Si el PR hace cosas que no figuran en su descripción (p. ej. toca permisos, borra columnas, cambia precios o refactoriza módulos ajenos), destacarlo como **cambio silencioso**.
   - Si no hay descripción ni issue, declararlo como *"No especificado en el PR"* en lugar de inventar motivos.

### Paso 3: Auditar Archivos Críticos
1. Cruzar todos los archivos modificados, renombrados o eliminados —y los hunks del diff— contra las 6 familias definidas en [references/critical-files.md](references/critical-files.md):
   - **Migraciones y esquema de datos**
   - **RLS, políticas y permisos**
   - **Términos legales, privacidad y copy sensible**
   - **Autenticación, sesiones y secretos**
   - **Pagos y estado financiero**
   - **Infraestructura, CI/CD y dependencias críticas**
2. Comprobar también si existe `CODEOWNERS` (`.github/CODEOWNERS`, `CODEOWNERS` o `docs/CODEOWNERS`) para señalar si algún archivo tocado requiere aprobación de un dueño específico.
3. **Lectura completa obligatoria:** para cada archivo crítico modificado, leer el archivo completo en su estado resultante (no solo el fragmento del diff) para detectar interacciones con políticas, guards, migraciones previas o reglas existentes.

### Paso 4: Evaluar Riesgo, Reversibilidad y Señales Objetivas
1. Clasificar el riesgo global (`Bajo`, `Medio`, `Alto` o `Bloqueante`) usando la matriz de [references/report-template.md](references/report-template.md).
2. Evaluar la **reversibilidad**: distinguir si basta con un `git revert` tras el merge o si el PR deja efectos difíciles o imposibles de deshacer (borrado de datos, cambios de tipo en BD, aceptación legal, rotación de claves, cobros).
3. Recoger el estado real de `statusCheckRollup` / checks de CI y comprobar si las zonas críticas añaden o actualizan tests. Nunca asumir que los tests pasan si no hay evidencia en el PR o en una ejecución real.

### Paso 5: Entregar el Informe Pre-Aprobación
1. Presentar el informe en el chat siguiendo exactamente la estructura de [references/report-template.md](references/report-template.md).
2. Si no se detectó ningún archivo crítico, declararlo de forma explícita listando las categorías verificadas.
3. Si el usuario pide dejar la revisión en GitHub/GitLab, mostrar primero el texto exacto y esperar confirmación antes de ejecutar `gh pr comment` o `gh pr review`. Nunca ejecutar `--approve` ni `merge` sin orden explícita.

---

## ⚠️ Reglas Críticas

1. **Solo lectura por defecto:** prohibido editar código del proyecto, aprobar PRs, fusionar ramas o publicar comentarios en el tracker/PR sin petición y confirmación explícita.
2. **Lenguaje llano respaldado por evidencia:** traducir a impacto claro para el lector, citando siempre `archivo:línea` o el recurso exacto detrás de cada riesgo.
3. **Cero suposiciones:** si falta contexto (sin descripción, sin CI visible, archivo binario o generado), decirlo explícitamente en *"Qué no se pudo verificar"*.
4. **Los archivos críticos nunca se minimizan:** cualquier toque a migraciones, RLS, términos legales, auth, pagos o secretos se reporta en la tabla dedicada aunque parezca "pequeño".
5. **Honestidad de alcance:** en PRs grandes nunca simular haber leído cada línea; declarar qué archivos críticos se leyeron íntegros y qué zonas quedaron resumidas.
6. **Sin derivar fuera de foco sin motivo:** si el usuario pide opinión de arquitectura o refactor profundo además de este brief, sugerir `code-quality-review`.

---

## 📚 Referencias

- [Catálogo de archivos críticos](references/critical-files.md): patrones de rutas, señales en el diff y preguntas clave por categoría.
- [Plantilla del informe y matriz de riesgo](references/report-template.md): formato canónico, criterios de riesgo y ejemplo completo.
