# Testing and Tooling: Jest + OXC (Oxlint & Oxfmt)

The standard combines the mobile runtime fidelity of **Jest** (`jest-expo`) with the Rust speed of **OXC** (**Oxlint** for static analysis and **Oxfmt** for instant formatting with Tailwind class sorting).

---

## 🃏 Jest Configuration (`jest.config.js`)

Jest is the runner the Expo team recommends to accurately simulate the native React Native environment and support `expo-router/testing-library`.

```js
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@tanstack/.*|@shopify/.*|nativewind)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/app/**',
    '!src/features/**/models/**',
    '!src/features/**/schemas/**',
    '!src/features/**/hooks/*-keys/**',
    '!src/config/constants.ts',
    '!src/config/env.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
```

### Test Setup (`src/test/setup.ts`)

```ts
import '@testing-library/react-native/extend-expect';

// SecureStore mock
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
```

---

## ⚡ Linter: Oxlint (`.oxlintrc.json`)

Oxlint runs in milliseconds and applies both React/RN best practices and the **non-negotiable Screaming Architecture rules**:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "react", "import", "jsx-a11y", "jest", "react-perf"],
  "categories": { "correctness": "error", "suspicious": "warn" },
  "env": { "browser": false, "es2024": true },
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "no-restricted-globals": [
      "error",
      { "name": "window", "message": "Do not use window in React Native." },
      { "name": "localStorage", "message": "Use expo-secure-store or AsyncStorage." },
      { "name": "document", "message": "There is no DOM in React Native." }
    ],
    "no-restricted-imports": [
      "error",
      {
        "paths": [{ "name": "react-dom", "message": "Do not use react-dom in React Native." }],
        "patterns": [
          { "regex": "^@/features/[^/]+$", "message": "Do not import from the feature root; import from the leaf folder." },
          { "regex": "^@/features/[^/]+/(components|hooks|screens|services)$", "message": "Do not import from grouping folders; import from the leaf folder." }
        ]
      }
    ]
  },
  "overrides": [
    {
      "files": ["src/app/**"],
      "rules": {
        "no-restricted-imports": [
          "error",
          {
            "patterns": [
              { "group": ["@tanstack/react-query"], "message": "Thin routes: queries belong in hooks inside features." },
              { "regex": "^@/features/[^/]+/services/", "message": "Thin routes: the UI consumes hooks, never services directly." }
            ]
          }
        ]
      }
    }
  ]
}
```

---

## 🎨 Formatter: Oxfmt (`.oxfmtrc.json`)

Oxfmt replaces Prettier, formatting at Rust speed and automatically sorting NativeWind's Tailwind classes thanks to its native support:

```json
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json",
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "sortTailwindcss": true
}
```

---

## 🚀 Scripts in `package.json`

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "format": "oxfmt .",
    "format:check": "oxfmt --check .",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "validate": "oxlint && oxfmt --check . && jest --coverage"
  }
}
```
