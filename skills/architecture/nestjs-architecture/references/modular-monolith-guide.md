# Guía del Monolito Modular en NestJS

Esta guía establece los principios de diseño arquitectónico, límites de módulos, reglas de comunicación y nomenclatura para construir aplicaciones empresariales robustas en NestJS.

---

## 1. Principio Fundamental: Monolito Modular (*Modular Monolith*)

El Monolito Modular organiza el backend en módulos de dominio altamente cohesionados y con acoplamiento débil:

- **Encapsulación de Dominio**: Cada capacidad de negocio reside en un módulo dedicado dentro de `src/modules/<nouns>/` que contiene sus propios controladores, servicios, repositorios, entidades y DTOs.
- **Interfaces Explícitas**: Los módulos solo se comunican entre sí mediante servicios de NestJS explícitamente exportados en su `@Module({ exports: [NounService] })`.
- **Prohibición de Acceso Cruzado a Repositorios**: Un módulo `Orders` **nunca** debe importar o inyectar el repositorio de `Users`. Debe consumir el `UserService` público.
- **Exact Package Versions**: Todas las dependencias deben fijarse con versiones exactas en el gestor de paquetes (`.npmrc` con `save-exact=true`) para garantizar compilaciones reproducibles.

---

## 2. Convenciones de Nombres y Estructura de Directorios

### 2.1 Regla Plural vs Singular
- La carpeta del módulo es siempre **plural** en `kebab-case` (ej. `pets`, `invoices`, `appointments`). *Excepción*: `auth` se mantiene singular.
- Los archivos y clases dentro del módulo son siempre **singulares**:
  - Archivos: `kebab-case` singular (`invoice.controller.ts`, `invoice.service.ts`).
  - Clases: `PascalCase` singular (`InvoiceController`, `InvoiceService`).

| Capa | Archivo | Clase / Interfaz | Subcarpeta |
| :--- | :--- | :--- | :--- |
| **Module** | `<noun>.module.ts` | `<Noun>Module` | Raíz del módulo |
| **Controller** | `<noun>.controller.ts` | `<Noun>Controller` | `controllers/` |
| **Service** | `<noun>.service.ts` | `<Noun>Service` | `services/` |
| **Repo Contrato** | `repository.ts` | `I<Noun>Repository` | `repositories/` |
| **Repo Impl** | `<noun>.repository.ts` | `<Noun>Repository` | `repositories/` |
| **Entity** | `<noun>.entity.ts` | `<Noun>` | `entities/` |
| **DTOs** | `<action>-<noun>.dto.ts` | `<Action><Noun>Dto` | `dto/` |
| **Specs** | `<noun>.<layer>.spec.ts` | — | Misma subcarpeta |

### 2.2 Layout de Directorio Completo de un Módulo
```text
src/modules/<nouns>/          ← Carpeta en PLURAL
├── controllers/
│   ├── <noun>.controller.ts  ← Archivos en SINGULAR
│   ├── <noun>.controller.spec.ts
│   └── index.ts
├── dto/
│   ├── create-<noun>.dto.ts
│   ├── update-<noun>.dto.ts
│   ├── find-<nouns>-query.dto.ts
│   ├── <noun>-response.dto.ts
│   └── index.ts
├── entities/
│   ├── <noun>.entity.ts
│   └── index.ts
├── repositories/
│   ├── repository.ts         ← Contrato (I<Noun>Repository) y Token
│   ├── <noun>.repository.ts  ← Implementación (<Noun>Repository)
│   ├── <noun>.repository.spec.ts
│   └── index.ts
├── services/
│   ├── <noun>.service.ts
│   ├── <noun>.service.spec.ts
│   └── index.ts
└── <noun>.module.ts
```

### 2.3 Política de Barrels: Regla de la Hoja Terminal (*Leaf-Folder Policy*)
- **La raíz del módulo (`src/modules/<nouns>/`) NUNCA lleva `index.ts`**: Es una carpeta contenedora que agrupa subcarpetas.
- **Solo las subcarpetas hoja llevan `index.ts`**: Las subcarpetas internas (`controllers/`, `dto/`, `entities/`, `repositories/`, `services/`) contienen directamente archivos de código, por lo que cada una exporta su API pública mediante su propio `index.ts`.
- **Importaciones inter-módulos**: Al consumir servicios de otro módulo, se importa directamente apuntando a la subcarpeta hoja:
  ```typescript
  // ✅ CORRECTO: Importar desde la subcarpeta hoja
  import { InvoiceService } from '@/modules/invoices/services';

  // ❌ PROHIBIDO: Importar desde la raíz del módulo
  import { InvoiceService } from '@/modules/invoices';
  ```

---

## 3. Checklist de Creación de Módulos (18 Pasos en Orden)

Al crear un nuevo módulo a partir de un sustantivo singular (ej. `product`), generar los archivos siguiendo este orden estricto:

1. **`entities/<noun>.entity.ts`**: Clase de dominio inmutable con constructor `readonly` y mapper `fromPersistence()`.
2. **`entities/index.ts`**: Exportador de la entidad.
3. **`dto/create-<noun>.dto.ts`**: DTO de creación con validaciones y `@ApiProperty`.
4. **`dto/update-<noun>.dto.ts`**: `PartialType(OmitType(Create<Noun>Dto, [] as const))`.
5. **`dto/find-<nouns>-query.dto.ts`**: DTO con paginación (`page`, `limit`) y filtros.
6. **`dto/<noun>-response.dto.ts`**: DTO de respuesta pública decorado con `@ApiProperty` y `@Expose()`.
7. **`dto/index.ts`**: Exportador de todos los DTOs.
8. **`repositories/repository.ts`**: Contrato de Interfaz (`I<Noun>Repository`) y Token de Inyección (`<NOUN>_REPOSITORY_TOKEN`).
9. **`repositories/<noun>.repository.ts`**: Implementación concreta (`<Noun>Repository implements I<Noun>Repository`) que aísla la base de datos/ORM.
10. **`repositories/<noun>.repository.spec.ts`**: Pruebas unitarias de repositorio mockeando el cliente de BD.
11. **`repositories/index.ts`**: Exportador de contrato e implementación.
12. **`services/<noun>.service.ts`**: Servicio de lógica de negocio inyectando `@Inject(<NOUN>_REPOSITORY_TOKEN) repo: I<Noun>Repository`.
13. **`services/<noun>.service.spec.ts`**: Pruebas unitarias de todas las ramas del servicio.
14. **`services/index.ts`**: Exportador del servicio.
15. **`controllers/<noun>.controller.ts`**: Controlador REST documentado con OpenAPI y retorno exclusivo de Response DTOs.
16. **`controllers/<noun>.controller.spec.ts`**: Pruebas unitarias del controlador.
17. **`controllers/index.ts`**: Exportador del controlador.
18. **`<noun>.module.ts`**: Definición del módulo NestJS vinculando `{ provide: <NOUN>_REPOSITORY_TOKEN, useClass: <Noun>Repository }`.

---

## 4. Pasos Posteriores al Scaffolding

Una vez generados los 18 archivos:
1. Registrar `<Noun>Module` en el array de `imports` de `src/app.module.ts`.
2. Definir el esquema/tabla o modelo en la capa de persistencia/ORM de tu elección (TypeORM, Prisma, Drizzle, etc.).
3. Ejecutar las migraciones correspondientes de base de datos según el ORM configurado.
4. Ejecutar la suite de pruebas unitarias (`pnpm exec jest --verbose`) para validar que todos los tests pasen.

### 4.1 Exclusión de Pruebas Unitarias en `src/config/`
La carpeta `src/config/` (`env.validation.ts`, constantes del sistema, loaders de `@nestjs/config`) almacena esquemas declarativos de validación de entorno y configuraciones estáticas de inicio. **NO** lleva pruebas unitarias directas (`*.spec.ts`).
