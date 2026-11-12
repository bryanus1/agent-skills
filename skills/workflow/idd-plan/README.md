# 🛠️ IDD Plan (`idd-plan`)

> **Fase 2 del flujo IDD (Issue-Driven Development): `idd-explore` → `idd-plan` → `idd-apply`. Genera un plan de implementación detallado (requisitos con escenarios, diseño, archivos verificados, tareas y verificación) y lo guarda en el mismo ítem de tu tracker o, si no tienes, en un `.md` local. No toca código.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `idd-plan` |
| **Categoría** | `workflow` |
| **Versión** | `1.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Depende de** | [`idd-explore`](../idd-explore/README.md) (adaptadores de proveedores) |

---

## 🧭 El flujo IDD

| Fase | Skill | Qué produce | ¿Toca código? |
|---|---|---|---|
| 1. Explore | [`idd-explore`](../idd-explore/README.md) | Ficha de 7 secciones | No |
| 2. Plan | **`idd-plan`** | Plan detallado | No |
| 3. Apply | [`idd-apply`](../idd-apply/README.md) | Código + tareas marcadas | Sí |

---

## 📦 Instalación

```bash
npx skills add bryanus1/agent-skills --skill idd-explore --skill idd-plan --skill idd-apply
```

---

## 📄 Qué contiene el plan

1. **Contexto**: por qué y para qué.
2. **Requisitos** en formato delta (`ADDED` / `MODIFIED` / `REMOVED`), con "DEBE…" y escenarios *Dado / Cuando / Entonces*.
3. **Diseño y decisiones**: enfoque, código que se reutiliza y alternativa descartada.
4. **Archivos afectados**: rutas verificadas en el repo.
5. **Tareas** `- [ ] 1.1 … → R1`, pequeñas y enlazadas a requisitos.
6. **Verificación**: comandos reales por escenario.
7. **Fuera de alcance, supuestos, preguntas abiertas y metadatos**.

Para cambios pequeños genera un **plan corto** (contexto, requisitos, tareas y verificación) y, si el plan pasa de unas 12 tareas, propone **dividirlo** en varios ítems.

Plantilla completa, plan corto y ejemplo: [references/plan-template.md](references/plan-template.md).

---

## 💡 Ejemplos

### 1. Desde un issue de GitHub
> *"Planifica el issue #42"*

Lee el issue (y la ficha de `idd-explore` si existe), explora el repo, te pregunta solo lo que cambia el alcance, te muestra el plan y, tras tu OK, lo añade al cuerpo del issue con `gh issue edit --body-file`.

### 2. Desde una página de Notion
> *"Haz el plan de implementación de https://www.notion.so/…"*

Igual que arriba, pero escribe la sección `🛠️ Plan de Implementación` en la misma página.

### 3. Sin tracker
> *"Planifica docs/specs/2026-11-12-exportar-csv.md"*

Añade el plan debajo de la ficha en ese mismo archivo.

---

## 📚 Documentación

- **[`SKILL.md`](SKILL.md)**: instrucciones operativas y reglas críticas.
- **[Plantilla del plan](references/plan-template.md)**: estructura, reglas de redacción y ejemplo.
