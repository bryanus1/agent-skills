# 📱 React Native Screaming Architecture (`react-native-architecture`)

> **Screaming Architecture standard for React Native with Expo Router. Guides feature-based structure, thin routes in `src/app`, TanStack Query hooks, NativeWind styling, Jest tests ($\ge 90\%$), ultra-fast static analysis with Oxlint and Oxfmt formatting.**

| Property | Value |
| :--- | :--- |
| **Name** | `react-native-architecture` |
| **Category** | `architecture` |
| **Version** | `1.2.0` |
| **Compatible Agents** | Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf |
| **Requirements** | `node` |

---

## 📦 Installation

### Via the `skills.sh` CLI (Recommended)

```bash
# Install in the current project:
npx skills add bryanus1/agent-skills --skill react-native-architecture

# Install globally on your machine:
npx skills add bryanus1/agent-skills --skill react-native-architecture -g
```

### Via a Local Symlink

```bash
# Google Antigravity:
mkdir -p .agents/skills
ln -s /path/to/agent-skills/skills/architecture/react-native-architecture .agents/skills/react-native-architecture

# Claude Code:
mkdir -p .claude/skills
ln -s ../../.agents/skills/react-native-architecture .claude/skills/react-native-architecture
```

---

## 💡 Usage Examples with AI Agents

* **Scaffold a full mobile feature with an Expo Router route and layout**:
  > *"Create the billing feature in React Native with a starter screen, a layout and a route at (tabs)/billing"*
  >
  > 🤖 **The agent will run**: `node <skill-dir>/scripts/scaffold-feature.mjs billing --with-starter --with-route --route-path "(tabs)/billing" --with-layout`  
  > ➔ Generates the subfolders in `src/features/billing/`, the flat model, the `billing-home` screen with NativeWind and a unit test, and the thin route with `_layout.tsx` in `src/app/(tabs)/billing/`.

* **Create a TanStack Query mutation hook with a key factory**:
  > *"Create the use-create-invoice hook in the billing feature"*
  >
  > 🤖 **The agent will run**: `node <skill-dir>/scripts/scaffold-hook.mjs use-create-invoice --feature billing --kind mutation --entity invoice`  
  > ➔ Generates the hierarchical `invoiceKeys` key factory in `hooks/invoice-keys/`, the `useCreateInvoice` hook with automatic list invalidation and its test with a `QueryClientProvider`.

* **Create a data service**:
  > *"Create the get-invoices service for the billing feature"*
  >
  > 🤖 **The agent will run**: `node <skill-dir>/scripts/scaffold-service.mjs get-invoices --feature billing`  
  > ➔ Generates `services/get-invoices/get-invoices.service.ts` with `apiClient` typing and its test with mocks.

* **Set up Jest + OXC tooling in the project**:
  > *"Set up Oxlint, Oxfmt and Jest with the architecture rules in my mobile app"*
  >
  > 🤖 **The agent will run**: `node <skill-dir>/scripts/setup-tooling.mjs`  
  > ➔ Generates `.oxlintrc.json` with architectural import restrictions, `.oxfmtrc.json` with Tailwind class sorting, and `jest.config.js`.

* **Validate architecture compliance**:
  > *"Check whether my code follows Screaming Architecture"*
  >
  > 🤖 **The agent will run**: `node <skill-dir>/scripts/check-architecture.mjs --include-imports`  
  > ➔ Audits barrels in container folders, non-thin routes in `src/app/`, missing tests and accidental use of browser APIs.

---

## 🛠️ Scripts and CLI Options

> `<skill-dir>` is the directory where this skill is installed (e.g. `.agents/skills/react-native-architecture` or `.claude/skills/react-native-architecture`).

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

## ⚡ Migrating from ESLint/Prettier to OXC

OXC replaces ESLint and Prettier, cutting CI times from minutes to milliseconds:

1. **Install the packages:**
   ```bash
   pnpm add -D oxlint oxfmt
   ```
2. **Generate the standard configurations:**
   ```bash
   node <skill-dir>/scripts/setup-tooling.mjs --only lint
   node <skill-dir>/scripts/setup-tooling.mjs --only format
   ```
3. **Included architecture rules:**
   - `no-restricted-imports`: forbids importing from a feature root (`@/features/billing`) or from groupers (`@/features/billing/components`).
   - `overrides` for `src/app/**`: forbids calling `@tanstack/react-query` or services directly in Expo Router routes.
   - `sortTailwindcss`: automatically sorts NativeWind utility classes at Rust speed, without heavy Prettier plugins.
4. **Scripts in `package.json`:**
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

## 📚 Documentation and References

- **[`SKILL.md`](SKILL.md)**: the full operating spec, the workflow and the critical rules for the agent.
- **[Screaming Architecture Guide](references/screaming-architecture-guide.md)**: directory structure, layers and naming conventions.
- **[Thin Routes with Expo Router](references/expo-router-thin-routes.md)**: how to wire screens to `src/app`.
- **[Navigation and Authentication](references/navigation-and-auth.md)**: `(auth)`/`(app)` route groups, `Stack.Protected` and token storage in SecureStore.
- **[TanStack Query Pattern](references/tanstack-query-pattern.md)**: hierarchical key factories, services with Zod, queries and mutations.
- **[State, Forms and Offline Support](references/state-forms-and-offline.md)**: Zustand in features, React Hook Form and reconnection handling.
- **[NativeWind Component Patterns](references/nativewind-component-patterns.md)**: mobile primitives, modals and accessible testing.
- **[Platform, Performance and Accessibility](references/platform-performance-a11y.md)**: `.ios`/`.android` files, FlashList, expo-image and a11y guidelines.
- **[Testing and Tooling (Jest + OXC)](references/testing-and-tooling.md)**: the full jest-expo, Oxlint and Oxfmt setup.
