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

> Haz clic en el nombre de cualquier skill para abrir su **`README.md`**, donde encontrarás su comando de instalación específico, requisitos, ejemplos de prompts, scripts CLI y referencias técnicas.

<!-- Tabla generada por `pnpm catalog` a partir del frontmatter de cada SKILL.md. No editar a mano. -->
<!-- catalog-table:start -->
| Skill | Categoría | Versión | Agentes | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **[`flutter-architecture`](skills/architecture/flutter-architecture/README.md)** | `architecture` | `1.1.0` | Todos | Clean Architecture Feature-First para Flutter. Guía el diseño modular en lib/features/&lt;feature&gt;/ (domain, data, presentation) con BLoC/Cubit, Inyección de Dependencias (GetIt/Injectable), manejo funcional de errores con Result sealed class y pruebas unitarias con mocktail y bloc_test. |
| **[`monorepo-architecture`](skills/architecture/monorepo-architecture/README.md)** | `architecture` | `1.0.1` | Todos | Estándar de monorepo con pnpm workspaces y Turborepo para una web Next.js y una API NestJS: estructura apps/ y packages/, paquetes internos compilados, contratos compartidos (Zod u OpenAPI), límites de dependencias verificables y scaffolding de features full-stack. |
| **[`nestjs-architecture`](skills/architecture/nestjs-architecture/README.md)** | `architecture` | `2.0.0` | Todos | Estándar de Modular Monolith para NestJS 12 (NodeAdapter, SWC, Vitest y OXC). Guía el andamiaje de módulos de dominio, contratos DTO/Zod, Swagger OpenAPI, repositorios ORM-agnósticos, doble barrera RBAC/ownership y testing &gt;= 90%. |
| **[`nextjs-architecture`](skills/architecture/nextjs-architecture/README.md)** | `architecture` | `1.2.0` | Todos | Estándar de Screaming Architecture para Next.js App Router. Guía la estructuración por features, subcarpetas encapsuladas, Server Actions con Zod, hooks con TanStack Query, FormDialog, linting con OXC y testing con Vitest + SWC (&gt;= 90%) y Playwright E2E. |
| **[`react-native-architecture`](skills/architecture/react-native-architecture/README.md)** | `architecture` | `1.0.0` | Todos | Estándar de Screaming Architecture para React Native con Expo Router. Guía la estructuración por features, rutas delgadas en src/app, hooks con TanStack Query, estilos NativeWind y tests con cobertura &gt;= 90%. Incluye scaffolds de feature y componente. |
| **[`dart-import-organizer`](skills/dart/dart-import-organizer/README.md)** | `dart` | `1.0.1` | Todos | Organiza y estandariza imports en Dart y Flutter (.dart). Se aplica DESPUÉS de formatear el código. Agrupa jerárquicamente en 6 bloques: dart:* → flutter/terceros → package de app → relativos → export → part, con orden alfabético y líneas en blanco entre grupos. |
| **[`ssh-connect`](skills/devops/ssh-connect/README.md)** | `devops` | `1.0.0` | Todos | Gestión, conexión y ejecución remota en servidores SSH con ssh-connect. Soporta llaves .pem con permisos asegurados, contraseñas automatizadas (Keychain) y multiplexación persistente sin bloqueos de TTY. |
| **[`git-cleanup`](skills/git/git-cleanup/README.md)** | `git` | `1.0.0` | Todos | Limpieza segura de ramas locales de Git tras fusionar PRs (Squash/Merge). Protege ramas principales (main/master/develop), detecta ramas eliminadas en origin y elimina ramas obsoletas sin falsos negativos. |
| **[`gh-cli`](skills/github/gh-cli/README.md)** | `github` | `1.0.0` | Todos | Automatización de flujos de GitHub con gh CLI y scripts: Pull Requests con Conventional Commits, emojis y labels verificados, diagnóstico de GitHub Actions, issues y releases con notas generadas. Úsala al crear o revisar PRs, depurar workflows fallidos o publicar releases. |
| **[`glab-cli`](skills/gitlab/glab-cli/README.md)** | `gitlab` | `1.2.0` | Todos | Automatización de flujos de GitLab (MRs con Conventional Commits, emojis, Scoped Labels, diagnóstico de CI/CD y releases) usando glab CLI y scripts. |
| **[`issue-triage`](skills/project-management/issue-triage/README.md)** | `project-management` | `1.0.0` | Todos | Refina issues de Linear, GitHub o GitLab con solo título o notas desestructuradas. Explora el repo local, extrae restricciones y reglas, preserva estimaciones y fechas, y actualiza la descripción con una especificación estructurada lista para OpenSpec. |
| **[`ts-import-organizer`](skills/typescript/ts-import-organizer/README.md)** | `typescript` | `1.1.1` | Todos | Organiza imports en TypeScript/JavaScript (.ts, .tsx, .js, .jsx). Se aplica siempre DESPUÉS de formatear el código. Agrupa: builtins → externos → path aliases → side-effects. Ordena líneas y miembros ({ ... }) por longitud, elimina unused y convierte rutas relativas a aliases. Activa al ordenar imports o escribir código. |
<!-- catalog-table:end -->

---

## 📦 Cómo Instalar y Usar las Skills

Puedes instalar estas skills directamente desde GitHub en cualquier proyecto o asistente de IA usando [`skills.sh`](https://skills.sh) CLI o mediante enlaces simbólicos locales. Consulta el `README.md` de cada skill en la tabla superior para ver sus dependencias y ejemplos de activación.

### 1. Vía CLI oficial (`skills.sh`) — *Recomendado*

```bash
# Listar todas las skills disponibles en este repositorio:
npx skills add bryanus1/agent-skills --list

# Instalar una skill específica en tu proyecto actual:
npx skills add bryanus1/agent-skills --skill <skill-name>

# Instalar una skill globalmente en tu máquina (disponible para todos tus proyectos):
npx skills add bryanus1/agent-skills --skill <skill-name> -g

# Instalar todas las skills del repositorio:
npx skills add bryanus1/agent-skills --all
```

### 2. Vía Enlace Simbólico (Symlink Local)

Si tienes este repositorio clonado en tu máquina y quieres reflejar los cambios automáticamente:

```bash
# Para Google Antigravity:
mkdir -p .agents/skills
ln -s /ruta/a/agent-skills/skills/<categoria>/<skill-name> .agents/skills/<skill-name>

# Para Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/<skill-name> .claude/skills/<skill-name>
```

---

## 📂 Estructura del Repositorio

```
agent-skills/
├── docs/                        # Estándares técnicos y de contribución
│   ├── SPECIFICATION.md         # Especificación técnica v1.0.0 del formato de skills
│   └── CONTRIBUTING.md          # Flujo de trabajo y normas para contribuir
├── templates/                   # Plantillas base (incluyen README.md y SKILL.md)
│   ├── basic-skill/             # Plantilla para flujos basados en Markdown puro
│   └── tool-assisted-skill/     # Plantilla con scripts ejecutables y referencias
├── skills/                      # Catálogo organizado por categorías (<categoría>/<skill>/)
│   ├── architecture/            # flutter, monorepo, nestjs, nextjs, react-native
│   ├── dart/                    # dart-import-organizer
│   ├── devops/                  # ssh-connect
│   ├── git/                     # git-cleanup
│   ├── github/                  # gh-cli
│   ├── gitlab/                  # glab-cli
│   └── typescript/              # ts-import-organizer
├── catalog/
│   └── catalog.json             # Índice de skills generado por `pnpm catalog`
├── scripts/                     # Herramientas de automatización y validación del hub
│   ├── lib/skills.mjs           # Descubrimiento y parseo de SKILL.md compartido
│   ├── lint-skills.mjs          # Linter: schema, README.md, enlaces, rutas absolutas y secciones
│   ├── build-catalog.mjs        # Genera catalog.json y la tabla del README
│   └── check-skill-versions.mjs # Verifica incrementos SemVer en PRs
├── tests/                       # Suite de pruebas unitarias (node:test)
├── AGENTS.md                    # Instrucciones y reglas para agentes trabajando en este repo
├── package.json
└── README.md
```

Cada carpeta de skill (`skills/<categoría>/<skill>/`) contiene su propio **`README.md`** (documentación humana, instalación y ejemplos) y su **`SKILL.md`** (instrucciones operativas para el agente).

---

## 🤝 Cómo Contribuir y Trabajar en este Repo

Para mantener la calidad y el estándar agnóstico, revisa la [**Guía de Contribución (`docs/CONTRIBUTING.md`)**](docs/CONTRIBUTING.md) y la [**Especificación Técnica (`docs/SPECIFICATION.md`)**](docs/SPECIFICATION.md).

### Resumen del flujo de desarrollo:

1. **Crear una rama**: `git checkout -b feat/mi-nueva-skill`.
2. **Elegir plantilla**: Copiar desde `templates/basic-skill` o `templates/tool-assisted-skill`.
3. **Escribir `SKILL.md` y `README.md`**: Definir Frontmatter YAML válido en `SKILL.md` (`name`, `version`, `description` < 350 chars, `triggers`) y documentar la instalación y ejemplos de uso en `README.md`.
4. **Validar con el Linter, regenerar el catálogo y ejecutar tests**:
   ```bash
   pnpm lint:strict
   pnpm catalog
   pnpm test
   ```
5. **Commit con Conventional Commits**: `feat(categoria): add mi-nueva-skill`.

---

## 📄 Licencia

Distribuido bajo la Licencia [MIT](LICENSE).
