---
name: tool-assisted-skill-template
version: 1.0.0
description: >-
  Plantilla avanzada para skills que combinan instrucciones paso a paso con scripts ejecutables y documentación complementaria.
tags: [tools, scripts, template]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - tool assisted
  - script execution
requirements:
  tools: [run_command, view_file, replace_file_content]
  bins: [bash]
---

# Skill Asistida por Herramientas y Scripts

## 🎯 Propósito
Descripción del flujo de trabajo automatizado que combina razonamiento del modelo y ejecución determinista de scripts.

## ⚡ Cuándo Activar esta Skill
- Cuando se requiera ejecutar diagnósticos automáticos, validaciones o transformaciones con scripts incluidos.

## 📋 Flujo de Trabajo Paso a Paso

1. **Paso 1: Diagnóstico y Preparación**:
   - Ejecutar el script de diagnóstico inicial:
     ```bash
     bash scripts/run.sh --check
     ```
2. **Paso 2: Aplicación del Flujo**:
   - Consultar la guía de referencia en [Guía Técnica](file:///Users/brayansanjuan/Development/personal/agent-skills/templates/tool-assisted-skill/references/guide.md) para detalles sobre la arquitectura o reglas complejas.
3. **Paso 3: Validación Final**:
   - Re-ejecutar el script de verificación y confirmar salida exitosa.

## 🛠️ Scripts Auxiliares

* `scripts/run.sh`: Script principal de automatización y validación.
  * Opciones: `--check` (solo diagnóstico), `--fix` (aplica correcciones automáticas).

## 📚 Referencias y Ejemplos
* [Guía Técnica](file:///Users/brayansanjuan/Development/personal/agent-skills/templates/tool-assisted-skill/references/guide.md)
* [Ejemplos de Entrada/Salida](file:///Users/brayansanjuan/Development/personal/agent-skills/templates/tool-assisted-skill/examples/sample.md)
