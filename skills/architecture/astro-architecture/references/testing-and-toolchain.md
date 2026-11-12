# 🧪 Toolchain y Testing: OXC y Playwright

Esta guía define el estándar de análisis estático ultrarrápido con **OXC** (`oxlint` / `oxfmt`) y pruebas End-to-End (E2E) con **Playwright** para proyectos Astro.

---

## 1. Visión General del Toolchain

| Herramienta | Rol | Propósito en Astro |
| :--- | :--- | :--- |
| **`astro check`** | Type-checker de Astro | Valida tipos TypeScript y plantillas `.astro` (props, slots, Content Collections). |
| **OXC (`oxlint` / `oxfmt`)** | Linter y Formateador en Rust | Análisis estático instantáneo (`correctness`, `suspicious`, `perf`) en `src/` (`*.ts`, `*.tsx`, `*.mjs`) y formateo consistente. |
| **Playwright** | End-to-End (E2E) Testing | Verifica el build estático/SSR real (`astro preview`): SEO, HTML semántico, islas `client:*`, responsive y cero errores de consola. |

---

## 2. Linting y Formateo con OXC (`oxlint` / `oxfmt`)

### 2.1 Configuración de Referencia (`.oxlintrc.json`)

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "unicorn", "jsx-a11y"],
  "categories": {
    "correctness": "error",
    "suspicious": "warn",
    "perf": "warn"
  },
  "ignorePatterns": ["dist/**", ".astro/**", "node_modules/**"]
}
```

> Si el proyecto usa islas con React, añadir `"react"` a `plugins`.

### 2.2 Comandos en `package.json`

```json
{
  "scripts": {
    "lint": "oxlint --deny-warnings src/",
    "format": "oxfmt --write .",
    "format:check": "oxfmt --check .",
    "check": "astro check && npm run lint"
  }
}
```

---

## 3. Pruebas E2E con Playwright (`@playwright/test`)

En Astro, las pruebas E2E deben ejecutarse contra el **build de producción** (`astro preview`), no solo contra `astro dev`, para validar exactamente los assets optimizados, las islas hidratadas y los metadatos finales.

### 3.1 Configuración de Referencia (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

### 3.2 Suite Mínima Recomendada (`e2e/landing.spec.ts`)

Toda landing page debe contar al menos con estas verificaciones automatizadas:

```typescript
import { expect, test } from '@playwright/test';

test.describe('Landing Page', () => {
  test('renders SEO metadata, single h1, and zero console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /.+/);

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('has no horizontal overflow and toggles FAQ details', async ({ page }) => {
    await page.goto('/');

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);

    const firstFaq = page.locator('#faq details').first();
    if ((await firstFaq.count()) > 0) {
      await firstFaq.locator('summary').click();
      await expect(firstFaq).toHaveAttribute('open', '');
    }
  });
});
```
