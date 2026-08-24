# 📐 Agent Skills Specification (v1.0.0)

Esta especificación define el estándar unificado y agnóstico para crear, empaquetar y distribuir **Skills** para asistentes y agentes de desarrollo de software impulsados por IA (*Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf, Roo Code, etc.*).

---

## 1. Conceptos Fundamentales

Una **Skill** es un paquete autocontenido de conocimiento procedural, directrices contextuales, herramientas auxiliares y flujos de trabajo que enseña a un agente cómo ejecutar tareas complejas con alta precisión y consistencia.

### Principio de Progressive Disclosure
Los agentes de IA operan bajo presupuestos finitos de ventana de contexto. Para maximizar la eficiencia:
1. **Fase de Descubrimiento (Level 1)**: Solo el nombre (`name`) y la descripción (`description`) de la skill se inyectan en el prompt inicial del agente.
2. **Fase de Activación (Level 2)**: El agente lee el archivo `SKILL.md` únicamente cuando el contexto de la tarea coincide con los disparadores (`triggers`).
3. **Fase de Profundización (Level 3)**: Los archivos dentro de `references/`, `scripts/` o `examples/` solo se consultan o ejecutan cuando las instrucciones principales lo indiquen expresamente.

---

## 2. Estructura de Directorios

Cada skill debe ubicarse en su propio directorio con la siguiente anatomía:

```
skill-name/
├── SKILL.md              # [REQUERIDO] Metadatos YAML + Instrucciones del flujo
├── metadata.json         # [OPCIONAL] Esquema extendido y compatibilidad
├── scripts/              # [OPCIONAL] Scripts ejecutables por el agente (Bash, Python, Node)
│   ├── run_check.sh
│   └── helper.py
├── references/           # [OPCIONAL] Documentación y guías técnicas complementarias
│   └── architecture.md
├── examples/             # [OPCIONAL] Casos de uso de referencia (Before / After)
│   └── sample_output.md
└── tests/                # [OPCIONAL] Prompts de evaluación y bancos de prueba
    └── evals.json
```

---

## 3. Esquema de Frontmatter (`SKILL.md`)

Todo archivo `SKILL.md` DEBE comenzar con un bloque YAML frontmatter delimitado por `---`:

```yaml
---
name: string                   # [Requerido] Identificador único kebab-case (máx 40 chars)
version: string                # [Requerido] Versión semántica (ej. 1.0.0)
description: string            # [Requerido] Descripción precisa y accionable (máx 350 chars)
author: string                 # [Opcional] Autor o Maintainer
license: string                # [Opcional] Licencia SPDX (ej. MIT, Apache-2.0)
tags: string[]                 # [Opcional] Lista de etiquetas para búsqueda y clasificación
agents: string[]               # [Opcional] Agentes compatibles ('antigravity', 'claude-code', 'codex', 'cursor', 'windsurf', 'all')
triggers: string[]             # [Requerido] Palabras clave, comandos o condiciones de activación
requirements:                  # [Opcional] Requisitos de ejecución
  tools: string[]              # Herramientas necesarias (ej. 'run_command', 'view_file', 'replace_file_content')
  bins: string[]               # Binarios del sistema requeridos (ej. 'git', 'docker', 'pnpm')
---
```

### Reglas de Validación de Metadatos:
- **`name`**: Solo letras minúsculas, números y guiones (`^[a-z0-9-]+$`).
- **`description`**: Debe responder claramente a:
  1. *¿Qué hace la skill?*
  2. *¿Cuándo debe activarla el agente?*
  3. *Palabras clave o intenciones desencadenantes.*
  *Límite recomendado: 350 caracteres para preservar contexto global.*
- **`triggers`**: Al menos 2 términos clave o intenciones descriptivas.

---

## 4. Cuerpo de `SKILL.md`

El contenido Markdown debe seguir una estructura estandarizada en secciones:

```markdown
# Nombre Legible de la Skill

## 🎯 Propósito
Descripción concisa del objetivo de la skill y el problema que resuelve.

## ⚡ Cuándo Activar esta Skill
Condiciones exactas, intenciones del usuario o patrones en el código que deben disparar este flujo.

## 📋 Flujo de Trabajo Paso a Paso
Instrucciones procedimentales numeradas y deterministas que el agente debe seguir en orden.

## 🛠️ Scripts y Herramientas Auxiliares
(Si aplica) Explicación de los scripts ubicados en `scripts/` y cómo ejecutarlos.

## ⚠️ Reglas y Consideraciones Críticas
Restricciones de seguridad, errores comunes que se deben evitar y buenas prácticas obligatorias.

## 📚 Referencias Adicionales
Enlaces a documentos complementarios en `references/`.
```

---

## 5. Directrices para Scripts (`scripts/`)

- **Determinismo**: Los scripts deben ser reproducibles, no interactivos (o aceptar flags no-interactivas como `-y` o `--non-interactive`).
- **Códigos de Salida Semánticos**:
  - `0`: Éxito / Validación pasada.
  - `> 0`: Error con mensaje explícito en `stderr` / `stdout`.
- **Portabilidad**: Preferir scripts de Shell POSIX (`#!/usr/bin/env sh` o `bash`), Python 3 estándar o Node.js sin dependencias pesadas innecesarias.
- **Seguridad**: No ejecutar comandos destructivos (`rm -rf /`, `git push --force`) sin confirmación explícita.

---

## 6. Mapeo y Compatibilidad Multi-Agente

| Agente / Entorno | Ubicación Nativa de Destino | Modo de Adaptación |
| :--- | :--- | :--- |
| **Google Antigravity** | `.agents/skills/<name>/` o `~/.gemini/config/skills/<name>/` | Nativo directo (`SKILL.md`) |
| **Claude Code** | `.claude/skills/<name>/` o `.claude/config/` | Nativo directo / Markdown import |
| **OpenAI Codex / CLI** | `.codex/skills/<name>/` | Nativo directo |
| **Cursor IDE** | `.cursorrules` / `.cursor/rules/` | Conversión/Inyección por adaptador |
| **Windsurf** | `.windsurfrules` | Conversión/Inyección por adaptador |
