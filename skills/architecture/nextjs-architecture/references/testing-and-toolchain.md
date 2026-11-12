# Testing y Toolchain Moderno: Vitest, Playwright, OXC y SWC

Esta guía define el estándar de compilación, análisis estático, pruebas unitarias ($\ge 90\%$) y pruebas End-to-End (E2E) para proyectos Next.js con Screaming Architecture.

---

## 1. Visión General del Toolchain

| Herramienta | Rol en la Arquitectura | Propósito |
| :--- | :--- | :--- |
| **SWC** | Compilador TypeScript / JSX | Compilación nativa en Next.js y transformación instantánea en Vitest (`@vitejs/plugin-react-swc`). |
| **OXC (`oxlint` / `oxfmt`)** | Linter y Formateador en Rust | Análisis estático ultrarrápido (`correctness`, `suspicious`, `perf`) con plugins para React, Next.js y accesibilidad. |
| **Vitest** | Unit & Integration Test Runner | Pruebas colocalizadas (`.test.ts`, `.test.tsx`) con `@testing-library/react` y cobertura V8 $\ge 90\%$. |
| **Playwright** | End-to-End (E2E) Testing | Verificación de rutas delgadas en `src/app/**`, flujos de usuario completos y diálogos modales en `e2e/`. |

---

## 2. Pruebas Unitarias con Vitest + SWC ($\ge 90\%$ Coverage)

### 2.1 Configuración de Referencia (`vitest.config.ts`)
Usa `@vitejs/plugin-react-swc` para compilar TSX con SWC y `@vitest/coverage-v8` aplicando las exclusiones arquitectónicas exactas:

```typescript
import path from 'node:path';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'src/features/**/*.{ts,tsx}',
        'src/components/**/*.{ts,tsx}',
        'src/hooks/**/*.{ts,tsx}',
        'src/lib/**/*.{ts,tsx}',
      ],
      exclude: [
        'src/app/**',
        'src/config/**',
        'src/**/models/**',
        'src/**/schemas/**',
        'src/**/index.ts',
        'src/**/*.test.{ts,tsx}',
        'src/components/ui/**',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
```

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
```

### 2.2 Convenciones de Pruebas Unitarias en Vitest
- **Imports explícitos**: Importar siempre `describe`, `it`, `expect`, `vi`, `beforeEach` desde `'vitest'` (`globals: false`).
- **Mocks y Spies**: Usar `vi.fn()`, `vi.spyOn()` y `vi.mock()`. Nunca usar APIs globales de Jest (`jest.fn()`).
- **Testing de Hooks con TanStack Query**: Envolver `renderHook` con un `QueryClientProvider` con `retry: false`:
  ```tsx
  import React from 'react';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import { renderHook, waitFor } from '@testing-library/react';
  import { describe, expect, it, vi } from 'vitest';
  import { useInvoices } from './use-invoices.hook';
  import * as getInvoicesService from '@/features/billing/services/get-invoices';

  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return function Wrapper({ children }: { readonly children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
  }

  describe('useInvoices Hook', () => {
    it('returns invoices from the service', async () => {
      vi.spyOn(getInvoicesService, 'getInvoices').mockResolvedValueOnce([
        { id: '1', customerId: 'c1', amount: 100, currency: 'USD', createdAt: '', updatedAt: '' },
      ]);

      const { result } = renderHook(() => useInvoices(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(1);
    });
  });
  ```

---

## 3. Pruebas End-to-End (E2E) con Playwright (`e2e/`)

Dado que `src/app/**` es una capa de enrutamiento delgada excluida de pruebas unitarias, la integración real de rutas, layouts, redirecciones, metadatos y flujos completos se valida con **Playwright**.

### 3.1 Estructura del Directorio `e2e/`
```text
e2e/
├── fixtures/             # Fixtures de autenticación y datos semilla
├── billing.spec.ts       # Flujos E2E de la feature billing
└── auth.spec.ts          # Flujos E2E de autenticación y guardas de ruta
```

### 3.2 Ejemplo de Especificación E2E (`e2e/billing.spec.ts`)
```typescript
import { expect, test } from '@playwright/test';

test.describe('Billing Feature (/billing)', () => {
  test('renders overview screen and opens invoice FormDialog', async ({ page }) => {
    await page.goto('/billing');

    await expect(page.getByRole('heading', { name: /billing overview/i })).toBeVisible();

    await page.getByRole('button', { name: /nueva factura/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/monto/i).fill('250');
    await page.getByRole('button', { name: /guardar/i }).click();

    await expect(page.getByRole('dialog')).toBeHidden();
  });
});
```

---

## 4. Linting y Formateo con OXC (`oxlint` / `oxfmt`)

### 4.1 Configuración de `.oxlintrc.json`
`oxlint` reemplaza cadenas pesadas de plugins de ESLint con verificación instantánea en Rust:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "react", "nextjs", "jsx-a11y", "unicorn", "import", "vitest"],
  "categories": {
    "correctness": "error",
    "suspicious": "warn",
    "perf": "warn"
  },
  "rules": {
    "import/no-cycle": "error",
    "import/no-self-import": "error",
    "react/rules-of-hooks": "error",
    "typescript/no-explicit-any": "error"
  },
  "ignorePatterns": [".next/**", "coverage/**", "playwright-report/**", "node_modules/**"]
}
```

### 4.2 Secuencia de Calidad y Orden de Imports
1. Formatear el código (`oxfmt` / Prettier).
2. Organizar imports siguiendo las reglas de la skill `ts-import-organizer` (agrupación por bloques, orden por longitud y conversión de rutas relativas a alias `@/*`).
3. Ejecutar `oxlint` y `tsc --noEmit`.
4. Ejecutar `vitest run --coverage` ($\ge 90\%$) y `playwright test`.

### 4.3 Scripts Estándar en `package.json`
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "oxlint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```
