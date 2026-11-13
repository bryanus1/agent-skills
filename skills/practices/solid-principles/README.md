# 🧱 SOLID Principles (`solid-principles`)

> **Aplica y revisa SRP, OCP, LSP, ISP y DIP a nivel de clase, módulo y componente en backend y frontend: diagnostica por señales concretas, refactoriza con tests y decide explícitamente cuándo NO aplicarlos (sin una razón real, una abstracción es solo ruido).**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `solid-principles` |
| **Categoría** | `practices` |
| **Versión** | `1.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |

---

## 📦 Instalación

```bash
# En el proyecto actual:
npx skills add bryanus1/agent-skills --skill solid-principles

# Global:
npx skills add bryanus1/agent-skills --skill solid-principles -g

# Recomendadas junto a esta:
npx skills add bryanus1/agent-skills --skill tdd-workflow
npx skills add bryanus1/agent-skills --skill clean-code
npx skills add bryanus1/agent-skills --skill design-patterns
```

---

## 💡 Ejemplos de Uso con Agentes de IA

* **Refactor de un servicio con demasiadas responsabilidades**:
  > *"Este `OrderService` valida, calcula precios, guarda en BD y envía el email. Aplícale SOLID."*
  >
  > 🤖 Diagnóstico por principio con evidencia (`archivo:línea`), decisión *Aplicar / Aplazar / No aplicar* para cada uno, refactor en pasos pequeños con tests entre pasos y reporte final.

* **Revisión sin cambios**:
  > *"Revisa esta jerarquía de clases y dime si hay problemas de diseño."*
  >
  > 🤖 Detecta violaciones (p. ej. una subclase que lanza `read-only` en un método heredado) y propone la separación de interfaces, sin tocar archivos.

* **Frenar la sobreingeniería**:
  > *"Aplica OCP a este `switch` de tres casos."*
  >
  > 🤖 Explica por qué un `switch` pequeño, estable y en un solo sitio no necesita abstracción.

---

## 📚 Documentación

- **[`SKILL.md`](SKILL.md)**: flujo, tabla de señales y reglas para el agente.
- Referencias: **[SRP](references/srp.md)**, **[OCP](references/ocp.md)**, **[LSP](references/lsp.md)**, **[ISP](references/isp.md)**, **[DIP](references/dip.md)**.
- **[Ejemplo completo: servicio de pedidos](examples/order-service.md)**.
