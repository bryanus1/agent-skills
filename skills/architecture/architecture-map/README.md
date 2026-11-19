# 🗺️ Architecture Map (`architecture-map`)

> **Genera desde cero o mantiene al día la página de arquitectura leyendo el repositorio real: topología, diagrama Mermaid, módulos/apps, stack, datos, auth, flujos clave, integraciones y despliegue — en Notion (MCP) o en `docs/ARCHITECTURE.md`, preservando las notas manuales del equipo.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `architecture-map` |
| **Categoría** | `architecture` |
| **Versión** | `1.0.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Destinos Soportados** | Notion (MCP) y Markdown local (`docs/ARCHITECTURE.md` / `ARCHITECTURE.md`) |

---

## 📦 Instalación

```bash
# Instalar en el proyecto actual con skills.sh:
npx skills add bryanus1/agent-skills --skill architecture-map

# Instalar globalmente en tu máquina:
npx skills add bryanus1/agent-skills --skill architecture-map -g
```

---

## 💡 Ejemplos de Uso

### 1. Generar la página inicial de arquitectura en el repo
> *"mapa-arquitectura para este proyecto"*

Explora manifiestos, módulos, migraciones, `.env.example` (sin leer `.env` reales) y workflows de CI, traza los flujos principales y te muestra el borrador de `docs/ARCHITECTURE.md` con diagrama Mermaid para que lo apruebes antes de crearlo.

### 2. Actualizar una página existente en Notion sin perder ADRs
> *"Actualiza la página de arquitectura en https://www.notion.so/acme/Arquitectura-12345 leyendo el estado actual del repo"*

Lee la página de Notion con `notion-fetch`, contrasta con el código real, resume la deriva detectada (módulos nuevos, cambios de stack), preserva las secciones manuales de ADRs y contexto de negocio, y espera tu confirmación antes de llamar a `notion-update-page`.

### 3. Sincronizar un `ARCHITECTURE.md` existente en un repo pequeño
> *"mapa-arquitectura: actualiza la documentación de arquitectura de esta CLI"*

Detecta `ARCHITECTURE.md` en la raíz sin crear duplicados en `docs/`, omite secciones irrelevantes como base de datos o RLS, y actualiza solo comandos y módulos verificados tras tu visto bueno.

---

## 📚 Documentación

- **[`SKILL.md`](SKILL.md)**: flujo paso a paso, puerta de revisión y reglas de seguridad.
- **[Checklist de descubrimiento](references/repo-discovery.md)**: exploración ordenada por capas y archivos excluidos.
- **[Plantilla de arquitectura](references/architecture-template.md)**: formato canónico, reglas seguras de Mermaid y ejemplo.
- **[Destinos y preservación](references/destinations.md)**: soporte para Notion MCP, Markdown local y protección de ADRs manuales.
