# 🧩 Design Patterns (`design-patterns`)

> **Elige y aplica patrones de diseño (GoF y modernos: Strategy, Adapter, Factory, Repository, Result, Compound Components, hooks…) partiendo del problema y no del catálogo, contrastándolos siempre con la alternativa más simple y decidiendo cuándo no usar ninguno.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `design-patterns` |
| **Categoría** | `practices` |
| **Versión** | `1.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |

---

## 📦 Instalación

```bash
# En el proyecto actual:
npx skills add bryanus1/agent-skills --skill design-patterns

# Global:
npx skills add bryanus1/agent-skills --skill design-patterns -g

# Recomendadas junto a esta:
npx skills add bryanus1/agent-skills --skill solid-principles
npx skills add bryanus1/agent-skills --skill tdd-workflow
```

---

## 💡 Ejemplos de Uso con Agentes de IA

* **De `switch` repetido a una solución extensible**:
  > *"Cada vez que añadimos un transportista tengo que tocar tres archivos. Aplica el patrón Strategy."*
  >
  > 🤖 Formula el problema, contrasta con la alternativa simple (una tabla de reglas) y la aplica; explica cuándo pasaría a clases.

* **Aislar un SDK de terceros**:
  > *"Quiero cambiar de proveedor de email y probar sin llamar al SDK. ¿Qué patrón uso?"*
  >
  > 🤖 Puerto y adaptador (Adapter + DIP): interfaz del dominio, adaptador único que importa el SDK y tests con un fake.

* **Frenar patrones innecesarios**:
  > *"Aplica Singleton y Factory a mi configuración."*
  >
  > 🤖 Cuestiona la petición con argumentos (estado global, sin variantes) y ofrece una alternativa por composición.

---

## 📚 Documentación

- **[`SKILL.md`](SKILL.md)**: flujo, tabla problema → patrón y reglas para el agente.
- Referencias: **[Creacionales](references/creational.md)**, **[Estructurales](references/structural.md)**, **[Comportamiento](references/behavioral.md)**, **[Frontend y backend](references/frontend-backend.md)**.
- **[Ejemplo: de switch repetido a estrategias](examples/strategy-vs-table.md)**.
