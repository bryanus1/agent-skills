# 🎯 Dart & Flutter Import Organizer (`dart-import-organizer`)

> **Organiza y estandariza imports en Dart y Flutter (`.dart`). Se aplica siempre DESPUÉS de formatear el código (`dart format`). Agrupa jerárquicamente en 6 bloques: `dart:*` → `flutter`/terceros → package de la app → relativos → `export` → `part`, con orden alfabético y líneas en blanco entre grupos.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `dart-import-organizer` |
| **Categoría** | `dart` |
| **Versión** | `1.0.1` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requisitos** | `node`, `dart` |

---

## 📦 Instalación

### Vía `skills.sh` CLI (Recomendado)

```bash
# Instalar en el proyecto actual:
npx skills add bryanus1/agent-skills --skill dart-import-organizer

# Instalar globalmente en tu máquina:
npx skills add bryanus1/agent-skills --skill dart-import-organizer -g
```

### Vía Enlace Simbólico Local

```bash
# Google Antigravity:
mkdir -p .agents/skills
ln -s /ruta/a/agent-skills/skills/dart/dart-import-organizer .agents/skills/dart-import-organizer

# Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/dart-import-organizer .claude/skills/dart-import-organizer
```

---

## 💡 Ejemplos de Uso con Agentes de IA

* **Organizar imports de un archivo o directorio**:
  > *"Reorganiza y limpia los imports de este archivo `login_screen.dart` después de darle formato"*
  >
  > 🤖 **El agente aplicará**:
  > 1. Formato sintáctico asegurado con `dart format`.
  > 2. Reorganización en los 6 bloques canónicos: `dart:*` ➔ terceros y `package:flutter/*` ➔ paquete de la app ➔ relativos locales ➔ `export` ➔ `part`.
  > 3. Ordenamiento alfabético por URI y de miembros en cláusulas `show`/`hide`.
  >
  > O ejecutará: `node <skill-dir>/scripts/organize-dart-imports.mjs lib/features/auth --write`

---

## 🛠️ Scripts y Opciones CLI

> `<skill-dir>` es el directorio donde está instalada esta skill (p. ej. `.agents/skills/dart-import-organizer` o `.claude/skills/dart-import-organizer`).

### [`scripts/organize-dart-imports.mjs`](scripts/organize-dart-imports.mjs)

```bash
# Organizar y reescribir un archivo Dart específico:
node <skill-dir>/scripts/organize-dart-imports.mjs lib/features/auth/presentation/screens/login_screen.dart --write

# Organizar recursivamente toda la carpeta lib/:
node <skill-dir>/scripts/organize-dart-imports.mjs lib --write

# Verificar en modo CI sin modificar (exit code > 0 si hay desorden):
node <skill-dir>/scripts/organize-dart-imports.mjs lib --check

# Vista previa de cambios (Dry-Run):
node <skill-dir>/scripts/organize-dart-imports.mjs lib/main.dart --dry-run
```

---

## 📚 Documentación y Referencias

- **[`SKILL.md`](SKILL.md)**: Especificación operativa completa, jerarquía de 6 bloques y reglas críticas para el agente.
- **[Ejemplos Antes y Después](examples/before-after-imports.md)**: Casos reales de refactorización y ordenamiento de imports en Flutter.
