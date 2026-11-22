# Modular Monolith and Modern Stack Guide (NestJS 12+)

This guide sets the architectural principles, the global `src/` structure, the `NodeAdapter` bootstrap in NestJS 12 and the toolchain based on **SWC** and **OXC**.

---

## 1. Core Principle: the Modular Monolith

- **Domain Encapsulation**: each business capability lives in `src/modules/<nouns>/` with its controllers, services, repositories, entities and DTOs.
- **Explicit Interfaces**: a module exposes **only** its public service in `@Module({ exports: [NounService] })`.
- **No Cross-Module Repository Access**: an `Orders` module **never** injects `IUserRepository` or imports `USER_REPOSITORY_TOKEN`. It consumes `UserService` from `@/modules/users/services`.
- **Zero Circular Dependencies (`forwardRef` is forbidden)**: if two modules need each other, extract a coordinating module/service or emit domain events with `@nestjs/event-emitter` (`OrderCreatedEvent` → `NotificationModule`).

---

## 2. NestJS 12 Bootstrap with `NodeAdapter`

NestJS 12 introduces **`NodeAdapter`** (`@nestjs/platform-node`), a native adapter over `node:http` that outperforms `ExpressAdapter` while staying compatible with Express-style helpers:

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NodeAdapter } from '@nestjs/platform-node';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new NodeAdapter());

  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
```

| Adapter | When to choose it |
| :--- | :--- |
| **`NodeAdapter`** (`@nestjs/platform-node`) | **The default in NestJS 12+.** Maximum throughput over `node:http` with Express-style compatibility. |
| **`FastifyAdapter`** (`@nestjs/platform-fastify`) | Only if you depend on native Fastify plugins or advanced route constraints. |
| **`ExpressAdapter`** (`@nestjs/platform-express`) | Only for legacy migrations that use internal APIs not implemented in `NodeAdapter`. |

---

## 3. Toolchain: SWC + OXC (`oxlint` / `oxfmt`)

### 3.1 Fast compilation with SWC
Configure `nest-cli.json` with `builder: "swc"` (up to 20x faster than `tsc`). Since SWC transpiles file by file and does no type checking, run `tsc --noEmit` in parallel or in CI:

```json
// nest-cli.json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "builder": "swc",
    "typeCheck": true,
    "deleteOutDir": true
  }
}
```

- **SWC rule (`import type`)**: use `import type` for interfaces and pure types (e.g. `import type { IInvoiceRepository } from '../repositories'`). Keep value imports for classes injected through the constructor (`InvoiceService`, DTOs) to preserve `emitDecoratorMetadata`.

### 3.2 Linting and Formatting with OXC
Use **`oxlint`** (50–100x faster than ESLint) and **`oxfmt`** in `package.json`:

```json
{
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "typecheck": "tsc --noEmit",
    "lint": "oxlint --deny-warnings src test",
    "format": "oxfmt --write src test",
    "test": "vitest run"
  }
}
```

If you run `oxfmt` or Prettier, always apply **`ts-import-organizer` after formatting** to keep the group and length order.

---

## 4. Global Project Structure and the `@/*` Alias

```text
src/
├── common/
│   ├── decorators/           # @Public(), @Roles(), @CurrentUser()
│   ├── enums/                # Role (shared across modules)
│   ├── filters/              # HttpExceptionFilter / error mapping
│   ├── guards/               # JwtAuthGuard, RolesGuard
│   └── prisma/               # (or database/) Shared DB provider
├── config/                   # Env validation (Zod/Joi) and loaders (no *.spec.ts)
├── modules/
│   └── <nouns>/              # PLURAL folder (exception: auth)
│       ├── controllers/      # <noun>.controller.ts, .spec.ts, index.ts
│       ├── dto/              # create, update, query, response (+ Paginated), index.ts
│       ├── entities/         # <noun>.entity.ts, index.ts
│       ├── repositories/     # repository.ts, <noun>.repository.ts, .spec.ts, index.ts
│       ├── services/         # <noun>.service.ts, .spec.ts, index.ts
│       └── <noun>.module.ts  # exports: [<Noun>Service]
├── app.module.ts
└── main.ts
```

In `tsconfig.json`, configure the `@/*` alias (required for inter-module imports and resolved in tests through `vite-tsconfig-paths`):

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 5. Naming and Barrel Conventions (*Leaf-Folder Policy*)

- **Module folder:** always **plural** in `kebab-case` (`pets`, `invoices`, `user-profiles`). Exception: `auth`.
- **Internal files and classes:** always **singular** (`invoice.controller.ts` → `InvoiceController`).
- **The `src/modules/<nouns>/` root NEVER has an `index.ts`.** Only the leaf subfolders (`controllers/`, `dto/`, `entities/`, `repositories/`, `services/`) have an `index.ts`.
- **Inter-module imports:** always point to the leaf subfolder:

```typescript
// ✅ CORRECT
import { InvoiceService } from '@/modules/invoices/services';

// ❌ FORBIDDEN
import { InvoiceService } from '@/modules/invoices';
import { INVOICE_REPOSITORY_TOKEN } from '@/modules/invoices/repositories';
```

---

## 6. Package Versioning (`.npmrc`)

In standalone API repositories, pin exact versions in `.npmrc` (`save-exact=true`). In monorepos managed with [`monorepo-architecture`](../../monorepo-architecture/SKILL.md), follow the root workspace policy (`engine-strict=true` and `pnpm-lock.yaml`).
