# Estándares de DTOs, Validación y Swagger OpenAPI

Este documento define los contratos de entrada/salida (DTOs), la configuración obligatoria de `ValidationPipe` / `ClassSerializerInterceptor`, la paginación estándar y la documentación Swagger OpenAPI.

---

## 1. Matriz Obligatoria de Uso de DTOs

| Capa / Target | Tipo Permitido | Tipo Prohibido | Propósito |
| :--- | :--- | :--- | :--- |
| **Body (`@Body`)** | `Create<Noun>Dto`, `Update<Noun>Dto` | Entidad, Modelo DB, `any`, `Record` | Validación estricta de entrada (`class-validator` o `nestjs-zod`). |
| **Query (`@Query`)** | `Find<Nouns>QueryDto` | Objeto plano, `any`, entidad | Paginación, ordenamiento y filtros sanitizados. |
| **Respuesta** | `<Noun>ResponseDto`, `Paginated<Noun>ResponseDto` | Entidad de dominio, registro DB, array plano sin paginar | Previene fuga de campos internos y estabiliza el contrato API. |

### Regla Inquebrantable
Los controladores **NUNCA** retornan entidades de dominio ni registros crudos de base de datos, y los listados paginados **NUNCA** descartan `total`, `page` y `limit`:

```typescript
// ✅ CORRECTO: Respuesta individual y paginada con DTOs
return CustomerResponseDto.fromEntity(entity);
return PaginatedCustomerResponseDto.fromPaginatedResult(result);

// ❌ PROHIBIDO: Retornar entidad directa o perder metadatos de paginación
return entity;
return result.items.map(CustomerResponseDto.fromEntity);
```

---

## 2. `ValidationPipe` Global y Serialización

Sin `ValidationPipe` con `transform: true`, los valores por defecto (`page = 1`) y `@Type(() => Number)` en `FindQueryDto` **no se ejecutan**. Regístralo globalmente en `src/main.ts` (o vía `APP_PIPE`):

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,            // Elimina propiedades no declaradas en el DTO
    forbidNonWhitelisted: true, // Responde 400 si llegan campos desconocidos
    transform: true,            // Convierte query params y params al tipo del DTO
  }),
);
```

Si usas `ClassSerializerInterceptor` global, anota los `ResponseDto` con `@Exclude()` a nivel de clase y `@Expose()` en cada propiedad pública (o mapea explícitamente en `fromEntity()`).

---

## 3. Definición Estándar de DTOs (`class-validator`)

### 3.1 `create-<noun>.dto.ts`
```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Nombre completo del cliente', example: 'Ana María Gómez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly name!: string;

  @ApiProperty({ description: 'Correo electrónico corporativo', example: 'ana.gomez@empresa.com' })
  @IsEmail()
  readonly email!: string;

  @ApiPropertyOptional({ description: 'Teléfono internacional', example: '+573001234567' })
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
  @ApiPropertyOptional({ description: 'Página actual', default: 1, minimum: 1, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Registros por página', default: 20, minimum: 1, maximum: 100, example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 20;

  @ApiPropertyOptional({ description: 'Término de búsqueda', example: 'Ana' })
  @IsOptional()
  @IsString()
  search?: string;
}
```

### 3.4 `<noun>-response.dto.ts` (Individual + Paginado)
```typescript
import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { Customer } from '../entities';

export class CustomerResponseDto {
  @ApiProperty({ description: 'Identificador UUID', example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @Expose()
  readonly id!: string;

  @ApiProperty({ description: 'Nombre completo', example: 'Ana María Gómez' })
  @Expose()
  readonly name!: string;

  @ApiPropertyOptional({ description: 'Descripción', nullable: true })
  @Expose()
  readonly description!: string | null;

  @ApiProperty({ description: 'Fecha de creación' })
  @Expose()
  readonly createdAt!: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
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

## 4. Modo Zod en Monorepos (`nestjs-zod`)

Cuando la API convive en un monorepo con modo `zod` (`--contracts zod --scope <scope>`):

```typescript
// dto/create-customer.dto.ts
import { createZodDto } from 'nestjs-zod';

import { createCustomerSchema } from '@acme/contracts/customers';

export class CreateCustomerDto extends createZodDto(createCustomerSchema) {}
```

- Registra `ZodValidationPipe` globalmente en lugar del `ValidationPipe` de `class-validator`.
- Mantén `<Noun>ResponseDto` y `Paginated<Noun>ResponseDto` con `fromEntity()` / `fromPaginatedResult()` y `@ApiProperty` para conservar el aislamiento de respuesta y el esquema OpenAPI.

---

## 5. Checklist de Swagger en Controladores

1. **Clase:** `@ApiTags('<Nouns>')`, `@ApiBearerAuth()`, `@Controller('<nouns-kebab>')`.
2. **Cada endpoint:** `@ApiOperation({ summary, description })`, `@ApiBadRequestResponse()`, `@ApiUnauthorizedResponse()`, `@ApiForbiddenResponse()`.
3. **Éxito:**
   - `GET /`: `@ApiOkResponse({ type: Paginated<Noun>ResponseDto })`
   - `GET /:id` y `PATCH /:id`: `@ApiOkResponse({ type: <Noun>ResponseDto })` + `@ApiNotFoundResponse()`
   - `POST /`: `@ApiCreatedResponse({ type: <Noun>ResponseDto })` + `@ApiBody({ type: Create<Noun>Dto })`
   - `DELETE /:id`: `@HttpCode(HttpStatus.NO_CONTENT)` + `@ApiNoContentResponse()` + `@ApiNotFoundResponse()`
4. **Parámetros UUID:** `@ApiParam({ name: 'id', format: 'uuid', ... })` + `new ParseUUIDPipe({ version: '4' })`.
