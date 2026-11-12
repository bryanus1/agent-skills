# Guía del Monolito Modular y Stack Moderno (NestJS 12+)

Esta guía establece los principios arquitectónicos, la estructura global de `src/`, el bootstrap con `NodeAdapter` en NestJS 12 y el toolchain basado en **SWC** y **OXC**.

---

## 1. Principio Fundamental: Monolito Modular (*Modular Monolith*)

- **Encapsulación de Dominio**: Cada capacidad de negocio reside en `src/modules/<nouns>/` con sus controladores, servicios, repositorios, entidades y DTOs.
- **Interfaces Explícitas**: Un módulo expone **únicamente** su servicio público en `@Module({ exports: [NounService] })`.
- **Prohibición de Acceso Cruzado a Repositorios**: Un módulo `Orders` **nunca** inyecta `IUserRepository` ni importa `USER_REPOSITORY_TOKEN`. Consume `UserService` desde `@/modules/users/services`.
- **Cero Dependencias Circulares (`forwardRef` prohibido)**: Si dos módulos se necesitan mutuamente, extrae un módulo/servicio coordinador o emite eventos de dominio con `@nestjs/event-emitter` (`OrderCreatedEvent` → `NotificationModule`).

---

## 2. Bootstrap en NestJS 12 con `NodeAdapter`

NestJS 12 introduce **`NodeAdapter`** (`@nestjs/platform-node`), un adaptador nativo sobre `node:http` que mejora el rendimiento frente a `ExpressAdapter` manteniendo compatibilidad con helpers estilo Express:

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

| Adaptador | Cuándo elegirlo |
| :--- | :--- |
| **`NodeAdapter`** (`@nestjs/platform-node`) | **Por defecto en NestJS 12+.** Máximo throughput sobre `node:http` con compatibilidad Express-style. |
| **`FastifyAdapter`** (`@nestjs/platform-fastify`) | Solo si dependes de plugins nativos de Fastify o route constraints avanzados. |
| **`ExpressAdapter`** (`@nestjs/platform-express`) | Solo para migraciones legacy que usen APIs internas no implementadas en `NodeAdapter`. |

---

## 3. Toolchain: SWC + OXC (`oxlint` / `oxfmt`)

### 3.1 Compilación rápida con SWC
Configura `nest-cli.json` con `builder: "swc"` (hasta 20x más rápido que `tsc`). Como SWC transpila archivo por archivo y no hace typechecking, ejecuta `tsc --noEmit` en paralelo o en CI:

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

- **Regla para SWC (`import type`)**: Usa `import type` en interfaces y tipos puros (p. ej. `import type { IInvoiceRepository } from '../repositories'`). Mantén imports de valor en clases inyectadas por constructor (`InvoiceService`, DTOs) para preservar `emitDecoratorMetadata`.

### 3.2 Linting y Formateo con OXC
Usa **`oxlint`** (50–100x más rápido que ESLint) y **`oxfmt`** en `package.json`:

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

Si ejecutas `oxfmt` o Prettier, aplica siempre **`ts-import-organizer` después del formateo** para conservar el orden de grupos y longitudes.

---

## 4. Estructura Global del Proyecto y Alias `@/*`

```text
src/
├── common/
│   ├── decorators/           # @Public(), @Roles(), @CurrentUser()
│   ├── enums/                # Role (compartido entre módulos)
│   ├── filters/              # HttpExceptionFilter / mapeo de errores
│   ├── guards/               # JwtAuthGuard, RolesGuard
│   └── prisma/               # (o database/) Proveedor compartido de BD
├── config/                   # Validación de env (Zod/Joi) y loaders (sin *.spec.ts)
├── modules/
│   └── <nouns>/              # Carpeta en PLURAL (excepción: auth)
│       ├── controllers/      # <noun>.controller.ts, .spec.ts, index.ts
│       ├── dto/              # create, update, query, response (+ Paginated), index.ts
│       ├── entities/         # <noun>.entity.ts, index.ts
│       ├── repositories/     # repository.ts, <noun>.repository.ts, .spec.ts, index.ts
│       ├── services/         # <noun>.service.ts, .spec.ts, index.ts
│       └── <noun>.module.ts  # exports: [<Noun>Service]
├── app.module.ts
└── main.ts
```

En `tsconfig.json` configura el alias `@/*` (requerido para imports inter-módulos y resuelto en tests mediante `vite-tsconfig-paths`):

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

## 5. Convenciones de Nombres y Barrels (*Leaf-Folder Policy*)

- **Carpeta del módulo:** siempre **plural** en `kebab-case` (`pets`, `invoices`, `user-profiles`). Excepción: `auth`.
- **Archivos y clases internos:** siempre **singulares** (`invoice.controller.ts` → `InvoiceController`).
- **La raíz `src/modules/<nouns>/` NUNCA lleva `index.ts`.** Solo las subcarpetas hoja (`controllers/`, `dto/`, `entities/`, `repositories/`, `services/`) llevan `index.ts`.
- **Imports inter-módulos:** apuntan siempre a la subcarpeta hoja:

```typescript
// ✅ CORRECTO
import { InvoiceService } from '@/modules/invoices/services';

// ❌ PROHIBIDO
import { InvoiceService } from '@/modules/invoices';
import { INVOICE_REPOSITORY_TOKEN } from '@/modules/invoices/repositories';
```

---

## 6. Versionado de Paquetes (`.npmrc`)

En repositorios standalone de API fija versiones exactas en `.npmrc` (`save-exact=true`). En monorepos gestionados con [`monorepo-architecture`](../../monorepo-architecture/SKILL.md), respeta la política del workspace raíz (`engine-strict=true` y `pnpm-lock.yaml`).
