# Estándares de DTOs y Swagger OpenAPI

Este documento define la política obligatoria de contratos de datos (DTOs) y la especificación de documentación interactiva Swagger OpenAPI en NestJS.

---

## 1. Matriz Obligatoria de Uso de DTOs

Todos los puntos de interacción entre el cliente HTTP y el controlador **deben** estar tipados estrictamente con DTOs específicos.

| Capa / Target | Tipo Permitido | Tipo Prohibido | Propósito |
| :--- | :--- | :--- | :--- |
| **Cuerpo de Petición (`@Body`)** | `Create<Noun>Dto`, `Update<Noun>Dto` | Entidad, Modelo DB, `any`, `Record` | Validación de datos entrantes con `class-validator`. |
| **Query Params (`@Query`)** | `Find<Nouns>QueryDto` | Objeto plano, `any`, entidad | Paginación, ordenamiento y filtros sanitizados. |
| **Payload de Respuesta** | `<Noun>ResponseDto`, `<Noun>ResponseDto[]` | Entidad de dominio (`<Noun>`), Registro DB (`<Noun>DB`) | Previene fuga de datos sensibles y estabiliza contratos API. |

### ⛔ Regla Inquebrantable
Los controladores **NUNCA** deben retornar entidades de dominio, modelos de base de datos o registros crudos directamente a los clientes. Siempre deben transformarse explícitamente a `<Noun>ResponseDto` usando el método de fábrica:

```typescript
// ✅ CORRECTO: Transformación explícita a Response DTO
const entity = await this.nounService.findOne(id, req.user.id, req.user.role);
return NounResponseDto.fromEntity(entity);

// ❌ PROHIBIDO: Retorno directo de entidad o modelo DB
const entity = await this.nounService.findOne(id, req.user.id, req.user.role);
return entity;
```

---

## 2. Definición Estándar de DTOs

### 2.1 `create-<noun>.dto.ts`
Todos los campos requeridos deben tener `@ApiProperty` con descripción y valores de ejemplo realistas, además de los decoradores de `class-validator`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Nombre completo del cliente', example: 'Ana María Gómez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly name: string;

  @ApiProperty({ description: 'Correo electrónico corporativo', example: 'ana.gomez@empresa.com' })
  @IsEmail()
  readonly email: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto internacional', example: '+573001234567' })
  @IsOptional()
  @IsString()
  readonly phone?: string;
}
```

### 2.2 `update-<noun>.dto.ts`
Hereda de `CreateDto` haciendo todos los campos opcionales mediante `PartialType` de `@nestjs/swagger`, omitiendo campos inmutables:

```typescript
import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCustomerDto } from './create-customer.dto';

// Omitir campos que no pueden modificarse tras la creación (ej. email)
export class UpdateCustomerDto extends PartialType(
  OmitType(CreateCustomerDto, ['email'] as const)
) {}
```

### 2.3 `find-<nouns>-query.dto.ts`
Incluye paginación por defecto y filtros opcionales de búsqueda:

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FindCustomersQueryDto {
  @ApiPropertyOptional({ description: 'Número de página', default: 1, minimum: 1, example: 1 })
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

### 2.4 `<noun>-response.dto.ts`
Representa el contrato público de salida hacia el frontend. Solo expone propiedades públicas con `@Expose()` y provee el método estático `fromEntity()`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Customer } from '../entities';

export class CustomerResponseDto {
  @ApiProperty({ description: 'Identificador único UUID', example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @Expose()
  readonly id: string;

  @ApiProperty({ description: 'Nombre completo', example: 'Ana María Gómez' })
  @Expose()
  readonly name: string;

  @ApiProperty({ description: 'Correo electrónico', example: 'ana.gomez@empresa.com' })
  @Expose()
  readonly email: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto', example: '+573001234567' })
  @Expose()
  readonly phone?: string;

  constructor(partial: Partial<CustomerResponseDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(entity: Customer): CustomerResponseDto {
    return new CustomerResponseDto({
      id: entity.id,
      name: entity.name,
      email: entity.email,
      phone: entity.phone,
    });
  }
}
```

---

## 3. Checklist Exhaustivo de Swagger en Controladores

Todo controlador REST debe cumplir con el siguiente conjunto de decoradores:

1. **A nivel de clase**:
   - `@ApiTags('<Nouns>')`
   - `@ApiBearerAuth()`
   - `@Controller('<nouns-kebab>')`
2. **A nivel de cada método de endpoint**:
   - `@ApiOperation({ summary, description })`
   - `@ApiUnauthorizedResponse({ description: 'No autorizado' })`
   - `@ApiForbiddenResponse({ description: 'Permisos insuficientes' })` (si usa `@Roles(...)`)
3. **Decoradores de éxito semánticos con tipo de DTO**:
   - `@ApiOkResponse({ type: CustomerResponseDto })` para un elemento.
   - `@ApiOkResponse({ type: [CustomerResponseDto] })` para listas.
   - `@ApiCreatedResponse({ type: CustomerResponseDto })` para POST de creación.
   - `@ApiNoContentResponse()` para eliminación (DELETE con `@HttpCode(204)`).
4. **Decoradores de parámetros**:
   - `@ApiParam({ name: 'id', format: 'uuid', description: 'Identificador UUID', example: '...' })`
   - `@ApiBody({ type: CreateCustomerDto, description: 'Payload de creación' })`
5. **Validación de parámetros de ruta**:
   - Usar `new ParseUUIDPipe({ version: '4' })` en todos los parámetros `:id`.
