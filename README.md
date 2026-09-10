# 🤖 Agent Skills Hub

> **Repositorio centralizado de habilidades (*skills*), utilidades y flujos de trabajo agnósticos para Google Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf, Roo Code y asistentes de IA.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Skills Status](https://img.shields.io/badge/Skills-Validated-brightgreen.svg)](scripts/lint-skills.mjs)
[![Skills.sh Compatible](https://img.shields.io/badge/Skills.sh-Compatible-blue.svg)](https://skills.sh)

---

## 📖 Descripción General

**Agent Skills Hub** es un ecosistema abierto y estandarizado de habilidades modulares que enseñan a agentes y asistentes de IA cómo ejecutar tareas complejas con alta precisión y consistencia.

Diseñado bajo el principio de **Progressive Disclosure**:
1. **Descubrimiento (Level 1)**: Solo `name` y `description` se cargan en el prompt inicial.
2. **Activación (Level 2)**: El agente lee `SKILL.md` únicamente cuando la tarea coincide con los `triggers`.
3. **Profundización (Level 3)**: Documentación en `references/` o utilidades en `scripts/` se leen solo cuando se necesita.

---

## ⚡ Skills Disponibles en el Catálogo

| Skill | Categoría | Agentes | Descripción |
| :--- | :--- | :--- | :--- |
| **[`flutter-architecture`](skills/architecture/flutter-architecture/SKILL.md)** | `architecture` / `mobile` | Todos | Feature-First Clean Architecture para Flutter (`domain`, `data`, `presentation`), BLoC/Cubit, GetIt/Injectable, Result sealed class de Dart 3 y andamiaje CLI de 13 archivos. |
| **[`nextjs-architecture`](skills/architecture/nextjs-architecture/SKILL.md)** | `architecture` / `frontend` | Todos | Screaming Architecture (Feature-Driven / Domain-First) para Next.js App Router, leaf-folder barrel policy, FormDialog, Server Actions vs TanStack Query y generadores CLI. |
| **[`nestjs-architecture`](skills/architecture/nestjs-architecture/SKILL.md)** | `architecture` / `backend` | Todos | Monolito Modular y Clean Architecture para NestJS, andamiaje de 18 archivos, persistencia agnóstica a ORM con contrato `I<Noun>Repository`, Swagger OpenAPI exhaustivo y doble barrera de seguridad (RBAC). |
| **[`dart-import-organizer`](skills/dart/dart-import-organizer/SKILL.md)** | `dart` / `clean-code` | Todos | Organización de directivas Dart post-formateo en 6 grupos jerárquicos (`dart:*` ➔ `flutter`/terceros ➔ `package:app` ➔ relativos ➔ `export` ➔ `part`), orden alfabético y script CLI. |
| **[`glab-cli`](skills/gitlab/glab-cli/SKILL.md)** | `gitlab` / `devops` | Todos | Automatización de GitLab con Conventional Commits, emojis, Scoped Labels, diagnóstico de CI/CD y gestión de releases. |
| **[`ts-import-organizer`](skills/typescript/ts-import-organizer/SKILL.md)** | `typescript` / `clean-code` | Todos | Organización de imports en TS/JS post-formateo (4 grupos, multilíneas primero, miembros por longitud ascendente, aliases `@/` e `import type`). |

---

## 📦 Cómo Instalar y Usar las Skills en Cualquier Proyecto

Puedes instalar estas skills directamente desde GitHub en cualquier proyecto o asistente de IA usando [`skills.sh`](https://skills.sh) CLI o enlaces directos:

### 1. Vía CLI oficial (`skills.sh`) — *Recomendado*

```bash
# Ver todas las skills disponibles en este repositorio
npx skills add bryanus1/agent-skills --list

# Instalar una skill específica en tu proyecto actual:
npx skills add bryanus1/agent-skills --skill flutter-architecture
npx skills add bryanus1/agent-skills --skill dart-import-organizer
npx skills add bryanus1/agent-skills --skill nextjs-architecture
npx skills add bryanus1/agent-skills --skill nestjs-architecture
npx skills add bryanus1/agent-skills --skill glab-cli
npx skills add bryanus1/agent-skills --skill ts-import-organizer

# Instalar todas las skills del repositorio:
npx skills add bryanus1/agent-skills --all

# Instalar globalmente en tu máquina (disponible para todos tus proyectos):
npx skills add bryanus1/agent-skills --skill flutter-architecture -g
```

### 2. Vía Enlace Simbólico (Symlink Local)

Si tienes este repositorio clonado en tu máquina y quieres reflejar los cambios automáticamente:

```bash
# Para Google Antigravity:
mkdir -p .agents/skills
ln -s /ruta/a/agent-skills/skills/architecture/flutter-architecture .agents/skills/flutter-architecture
ln -s /ruta/a/agent-skills/skills/dart/dart-import-organizer .agents/skills/dart-import-organizer
ln -s /ruta/a/agent-skills/skills/architecture/nextjs-architecture .agents/skills/nextjs-architecture
ln -s /ruta/a/agent-skills/skills/architecture/nestjs-architecture .agents/skills/nestjs-architecture

# Para Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/flutter-architecture .claude/skills/flutter-architecture
ln -s ../../.agents/skills/dart-import-organizer .claude/skills/dart-import-organizer
ln -s ../../.agents/skills/nextjs-architecture .claude/skills/nextjs-architecture
ln -s ../../.agents/skills/nestjs-architecture .claude/skills/nestjs-architecture
```

---

## 💡 Ejemplos de Activación y Uso con Agentes de IA

Una vez instalada una skill, tu asistente de IA la activará automáticamente cuando uses lenguaje natural:

### 📱 Ejemplo con `flutter-architecture`:

* **Andamiar una feature completa con BLoC**:
  > *"Estructura la feature de facturación (billing) con Clean Architecture y el modelo invoice en Flutter"*
  > 
  > 🤖 **El agente ejecutará**: `node skills/architecture/flutter-architecture/scripts/scaffold-feature.mjs billing --model invoice`  
  > ➔ Genera las 3 capas (`domain`, `data`, `presentation`), contratos de repositorio con Result, BLoC con estados inmutables y tests unitarios con `mocktail`.

* **Andamiar con Cubit**:
  > *"Crea la feature del carrito de compras (cart) usando Cubit"*
  > 
  > 🤖 **El agente ejecutará**: `node skills/architecture/flutter-architecture/scripts/scaffold-feature.mjs cart --model cart_item --cubit`  
  > ➔ Genera la feature con `CartItemCubit`, estados sellados y suite de pruebas en `test/features/cart/`.

---

### 🎯 Ejemplo con `dart-import-organizer`:

* **Organizar imports de un archivo o directorio**:
  > *"Reorganiza y limpia los imports de este archivo `login_screen.dart` después de darle formato"*
  > 
  > 🤖 **El agente aplicará**:
  > 1. Formato sintáctico asegurado con `dart format`.
  > 2. Reorganización en los 6 bloques canónicos: `dart:*` ➔ terceros y `package:flutter/*` ➔ paquete de la app ➔ relativos locales ➔ `export` ➔ `part`.
  > 3. Ordenamiento alfabético por URI y de miembros en cláusulas `show`/`hide`.
  > 
  > O ejecutará: `node skills/dart/dart-import-organizer/scripts/organize-dart-imports.mjs lib/features/auth --write`

---

### ⚡ Ejemplo con `nextjs-architecture`:

* **Andamiar una feature completa**:
  > *"Estructura la feature de facturación (billing) con Screaming Architecture y un modelo inicial"*
  > 
  > 🤖 **El agente ejecutará**: `node skills/architecture/nextjs-architecture/scripts/scaffold-feature.mjs billing --model invoice`  
  > ➔ Genera las 7 subcarpetas (`components`, `hooks`, `models`, `schemas`, `screens`, `services`, `utils`), modelos planos `.ts` sin tests, screen encapsulada y barrel de hoja terminal.

* **Crear componente modal desacoplado**:
  > *"Crea un diálogo modal para crear facturas en billing con shadcn Dialog"*
  > 
  > 🤖 **El agente ejecutará**: `node skills/architecture/nextjs-architecture/scripts/scaffold-component.mjs create-invoice-dialog --feature billing --variant dialog`  
  > ➔ Genera el patrón `FormDialog` con TSDoc, validación y tests unitarios.

---

### 🏛️ Ejemplo con `nestjs-architecture`:

* **Andamiar módulo de dominio completo**:
  > *"Crea el módulo de facturas (invoice) con arquitectura limpia y contrato de repositorio"*
  > 
  > 🤖 **El agente ejecutará**: `node skills/architecture/nestjs-architecture/scripts/scaffold-module.mjs invoice --target-dir src/modules`  
  > ➔ Genera los **18 archivos** del módulo (`entities`, `dto`, `repositories/repository.ts` con contrato `IInvoiceRepository` y token `INVOICE_REPOSITORY_TOKEN`, `repositories/invoice.repository.ts`, `services` desacoplados, `controllers` con Swagger completo, specs unitarias y `invoice.module.ts`).

---

### 🦊 Ejemplo con `glab-cli`:

* **Crear Merge Request estandarizado**:
  > *"Crea un Merge Request para la funcionalidad de autenticación vinculada al issue #42"*
  > 
  > 🤖 **El agente ejecutará**: `./skills/gitlab/glab-cli/scripts/create_mr.sh --issue 42 --domain auth`  
  > ➔ Genera el título con emoji: `feat(#42): ✨ nextauth credentials`, asigna los Scoped Labels oficiales (`type::feature`, `domain::auth`, `layer::frontend`) y redacta la descripción estructurada.

* **Sin Issue ID (sin scope)**:
  > *"Crea un MR para actualizar las dependencias de Zod"*
  > 
  > 🤖 **El agente ejecutará**: `./skills/gitlab/glab-cli/scripts/create_mr.sh --domain operations`  
  > ➔ Genera título limpio sin paréntesis de scope: `chore: 🔧 upgrade zod`.

* **Diagnosticar pipeline fallido**:
  > *"El pipeline de CI falló en mi rama, ayúdame a ver qué pasó"*
  > 
  > 🤖 **El agente ejecutará**: `./skills/gitlab/glab-cli/scripts/diagnose_pipeline.sh --job lint`

---

### 🟦 Ejemplo con `ts-import-organizer`:

* **Limpiar y ordenar imports (Post-formateo)**:
  > *"Organiza los imports de este archivo `Dashboard.tsx`, elimina los que no use y cambia las rutas relativas `../../../` por `@/`"*
  > 
  > 🤖 **El agente aplicará**:
  > 1. Formateo previo del código (sintaxis y cuerpo del archivo asegurados primero).
  > 2. Depuración de imports: elimina unused, consolida duplicados y convierte rutas relativas a `@/`.
  > 3. Conversión a `import type` para interfaces y tipos de TypeScript.
  > 4. Agrupación en 4 bloques: `builtins` ➔ `externos` ➔ `@/ aliases / locales` ➔ `side-effects`.
  > 5. Jerarquía dentro del grupo: imports multilínea primero y monolíneas después, con todos los miembros internos ordenados por longitud ascendente.

---

## 📂 Estructura del Repositorio

```
agent-skills/
├── docs/                        # Estándares técnicos y de contribución
│   ├── SPECIFICATION.md         # Especificación técnica v1.0.0 del formato de skills
│   └── CONTRIBUTING.md          # Flujo de trabajo y normas para contribuir
├── templates/                   # Plantillas para crear nuevas skills
│   ├── basic-skill/             # Plantilla para flujos basados en Markdown puro
│   └── tool-assisted-skill/     # Plantilla con scripts ejecutables y referencias
├── skills/                      # Catálogo organizado por categorías
│   ├── architecture/            # Arquitectura empresarial frontend, mobile y backend
│   │   ├── flutter-architecture/# Clean Architecture Feature-First, BLoC y Result en Flutter
│   │   ├── nestjs-architecture/ # Modular Monolith, contratos DIP y Swagger en NestJS
│   │   └── nextjs-architecture/ # Screaming Architecture y App Router en Next.js
│   ├── dart/
│   │   └── dart-import-organizer/# Organización canónica de directivas Dart en 6 grupos
│   ├── gitlab/
│   │   └── glab-cli/            # Flujos y scripts para GitLab CLI
│   └── typescript/
│       └── ts-import-organizer/ # Reglas y ejemplos de imports limpios en TypeScript
├── scripts/                     # Herramientas de automatización del hub
│   └── lint-skills.mjs          # Linter y validador de schema YAML
├── AGENTS.md                    # Instrucciones y reglas para agentes trabajando en este repo
├── package.json
└── README.md
```

---

## 🤝 Cómo Contribuir y Trabajar en este Repo

Para mantener la calidad y el estándar agnóstico, revisa la [**Guía de Contribución (`docs/CONTRIBUTING.md`)**](docs/CONTRIBUTING.md).

### Resumen del flujo de desarrollo:

1. **Crear una rama**: `git checkout -b feat/mi-nueva-skill`.
2. **Elegir plantilla**: Copiar desde `templates/basic-skill` o `templates/tool-assisted-skill`.
3. **Escribir `SKILL.md`**: Definir Frontmatter YAML válido (`name`, `version`, `description` < 350 chars, `triggers`).
4. **Validar con el Linter**:
   ```bash
   pnpm lint:skills
   ```
5. **Commit con Conventional Commits**: `feat(categoria): add mi-nueva-skill`.

---

## 📄 Licencia

Distribuido bajo la Licencia [MIT](LICENSE).
