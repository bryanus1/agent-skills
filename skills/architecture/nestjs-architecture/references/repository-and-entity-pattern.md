# Patrón de Repositorio, Entidades de Dominio y Transacciones (ORM-Agnostic)

Esta guía detalla cómo desacoplar el motor de persistencia (Prisma, TypeORM, Drizzle, etc.) de los servicios y controladores mediante contratos tipados, entidades inmutables y mapeo de errores.

---

## 1. Regla de Oro del Desacoplamiento

- Los servicios y controladores **nunca** importan clientes de ORM (`PrismaClient`, `Repository` de TypeORM, `db` de Drizzle).
- El repositorio es la única capa que consulta la base de datos y siempre retorna **Entidades de Dominio** inmutables.
- **El token del repositorio (`<NOUN>_REPOSITORY_TOKEN`) es privado al módulo:** nunca se incluye en `exports` del `@Module`.

---

## 2. Entidad de Dominio (`entities/<noun>.entity.ts`)

Tipado estricto sin `any` en el registro de persistencia:

```typescript
export interface CustomerPersistenceRecord {
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly ownerId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class Customer {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly description: string | null,
    readonly ownerId: string,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static fromPersistence(record: CustomerPersistenceRecord): Customer {
    return new Customer(
      record.id,
      record.name,
      record.description ?? null,
      record.ownerId,
      record.createdAt,
      record.updatedAt,
    );
  }
}
```

---

## 3. Contrato de Repositorio (`repositories/repository.ts`)

```typescript
import type { Customer } from '../entities';

export const CUSTOMER_REPOSITORY_TOKEN = 'CUSTOMER_REPOSITORY';

export interface CreateCustomerData {
  readonly name: string;
  readonly description?: string;
  readonly ownerId: string;
}

export interface UpdateCustomerData {
  readonly name?: string;
  readonly description?: string;
}

export interface FindCustomersParams {
  readonly skip?: number;
  readonly take?: number;
  readonly search?: string;
  readonly ownerId?: string;
}

export interface ICustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findMany(params: FindCustomersParams): Promise<[Customer[], number]>;
  create(data: CreateCustomerData): Promise<Customer>;
  update(id: string, data: UpdateCustomerData): Promise<Customer>;
  remove(id: string): Promise<void>;
}
```

---

## 4. Implementaciones Concretas por ORM

### 4.1 Prisma (`--orm prisma`)
```typescript
import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/common/prisma';

import { Customer, type CustomerPersistenceRecord } from '../entities';
import type {
  FindCustomersParams,
  CreateCustomerData,
  UpdateCustomerData,
  ICustomerRepository,
} from './repository';

@Injectable()
export class CustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Customer | null> {
    const record = await this.prisma.customer.findUnique({ where: { id } });
    return record ? Customer.fromPersistence(record as CustomerPersistenceRecord) : null;
  }

  async findMany(params: FindCustomersParams): Promise<[Customer[], number]> {
    const { skip = 0, take = 20, search, ownerId } = params;
    const where = {
      ...(ownerId ? { ownerId } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const [records, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.customer.count({ where }),
    ]);

    return [records.map((r) => Customer.fromPersistence(r as CustomerPersistenceRecord)), total];
  }
  // create, update, remove...
}
```

### 4.2 TypeORM (`--orm typeorm`)
```typescript
import { ILike, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CustomerRepository implements ICustomerRepository {
  constructor(
    @InjectRepository(CustomerOrmEntity)
    private readonly ormRepo: Repository<CustomerOrmEntity>,
  ) {}

  async findMany(params: FindCustomersParams): Promise<[Customer[], number]> {
    const { skip = 0, take = 20, search, ownerId } = params;
    const [records, total] = await this.ormRepo.findAndCount({
      where: {
        ...(ownerId ? { ownerId } : {}),
        ...(search ? { name: ILike(`%${search}%`) } : {}),
      },
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
    return [records.map((r) => Customer.fromPersistence(r)), total];
  }
}
```

### 4.3 Drizzle (`--orm drizzle`)
Inyecta el cliente Drizzle o un query port tipado (`DrizzleCustomerPort`) sin `any` y transforma cada fila con `(row) => Customer.fromPersistence(row)`.

---

## 5. Transacciones (Unit of Work ORM-Agnostic) y Mapeo de Errores

### 5.1 Transacciones sin filtrar el ORM
Cuando una operación de negocio necesita atomicidad entre múltiples pasos (ej. `Invoice` + `InvoiceItem`), define un puerto abstracto `UnitOfWork`:

```typescript
export const UNIT_OF_WORK_TOKEN = 'UNIT_OF_WORK';

export interface IUnitOfWork {
  runInTransaction<T>(work: () => Promise<T>): Promise<T>;
}
```

En Prisma puede respaldarse con `AsyncLocalStorage` sobre `prisma.$transaction`, y en TypeORM con `QueryRunner`. El servicio permanece 100% agnóstico al ORM.

### 5.2 Traducción de errores de persistencia
El repositorio captura errores nativos del driver (p. ej. Prisma `P2002` o Postgres `23505` para unique constraint) y lanza excepciones semánticas HTTP/de dominio (`ConflictException` `409`), evitando filtrar nombres de tablas o columnas al cliente.

---

## 6. Vinculación en el Módulo (`<noun>.module.ts`)

```typescript
@Module({
  controllers: [CustomerController],
  providers: [
    CustomerService,
    {
      provide: CUSTOMER_REPOSITORY_TOKEN,
      useClass: CustomerRepository,
    },
  ],
  exports: [CustomerService], // NUNCA exportar CUSTOMER_REPOSITORY_TOKEN
})
export class CustomerModule {}
```
