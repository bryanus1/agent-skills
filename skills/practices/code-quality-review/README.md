# 🔎 Code Quality Review (`code-quality-review`)

> **Revisión de calidad de un cambio (rama, PR o rutas) que orquesta las skills de `practices`: delimita el alcance, elige las lentes según lo que cambió y entrega un único informe priorizado y sin duplicados. Solo lectura por defecto.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `code-quality-review` |
| **Categoría** | `practices` |
| **Versión** | `1.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requiere skills** | `clean-code`, `solid-principles`, `design-patterns`, `tdd-workflow`, `frontend-best-practices`, `backend-best-practices` |

---

## 📦 Instalación

```bash
# Instala la skill y las lentes que usa:
npx skills add bryanus1/agent-skills --skill code-quality-review
npx skills add bryanus1/agent-skills --skill clean-code
npx skills add bryanus1/agent-skills --skill solid-principles
npx skills add bryanus1/agent-skills --skill design-patterns
npx skills add bryanus1/agent-skills --skill tdd-workflow
npx skills add bryanus1/agent-skills --skill frontend-best-practices
npx skills add bryanus1/agent-skills --skill backend-best-practices
```

Si falta alguna lente, la revisión continúa con las demás y lo indica en el informe.

---

## 💡 Ejemplos de Uso con Agentes de IA

* **Antes de abrir un PR**:
  > *"Revisa mi rama antes de abrir el PR."*
  >
  > 🤖 Clasifica los archivos cambiados, ejecuta tests y `detect-smells`, aplica solo las lentes relevantes y devuelve un informe con veredicto, hallazgos priorizados (sin duplicados entre lentes) y un plan de correcciones.

* **Revisión de rutas concretas**:
  > *"Haz una revisión de calidad de `src/orders`."*

* **Un cambio trivial**:
  > *"Revisa este cambio de un texto."*
  >
  > 🤖 Informa "sin hallazgos relevantes" en lugar de activar todas las lentes.

---

## 🧭 Cómo funciona

1. **Alcance**: `scripts/collect-scope.mjs` (solo lectura) lista y clasifica los archivos cambiados.
2. **Lentes**: elige solo las que justifica el cambio ([lens-routing](references/lens-routing.md)).
3. **Evidencia**: ejecuta tests, typecheck y lint reales del proyecto.
4. **Diagnóstico**: aplica cada skill hermana sin modificar nada.
5. **Informe**: fusiona, deduplica y prioriza ([severity-and-report](references/severity-and-report.md)).

## 🚫 Qué NO hace

- No modifica código, no commitea y no hace push: propone un plan y pregunta.
- No se usa para un aspecto concreto (SOLID, seguridad…): para eso están las skills específicas.
- No revisa lo que no cambió (lo preexistente va a "Fuera de alcance").

---

## 📁 Estructura

```
code-quality-review/
├── SKILL.md
├── README.md
├── scripts/collect-scope.mjs
├── references/
├── examples/review-orders-branch.md
└── evals/            # evals.json + fixtures
```
