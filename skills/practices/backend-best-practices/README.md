# 🛠️ Backend Best Practices (`backend-best-practices`)

> **Revisa y mejora endpoints, servicios y acceso a datos con criterios verificables y priorizados: diseño de API y errores, consultas, seguridad, fiabilidad y observabilidad. Corrige lo que duele y avisa antes de cambiar el contrato público.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `backend-best-practices` |
| **Categoría** | `practices` |
| **Versión** | `1.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |

---

## 📦 Instalación

```bash
# En el proyecto actual:
npx skills add bryanus1/agent-skills --skill backend-best-practices

# Global:
npx skills add bryanus1/agent-skills --skill backend-best-practices -g

# Recomendadas junto a esta:
npx skills add bryanus1/agent-skills --skill tdd-workflow
npx skills add bryanus1/agent-skills --skill solid-principles
npx skills add bryanus1/agent-skills --skill nestjs-architecture
```

---

## 💡 Ejemplos de Uso con Agentes de IA

* **Revisión de un módulo de API**:
  > *"Revisa `orders-api.ts` y aplica buenas prácticas de backend."*
  >
  > 🤖 Tabla de hallazgos por severidad con `archivo:línea` (inyección SQL, IDOR, mass assignment, N+1, errores con 200 y stack), correcciones mínimas, aviso explícito de los cambios de contrato y lo que no pudo verificar.

* **Endpoint nuevo**:
  > *"Crea un endpoint para cancelar un pedido."*
  >
  > 🤖 Validación en el borde, autorización por recurso, códigos de estado correctos, transacción si cambia varias tablas, idempotencia.

* **Un handler que ya está bien**:
  > *"Aplica buenas prácticas a este endpoint."*
  >
  > 🤖 Informa que no hay hallazgos relevantes en lugar de inventar capas.

---

## 🧭 Qué cubre

| Área | Referencia |
|---|---|
| API, validación y errores | [api-design](references/api-design.md) |
| Acceso a datos y migraciones | [data-access](references/data-access.md) |
| Seguridad (OWASP) | [security-backend](references/security-backend.md) |
| Fiabilidad y observabilidad | [reliability-observability](references/reliability-observability.md) |

## 🚫 Qué NO hace

- No define la estructura de módulos (usa `nestjs-architecture`, `monorepo-architecture`).
- No cambia códigos de estado, rutas ni formas de respuesta sin avisar.
- No ejecuta migraciones ni toca datos reales sin confirmación.
- No afirma mejoras de rendimiento sin medirlas.

---

## 📁 Estructura

```
backend-best-practices/
├── SKILL.md
├── README.md
├── references/
├── examples/review-orders-api.md
└── evals/            # evals.json + fixtures (node:test)
```
