# 🧪 Toolchain and Testing: OXC and Playwright

This guide defines the standard for ultra-fast static analysis with **OXC** (`oxlint` / `oxfmt`) and End-to-End (E2E) tests with **Playwright** for Astro projects.

---

## 1. Toolchain Overview

| Tool | Role | Purpose in Astro |
| :--- | :--- | :--- |
| **`astro check`** | Astro type checker | Validates TypeScript types and `.astro` templates (props, slots, Content Collections). |
| **OXC (`oxlint` / `oxfmt`)** | Rust linter and formatter | Instant static analysis (`correctness`, `suspicious`, `perf`) over `src/` (`*.ts`, `*.tsx`, `*.mjs`) and consistent formatting. |
| **Playwright** | End-to-End (E2E) testing | Checks the real static/SSR build (`astro preview`): SEO, semantic HTML, `client:*` islands, responsiveness and zero console errors. |

---

## 2. Linting and Formatting with OXC (`oxlint` / `oxfmt`)

### 2.1 Reference Configuration (`.oxlintrc.json`)

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

> If the project uses React islands, add `"react"` to `plugins`.

### 2.2 Commands in `package.json`

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

## 3. E2E Tests with Playwright (`@playwright/test`)

In Astro, E2E tests must run against the **production build** (`astro preview`), not only against `astro dev`, to validate exactly the optimized assets, the hydrated islands and the final metadata.

### 3.1 Reference Configuration (`playwright.config.ts`)

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

### 3.2 Recommended Minimum Suite (`e2e/landing.spec.ts`)

Every landing page must have at least these automated checks:

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
