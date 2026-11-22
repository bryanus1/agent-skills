# Repository Pattern, Domain Entities and Transactions (ORM-Agnostic)

This guide explains how to decouple the persistence engine (Prisma, TypeORM, Drizzle, etc.) from services and controllers through typed contracts, immutable entities and error mapping.

---

## 1. The Golden Rule of Decoupling

- Services and controllers **never** import ORM clients (`PrismaClient`, TypeORM's `Repository`, Drizzle's `db`).
- The repository is the only layer that queries the database, and it always returns immutable **Domain Entities**.
- **The repository token (`<NOUN>_REPOSITORY_TOKEN`) is private to the module:** it is never included in the `@Module`'s `exports`.

---

## 2. Domain Entity (`entities/<noun>.entity.ts`)

Strict typing, with no `any` in the persistence record:

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

## 3. Repository Contract (`repositories/repository.ts`)

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

## 4. Concrete Implementations per ORM

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
Inject the Drizzle client or a typed query port (`DrizzleCustomerPort`) without `any`, and map each row with `(row) => Customer.fromPersistence(row)`.

---

## 5. Transactions (ORM-Agnostic Unit of Work) and Error Mapping

### 5.1 Transactions without leaking the ORM
When a business operation needs atomicity across several steps (e.g. `Invoice` + `InvoiceItem`), define an abstract `UnitOfWork` port:

```typescript
export const UNIT_OF_WORK_TOKEN = 'UNIT_OF_WORK';

export interface IUnitOfWork {
  runInTransaction<T>(work: () => Promise<T>): Promise<T>;
}
```

In Prisma it can be backed by `AsyncLocalStorage` over `prisma.$transaction`, and in TypeORM by a `QueryRunner`. The service stays 100% ORM-agnostic.

### 5.2 Translating persistence errors
The repository catches native driver errors (e.g. Prisma `P2002` or Postgres `23505` for a unique constraint) and throws semantic HTTP/domain exceptions (`ConflictException` `409`), so table or column names never leak to the client.

---

## 6. Binding in the Module (`<noun>.module.ts`)

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
  exports: [CustomerService], // NEVER export CUSTOMER_REPOSITORY_TOKEN
})
export class CustomerModule {}
```
