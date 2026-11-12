# Estrategia de Testing en NestJS (Vitest + SWC + E2E)

Esta guía estandariza las pruebas unitarias con **Vitest + SWC** (y su alternativa Jest), las pruebas de integración/E2E con **Supertest** y las exclusiones obligatorias de cobertura ($\ge 90\%$).

---

## 1. Configuración de `vitest.config.ts` con SWC

NestJS depende de `emitDecoratorMetadata` y decoradores experimentales. Vitest requiere `unplugin-swc` para transpilar correctamente las clases decoradas sin perder los metadatos de inyección:

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

## 2. Qué Probar por Capa

| Capa | Archivo | Qué verificar |
| :--- | :--- | :--- |
| **Repository** | `<noun>.repository.spec.ts` | Mapeo `fromPersistence()`, retorno `null` cuando no existe, filtros (`ownerId`, `search`) y paginación. |
| **Service** | `<noun>.service.spec.ts` | Happy paths, inyección de `ownerId` en `create`, filtro por rol en `findAll`, `NotFoundException` (404), `ForbiddenException` (403) y `ConflictException` (409). |
| **Controller** | `<noun>.controller.spec.ts` | Delegación al servicio con `req.user` y retorno de `<Noun>ResponseDto` / `Paginated<Noun>ResponseDto`. |
| **Guards / Pipes** | `*.guard.spec.ts` | Comportamiento de `@Public()` en `JwtAuthGuard` y validación de roles en `RolesGuard`. |

---

## 3. Exclusiones de Cobertura

Las siguientes piezas son declarativas o glue de framework y se excluyen de `coverage.exclude` (y de `collectCoverageFrom` en Jest):
- `src/config/**` (esquemas Zod/Joi de entorno y loaders de `@nestjs/config`).
- `src/main.ts` y `**/*.module.ts` (wiring de arranque y `@Module`).
- `**/*.dto.ts` y `**/index.ts` (contratos declarativos y barrels).

---

## 4. Pruebas E2E con `NodeAdapter` y Supertest

Para validar el pipeline HTTP real (`ValidationPipe`, `ParseUUIDPipe`, `JwtAuthGuard`, `RolesGuard` y serialización):

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
