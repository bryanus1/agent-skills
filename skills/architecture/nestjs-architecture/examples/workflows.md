# Workflow and Refactoring Examples — `nestjs-architecture`

## Case 1: Refactor a *Fat Controller* coupled to the ORM

**Problem (coupled code that leaks the DB entity):**
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

**Solution following `nestjs-architecture`:**
1. **`repositories/repository.ts`**: define `IInvoiceRepository` and `INVOICE_REPOSITORY_TOKEN`.
2. **`repositories/invoice.repository.ts`**: wrap `this.prisma.invoice.findUnique` and return `Invoice.fromPersistence(record)`.
3. **`services/invoice.service.ts`**: inject `@Inject(INVOICE_REPOSITORY_TOKEN) private readonly repo: IInvoiceRepository`, throw `NotFoundException` on `null` and `ForbiddenException` if `requesterRole !== Role.ADMIN && entity.ownerId !== requesterId`.
4. **`controllers/invoice.controller.ts`**: validate `:id` with `ParseUUIDPipe({ version: '4' })`, document with Swagger (`@ApiOperation`, `@ApiParam`, `@ApiOkResponse`, `@ApiNotFoundResponse`, `@ApiForbiddenResponse`, `@ApiUnauthorizedResponse`, `@ApiBadRequestResponse`) and return `InvoiceResponseDto.fromEntity(entity)`.

---

## Case 2: Inter-module communication without crossing repositories

> *"The `Orders` module needs to check that the user exists before creating an order."*

- **❌ Forbidden:** importing `USER_REPOSITORY_TOKEN` or `UserRepository` inside `OrdersModule`.
- **✅ Correct:**
  1. `UsersModule` exports only `UserService` (`exports: [UserService]`).
  2. `OrdersModule` imports `UsersModule` (`imports: [UsersModule]`).
  3. `OrderService` imports `UserService` from `@/modules/users/services` (leaf folder) and injects it in its constructor.

---

## Case 3: Monorepo Scaffolding with Zod Contracts

```bash
node <skill-dir>/scripts/scaffold-module.mjs invoice \
  --target-dir apps/api/src/modules \
  --orm prisma \
  --contracts zod \
  --scope acme \
  --dry-run
```

Then run it without `--dry-run`. The script generates the 18 files with:
- `CreateInvoiceDto` and `UpdateInvoiceDto` extending `createZodDto(...)` from `@acme/contracts/invoices`.
- `InvoiceResponseDto` and `PaginatedInvoiceResponseDto`, ready for Swagger and `fromEntity` / `fromPaginatedResult`.
- `InvoiceModule` exporting only `InvoiceService`.
- Unit specs ready to run with `pnpm exec vitest run`.
