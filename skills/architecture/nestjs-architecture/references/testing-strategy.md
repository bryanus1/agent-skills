# NestJS Testing Strategy (Vitest + SWC + E2E)

This guide standardizes unit tests with **Vitest + SWC** (and the Jest alternative), integration/E2E tests with **Supertest** and the mandatory coverage exclusions ($\ge 90\%$).

---

## 1. `vitest.config.ts` Setup with SWC

NestJS depends on `emitDecoratorMetadata` and experimental decorators. Vitest needs `unplugin-swc` to transpile decorated classes correctly without losing the injection metadata:

```typescript
// vitest.config.ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    swc.vite({
      jsc: {
        target: 'es2022',
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 },
      exclude: [
        'src/main.ts',
        'src/config/**',
        '**/*.module.ts',
        '**/*.dto.ts',
        '**/index.ts',
        '**/*.spec.ts',
      ],
    },
  },
});
```

---

## 2. What to Test per Layer

| Layer | File | What to check |
| :--- | :--- | :--- |
| **Repository** | `<noun>.repository.spec.ts` | The `fromPersistence()` mapping, returning `null` when the record does not exist, filters (`ownerId`, `search`) and pagination. |
| **Service** | `<noun>.service.spec.ts` | Happy paths, `ownerId` injection in `create`, role filtering in `findAll`, `NotFoundException` (404), `ForbiddenException` (403) and `ConflictException` (409). |
| **Controller** | `<noun>.controller.spec.ts` | Delegation to the service with `req.user` and returning `<Noun>ResponseDto` / `Paginated<Noun>ResponseDto`. |
| **Guards / Pipes** | `*.guard.spec.ts` | `@Public()` behavior in `JwtAuthGuard` and role validation in `RolesGuard`. |

---

## 3. Coverage Exclusions

The following pieces are declarative or framework glue and are excluded through `coverage.exclude` (and `collectCoverageFrom` in Jest):
- `src/config/**` (Zod/Joi environment schemas and `@nestjs/config` loaders).
- `src/main.ts` y `**/*.module.ts` (bootstrap wiring and `@Module`).
- `**/*.dto.ts` y `**/index.ts` (declarative contracts and barrels).

---

## 4. E2E Tests with `NodeAdapter` and Supertest

To validate the real HTTP pipeline (`ValidationPipe`, `ParseUUIDPipe`, `JwtAuthGuard`, `RolesGuard` and serialization):

```typescript
// test/invoices.e2e-spec.ts
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { NodeAdapter } from '@nestjs/platform-node';
import { it, expect, describe, afterAll, beforeAll } from 'vitest';

import { AppModule } from '@/app.module';

describe('Invoices (e2e)', () => {
  let app: Awaited<ReturnType<typeof Test.createTestingModule>> extends never ? never : any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication(new NodeAdapter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated requests with 401', async () => {
    await request(app.getHttpServer()).get('/invoices').expect(401);
  });
});
```
