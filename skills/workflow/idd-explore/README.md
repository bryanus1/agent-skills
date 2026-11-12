# 🔍 IDD Explore (`idd-explore`)

> **Fase 1 del flujo IDD (Issue-Driven Development): `idd-explore` → `idd-plan` → `idd-apply`. Convierte un ticket con solo título o notas sueltas en una ficha estructurada con contexto real del repo, guardada en tu tracker (Notion, Linear, GitHub Issues/Projects) o, si no tienes, en un `.md` local.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `idd-explore` (antes `issue-triage`) |
| **Categoría** | `workflow` |
| **Versión** | `2.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Fuentes** | Notion (MCP), Linear (MCP), GitHub Issues/Projects (`gh`), `.md` local |

---

## 🧭 El flujo IDD

| Fase | Skill | Qué produce | ¿Toca código? |
|---|---|---|---|
| 1. Explore | **`idd-explore`** | Ficha de 7 secciones | No |
| 2. Plan | [`idd-plan`](../idd-plan/README.md) | Plan detallado: requisitos, escenarios, tareas, verificación | No |
| 3. Apply | [`idd-apply`](../idd-apply/README.md) | Código + tareas marcadas | Sí |

Todo vive en **un solo lugar por cambio**: el ítem del tracker, o `docs/specs/<YYYY-MM-DD>-<slug>.md` si no hay tracker. Cada fase añade su sección y pide confirmación antes de escribir.

---

## 📦 Instalación

```bash
# Las tres fases del flujo:
npx skills add bryanus1/agent-skills --skill idd-explore --skill idd-plan --skill idd-apply

# Solo esta fase:
npx skills add bryanus1/agent-skills --skill idd-explore
```

> **Migración desde `issue-triage`:** la skill se renombró en la versión 2.0.0. Desinstala `issue-triage` e instala `idd-explore`; el comportamiento base es el mismo.

---

## 🔌 Proveedores

| Proveedor | Entrada | Lectura | Escritura |
| :--- | :--- | :--- | :--- |
| **Notion** | URL o ID de página | `notion-fetch` | `notion-update-page` / `notion-create-pages` |
| **Linear** | `ENG-104`, URL | `get_issue` | `save_issue` |
| **GitHub Issues** | `#42`, URL | `gh issue view` | `gh issue edit/create --body-file` |
| **GitHub Projects** | URL del proyecto | `gh project item-list` | issue enlazada + `gh project item-add` |
| **Local** | ruta `.md`, texto | archivo / prompt | `docs/specs/<fecha>-<slug>.md` |

---

## 💡 Ejemplos

### 1. Ticket de Linear con solo título
> *"Haz triage de ENG-104, solo tiene título"*

El agente lee el issue, explora el repo sin modificarlo, arma la ficha, te la muestra y, al confirmar, actualiza la descripción en Linear. Termina sugiriendo `idd-plan`.

### 2. Página de Notion con notas sueltas
> *"Explora este requerimiento: https://www.notion.so/…"*

Extrae restricciones, reglas y estimaciones de las notas, verifica en el repo los módulos involucrados y, tras tu OK, escribe la ficha en la misma página.

### 3. Sin tracker
> *"Refina esto, no uso ningún gestor: (notas…)"*

Genera la ficha y, tras confirmar, la guarda en `docs/specs/2026-11-12-<slug>.md`.

---

## 📚 Documentación

- **[`SKILL.md`](SKILL.md)**: instrucciones operativas y reglas críticas.
- **[Plantilla de la ficha](references/issue-template.md)**: las 7 secciones con un ejemplo.
- **[Adaptadores](references/adapters.md)**: lectura y escritura por proveedor (compartido por las tres fases).
