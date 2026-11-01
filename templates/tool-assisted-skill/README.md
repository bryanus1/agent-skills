# 🛠️ Tool-Assisted Skill Template

> **Plantilla avanzada para skills que combinan instrucciones paso a paso con scripts ejecutables (`scripts/`), referencias técnicas (`references/`) y ejemplos (`examples/`).**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `tool-assisted-skill-template` |
| **Versión** | `1.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requisitos** | `bash` |

---

## 📦 Instalación

```bash
# Instalar en el proyecto actual con skills.sh:
npx skills add bryanus1/agent-skills --skill <nombre-de-tu-skill>

# Instalar globalmente en tu máquina:
npx skills add bryanus1/agent-skills --skill <nombre-de-tu-skill> -g
```

---

## 💡 Ejemplos de Uso con Agentes de IA

* **Diagnóstico sin modificar archivos**:
  > *"Ejecuta el diagnóstico de `<nombre-de-tu-skill>` en modo lectura"*
  >
  > 🤖 **El agente ejecutará**: `bash <skill-dir>/scripts/run.sh --check`

---

## 🛠️ Scripts y Opciones CLI

- **[`scripts/run.sh`](scripts/run.sh)**: Script principal de automatización (`--check` para diagnóstico, `--fix` para aplicar correcciones).

---

## 📚 Documentación y Referencias

- **[`SKILL.md`](SKILL.md)**: Instrucciones operativas y reglas críticas para el agente de IA.
- **[Guía Técnica](references/guide.md)**: Documentación de referencia detallada.
- **[Ejemplos de Entrada/Salida](examples/sample.md)**: Casos de uso de ejemplo.
