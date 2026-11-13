# 🖥️ Frontend Best Practices (`frontend-best-practices`)

> **Revisa y mejora componentes, hooks y páginas con criterios verificables y priorizados: estado y efectos, datos remotos, formularios, accesibilidad, rendimiento y seguridad. Corrige lo que duele y deja en paz lo que ya está bien.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `frontend-best-practices` |
| **Categoría** | `practices` |
| **Versión** | `1.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |

---

## 📦 Instalación

```bash
# En el proyecto actual:
npx skills add bryanus1/agent-skills --skill frontend-best-practices

# Global:
npx skills add bryanus1/agent-skills --skill frontend-best-practices -g

# Recomendadas junto a esta:
npx skills add bryanus1/agent-skills --skill tdd-workflow
npx skills add bryanus1/agent-skills --skill clean-code
npx skills add bryanus1/agent-skills --skill nextjs-architecture
```

---

## 💡 Ejemplos de Uso con Agentes de IA

* **Revisión de un componente**:
  > *"Revisa `UserList.tsx` y aplica buenas prácticas de frontend."*
  >
  > 🤖 Tabla de hallazgos por severidad con `archivo:línea` (XSS, teclado, carreras en `fetch`, estado derivado, claves), correcciones mínimas, decisiones de *no aplicar* y qué no pudo verificar sin navegador.

* **Escribir un componente nuevo**:
  > *"Crea un formulario de contacto accesible con validación."*
  >
  > 🤖 Etiquetas, errores asociados al campo, estado de envío, validación en cliente y en servidor.

* **Un componente que ya está bien**:
  > *"Aplica buenas prácticas a este botón."*
  >
  > 🤖 Informa que no hay hallazgos relevantes en lugar de inventar mejoras.

---

## 🧭 Qué cubre

| Área | Referencia |
|---|---|
| Estado, efectos y datos remotos | [react-state-effects](references/react-state-effects.md) |
| Formularios | [forms-and-data](references/forms-and-data.md) |
| Accesibilidad (WCAG 2.2 AA) | [accessibility](references/accessibility.md) |
| Rendimiento (Core Web Vitals) | [performance](references/performance.md) |
| Seguridad (XSS, tokens, secretos) | [security-frontend](references/security-frontend.md) |

## 🚫 Qué NO hace

- No define la estructura de carpetas (usa las skills de arquitectura).
- No afirma mejoras de rendimiento ni accesibilidad sin poder medirlas: lo declara como no verificado.
- No instala dependencias sin confirmación.

---

## 📁 Estructura

```
frontend-best-practices/
├── SKILL.md
├── README.md
├── references/
├── examples/review-user-list.md
└── evals/            # evals.json + fixtures
```
