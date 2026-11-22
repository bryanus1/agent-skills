# Testing and Modern Toolchain: Vitest, Playwright, OXC and SWC

This guide defines the standard for compilation, static analysis, unit tests ($\ge 90\%$) and End-to-End (E2E) tests for Next.js projects with Screaming Architecture.

---

## 1. Toolchain Overview

| Tool | Role in the Architecture | Purpose |
| :--- | :--- | :--- |
| **SWC** | TypeScript / JSX compiler | Native compilation in Next.js and instant transformation in Vitest (`@vitejs/plugin-react-swc`). |
| **OXC (`oxlint` / `oxfmt`)** | Rust linter and formatter | Ultra-fast static analysis (`correctness`, `suspicious`, `perf`) with plugins for React, Next.js and accessibility. |
| **Vitest** | Unit & Integration Test Runner | Colocated tests (`.test.ts`, `.test.tsx`) with `@testing-library/react` and V8 coverage $\ge 90\%$. |
| **Playwright** | End-to-End (E2E) Testing | Verifies thin routes in `src/app/**`, full user flows and modal dialogs in `e2e/`. |

---

## 2. Unit Tests with Vitest + SWC ($\ge 90\%$ Coverage)

### 2.1 Reference Configuration (`vitest.config.ts`)
Use `@vitejs/plugin-react-swc` to compile TSX with SWC and `@vitest/coverage-v8` with the exact architectural exclusions:

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

### 2.2 Vitest Unit Test Conventions
- **Explicit imports**: always import `describe`, `it`, `expect`, `vi`, `beforeEach` from `'vitest'` (`globals: false`).
- **Mocks and spies**: use `vi.fn()`, `vi.spyOn()` and `vi.mock()`. Never use Jest global APIs (`jest.fn()`).
- **Testing hooks with TanStack Query**: wrap `renderHook` in a `QueryClientProvider` with `retry: false`:
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

## 3. End-to-End (E2E) Tests with Playwright (`e2e/`)

Since `src/app/**` is a thin routing layer excluded from unit tests, the real integration of routes, layouts, redirects, metadata and full flows is validated with **Playwright**.

### 3.1 `e2e/` Directory Structure
```text
e2e/
├── fixtures/             # Authentication fixtures and seed data
├── billing.spec.ts       # E2E flows for the billing feature
└── auth.spec.ts          # E2E flows for authentication and route guards
```

### 3.2 E2E Spec Example (`e2e/billing.spec.ts`)
```typescript
import { expect, test } from '@playwright/test';

test.describe('Billing Feature (/billing)', () => {
  test('renders overview screen and opens invoice FormDialog', async ({ page }) => {
    await page.goto('/billing');

    await expect(page.getByRole('heading', { name: /billing overview/i })).toBeVisible();

    await page.getByRole('button', { name: /new invoice/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/amount/i).fill('250');
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByRole('dialog')).toBeHidden();
  });
});
```

---

## 4. Linting and Formatting with OXC (`oxlint` / `oxfmt`)

### 4.1 `.oxlintrc.json` Configuration
`oxlint` replaces heavy chains of ESLint plugins with instant checks in Rust:

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

### 4.2 Quality Sequence and Import Order
1. Format the code (`oxfmt` / Prettier).
2. Organize imports following the `ts-import-organizer` skill's rules (block grouping, length ordering and converting relative paths to `@/*` aliases).
3. Run `oxlint` and `tsc --noEmit`.
4. Run `vitest run --coverage` ($\ge 90\%$) and `playwright test`.

### 4.3 Standard Scripts in `package.json`
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
