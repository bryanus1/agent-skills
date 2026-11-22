# DTO, Validation and Swagger OpenAPI Standards

This document defines the input/output contracts (DTOs), the mandatory `ValidationPipe` / `ClassSerializerInterceptor` configuration, standard pagination and the Swagger OpenAPI documentation.

---

## 1. Mandatory DTO Usage Matrix

| Layer / Target | Allowed Type | Forbidden Type | Purpose |
| :--- | :--- | :--- | :--- |
| **Body (`@Body`)** | `Create<Noun>Dto`, `Update<Noun>Dto` | Entity, DB model, `any`, `Record` | Strict input validation (`class-validator` or `nestjs-zod`). |
| **Query (`@Query`)** | `Find<Nouns>QueryDto` | Plain object, `any`, entity | Pagination, sorting and sanitized filters. |
| **Response** | `<Noun>ResponseDto`, `Paginated<Noun>ResponseDto` | Domain entity, DB record, plain unpaginated array | Prevents leaking internal fields and stabilizes the API contract. |

### Unbreakable Rule
Controllers **NEVER** return domain entities or raw database records, and paginated listings **NEVER** drop `total`, `page` and `limit`:

```typescript
// ✅ CORRECT: single and paginated responses with DTOs
return CustomerResponseDto.fromEntity(entity);
return PaginatedCustomerResponseDto.fromPaginatedResult(result);

// ❌ FORBIDDEN: returning the entity directly or losing pagination metadata
return entity;
return result.items.map(CustomerResponseDto.fromEntity);
```

---

## 2. Global `ValidationPipe` and Serialization

Without a `ValidationPipe` with `transform: true`, the defaults (`page = 1`) and `@Type(() => Number)` in `FindQueryDto` **do not run**. Register it globally in `src/main.ts` (or through `APP_PIPE`):

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,            // Strips properties not declared in the DTO
    forbidNonWhitelisted: true, // Responds 400 when unknown fields arrive
    transform: true,            // Converts query params and params to the DTO's types
  }),
);
```

If you use a global `ClassSerializerInterceptor`, annotate the `ResponseDto` classes with `@Exclude()` at class level and `@Expose()` on each public property (or map explicitly in `fromEntity()`).

---

## 3. Standard DTO Definition (`class-validator`)

### 3.1 `create-<noun>.dto.ts`
```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Customer full name', example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly name!: string;

  @ApiProperty({ description: 'Corporate email address', example: 'jane.doe@company.com' })
  @IsEmail()
  readonly email!: string;

  @ApiPropertyOptional({ description: 'International phone number', example: '+14155550123' })
  @IsOptional()
  @IsString()
  readonly phone?: string;
}
```

### 3.2 `update-<noun>.dto.ts`
```typescript
import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateCustomerDto } from './create-customer.dto';

export class UpdateCustomerDto extends PartialType(
  OmitType(CreateCustomerDto, ['email'] as const),
) {}
```

### 3.3 `find-<nouns>-query.dto.ts`
```typescript
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Min, Max, IsInt, IsString, IsOptional } from 'class-validator';

export class FindCustomersQueryDto {
  @ApiPropertyOptional({ description: 'Current page', default: 1, minimum: 1, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Records per page', default: 20, minimum: 1, maximum: 100, example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 20;

  @ApiPropertyOptional({ description: 'Search term', example: 'Jane' })
  @IsOptional()
  @IsString()
  search?: string;
}
```

### 3.4 `<noun>-response.dto.ts` (Single + Paginated)
```typescript
import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { Customer } from '../entities';

export class CustomerResponseDto {
  @ApiProperty({ description: 'UUID identifier', example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @Expose()
  readonly id!: string;

  @ApiProperty({ description: 'Full name', example: 'Jane Doe' })
  @Expose()
  readonly name!: string;

  @ApiPropertyOptional({ description: 'Description', nullable: true })
  @Expose()
  readonly description!: string | null;

  @ApiProperty({ description: 'Creation date' })
  @Expose()
  readonly createdAt!: Date;

  @ApiProperty({ description: 'Last update date' })
  @Expose()
  readonly updatedAt!: Date;

  constructor(partial: Partial<CustomerResponseDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(entity: Customer): CustomerResponseDto {
    return new CustomerResponseDto({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}

export class PaginatedCustomerResponseDto {
  @ApiProperty({ type: [CustomerResponseDto] })
  @Expose()
  readonly items!: CustomerResponseDto[];

  @ApiProperty({ example: 42 })
  @Expose()
  readonly total!: number;

  @ApiProperty({ example: 1 })
  @Expose()
  readonly page!: number;

  @ApiProperty({ example: 20 })
  @Expose()
  readonly limit!: number;

  constructor(partial: Partial<PaginatedCustomerResponseDto>) {
    Object.assign(this, partial);
  }

  static fromPaginatedResult(result: {
    items: Customer[];
    total: number;
    page: number;
    limit: number;
  }): PaginatedCustomerResponseDto {
    return new PaginatedCustomerResponseDto({
      items: result.items.map((entity) => CustomerResponseDto.fromEntity(entity)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  }
}
```

---

## 4. Zod Mode in Monorepos (`nestjs-zod`)

When the API lives in a monorepo in `zod` mode (`--contracts zod --scope <scope>`):

```typescript
// dto/create-customer.dto.ts
import { createZodDto } from 'nestjs-zod';

import { createCustomerSchema } from '@acme/contracts/customers';

export class CreateCustomerDto extends createZodDto(createCustomerSchema) {}
```

- Register `ZodValidationPipe` globally instead of the `class-validator` `ValidationPipe`.
- Keep `<Noun>ResponseDto` and `Paginated<Noun>ResponseDto` with `fromEntity()` / `fromPaginatedResult()` and `@ApiProperty` to preserve response isolation and the OpenAPI schema.

---

## 5. Swagger Checklist for Controllers

1. **Class:** `@ApiTags('<Nouns>')`, `@ApiBearerAuth()`, `@Controller('<nouns-kebab>')`.
2. **Each endpoint:** `@ApiOperation({ summary, description })`, `@ApiBadRequestResponse()`, `@ApiUnauthorizedResponse()`, `@ApiForbiddenResponse()`.
3. **Success:**
   - `GET /`: `@ApiOkResponse({ type: Paginated<Noun>ResponseDto })`
   - `GET /:id` and `PATCH /:id`: `@ApiOkResponse({ type: <Noun>ResponseDto })` + `@ApiNotFoundResponse()`
   - `POST /`: `@ApiCreatedResponse({ type: <Noun>ResponseDto })` + `@ApiBody({ type: Create<Noun>Dto })`
   - `DELETE /:id`: `@HttpCode(HttpStatus.NO_CONTENT)` + `@ApiNoContentResponse()` + `@ApiNotFoundResponse()`
4. **UUID parameters:** `@ApiParam({ name: 'id', format: 'uuid', ... })` + `new ParseUUIDPipe({ version: '4' })`.
