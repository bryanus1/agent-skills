# Ejemplos de Flujos y Refactorización — `nestjs-architecture`

## Caso 1: Refactorizar un *Fat Controller* acoplado al ORM

**Problema (código acoplado y con fuga de entidad DB):**
```typescript
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prisma.invoice.findUnique({ where: { id } });
  }
}
```

**Solución siguiendo `nestjs-architecture`:**
1. **`repositories/repository.ts`**: definir `IInvoiceRepository` y `INVOICE_REPOSITORY_TOKEN`.
2. **`repositories/invoice.repository.ts`**: encapsular `this.prisma.invoice.findUnique` y retornar `Invoice.fromPersistence(record)`.
3. **`services/invoice.service.ts`**: inyectar `@Inject(INVOICE_REPOSITORY_TOKEN) private readonly repo: IInvoiceRepository`, lanzar `NotFoundException` si es `null` y `ForbiddenException` si `requesterRole !== Role.ADMIN && entity.ownerId !== requesterId`.
4. **`controllers/invoice.controller.ts`**: validar `:id` con `ParseUUIDPipe({ version: '4' })`, documentar con Swagger (`@ApiOperation`, `@ApiParam`, `@ApiOkResponse`, `@ApiNotFoundResponse`, `@ApiForbiddenResponse`, `@ApiUnauthorizedResponse`, `@ApiBadRequestResponse`) y devolver `InvoiceResponseDto.fromEntity(entity)`.

---

## Caso 2: Comunicación inter-módulos sin cruzar repositorios

> *"El módulo `Orders` necesita verificar que el usuario exista antes de crear una orden."*

- **❌ Prohibido:** importar `USER_REPOSITORY_TOKEN` o `UserRepository` dentro de `OrdersModule`.
- **✅ Correcto:**
  1. `UsersModule` exporta únicamente `UserService` (`exports: [UserService]`).
  2. `OrdersModule` importa `UsersModule` (`imports: [UsersModule]`).
  3. `OrderService` importa `UserService` desde `@/modules/users/services` (carpeta hoja) y lo inyecta en su constructor.

---

## Caso 3: Scaffolding en Monorepo con Contratos Zod

```bash
node <skill-dir>/scripts/scaffold-module.mjs invoice \
  --target-dir apps/api/src/modules \
  --orm prisma \
  --contracts zod \
  --scope acme \
  --dry-run
```

Luego ejecuta sin `--dry-run`. El script genera los 18 archivos con:
- `CreateInvoiceDto` y `UpdateInvoiceDto` extendiendo `createZodDto(...)` de `@acme/contracts/invoices`.
- `InvoiceResponseDto` y `PaginatedInvoiceResponseDto` listos para Swagger y `fromEntity` / `fromPaginatedResult`.
- `InvoiceModule` exportando únicamente `InvoiceService`.
- Specs unitarios listos para ejecutar con `pnpm exec vitest run`.
