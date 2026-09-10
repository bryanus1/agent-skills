# Patrón de Repositorio y Entidades de Dominio (ORM-Agnostic)

Esta guía detalla cómo desacoplar completamente la base de datos y la librería de ORM (TypeORM, Prisma, MikroORM, Drizzle, Kysely, Mongo, etc.) del resto de la aplicación NestJS, aplicando los principios de Clean Architecture y Repository Pattern.

---

## 1. Desacoplamiento de Persistencia: Regla de Oro

El acceso a la base de datos se confina de manera estricta y exclusiva dentro de la capa de **Repositorio**:
- Los servicios y controladores **nunca** importan clientes de ORM (PrismaClient, TypeORM EntityManager / Repository, Drizzle db, Mongoose Models, etc.) ni interactúan directamente con esquemas de base de datos.
- El repositorio mapea los registros crudos de la persistencia a **Entidades de Dominio** puras e inmutables antes de retornarlos.
- **Independencia Tecnológica**: Si el proyecto decide cambiar de ORM (por ejemplo, migrar de TypeORM a Drizzle o Prisma), **las capas de Servicios, Controladores y DTOs permanecen 100% inalteradas**.

---

## 2. Entidad de Dominio (`entities/<noun>.entity.ts`)

La entidad de dominio modela las propiedades y reglas de negocio del recurso. Es inmutable y totalmente ajena a decoradores de ORM (`@Column`, `@Entity`, etc.):

```typescript
/**
 * Interfaz descriptiva del registro crudo de persistencia / ORM.
 */
export interface ICustomerPersistenceRecord {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone?: string | null;
  readonly company_id?: string;
  readonly companyId?: string;
  readonly company?: { name: string } | null;
  readonly created_at?: Date;
  readonly createdAt?: Date;
}

export class Customer {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly email: string,
    readonly phone: string | null,
    readonly companyId: string,
    readonly companyName?: string
  ) {}

  /**
   * Fábrica estática que transforma el registro de persistencia (cualquier ORM/driver)
   * a la entidad de dominio inmutable.
   */
  static fromPersistence(record: ICustomerPersistenceRecord | any): Customer {
    return new Customer(
      record.id,
      record.name,
      record.email,
      record.phone ?? null,
      record.companyId ?? record.company_id ?? '',
      record.company?.name
    );
  }
}
```

---

## 3. Contrato de Repositorio (`repositories/repository.ts`)

En cumplimiento con el **Principio de Inversión de Dependencias (DIP)**, la capa de dominio define un contrato abstracto mediante una interfaz de TypeScript y un token de inyección.

Los servicios de negocio **dependen exclusivamente de esta interfaz y del token**, jamás de la implementación concreta:

```typescript
// repositories/repository.ts
import { Customer } from '../entities';

export const CUSTOMER_REPOSITORY_TOKEN = 'CUSTOMER_REPOSITORY';

export interface CreateCustomerData {
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly companyId: string;
}

export interface UpdateCustomerData {
  readonly name?: string;
  readonly phone?: string;
}

export interface FindCustomersParams {
  readonly skip?: number;
  readonly take?: number;
  readonly search?: string;
  readonly companyId?: string;
}

/**
 * Contrato de repositorio de Customer.
 * Define las operaciones abstractas sin comprometerse con ningún ORM o motor de base de datos.
 */
export interface ICustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findMany(params: FindCustomersParams): Promise<[Customer[], number]>;
  create(data: CreateCustomerData): Promise<Customer>;
  update(id: string, data: UpdateCustomerData): Promise<Customer>;
  remove(id: string): Promise<void>;
}
```

---

## 4. Implementación Concreta (`repositories/<noun>.repository.ts`)

La clase de implementación concreta (`CustomerRepository`) implementa la interfaz de contrato `ICustomerRepository`. Esta clase es la única que conoce la librería de base de datos u ORM (Prisma, TypeORM, Drizzle, Kysely, Mongo, etc.):

```typescript
// repositories/customer.repository.ts
import { Injectable } from '@nestjs/common';
import { Customer } from '../entities';
import {
  ICustomerRepository,
  CreateCustomerData,
  UpdateCustomerData,
  FindCustomersParams,
} from './repository';

@Injectable()
export class CustomerRepository implements ICustomerRepository {
  // Inyectar el proveedor o cliente de base de datos configurado en el proyecto
  // (ej. PrismaService, DataSource de TypeORM, db de Drizzle, etc.)
  constructor(private readonly persistenceClient: any) {}

  async findById(id: string): Promise<Customer | null> {
    const record = await this.persistenceClient.findCustomerById(id);
    return record ? Customer.fromPersistence(record) : null;
  }

  async findMany(params: FindCustomersParams): Promise<[Customer[], number]> {
    const { skip = 0, take = 20, search, companyId } = params;

    const [records, total] = await this.persistenceClient.findCustomersPaginated({
      skip,
      take,
      search,
      companyId,
    });

    return [records.map(Customer.fromPersistence), total];
  }

  async create(data: CreateCustomerData): Promise<Customer> {
    const record = await this.persistenceClient.insertCustomer(data);
    return Customer.fromPersistence(record);
  }

  async update(id: string, data: UpdateCustomerData): Promise<Customer> {
    const record = await this.persistenceClient.updateCustomer(id, data);
    return Customer.fromPersistence(record);
  }

  async remove(id: string): Promise<void> {
    await this.persistenceClient.deleteCustomer(id);
  }
}
```

---

## 5. Inversión de Dependencias en el Servicio (`services/<noun>.service.ts`)

Cuando el servicio consume el repositorio, **hace referencia a la interfaz y al token, jamás a la implementación concreta**:

```typescript
// services/customer.service.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Customer } from '../entities';
import {
  ICustomerRepository,
  CUSTOMER_REPOSITORY_TOKEN,
} from '../repositories';

@Injectable()
export class CustomerService {
  constructor(
    @Inject(CUSTOMER_REPOSITORY_TOKEN)
    private readonly customerRepository: ICustomerRepository // <-- Referencia al contrato ICustomerRepository
  ) {}

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return customer;
  }
}
```

---

## 6. Vinculación en el Módulo (`<noun>.module.ts`)

En el módulo NestJS se asocia el token de inyección con la clase concreta:

```typescript
// customer.module.ts
import { Module } from '@nestjs/common';
import { CustomerController } from './controllers';
import { CustomerService } from './services';
import {
  CUSTOMER_REPOSITORY_TOKEN,
  CustomerRepository,
} from './repositories';

@Module({
  controllers: [CustomerController],
  providers: [
    CustomerService,
    {
      provide: CUSTOMER_REPOSITORY_TOKEN,
      useClass: CustomerRepository,
    },
  ],
  exports: [CustomerService, CUSTOMER_REPOSITORY_TOKEN],
})
export class CustomerModule {}
```

---

## 7. Re-export en Barrels (`repositories/index.ts`)

El barrel de hoja de la carpeta `repositories/` expone tanto el contrato como la implementación:

```typescript
// repositories/index.ts
export * from './repository';
export * from './customer.repository';
```

---

## 8. Estrategia de Testing Unitario (`*.spec.ts`)

- **Para el Repositorio (`customer.repository.spec.ts`)**:
  - Se instancia directamente `new CustomerRepository(mockPersistenceClient)`.
  - Se verifica que todos los retornos sean instancias de la Entidad de Dominio usando `fromPersistence()`.
- **Para el Servicio (`customer.service.spec.ts`)**:
  - Se suministra un mock tipado contra la interfaz `ICustomerRepository`:
    ```typescript
    const mockRepo: jest.Mocked<ICustomerRepository> = {
      findById: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    ```
  - En el `TestingModule` de NestJS se usa `{ provide: CUSTOMER_REPOSITORY_TOKEN, useValue: mockRepo }`.
  - El test no requiere levantar ninguna base de datos ni conocer la implementación de persistencia.

