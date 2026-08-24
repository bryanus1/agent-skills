---
name: basic-skill-template
version: 1.0.0
description: >-
  Breve resumen (máx 350 caracteres) de lo que hace la skill y cuándo activarla.
  Incluye palabras clave que orienten al agente de IA.
tags: [workflow, template]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - trigger keyword 1
  - trigger keyword 2
requirements:
  tools: [view_file, replace_file_content]
---

# Nombre de la Skill

## 🎯 Propósito
Describe brevemente el problema específico que resuelve esta skill y el objetivo final esperado.

## ⚡ Cuándo Activar esta Skill
- Cuando el usuario solicite...
- Cuando se detecte el patrón o problema...

## 📋 Flujo de Trabajo Paso a Paso

1. **Paso 1: Análisis e Inspección**:
   - Inspeccionar los archivos relevantes usando las herramientas de lectura.
2. **Paso 2: Planificación**:
   - Diseñar la solución respetando las restricciones del proyecto.
3. **Paso 3: Ejecución**:
   - Aplicar los cambios o generar el código correspondiente.
4. **Paso 4: Verificación**:
   - Comprobar que los cambios compilen o pasen las pruebas correspondientes.

## ⚠️ Reglas Críticas
- Mantener la consistencia del código existente.
- No introducir dependencias no aprobadas.
