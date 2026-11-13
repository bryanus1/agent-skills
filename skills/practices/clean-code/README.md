# 🧹 Clean Code (`clean-code`)

> **Código legible y mantenible a nivel de función y archivo: nombres, funciones pequeñas, manejo de errores, comentarios y un catálogo de code smells → refactor. Incluye un proceso de refactor seguro (tests antes y después) y un detector heurístico de smells para JS/TS.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `clean-code` |
| **Categoría** | `practices` |
| **Versión** | `1.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |

---

## 📦 Instalación

```bash
# En el proyecto actual:
npx skills add bryanus1/agent-skills --skill clean-code

# Global:
npx skills add bryanus1/agent-skills --skill clean-code -g

# Recomendado junto a tdd-workflow (tests de caracterización antes de refactorizar):
npx skills add bryanus1/agent-skills --skill tdd-workflow
```

---

## 💡 Ejemplos de Uso con Agentes de IA

* **Refactor seguro**:
  > *"Refactoriza `src/orders/report.ts`, nadie lo entiende. Los tests deben seguir pasando."*
  >
  > 🤖 Ejecuta los tests, detecta smells, refactoriza en pasos pequeños con tests entre pasos y reporta los cambios. Los bugs encontrados se reportan aparte en lugar de corregirse en silencio.

* **Revisión de legibilidad (sin cambios)**:
  > *"Revisa `UserList.tsx` y dime qué mejorarías."*
  >
  > 🤖 Tabla de hallazgos priorizada (corrección → comprensión → duplicación → cosmética) con `archivo:línea` y el refactor concreto.

* **Código legacy sin tests**:
  > *"Limpia `pricing.ts`, se usa en checkout."*
  >
  > 🤖 Primero tests de caracterización, después el refactor.

---

## 🛠️ Script

```bash
node <skill-dir>/scripts/detect-smells.mjs src
node <skill-dir>/scripts/detect-smells.mjs src/orders --json
node <skill-dir>/scripts/detect-smells.mjs src --max-lines 60 --max-params 4 --fail-on-findings
```

Detector heurístico y de solo lectura para JS/TS: `long-function`, `deep-nesting`, `too-many-params`, `long-file`, `magic-number`, `nested-ternary` y `todo-comment`. Son señales para revisar, no veredictos.

---

## 📚 Documentación

- **[`SKILL.md`](SKILL.md)**: flujo y reglas para el agente.
- **[Catálogo de smells](references/smells.md)** y **[catálogo de refactorings](references/refactorings.md)**.
- **[Ejemplos antes/después](examples/before-after.md)** (backend y frontend).
