# Testing y Tooling: Jest + OXC (Oxlint & Oxfmt)

El estándar combina la fidelidad de runtime móvil de **Jest** (`jest-expo`) con la velocidad Rust de **OXC** (**Oxlint** para análisis estático y **Oxfmt** para formateo instantáneo con ordenamiento de clases Tailwind).

---

## 🃏 Configuración de Jest (`jest.config.js`)

Jest es el runner recomendado por el equipo de Expo para simular con precisión el entorno nativo de React Native y soportar `expo-router/testing-library`.

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

### Setup de Tests (`src/test/setup.ts`)

```ts
import '@testing-library/react-native/extend-expect';

// Mock de SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
```

---

## ⚡ Linter: Oxlint (`.oxlintrc.json`)

Oxlint se ejecuta en milisegundos y aplica tanto las buenas prácticas de React/RN como las **reglas no negociables de Screaming Architecture**:

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
      { "name": "window", "message": "No uses window en React Native." },
      { "name": "localStorage", "message": "Usa expo-secure-store o AsyncStorage." },
      { "name": "document", "message": "No existe DOM en React Native." }
    ],
    "no-restricted-imports": [
      "error",
      {
        "paths": [{ "name": "react-dom", "message": "No uses react-dom en React Native." }],
        "patterns": [
          { "regex": "^@/features/[^/]+$", "message": "Prohibido importar de la raíz de la feature; importa desde la carpeta hoja." },
          { "regex": "^@/features/[^/]+/(components|hooks|screens|services)$", "message": "Prohibido importar de agrupadores; importa desde la carpeta hoja que posee el index.ts." }
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
              { "group": ["@tanstack/react-query"], "message": "Rutas delgadas: las queries van en hooks dentro de features." },
              { "regex": "^@/features/[^/]+/services/", "message": "Rutas delgadas: la UI consume hooks, nunca servicios directamente." }
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

Oxfmt reemplaza a Prettier, formateando a velocidad Rust y ordenando automáticamente las clases de Tailwind de NativeWind gracias a su compatibilidad nativa:

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

## 🚀 Scripts en `package.json`

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
