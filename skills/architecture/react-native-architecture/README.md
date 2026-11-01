# 📱 React Native Screaming Architecture (`react-native-architecture`)

> **Estándar de Screaming Architecture para React Native con Expo Router. Guía la estructuración por features, rutas delgadas en `src/app`, hooks con TanStack Query, estilos NativeWind y tests con cobertura $\ge 90\%$. Incluye scaffolds de feature y componente.**

| Propiedad | Valor |
| :--- | :--- |
| **Nombre** | `react-native-architecture` |
| **Categoría** | `architecture` |
| **Versión** | `1.0.0` |
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

* **Andamiar una feature móvil con ruta en Expo Router**:
  > *"Crea la feature de facturación (billing) en React Native con su screen inicial y su ruta en Expo Router"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-feature.mjs billing --with-starter --with-route`  
  > ➔ Genera las 7 subcarpetas en `src/features/billing/`, el modelo plano, la screen `billing-home` con NativeWind (`View`, `Text`) y test unitario, y la ruta delgada `src/app/billing/index.tsx`.

* **Crear un modal encapsulado con NativeWind**:
  > *"Crea un modal para registrar facturas en la feature billing"*
  >
  > 🤖 **El agente ejecutará**: `node <skill-dir>/scripts/scaffold-component.mjs create-invoice-modal --target-dir src/features/billing/components --type modal`  
  > ➔ Genera el componente con `Modal` de React Native, TSDoc, test con `@testing-library/react-native` y barrel `index.ts`.

---

## 🛠️ Scripts y Opciones CLI

> `<skill-dir>` es el directorio donde está instalada esta skill (p. ej. `.agents/skills/react-native-architecture` o `.claude/skills/react-native-architecture`).

- **[`scripts/scaffold-feature.mjs`](scripts/scaffold-feature.mjs)**:
  ```bash
  node <skill-dir>/scripts/scaffold-feature.mjs <feature-name> [--target-dir <path>] [--app-dir <path>] [--with-starter] [--with-route] [--dry-run] [--force]
  ```
- **[`scripts/scaffold-component.mjs`](scripts/scaffold-component.mjs)**:
  ```bash
  node <skill-dir>/scripts/scaffold-component.mjs <component-name> [--target-dir <path>] [--type default|modal|section] [--dry-run] [--force]
  ```

---

## 📚 Documentación y Referencias

- **[`SKILL.md`](SKILL.md)**: Especificación operativa completa, flujo de trabajo y reglas críticas para el agente.
- **[Guía de Screaming Architecture](references/screaming-architecture-guide.md)**: Estructura de directorios, capas y convenciones de nombres.
- **[Rutas Delgadas con Expo Router](references/expo-router-thin-routes.md)**: Cómo conectar screens a `src/app`.
- **[Patrón TanStack Query](references/tanstack-query-pattern.md)**: Servicios, key factories, queries y mutaciones.
- **[Patrones de Componentes con NativeWind](references/nativewind-component-patterns.md)**: Primitivas móviles, modales y testing.
