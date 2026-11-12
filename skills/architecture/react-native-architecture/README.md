# 📱 React Native Screaming Architecture (`react-native-architecture`)

> **Estándar de Screaming Architecture para React Native con Expo Router. Guía la estructuración por features, rutas delgadas en `src/app`, hooks con TanStack Query, estilos NativeWind, tests con Jest ($\ge 90\%$), análisis estático ultra-rápido con Oxlint y formato Oxfmt.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `react-native-architecture` |
| **Categoría** | `architecture` |
| **Versión** | `1.1.0` |
| **Agentes Compatibles** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requisitos** | `node` |

---

## 📦 Instalación

### Vía `skills.sh` CLI (Recomendado)

```bash
# Instalar en el proyecto actual:
npx skills add bryanus1/agent-skills --skill react-native-architecture

# Instalar globalmente en tu máquina:
npx skills add bryanus1/agent-skills --skill react-native-architecture -g
```

### Vía Enlace Simbólico Local

```bash
# Google Antigravity:
mkdir -p .agents/skills
ln -s /ruta/a/agent-skills/skills/architecture/react-native-architecture .agents/skills/react-native-architecture

# Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/react-native-architecture .claude/skills/react-native-architecture
```

---

## 💡 Ejemplos de Uso con Agentes de IA

* **Andamiar una feature móvil completa con ruta en Expo Router y layout**:
  > *"Crea la feature de facturación (billing) en React Native con screen inicial, layout y ruta en (tabs)/billing"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-feature.mjs billing --with-starter --with-route --route-path "(tabs)/billing" --with-layout`  
  > ➔ Genera las subcarpetas en `src/features/billing/`, el modelo plano, la screen `billing-home` con NativeWind y test unitario, y la ruta delgada con `_layout.tsx` en `src/app/(tabs)/billing/`.

* **Crear un hook de mutación con TanStack Query y key factory**:
  > *"Crea el hook use-create-invoice en la feature billing"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-hook.mjs use-create-invoice --feature billing --kind mutation --entity invoice`  
  > ➔ Genera la key factory jerárquica `invoiceKeys` en `hooks/invoice-keys/`, el hook `useCreateInvoice` con invalidación automática de listas y su test con `QueryClientProvider`.

* **Crear un servicio de datos**:
  > *"Crea el servicio get-invoices para la feature billing"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-service.mjs get-invoices --feature billing`  
  > ➔ Genera `services/get-invoices/get-invoices.service.ts` con tipado de `apiClient` y su test con mocks.

* **Configurar tooling Jest + OXC en el proyecto**:
  > *"Configura Oxlint, Oxfmt y Jest con las reglas de arquitectura en mi app móvil"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/setup-tooling.mjs`  
  > ➔ Genera `.oxlintrc.json` con restricciones de imports arquitectónicos, `.oxfmtrc.json` con ordenamiento de clases Tailwind y `jest.config.js`.

* **Validar cumplimiento de la arquitectura**:
  > *"Verifica si mi código cumple con Screaming Architecture"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/check-architecture.mjs --include-imports`  
  > ➔ Audita barrels en carpetas contenedoras, rutas no delgadas en `src/app/`, tests ausentes y uso accidental de APIs del navegador.

---

## 🛠️ Scripts y Opciones CLI

> `<skill-dir>` es el directorio donde está instalada esta skill (p. ej. `.agents/skills/react-native-architecture` o `.claude/skills/react-native-architecture`).

- **[`scripts/scaffold-feature.mjs`](scripts/scaffold-feature.mjs)**:
  ```bash
  node <skill-dir>/scripts/scaffold-feature.mjs <feature-name> [--target-dir <path>] [--app-dir <path>] [--route-path <path>] [--with-starter] [--with-route] [--with-layout] [--minimal] [--dry-run] [--force]
  ```
- **[`scripts/scaffold-component.mjs`](scripts/scaffold-component.mjs)**:
  ```bash
  node <skill-dir>/scripts/scaffold-component.mjs <component-name> [--target-dir <path>] [--type default|modal|section] [--dry-run] [--force]
  ```
- **[`scripts/scaffold-hook.mjs`](scripts/scaffold-hook.mjs)**:
  ```bash
  node <skill-dir>/scripts/scaffold-hook.mjs <hook-name> --feature <feature-name> [--kind query|mutation] [--entity <name>] [--dry-run] [--force]
  ```
- **[`scripts/scaffold-service.mjs`](scripts/scaffold-service.mjs)**:
  ```bash
  node <skill-dir>/scripts/scaffold-service.mjs <verb-noun> --feature <feature-name> [--dry-run] [--force]
  ```
- **[`scripts/setup-tooling.mjs`](scripts/setup-tooling.mjs)**:
  ```bash
  node <skill-dir>/scripts/setup-tooling.mjs [--only lint|format|test] [--dry-run] [--force]
  ```
- **[`scripts/check-architecture.mjs`](scripts/check-architecture.mjs)**:
  ```bash
  node <skill-dir>/scripts/check-architecture.mjs [--src-dir <dir>] [--include-imports] [--json]
  ```

---

## ⚡ Migrar de ESLint/Prettier a OXC

OXC reemplaza a ESLint y Prettier reduciendo los tiempos de CI de minutos a milisegundos:

1. **Instalación de paquetes:**
   ```bash
   pnpm add -D oxlint oxfmt
   ```
2. **Generar configuraciones estándar:**
   ```bash
   node <skill-dir>/scripts/setup-tooling.mjs --only lint
   node <skill-dir>/scripts/setup-tooling.mjs --only format
   ```
3. **Reglas de arquitectura incluidas:**
   - `no-restricted-imports`: prohíbe importar desde la raíz de una feature (`@/features/billing`) o desde agrupadores (`@/features/billing/components`).
   - `overrides` en `src/app/**`: prohíbe invocar `@tanstack/react-query` o servicios directamente en las rutas de Expo Router.
   - `sortTailwindcss`: ordena automáticamente las clases utilitarias de NativeWind a velocidad Rust sin necesidad de plugins pesados de Prettier.
4. **Scripts en `package.json`:**
   ```json
   {
     "scripts": {
       "lint": "oxlint",
       "format": "oxfmt .",
       "format:check": "oxfmt --check ."
     }
   }
   ```

---

## 📚 Documentación y Referencias

- **[`SKILL.md`](SKILL.md)**: Especificación operativa completa, flujo de trabajo y reglas críticas para el agente.
- **[Guía de Screaming Architecture](references/screaming-architecture-guide.md)**: Estructura de directorios, capas y convenciones de nombres.
- **[Rutas Delgadas con Expo Router](references/expo-router-thin-routes.md)**: Cómo conectar screens a `src/app`.
- **[Navegación y Autenticación](references/navigation-and-auth.md)**: Grupos de rutas `(auth)`/`(app)`, `Stack.Protected` y almacenamiento de tokens en SecureStore.
- **[Patrón TanStack Query](references/tanstack-query-pattern.md)**: Key factories jerárquicas, servicios con Zod, queries y mutaciones.
- **[Estado, Formularios y Soporte Offline](references/state-forms-and-offline.md)**: Zustand en features, React Hook Form y gestión de reconexión.
- **[Patrones de Componentes con NativeWind](references/nativewind-component-patterns.md)**: Primitivas móviles, modales y testing accesible.
- **[Plataforma, Rendimiento y Accesibilidad](references/platform-performance-a11y.md)**: Archivos `.ios`/`.android`, FlashList, expo-image y pautas a11y.
- **[Testing y Tooling (Jest + OXC)](references/testing-and-tooling.md)**: Configuración completa de jest-expo, Oxlint y Oxfmt.
