---
name: react-native-architecture
version: 1.1.0
description: >-
  Estándar Screaming Architecture para React Native y Expo Router. Guía estructuración por features, rutas delgadas en src/app, TanStack Query, NativeWind, tests Jest >= 90%, análisis estático con Oxlint y formato Oxfmt. Incluye validador y scaffolds de feature, componente, hook y servicio.
tags: [react-native, expo, expo-router, screaming-architecture, mobile, tanstack-query, nativewind, oxlint, oxc, jest]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - react native architecture
  - expo router architecture
  - scaffold react native feature
  - react native feature
  - screaming architecture react native
  - arquitectura react native
  - crear feature react native
  - estructurar expo
  - expo app structure
  - expo router tabs
  - proteger rutas expo
  - crear pantalla react native
  - react native tanstack hook
  - oxlint expo
  - configurar lint react native
requirements:
  tools: [run_command, view_file, replace_file_content, write_to_file]
  bins: [node]
---

# 📱 React Native Screaming Architecture Standard

## 🎯 Propósito

Estandarizar el diseño y la modularización de apps **React Native con Expo Router** siguiendo **Screaming Architecture** (Feature-Driven / Domain-First), el equivalente móvil de [`nextjs-architecture`](../nextjs-architecture/SKILL.md). Garantiza código desacoplado mediante encapsulación en subcarpetas, rutas delgadas en `src/app`, separación de UI, hooks, servicios, esquemas y modelos, y tests con cobertura $\ge 90\%$.

**Stack asumido:** Expo + Expo Router, TanStack Query, NativeWind (`className`), Zod, Jest + `@testing-library/react-native`, Oxlint + Oxfmt (`sortTailwindcss: true`), alias `@/*` → `src/*`.

---

## ⚡ Cuándo Activar esta Skill

- Al crear o refactorizar módulos de negocio en `src/features/<feature-name>/`.
- Al crear componentes compartidos (`src/components/common/`) o específicos de una feature.
- Al conectar pantallas con rutas de Expo Router (`src/app/**`).
- Al implementar flujos de datos con **TanStack Query** (key factories + hooks + servicios).
- Al definir esquemas Zod (`*.schema.ts`) o modelos de dominio (`models/*.ts`).
- Al validar nombres, sufijos y la política de barrel files.
- Al ejecutar análisis estático con Oxlint o formateo con Oxfmt.

> **Monorepo:** si la app vive en `apps/mobile`, aplica estas reglas dentro de `apps/mobile/src/` y usa también [`monorepo-architecture`](../monorepo-architecture/SKILL.md). Genera con `--target-dir apps/mobile/src/features --app-dir apps/mobile/src/app`.

---

## 📋 Flujo de Trabajo Paso a Paso

```mermaid
flowchart TD
    A["1. Identificar Feature"] --> B["2. Scaffolding\n(scaffold-feature.mjs)"]
    B --> C["3. Modelos\n(models/*.ts)"]
    C --> D["4. Servicios con Zod\n(scaffold-service.mjs)"]
    D --> E["5. Key Factories & Hooks\n(scaffold-hook.mjs)"]
    E --> F["6. Componentes & Screens\n(scaffold-component.mjs)"]
    F --> G["7. Ruta delgada en Expo Router\n(src/app/**)"]
    G --> H["8. Validar Arquitectura\n(check-architecture.mjs)"]
    H --> I["9. Tests & Calidad\n(Jest >= 90%, Oxlint, Oxfmt)"]
```

### 1. Modelado de dominio (`models/`)
Archivos planos TypeScript en `models/<entity>.ts`, con `models/index.ts` que los reexporta. Sin tests.

### 2. Servicios (`services/`)
Un servicio por subcarpeta: `<verb>-<noun>/<verb>-<noun>.service.ts` con su test e `index.ts`. Usan el cliente HTTP tipado de `src/config/api-client` y validan la respuesta con `schema.parse()`. No hay Server Actions en móvil.

### 3. Esquemas (`schemas/`)
Archivos planos `<name>.schema.ts` con Zod, constante `camelCase` terminada en `Schema`, barrel `schemas/index.ts`. Sin tests.

### 4. Key Factories & Hooks (`hooks/`)
- Key factories en subcarpetas independientes: `hooks/<entity>-keys/<entity>.keys.ts` con jerarquía `all → lists() → list(filters) → details() → detail(id)`.
- Hooks de consulta y mutación en `hooks/use-<action>/use-<action>.hook.ts` consumiendo la factory correspondiente. Ver [patrón TanStack Query](references/tanstack-query-pattern.md).

### 5. Componentes y screens (`components/`, `screens/`)
- Usar primitivas de RN (`View`, `Text`, `Pressable`, `FlashList`, `expo-image`) con `className` de NativeWind; sin `div`/`span`.
- Cada componente o screen vive en su subcarpeta con implementación, test adyacente e `index.ts`.
- Modales: arquetipo `--type modal` con labels personalizables y soporte `dark:`. Documentar props con TSDoc. Ver [patrones de componentes](references/nativewind-component-patterns.md).

### 6. Rutas en Expo Router (`src/app/`)
Cada `index.tsx`, `[id].tsx` o `_layout.tsx` solo importa y reexporta/renderiza la screen de la feature. Sin lógica ni tests en `src/app/`; si hace falta lógica (parámetros, guardas de acceso), se extrae a `src/features/<feature>/utils/`. Ver [rutas delgadas](references/expo-router-thin-routes.md).

---

## ⚠️ Reglas Críticas

1. **Barrels solo en carpetas hoja (*Leaf-Folder Barrel Policy*)**: `index.ts` únicamente en carpetas con archivos de implementación directos (`components/invoice-card/`, `models/`, `schemas/`, `utils/`). Nunca en la raíz de la feature ni en agrupadores como `components/`, `hooks/`, `screens/`.
2. **Imports directos a la carpeta con `index.ts`**:
   ```typescript
   // ✅ CORRECTO
   import { useInvoices } from '@/features/billing/hooks/use-invoices';
   import { invoiceKeys } from '@/features/billing/hooks/invoice-keys';
   import { IInvoice } from '@/features/billing/models';

   // ❌ PROHIBIDO: carpetas contenedoras
   import { useInvoices, IInvoice } from '@/features/billing';
   import { InvoiceCard } from '@/features/billing/components';
   ```
3. **Encapsulación por subcarpeta** en `kebab-case`: implementación, test e `index.ts`.
4. **Rutas delgadas**: `src/app/**` no contiene lógica ni tests.
5. **Cobertura $\ge 90\%$** con tests adyacentes (`.test.ts(x)`). Excluidos: `models/`, `schemas/`, `hooks/*-keys/`, `src/app/`, barrels `index.ts` y constantes puras (`src/config/env.ts`, `src/config/constants.ts`). Los módulos con lógica o I/O en `src/config/` (como `api-client.ts`) sí requieren tests unitarios.
6. **Sin web APIs y almacenamiento seguro**: nada de `div`, `window` ni `localStorage`. Usar primitivas RN; guardar tokens de sesión exclusivamente en `expo-secure-store`, nunca en `AsyncStorage`.
7. **Límites entre features**: una feature no debe importar `screens/` ni `components/` internos de otra feature. Componentes o utilidades compartidas deben promoverse a `src/components/common/`, `src/lib/` o `src/stores/`.

---

## 📚 Referencias

- [Guía de Screaming Architecture](references/screaming-architecture-guide.md): estructura de directorios, capas y convenciones de nombres.
- [Rutas delgadas con Expo Router](references/expo-router-thin-routes.md): cómo conectar screens a `src/app`.
- [Navegación y Autenticación](references/navigation-and-auth.md): grupos `(auth)`/`(app)`, `Stack.Protected`, typed routes y tokens seguros.
- [Patrón TanStack Query](references/tanstack-query-pattern.md): servicios, key factories, queries y mutaciones.
- [Estado, Formularios y Offline](references/state-forms-and-offline.md): Zustand, react-hook-form + Zod, AppState y NetInfo.
- [Patrones de componentes con NativeWind](references/nativewind-component-patterns.md): primitivas, modales y testing.
- [Plataforma, Rendimiento y Accesibilidad](references/platform-performance-a11y.md): `.ios`/`.android`, FlashList, expo-image y a11y.
- [Testing y Tooling (Jest + OXC)](references/testing-and-tooling.md): jest-expo, Oxlint con reglas arquitectónicas y Oxfmt.

---

## 🛠️ Scripts

> **Rutas:** `<skill-dir>` es el directorio que contiene este `SKILL.md` (p. ej. `.claude/skills/<name>/` o `.agents/skills/<name>/`). Ejecuta los scripts desde la raíz del proyecto del usuario, no desde `<skill-dir>`.

> **Seguridad:** los scripts abortan sin escribir nada si alguno de los archivos que generan ya existe. Ejecuta primero con `--dry-run` para ver qué se va a crear. Usa `--force` (sobrescribe esos archivos) solo con confirmación explícita del usuario.

### 1. Generar una feature completa
```bash
node <skill-dir>/scripts/scaffold-feature.mjs <feature-name> [--target-dir <path>] [--app-dir <path>] [--route-path <path>] [--with-starter] [--with-route] [--with-layout] [--minimal] [--dry-run] [--force]
```
*Ejemplo:* `node <skill-dir>/scripts/scaffold-feature.mjs billing --with-starter --with-route --route-path "(tabs)/billing" --with-layout`

### 2. Generar un componente encapsulado
```bash
node <skill-dir>/scripts/scaffold-component.mjs <component-name> [--target-dir <path>] [--type default|modal|section] [--dry-run] [--force]
```
*Ejemplo:* `node <skill-dir>/scripts/scaffold-component.mjs create-invoice-modal --target-dir src/features/billing/components --type modal`

### 3. Generar un hook con TanStack Query
```bash
node <skill-dir>/scripts/scaffold-hook.mjs <hook-name> --feature <feature-name> [--kind query|mutation] [--entity <name>] [--dry-run] [--force]
```
*Ejemplo:* `node <skill-dir>/scripts/scaffold-hook.mjs use-invoices --feature billing --kind query --entity invoice`

### 4. Generar un servicio de datos
```bash
node <skill-dir>/scripts/scaffold-service.mjs <verb-noun> --feature <feature-name> [--dry-run] [--force]
```
*Ejemplo:* `node <skill-dir>/scripts/scaffold-service.mjs get-invoices --feature billing`

### 5. Configurar tooling estándar (Jest + OXC)
```bash
node <skill-dir>/scripts/setup-tooling.mjs [--only lint|format|test] [--dry-run] [--force]
```
*Ejemplo:* `node <skill-dir>/scripts/setup-tooling.mjs`

### 6. Validar reglas de Screaming Architecture
```bash
node <skill-dir>/scripts/check-architecture.mjs [--src-dir <dir>] [--include-imports] [--json]
```
*Ejemplo:* `node <skill-dir>/scripts/check-architecture.mjs --include-imports`
