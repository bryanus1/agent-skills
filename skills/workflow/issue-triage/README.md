# 📋 Issue Triage (`issue-triage`)

> **Refinamiento agnóstico y pre-especificación de tickets (Linear, GitHub Issues o notas locales). Transforma títulos vacíos o "brain dumps" en especificaciones estructuradas con contexto del codebase y preservación de metadatos de estimación, listas para OpenSpec.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `issue-triage` |
| **Categoría** | `workflow` |
| **Versión** | `1.0.1` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Adaptadores Soportados** | Linear (MCP/CLI), GitHub CLI (`gh`), Manual Markdown |

---

## 📦 Instalación

### Vía `skills.sh` CLI (Recomendado)

```bash
# Instalar en el proyecto actual:
npx skills add bryanus1/agent-skills --skill issue-triage

# Instalar globalmente en tu máquina:
npx skills add bryanus1/agent-skills --skill issue-triage -g
```

### Vía Enlace Simbólico Local

```bash
# Google Antigravity:
mkdir -p .agents/skills
ln -s /ruta/a/agent-skills/skills/workflow/issue-triage .agents/skills/issue-triage

# Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/issue-triage .claude/skills/issue-triage
```

---

## 🔌 Matriz de Adaptadores de Proveedores

| Proveedor | Formato de Entrada | Herramienta de Lectura | Herramienta de Persistencia |
| :--- | :--- | :--- | :--- |
| **Linear** | `ENG-104`, URL de Linear | Linear MCP (`get_issue`) o CLI | Linear MCP (`save_issue`) |
| **GitHub** | `#42`, URL de GitHub | `gh issue view` | `gh issue edit --body-file` |
| **Manual** | Texto en chat, Jira, Notion | Texto del prompt | Bloque Markdown formateado |

---

## 💡 Ejemplos de Uso con Agentes de IA

### 1. Refinar ticket de Linear con solo título
> *"Haz triage de ENG-104, solo tiene título"*
>
> 🤖 **El agente:**
> 1. Consulta el issue vía Linear MCP.
> 2. Explora el repositorio local para identificar componentes y arquitectura relacionados.
> 3. Formula la ficha con Objetivo, Restricciones y Alcance sugerido.
> 4. Te muestra el borrador para confirmación rápida.
> 5. Al confirmar, actualiza la descripción en Linear vía `save_issue`.

### 2. Procesar notas densas ("Brain Dump") sin perder estimaciones
> *"Revisa el issue #58 en GitHub. Tiene un párrafo con notas desordenadas sobre fechas, backend y estimaciones"*
>
> 🤖 **El agente:**
> 1. Lee el cuerpo original con `gh issue view 58`.
> 2. Separa las reglas de cálculo de fechas de las restricciones arquitectónicas.
> 3. Extrae la estimación horaria y ventana temporal hacia la sección `🗓️ Metadatos & Planificación`.
> 4. Valida en el repositorio las Edge Functions o módulos de base de datos existentes.
> 5. Muestra el borrador estructurado y pide confirmación antes de actualizar con `gh issue edit`.

### 3. Modo agnóstico / manual para Jira o Notion
> *"Quiero refinar una tarea para cálculo de plazos en Postgres, no tengo Linear conectado. Este es el requerimiento: (...)"*
>
> 🤖 **El agente:**
> 1. Procesa las notas y analiza el código en el repo local.
> 2. Genera el bloque Markdown estándar listo para copiar y pegar en Jira, Notion o cualquier gestor de proyectos.

---

## 🔄 Conexión con OpenSpec

La ficha generada en el issue mapea 1:1 con los artefactos de OpenSpec. Cuando decidas implementar la tarea en el futuro, simplemente ejecuta:

```text
/openspec-propose <slug-del-issue>
```

Y luego:

```text
/openspec-apply-change <slug-del-issue>
```

---

## 📚 Documentación y Referencias

- **[`SKILL.md`](SKILL.md)**: Especificación operativa completa y reglas críticas.
- **[Plantilla Estándar de Issue Triage](references/issue-template.md)**: Estructura de las 7 secciones y mapeo detallado a OpenSpec.
- **[Guía de Adaptadores](references/adapters.md)**: Comandos CLI y llamadas MCP paso a paso.
