#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

function printHelp() {
  console.log(`
Usage: node scaffold-module.mjs <noun-singular> [options]

Arguments:
  noun-singular       Singular noun in kebab-case (e.g., pet, invoice, customer, order)

Options:
  --target-dir <dir>  Base directory for modules (default: src/modules)
  --plural <name>     Custom plural name (default: auto-detected plural)
  --help, -h          Show this help message
`);
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toPascalCase(str) {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function pluralize(str) {
  if (str.endsWith('y') && !/[aeiou]y$/i.test(str)) {
    return str.slice(0, -1) + 'ies';
  }
  if (str.endsWith('s') || str.endsWith('x') || str.endsWith('z') || str.endsWith('ch') || str.endsWith('sh')) {
    return str + 'es';
  }
  return str + 's';
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const nounKebab = args[0].toLowerCase();
  if (!/^[a-z0-9-]+$/.test(nounKebab)) {
    console.error(`❌ Error: Singular noun '${nounKebab}' must be in kebab-case.`);
    process.exit(1);
  }

  let targetDir = 'src/modules';
  let customPlural = null;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--target-dir' && args[i + 1]) {
      targetDir = args[i + 1];
      i++;
    } else if (args[i] === '--plural' && args[i + 1]) {
      customPlural = args[i + 1].toLowerCase();
      i++;
    }
  }

  const nounsKebab = customPlural || (nounKebab === 'auth' ? 'auth' : pluralize(nounKebab));
  const NounPascal = toPascalCase(nounKebab);
  const NounsPascal = toPascalCase(nounsKebab);
  const nounCamel = toCamelCase(nounKebab);
  const nounsCamel = toCamelCase(nounsKebab);
  const nounConstant = nounKebab.toUpperCase().replace(/-/g, '_');

  const moduleRoot = path.resolve(process.cwd(), targetDir, nounsKebab);

  if (fs.existsSync(moduleRoot)) {
    console.error(`❌ Error: Module folder '${moduleRoot}' already exists.`);
    process.exit(1);
  }

  console.log(`🏛️ Scaffolding NestJS Modular Monolith: ${NounPascal}`);
  console.log(`📁 Module directory (plural): ${nounsKebab}/`);
  console.log(`📄 Internal files (singular): ${nounKebab}.*.ts\n`);

  fs.mkdirSync(path.join(moduleRoot, 'entities'), { recursive: true });
  fs.mkdirSync(path.join(moduleRoot, 'dto'), { recursive: true });
  fs.mkdirSync(path.join(moduleRoot, 'repositories'), { recursive: true });
  fs.mkdirSync(path.join(moduleRoot, 'services'), { recursive: true });
  fs.mkdirSync(path.join(moduleRoot, 'controllers'), { recursive: true });

  const files = [];

  // 1. Entity
  files.push({
    path: path.join(moduleRoot, 'entities', `${nounKebab}.entity.ts`),
    content: `export interface ${NounPascal}PersistenceRecord {
  readonly id: string;
  // TODO: Add raw persistence / ORM fields here
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class ${NounPascal} {
  constructor(
    readonly id: string,
    // TODO: Add domain business fields here (use readonly)
    readonly createdAt: Date,
    readonly updatedAt: Date
  ) {}

  /**
   * Static factory to map persistence / ORM record to immutable domain entity.
   */
  static fromPersistence(record: ${NounPascal}PersistenceRecord | any): ${NounPascal} {
    return new ${NounPascal}(
      record.id,
      // TODO: Map persistence fields
      record.createdAt,
      record.updatedAt
    );
  }
}
`,
  });

  // 2. Entities Index
  files.push({
    path: path.join(moduleRoot, 'entities', 'index.ts'),
    content: `export * from './${nounKebab}.entity';\n`,
  });

  // 3. Create DTO
  files.push({
    path: path.join(moduleRoot, 'dto', `create-${nounKebab}.dto.ts`),
    content: `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class Create${NounPascal}Dto {
  @ApiProperty({ description: 'Nombre o título descriptivo', example: 'Ejemplo de ${NounPascal}' })
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @ApiPropertyOptional({ description: 'Notas o descripción adicional' })
  @IsOptional()
  @IsString()
  readonly description?: string;
  // TODO: Add validated request fields with @ApiProperty
}
`,
  });

  // 4. Update DTO
  files.push({
    path: path.join(moduleRoot, 'dto', `update-${nounKebab}.dto.ts`),
    content: `import { OmitType, PartialType } from '@nestjs/swagger';
import { Create${NounPascal}Dto } from './create-${nounKebab}.dto';

export class Update${NounPascal}Dto extends PartialType(
  OmitType(Create${NounPascal}Dto, [] as const)
) {}
`,
  });

  // 5. Query DTO
  files.push({
    path: path.join(moduleRoot, 'dto', `find-${nounsKebab}-query.dto.ts`),
    content: `import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class Find${NounsPascal}QueryDto {
  @ApiPropertyOptional({ description: 'Página actual', default: 1, minimum: 1, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Límite por página', default: 20, minimum: 1, maximum: 100, example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 20;

  @ApiPropertyOptional({ description: 'Término de búsqueda opcional', example: 'consulta' })
  @IsOptional()
  @IsString()
  search?: string;
}
`,
  });

  // 6. Response DTO
  files.push({
    path: path.join(moduleRoot, 'dto', `${nounKebab}-response.dto.ts`),
    content: `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ${NounPascal} } from '../entities';

export class ${NounPascal}ResponseDto {
  @ApiProperty({ description: 'Identificador único UUID', example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @Expose()
  readonly id: string;

  @ApiProperty({ description: 'Nombre o título descriptivo', example: 'Ejemplo de ${NounPascal}' })
  @Expose()
  readonly name: string;

  @ApiPropertyOptional({ description: 'Descripción detallada' })
  @Expose()
  readonly description?: string;

  constructor(partial: Partial<${NounPascal}ResponseDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(entity: ${NounPascal}): ${NounPascal}ResponseDto {
    return new ${NounPascal}ResponseDto({
      id: entity.id,
      name: (entity as any).name || '',
      description: (entity as any).description,
    });
  }
}
`,
  });

  // 7. DTO Index
  files.push({
    path: path.join(moduleRoot, 'dto', 'index.ts'),
    content: `export * from './create-${nounKebab}.dto';
export * from './update-${nounKebab}.dto';
export * from './find-${nounsKebab}-query.dto';
export * from './${nounKebab}-response.dto';
`,
  });

  // 8. Repository Contract & Token
  files.push({
    path: path.join(moduleRoot, 'repositories', 'repository.ts'),
    content: `import { ${NounPascal} } from '../entities';

export const ${nounConstant}_REPOSITORY_TOKEN = '${nounConstant}_REPOSITORY';

export interface Create${NounPascal}Data {
  readonly name: string;
  readonly description?: string;
}

export interface Update${NounPascal}Data {
  readonly name?: string;
  readonly description?: string;
}

export interface Find${NounsPascal}Params {
  readonly skip?: number;
  readonly take?: number;
  readonly search?: string;
}

/**
 * Contrato de repositorio abstracto para ${NounPascal}.
 * En cumplimiento de DIP, los servicios consumen esta interfaz y no la implementación concreta.
 */
export interface I${NounPascal}Repository {
  findById(id: string): Promise<${NounPascal} | null>;
  findMany(params: Find${NounsPascal}Params): Promise<[${NounPascal}[], number]>;
  create(data: Create${NounPascal}Data): Promise<${NounPascal}>;
  update(id: string, data: Update${NounPascal}Data): Promise<${NounPascal}>;
  remove(id: string): Promise<void>;
}
`,
  });

  // 9. Repository Implementation
  files.push({
    path: path.join(moduleRoot, 'repositories', `${nounKebab}.repository.ts`),
    content: `import { Injectable } from '@nestjs/common';
import { ${NounPascal} } from '../entities';
import {
  I${NounPascal}Repository,
  Create${NounPascal}Data,
  Update${NounPascal}Data,
  Find${NounsPascal}Params,
} from './repository';

@Injectable()
export class ${NounPascal}Repository implements I${NounPascal}Repository {
  // Inject your database service/provider here (e.g. TypeORM DataSource, PrismaService, Kysely, Mongo, etc.)
  constructor(private readonly db: any) {}

  async findById(id: string): Promise<${NounPascal} | null> {
    const record = await this.db.${nounCamel}?.findUnique?.({
      where: { id },
    });
    return record ? ${NounPascal}.fromPersistence(record) : null;
  }

  async findMany(params: Find${NounsPascal}Params): Promise<[${NounPascal}[], number]> {
    const { skip = 0, take = 20, search } = params;
    const where = search
      ? { name: { contains: search, mode: 'insensitive' } }
      : {};

    const [records, total] = await this.db.$transaction?.([
      this.db.${nounCamel}.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.${nounCamel}.count({ where }),
    ]) || [[], 0];

    return [records.map(${NounPascal}.fromPersistence), total];
  }

  async create(data: Create${NounPascal}Data): Promise<${NounPascal}> {
    const record = await this.db.${nounCamel}?.create?.({ data });
    return ${NounPascal}.fromPersistence(record);
  }

  async update(id: string, data: Update${NounPascal}Data): Promise<${NounPascal}> {
    const record = await this.db.${nounCamel}?.update?.({
      where: { id },
      data,
    });
    return ${NounPascal}.fromPersistence(record);
  }

  async remove(id: string): Promise<void> {
    await this.db.${nounCamel}?.delete?.({ where: { id } });
  }
}
`,
  });

  // 10. Repository Spec
  files.push({
    path: path.join(moduleRoot, 'repositories', `${nounKebab}.repository.spec.ts`),
    content: `import { ${NounPascal}Repository } from './${nounKebab}.repository';

describe('${NounPascal}Repository', () => {
  let repository: ${NounPascal}Repository;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      ${nounCamel}: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    repository = new ${NounPascal}Repository(mockDb);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
`,
  });

  // 11. Repositories Index
  files.push({
    path: path.join(moduleRoot, 'repositories', 'index.ts'),
    content: `export * from './repository';
export * from './${nounKebab}.repository';
`,
  });

  // 12. Service
  files.push({
    path: path.join(moduleRoot, 'services', `${nounKebab}.service.ts`),
    content: `import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { I${NounPascal}Repository, ${nounConstant}_REPOSITORY_TOKEN } from '../repositories';
import { ${NounPascal} } from '../entities';
import { Create${NounPascal}Dto, Update${NounPascal}Dto, Find${NounsPascal}QueryDto } from '../dto';

export interface PaginatedResult<T> {
  readonly items: T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

@Injectable()
export class ${NounPascal}Service {
  constructor(
    @Inject(${nounConstant}_REPOSITORY_TOKEN)
    private readonly ${nounCamel}Repository: I${NounPascal}Repository
  ) {}

  async create(dto: Create${NounPascal}Dto, requesterId: string, requesterRole: string): Promise<${NounPascal}> {
    return this.${nounCamel}Repository.create(dto);
  }

  async findAll(query: Find${NounsPascal}QueryDto, requesterId: string, requesterRole: string): Promise<PaginatedResult<${NounPascal}>> {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await this.${nounCamel}Repository.findMany({ skip, take: limit, search });
    return { items, total, page, limit };
  }

  async findOne(id: string, requesterId: string, requesterRole: string): Promise<${NounPascal}> {
    const entity = await this.${nounCamel}Repository.findById(id);
    if (!entity) {
      throw new NotFoundException('${NounPascal} no encontrado');
    }
    // TODO: Add ownership verification when applicable (e.g. requesterRole !== 'admin' && entity.ownerId !== requesterId)
    return entity;
  }

  async update(id: string, dto: Update${NounPascal}Dto, requesterId: string, requesterRole: string): Promise<${NounPascal}> {
    await this.findOne(id, requesterId, requesterRole);
    return this.${nounCamel}Repository.update(id, dto);
  }

  async remove(id: string, requesterId: string, requesterRole: string): Promise<void> {
    await this.findOne(id, requesterId, requesterRole);
    await this.${nounCamel}Repository.remove(id);
  }
}
`,
  });

  // 13. Service Spec
  files.push({
    path: path.join(moduleRoot, 'services', `${nounKebab}.service.spec.ts`),
    content: `import { ${NounPascal}Service } from './${nounKebab}.service';
import { I${NounPascal}Repository } from '../repositories';

describe('${NounPascal}Service', () => {
  let service: ${NounPascal}Service;
  let mockRepo: jest.Mocked<I${NounPascal}Repository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    service = new ${NounPascal}Service(mockRepo);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
`,
  });

  // 14. Services Index
  files.push({
    path: path.join(moduleRoot, 'services', 'index.ts'),
    content: `export * from './${nounKebab}.service';\n`,
  });

  // 15. Controller
  files.push({
    path: path.join(moduleRoot, 'controllers', `${nounKebab}.controller.ts`),
    content: `import {
  Get,
  Req,
  Body,
  Post,
  Param,
  Patch,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
  Controller,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiTags,
  ApiParam,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ${NounPascal}Service } from '../services';
import {
  Create${NounPascal}Dto,
  Update${NounPascal}Dto,
  Find${NounsPascal}QueryDto,
  ${NounPascal}ResponseDto,
} from '../dto';

@ApiTags('${NounsPascal}')
@ApiBearerAuth()
@Controller('${nounsKebab}')
export class ${NounPascal}Controller {
  constructor(private readonly ${nounCamel}Service: ${NounPascal}Service) {}

  @Post()
  @ApiOperation({ summary: 'Crear ${NounPascal}', description: 'Crea un nuevo registro en el dominio.' })
  @ApiCreatedResponse({ type: ${NounPascal}ResponseDto, description: 'Creado exitosamente.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
  @ApiBody({ type: Create${NounPascal}Dto })
  async create(@Body() dto: Create${NounPascal}Dto, @Req() req: any): Promise<${NounPascal}ResponseDto> {
    const requesterId = req.user?.id || 'anonymous';
    const requesterRole = req.user?.role || 'user';
    const entity = await this.${nounCamel}Service.create(dto, requesterId, requesterRole);
    return ${NounPascal}ResponseDto.fromEntity(entity);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ${NounsPascal}', description: 'Retorna listado paginado con filtros.' })
  @ApiOkResponse({ type: [${NounPascal}ResponseDto], description: 'Listado obtenido.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  async findAll(@Query() query: Find${NounsPascal}QueryDto, @Req() req: any): Promise<${NounPascal}ResponseDto[]> {
    const requesterId = req.user?.id || 'anonymous';
    const requesterRole = req.user?.role || 'user';
    const result = await this.${nounCamel}Service.findAll(query, requesterId, requesterRole);
    return result.items.map(${NounPascal}ResponseDto.fromEntity);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar ${NounPascal}', description: 'Obtiene detalle por identificador UUID.' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del registro' })
  @ApiOkResponse({ type: ${NounPascal}ResponseDto, description: 'Registro encontrado.' })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: any
  ): Promise<${NounPascal}ResponseDto> {
    const requesterId = req.user?.id || 'anonymous';
    const requesterRole = req.user?.role || 'user';
    const entity = await this.${nounCamel}Service.findOne(id, requesterId, requesterRole);
    return ${NounPascal}ResponseDto.fromEntity(entity);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar ${NounPascal}', description: 'Actualiza campos de un registro.' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del registro' })
  @ApiOkResponse({ type: ${NounPascal}ResponseDto, description: 'Actualizado exitosamente.' })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: Update${NounPascal}Dto,
    @Req() req: any
  ): Promise<${NounPascal}ResponseDto> {
    const requesterId = req.user?.id || 'anonymous';
    const requesterRole = req.user?.role || 'user';
    const entity = await this.${nounCamel}Service.update(id, dto, requesterId, requesterRole);
    return ${NounPascal}ResponseDto.fromEntity(entity);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar ${NounPascal}', description: 'Elimina un registro del sistema.' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del registro' })
  @ApiNoContentResponse({ description: 'Eliminado exitosamente.' })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: any
  ): Promise<void> {
    const requesterId = req.user?.id || 'anonymous';
    const requesterRole = req.user?.role || 'user';
    await this.${nounCamel}Service.remove(id, requesterId, requesterRole);
  }
}
`,
  });

  // 16. Controller Spec
  files.push({
    path: path.join(moduleRoot, 'controllers', `${nounKebab}.controller.spec.ts`),
    content: `import { ${NounPascal}Controller } from './${nounKebab}.controller';

describe('${NounPascal}Controller', () => {
  let controller: ${NounPascal}Controller;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    controller = new ${NounPascal}Controller(mockService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
`,
  });

  // 17. Controllers Index
  files.push({
    path: path.join(moduleRoot, 'controllers', 'index.ts'),
    content: `export * from './${nounKebab}.controller';\n`,
  });

  // 18. Module
  files.push({
    path: path.join(moduleRoot, `${nounKebab}.module.ts`),
    content: `import { Module } from '@nestjs/common';
import { ${NounPascal}Controller } from './controllers';
import { ${NounPascal}Service } from './services';
import {
  ${nounConstant}_REPOSITORY_TOKEN,
  ${NounPascal}Repository,
} from './repositories';

@Module({
  controllers: [${NounPascal}Controller],
  providers: [
    ${NounPascal}Service,
    {
      provide: ${nounConstant}_REPOSITORY_TOKEN,
      useClass: ${NounPascal}Repository,
    },
  ],
  exports: [${NounPascal}Service, ${nounConstant}_REPOSITORY_TOKEN],
})
export class ${NounPascal}Module {}
`,
  });

  // Write all 18 files in order
  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    fs.writeFileSync(item.path, item.content, 'utf8');
    console.log(`  [${String(i + 1).padStart(2, '0')}/18] Created: ${path.relative(process.cwd(), item.path)}`);
  }

  console.log(`\n✅ Module '${NounPascal}Module' successfully scaffolded!`);
  console.log(`\n📌 Next steps:`);
  console.log(`   1. Add ${NounPascal}Module to 'imports' in src/app.module.ts
   2. Define ${NounPascal} entity / table in your persistence schema (TypeORM, Prisma, Drizzle, etc.)
   3. Run your project's database migration command
   4. Run 'pnpm exec jest' to verify all 18 generated specs pass.`);
}

main();
