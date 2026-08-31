# 🤝 Guía de Contribución: Agent Skills Hub

¡Gracias por tu interés en contribuir a **Agent Skills Hub**! Esta guía detalla el flujo de trabajo, las directrices de arquitectura, seguridad y buenas prácticas para diseñar, implementar y validar nuevas skills.

---

## 🛠️ Requisitos Previos

- **Node.js**: v18 o superior.
- **pnpm**: v9 o v10 (`npm install -g pnpm` o `corepack enable`).
- **Git**: Configurado en tu entorno local.
- **Bash / POSIX Shell**: Para probar scripts ejecutables (en tool-assisted skills).

---

## 🚀 Flujo de Trabajo Paso a Paso

### 1. Clonar el repositorio y crear una rama de trabajo

Sigue la convención de ramas: `feat/<categoria>-<nombre>` o `fix/<nombre>`:

```bash
git checkout -b feat/docker-optimization
```

### 2. Elegir el Tipo de Skill y Plantilla Base

Elige una de las plantillas en `templates/`:

| Tipo | Directorio Plantilla | Cuándo Usar |
| :--- | :--- | :--- |
| **Basic Skill (Solo Markdown)** | `templates/basic-skill/` | Para directrices de arquitectura, checklists, convenciones de código o flujos procedimentales sin scripts. |
| **Tool-Assisted Skill** | `templates/tool-assisted-skill/` | Para flujos que requieren scripts ejecutables (`scripts/`), documentación técnica extendida (`references/`) o bancos de ejemplos (`examples/`). |

Copia la plantilla dentro de la categoría adecuada en `skills/<categoría>/<nombre-de-skill>`:

```bash
mkdir -p skills/docker/docker-optimization
cp -r templates/tool-assisted-skill/* skills/docker/docker-optimization/
```

---

### 3. Redactar el Archivo `SKILL.md`

Todo `SKILL.md` DEBE comenzar con un bloque Frontmatter YAML válido que cumpla con [`docs/SPECIFICATION.md`](SPECIFICATION.md):

```yaml
---
name: docker-optimization
version: 1.0.0
description: >-
  Optimización de Dockerfiles con builds multi-stage, reducción de tamaño de imágenes y caching eficiente.
tags: [docker, containers, devops, optimization]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - optimizar dockerfile
  - docker multi-stage
  - reducir tamaño de imagen
requirements:
  tools: [run_command, view_file, replace_file_content]
  bins: [docker]
---
```

#### ⚠️ Reglas Críticas para el Frontmatter:
- **`name`**: Solo letras minúsculas, números y guiones (`^[a-z0-9-]+$`), máximo 40 caracteres.
- **`description`**: **Máximo 350 caracteres**. Debe responder concisamente qué hace y cuándo activarse (Principio de Progressive Disclosure).
- **`triggers`**: Mínimo 2 términos clave o intenciones desencadenantes (inglés / español).

---

### 4. Estructura del Cuerpo del Markdown

Asegúrate de incluir las secciones estándar:
1. `# Nombre de la Skill`
2. `## 🎯 Propósito`: Objetivo claro y problema que resuelve.
3. `## ⚡ Cuándo Activar esta Skill`: Disparadores inequívocos.
4. `## 📋 Flujo de Trabajo Paso a Paso`: Pasos numerados y deterministas (con diagrama Mermaid si aporta valor).
5. `## 🛠️ Scripts y Herramientas Auxiliares`: (Si aplica) explicación de cómo invocar los scripts en `scripts/`.
6. `## ⚠️ Reglas Críticas`: Restricciones de seguridad y directrices no negociables.
7. `## 📚 Referencias Adicionales`: Enlaces a archivos dentro de `references/` o `examples/`.

---

### 5. Directrices para Scripts (`scripts/`)

- **Determinismo**: Scripts no interactivos (o que acepten flags como `--yes`, `--non-interactive`, `-y`).
- **Códigos de Salida**: `0` para éxito, `>0` para errores con mensaje claro.
- **Permisos de Ejecución**: Ejecutar siempre `chmod +x scripts/*.sh` antes de commitear.
- **Seguridad**: Prohibido ejecutar comandos destructivos sin confirmación explícita (`rm -rf /`, `git push --force`).

---

### 6. Validación Obligatoria con el Linter

Antes de hacer commit o crear un PR, ejecuta el linter central:

```bash
# Validar todo el repositorio:
pnpm lint:skills

# Validar tu skill específica:
node scripts/lint-skills.mjs skills/docker/docker-optimization
```

El linter debe finalizar con `PASS: 0 errors, 0 warnings`.

---

## 📝 Convención de Commits

Todos los commits deben seguir **Conventional Commits**:

```bash
feat(docker): add docker-optimization skill with multi-stage scripts
fix(glab): correct issue scope in mr title generation
docs(contributing): update step-by-step contribution guide
```

---

## 📋 Criterios de Aceptación para Pull Requests

1. ✅ **Linter en Verde**: `pnpm lint:skills` sin errores.
2. ✅ **Progressive Disclosure**: Frontmatter ligero y sin runbooks completos dentro de la descripción.
3. ✅ **Agnosticismo**: Compatible con múltiples agentes de IA.
4. ✅ **Seguridad**: Sin credenciales, tokens o scripts destructivos.

---

## 📜 Licencia

Al contribuir a este repositorio, aceptas que tus contribuciones se licencien bajo los términos de la Licencia MIT.
