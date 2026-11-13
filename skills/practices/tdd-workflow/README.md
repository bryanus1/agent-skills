# 🔴🟢🔵 TDD Workflow (`tdd-workflow`)

> **Desarrollo guiado por tests para frontend y backend: lista de tests, ciclos Red → Green → Refactor con evidencia real de ejecución, reproducción de bugs con un test que falla y tests de caracterización antes de tocar código legacy.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `tdd-workflow` |
| **Categoría** | `practices` |
| **Versión** | `1.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |

---

## 📦 Instalación

```bash
# En el proyecto actual:
npx skills add bryanus1/agent-skills --skill tdd-workflow

# Global:
npx skills add bryanus1/agent-skills --skill tdd-workflow -g
```

---

## 💡 Ejemplos de Uso con Agentes de IA

* **Feature nueva con TDD**:
  > *"Con TDD, implementa `calculateShipping(order)`: envío gratis desde 50 €, si no 4,99 €, y 10 € extra en zonas remotas."*
  >
  > 🤖 El agente detecta el runner, escribe la lista de tests, avanza ciclo a ciclo mostrando cada rojo real y termina con la suite completa en verde y una tabla de ciclos.

* **Corregir un bug**:
  > *"`parseDuration('90s')` devuelve 0. Arréglalo."*
  >
  > 🤖 Primero un test que reproduce el bug y falla; después la corrección mínima; al final la suite completa.

* **Cambiar código legacy sin tests**:
  > *"Necesito cambiar el cálculo de comisiones de `billing.js`, pero no tiene tests."*
  >
  > 🤖 Tests de caracterización que fijan el comportamiento actual, y luego el ciclo TDD para el cambio.

---

## 🛠️ Script

```bash
# Desde la raíz del proyecto (o del paquete en un monorepo):
node <skill-dir>/scripts/detect-test-runner.mjs
node <skill-dir>/scripts/detect-test-runner.mjs --json
node <skill-dir>/scripts/detect-test-runner.mjs --cwd packages/api
```

Detecta vitest, jest, mocha, `node:test`, playwright, cypress, pytest, `go test` y `cargo test`; el gestor de paquetes; los comandos para ejecutar todo, un archivo o en modo watch; y la convención de nombres de los tests existentes. Es de solo lectura.

---

## 📚 Documentación

- **[`SKILL.md`](SKILL.md)**: flujo completo para el agente.
- **[Test doubles](references/test-doubles.md)**, **[Frontend](references/frontend-testing.md)**, **[Backend](references/backend-testing.md)**.
- **[Ejemplo de sesión TDD](examples/tdd-session.md)**.
