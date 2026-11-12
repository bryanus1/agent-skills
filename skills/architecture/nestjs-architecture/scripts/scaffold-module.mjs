#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const KEBAB_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const VALID_ORMS = ['custom', 'prisma', 'typeorm', 'drizzle'];
const VALID_CONTRACTS = ['class-validator', 'zod'];
const VALID_RUNNERS = ['vitest', 'jest'];

function printHelp() {
  console.log(`
Usage: node scaffold-module.mjs <noun-singular> [options]

Arguments:
  noun-singular              Singular noun in kebab-case (e.g., pet, invoice, order)

Options:
  --target-dir <dir>         Base directory for modules (default: src/modules)
  --plural <name>            Custom plural name in kebab-case (default: auto-detected)
  --orm <adapter>            custom | prisma | typeorm | drizzle (default: custom)
  --contracts <mode>         class-validator | zod (default: class-validator)
  --scope <scope>            npm scope for --contracts zod (e.g., acme -> @acme/contracts)
  --test-runner <runner>     vitest | jest (default: vitest)
  --dry-run                  List files that would be generated without writing anything
  --force                    Overwrite generated files that already exist (default: abort)
  --help, -h                 Show this help message
`);
}

function fail(message) {
  console.error(`❌ Error: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  const booleans = new Set(['--dry-run', '--force', '--help', '-h']);
  const strings = new Set(['--target-dir', '--plural', '--orm', '--contracts', '--scope', '--test-runner']);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (booleans.has(arg)) {
      flags[arg.replace(/^--?/, '')] = true;
    } else if (strings.has(arg)) {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('-')) {
        fail(`Missing value for ${arg}.`);
      }
      flags[arg.slice(2)] = value;
      i++;
    } else if (arg.startsWith('-')) {
      fail(`Unknown option: ${arg}. Run with --help.`);
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function toPascalCase(str) {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function pluralize(str) {
  if (str === 'auth') return str;
  if (str.endsWith('y') && !/[aeiou]y$/i.test(str)) {
    return `${str.slice(0, -1)}ies`;
  }
  if (/(s|x|z|ch|sh)$/.test(str)) {
    return `${str}es`;
  }
  return `${str}s`;
}

function detectScopeFromCwd() {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (typeof pkg.name !== 'string' || !pkg.name) return null;
    return pkg.name.startsWith('@') ? pkg.name.slice(1).split('/')[0] : pkg.name;
  } catch {
    return null;
  }
}

function buildRepositoryTemplate({ orm, NounPascal, nounKebab, nounCamel, NounsPascal }) {
  const contractImports = `import type {
  Find${NounsPascal}Params,
  Create${NounPascal}Data,
  Update${NounPascal}Data,
  I${NounPascal}Repository,
} from './repository';
import { ${NounPascal}, type ${NounPascal}PersistenceRecord } from '../entities';`;

  if (orm === 'prisma') {
    return `import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/common/prisma';

${contractImports}

@Injectable()
export class ${NounPascal}Repository implements I${NounPascal}Repository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<${NounPascal} | null> {
    const record = await this.prisma.${nounCamel}.findUnique({ where: { id } });
    return record ? ${NounPascal}.fromPersistence(record as ${NounPascal}PersistenceRecord) : null;
  }

  async findMany(params: Find${NounsPascal}Params): Promise<[${NounPascal}[], number]> {
    const { skip = 0, take = 20, search, ownerId } = params;
    const where = {
      ...(ownerId ? { ownerId } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const [records, total] = await this.prisma.$transaction([
      this.prisma.${nounCamel}.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.${nounCamel}.count({ where }),
    ]);

    return [
      records.map((record) => ${NounPascal}.fromPersistence(record as ${NounPascal}PersistenceRecord)),
      total,
    ];
  }

  async create(data: Create${NounPascal}Data): Promise<${NounPascal}> {
    const record = await this.prisma.${nounCamel}.create({ data });
    return ${NounPascal}.fromPersistence(record as ${NounPascal}PersistenceRecord);
  }

  async update(id: string, data: Update${NounPascal}Data): Promise<${NounPascal}> {
    const record = await this.prisma.${nounCamel}.update({ where: { id }, data });
    return ${NounPascal}.fromPersistence(record as ${NounPascal}PersistenceRecord);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.${nounCamel}.delete({ where: { id } });
  }
}
`;
  }

  if (orm === 'typeorm') {
    return `import { ILike, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

${contractImports}
import { ${NounPascal}OrmEntity } from './${nounKebab}.orm-entity';

@Injectable()
export class ${NounPascal}Repository implements I${NounPascal}Repository {
  constructor(
    @InjectRepository(${NounPascal}OrmEntity)
    private readonly ormRepo: Repository<${NounPascal}OrmEntity>,
  ) {}

  async findById(id: string): Promise<${NounPascal} | null> {
    const record = await this.ormRepo.findOne({ where: { id } });
    return record ? ${NounPascal}.fromPersistence(record) : null;
  }

  async findMany(params: Find${NounsPascal}Params): Promise<[${NounPascal}[], number]> {
    const { skip = 0, take = 20, search, ownerId } = params;
    const where = {
      ...(ownerId ? { ownerId } : {}),
      ...(search ? { name: ILike(\`%\${search}%\`) } : {}),
    };

    const [records, total] = await this.ormRepo.findAndCount({
      where,
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return [records.map((record) => ${NounPascal}.fromPersistence(record)), total];
  }

  async create(data: Create${NounPascal}Data): Promise<${NounPascal}> {
    const entity = this.ormRepo.create(data);
    const saved = await this.ormRepo.save(entity);
    return ${NounPascal}.fromPersistence(saved);
  }

  async update(id: string, data: Update${NounPascal}Data): Promise<${NounPascal}> {
    await this.ormRepo.update(id, data);
    const updated = await this.ormRepo.findOneByOrFail({ id });
    return ${NounPascal}.fromPersistence(updated);
  }

  async remove(id: string): Promise<void> {
    await this.ormRepo.delete(id);
  }
}
`;
  }

  if (orm === 'drizzle') {
    return `import { Injectable } from '@nestjs/common';

${contractImports}

export interface Drizzle${NounPascal}Port {
  findById(id: string): Promise<${NounPascal}PersistenceRecord | null>;
  findMany(params: Find${NounsPascal}Params): Promise<[${NounPascal}PersistenceRecord[], number]>;
  create(data: Create${NounPascal}Data): Promise<${NounPascal}PersistenceRecord>;
  update(id: string, data: Update${NounPascal}Data): Promise<${NounPascal}PersistenceRecord>;
  remove(id: string): Promise<void>;
}

@Injectable()
export class ${NounPascal}Repository implements I${NounPascal}Repository {
  // Inject your Drizzle DB client or query wrapper implementing Drizzle${NounPascal}Port
  constructor(private readonly db: Drizzle${NounPascal}Port) {}

  async findById(id: string): Promise<${NounPascal} | null> {
    const record = await this.db.findById(id);
    return record ? ${NounPascal}.fromPersistence(record) : null;
  }

  async findMany(params: Find${NounsPascal}Params): Promise<[${NounPascal}[], number]> {
    const [records, total] = await this.db.findMany(params);
    return [records.map((record) => ${NounPascal}.fromPersistence(record)), total];
  }

  async create(data: Create${NounPascal}Data): Promise<${NounPascal}> {
    const record = await this.db.create(data);
    return ${NounPascal}.fromPersistence(record);
  }

  async update(id: string, data: Update${NounPascal}Data): Promise<${NounPascal}> {
    const record = await this.db.update(id, data);
    return ${NounPascal}.fromPersistence(record);
  }

  async remove(id: string): Promise<void> {
    await this.db.remove(id);
  }
}
`;
  }

  return `import { Injectable } from '@nestjs/common';

${contractImports}

export interface ${NounPascal}PersistenceClient {
  findById(id: string): Promise<${NounPascal}PersistenceRecord | null>;
  findMany(params: Find${NounsPascal}Params): Promise<[${NounPascal}PersistenceRecord[], number]>;
  create(data: Create${NounPascal}Data): Promise<${NounPascal}PersistenceRecord>;
  update(id: string, data: Update${NounPascal}Data): Promise<${NounPascal}PersistenceRecord>;
  remove(id: string): Promise<void>;
}

@Injectable()
export class ${NounPascal}Repository implements I${NounPascal}Repository {
  // Inject your typed persistence client (PrismaService, TypeORM Repository, Drizzle, etc.)
  constructor(private readonly persistence: ${NounPascal}PersistenceClient) {}

  async findById(id: string): Promise<${NounPascal} | null> {
    const record = await this.persistence.findById(id);
    return record ? ${NounPascal}.fromPersistence(record) : null;
  }

  async findMany(params: Find${NounsPascal}Params): Promise<[${NounPascal}[], number]> {
    const [records, total] = await this.persistence.findMany(params);
    return [records.map((record) => ${NounPascal}.fromPersistence(record)), total];
  }

  async create(data: Create${NounPascal}Data): Promise<${NounPascal}> {
    const record = await this.persistence.create(data);
    return ${NounPascal}.fromPersistence(record);
  }

  async update(id: string, data: Update${NounPascal}Data): Promise<${NounPascal}> {
    const record = await this.persistence.update(id, data);
    return ${NounPascal}.fromPersistence(record);
  }

  async remove(id: string): Promise<void> {
    await this.persistence.remove(id);
  }
}
`;
}

function buildRepoSpecTemplate({ runner, orm, NounPascal, nounKebab, nounCamel }) {
  const isVitest = runner === 'vitest';
  const vitestImport = isVitest
    ? `import { it, vi, expect, describe, beforeEach } from 'vitest';\n\n`
    : '';
  const mockFn = isVitest ? 'vi.fn' : 'jest.fn';
  const clearAll = isVitest ? 'vi.clearAllMocks()' : 'jest.clearAllMocks()';

  if (orm === 'prisma') {
    return `${vitestImport}import { ${NounPascal} } from '../entities';
import { ${NounPascal}Repository } from './${nounKebab}.repository';

describe('${NounPascal}Repository', () => {
  let repository: ${NounPascal}Repository;
  let mockPrisma: {
    ${nounCamel}: {
      findUnique: ReturnType<typeof ${mockFn}>;
      findMany: ReturnType<typeof ${mockFn}>;
      count: ReturnType<typeof ${mockFn}>;
      create: ReturnType<typeof ${mockFn}>;
      update: ReturnType<typeof ${mockFn}>;
      delete: ReturnType<typeof ${mockFn}>;
    };
    $transaction: ReturnType<typeof ${mockFn}>;
  };

  const now = new Date();
  const sampleRecord = {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    name: 'Sample ${NounPascal}',
    description: 'Details',
    ownerId: 'user-1',
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    ${clearAll};
    mockPrisma = {
      ${nounCamel}: {
        findUnique: ${mockFn}(),
        findMany: ${mockFn}(),
        count: ${mockFn}(),
        create: ${mockFn}(),
        update: ${mockFn}(),
        delete: ${mockFn}(),
      },
      $transaction: ${mockFn}(),
    };
    repository = new ${NounPascal}Repository(mockPrisma as never);
  });

  it('maps persisted record to domain entity in findById', async () => {
    mockPrisma.${nounCamel}.findUnique.mockResolvedValue(sampleRecord);

    const result = await repository.findById(sampleRecord.id);

    expect(result).toBeInstanceOf(${NounPascal});
    expect(result?.id).toBe(sampleRecord.id);
  });

  it('returns null when record does not exist', async () => {
    mockPrisma.${nounCamel}.findUnique.mockResolvedValue(null);

    const result = await repository.findById('missing-id');

    expect(result).toBeNull();
  });
});
`;
  }

  if (orm === 'typeorm') {
    return `${vitestImport}import { ${NounPascal} } from '../entities';
import { ${NounPascal}Repository } from './${nounKebab}.repository';

describe('${NounPascal}Repository', () => {
  let repository: ${NounPascal}Repository;
  let mockOrmRepo: {
    findOne: ReturnType<typeof ${mockFn}>;
    findAndCount: ReturnType<typeof ${mockFn}>;
    create: ReturnType<typeof ${mockFn}>;
    save: ReturnType<typeof ${mockFn}>;
    update: ReturnType<typeof ${mockFn}>;
    findOneByOrFail: ReturnType<typeof ${mockFn}>;
    delete: ReturnType<typeof ${mockFn}>;
  };

  const now = new Date();
  const sampleRecord = {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    name: 'Sample ${NounPascal}',
    description: 'Details',
    ownerId: 'user-1',
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    ${clearAll};
    mockOrmRepo = {
      findOne: ${mockFn}(),
      findAndCount: ${mockFn}(),
      create: ${mockFn}(),
      save: ${mockFn}(),
      update: ${mockFn}(),
      findOneByOrFail: ${mockFn}(),
      delete: ${mockFn}(),
    };
    repository = new ${NounPascal}Repository(mockOrmRepo as never);
  });

  it('maps persisted record to domain entity in findById', async () => {
    mockOrmRepo.findOne.mockResolvedValue(sampleRecord);

    const result = await repository.findById(sampleRecord.id);

    expect(result).toBeInstanceOf(${NounPascal});
    expect(result?.id).toBe(sampleRecord.id);
  });

  it('returns null when record is not found', async () => {
    mockOrmRepo.findOne.mockResolvedValue(null);

    const result = await repository.findById('missing-id');

    expect(result).toBeNull();
  });
});
`;
  }

  return `${vitestImport}import { ${NounPascal} } from '../entities';
import { ${NounPascal}Repository } from './${nounKebab}.repository';

describe('${NounPascal}Repository', () => {
  let repository: ${NounPascal}Repository;
  let mockClient: {
    findById: ReturnType<typeof ${mockFn}>;
    findMany: ReturnType<typeof ${mockFn}>;
    create: ReturnType<typeof ${mockFn}>;
    update: ReturnType<typeof ${mockFn}>;
    remove: ReturnType<typeof ${mockFn}>;
  };

  const now = new Date();
  const sampleRecord = {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    name: 'Sample ${NounPascal}',
    description: 'Details',
    ownerId: 'user-1',
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    ${clearAll};
    mockClient = {
      findById: ${mockFn}(),
      findMany: ${mockFn}(),
      create: ${mockFn}(),
      update: ${mockFn}(),
      remove: ${mockFn}(),
    };
    repository = new ${NounPascal}Repository(mockClient as never);
  });

  it('maps persisted record to domain entity in findById', async () => {
    mockClient.findById.mockResolvedValue(sampleRecord);

    const result = await repository.findById(sampleRecord.id);

    expect(result).toBeInstanceOf(${NounPascal});
    expect(result?.id).toBe(sampleRecord.id);
  });

  it('returns null when record is not found', async () => {
    mockClient.findById.mockResolvedValue(null);

    const result = await repository.findById('missing-id');

    expect(result).toBeNull();
  });
});
`;
}

function buildServiceSpecTemplate({ runner, NounPascal, nounKebab }) {
  const isVitest = runner === 'vitest';
  const vitestImport = isVitest
    ? `import { it, vi, expect, describe, beforeEach, type Mocked } from 'vitest';\n`
    : '';
  const mockFn = isVitest ? 'vi.fn' : 'jest.fn';
  const mockedType = isVitest ? 'Mocked' : 'jest.Mocked';
  const clearAll = isVitest ? 'vi.clearAllMocks()' : 'jest.clearAllMocks()';

  return `${vitestImport}import { NotFoundException, ForbiddenException } from '@nestjs/common';

import { ${NounPascal} } from '../entities';
import { ${NounPascal}Service } from './${nounKebab}.service';
import type { I${NounPascal}Repository } from '../repositories';

describe('${NounPascal}Service', () => {
  let service: ${NounPascal}Service;
  let mockRepo: ${mockedType}<I${NounPascal}Repository>;

  const now = new Date();
  const sampleEntity = new ${NounPascal}(
    '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    'Sample ${NounPascal}',
    'Details',
    'owner-1',
    now,
    now,
  );

  beforeEach(() => {
    ${clearAll};
    mockRepo = {
      findById: ${mockFn}(),
      findMany: ${mockFn}(),
      create: ${mockFn}(),
      update: ${mockFn}(),
      remove: ${mockFn}(),
    };
    service = new ${NounPascal}Service(mockRepo);
  });

  it('creates a record attaching requesterId as ownerId', async () => {
    mockRepo.create.mockResolvedValue(sampleEntity);

    const result = await service.create({ name: 'Sample ${NounPascal}', description: 'Details' }, 'owner-1', 'user');

    expect(mockRepo.create).toHaveBeenCalledWith({
      name: 'Sample ${NounPascal}',
      description: 'Details',
      ownerId: 'owner-1',
    });
    expect(result).toEqual(sampleEntity);
  });

  it('throws NotFoundException when record does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(service.findOne('missing-id', 'owner-1', 'user')).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException when non-admin accesses another user record', async () => {
    mockRepo.findById.mockResolvedValue(sampleEntity);

    await expect(service.findOne(sampleEntity.id, 'other-user', 'user')).rejects.toThrow(ForbiddenException);
  });

  it('allows admin to access any record', async () => {
    mockRepo.findById.mockResolvedValue(sampleEntity);

    const result = await service.findOne(sampleEntity.id, 'admin-1', 'admin');

    expect(result).toEqual(sampleEntity);
  });
});
`;
}

function buildControllerSpecTemplate({ runner, NounPascal, nounKebab }) {
  const isVitest = runner === 'vitest';
  const vitestImport = isVitest
    ? `import { it, vi, expect, describe, beforeEach } from 'vitest';\n\n`
    : '';
  const mockFn = isVitest ? 'vi.fn' : 'jest.fn';
  const clearAll = isVitest ? 'vi.clearAllMocks()' : 'jest.clearAllMocks()';

  return `${vitestImport}import { ${NounPascal} } from '../entities';
import type { ${NounPascal}Service } from '../services';
import { ${NounPascal}Controller } from './${nounKebab}.controller';
import { ${NounPascal}ResponseDto, Paginated${NounPascal}ResponseDto } from '../dto';

describe('${NounPascal}Controller', () => {
  let controller: ${NounPascal}Controller;
  let mockService: {
    create: ReturnType<typeof ${mockFn}>;
    findAll: ReturnType<typeof ${mockFn}>;
    findOne: ReturnType<typeof ${mockFn}>;
    update: ReturnType<typeof ${mockFn}>;
    remove: ReturnType<typeof ${mockFn}>;
  };

  const now = new Date();
  const sampleEntity = new ${NounPascal}(
    '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    'Sample ${NounPascal}',
    'Details',
    'owner-1',
    now,
    now,
  );
  const authReq = { user: { id: 'owner-1', role: 'user' } };

  beforeEach(() => {
    ${clearAll};
    mockService = {
      create: ${mockFn}(),
      findAll: ${mockFn}(),
      findOne: ${mockFn}(),
      update: ${mockFn}(),
      remove: ${mockFn}(),
    };
    controller = new ${NounPascal}Controller(mockService as unknown as ${NounPascal}Service);
  });

  it('returns ResponseDto on create', async () => {
    mockService.create.mockResolvedValue(sampleEntity);

    const result = await controller.create({ name: 'Sample ${NounPascal}' }, authReq);

    expect(result).toBeInstanceOf(${NounPascal}ResponseDto);
    expect(result.id).toBe(sampleEntity.id);
  });

  it('returns PaginatedResponseDto on findAll', async () => {
    mockService.findAll.mockResolvedValue({ items: [sampleEntity], total: 1, page: 1, limit: 20 });

    const result = await controller.findAll({ page: 1, limit: 20 }, authReq);

    expect(result).toBeInstanceOf(Paginated${NounPascal}ResponseDto);
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });
});
`;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    process.exit(argv.length === 0 ? 1 : 0);
  }

  const { positional, flags } = parseArgs(argv);
  const nounKebab = positional[0]?.toLowerCase();
  if (!nounKebab || !KEBAB_REGEX.test(nounKebab)) {
    fail(`Singular noun '${positional[0] ?? ''}' must be in kebab-case.`);
  }
  if (positional.length > 1) {
    fail(`Unexpected extra positional argument: '${positional[1]}'.`);
  }

  const targetDir = flags['target-dir'] ?? 'src/modules';
  const customPlural = flags.plural?.toLowerCase() ?? null;
  if (customPlural !== null && !KEBAB_REGEX.test(customPlural)) {
    fail(`Custom plural '${customPlural}' must be in kebab-case.`);
  }

  const orm = flags.orm ?? 'custom';
  if (!VALID_ORMS.includes(orm)) {
    fail(`Unknown --orm '${orm}'. Allowed: ${VALID_ORMS.join(', ')}.`);
  }

  const contracts = flags.contracts ?? 'class-validator';
  if (!VALID_CONTRACTS.includes(contracts)) {
    fail(`Unknown --contracts '${contracts}'. Allowed: ${VALID_CONTRACTS.join(', ')}.`);
  }

  const runner = flags['test-runner'] ?? 'vitest';
  if (!VALID_RUNNERS.includes(runner)) {
    fail(`Unknown --test-runner '${runner}'. Allowed: ${VALID_RUNNERS.join(', ')}.`);
  }

  const scope = flags.scope?.replace(/^@/, '') ?? (contracts === 'zod' ? detectScopeFromCwd() : null);
  if (contracts === 'zod' && !scope) {
    fail("Could not detect npm scope for --contracts zod. Pass --scope <scope>.");
  }

  const isDryRun = Boolean(flags['dry-run']);
  const isForce = Boolean(flags.force);

  const nounsKebab = customPlural || pluralize(nounKebab);
  const NounPascal = toPascalCase(nounKebab);
  const NounsPascal = toPascalCase(nounsKebab);
  const nounCamel = toCamelCase(nounKebab);
  const nounConstant = nounKebab.toUpperCase().replace(/-/g, '_');
  const moduleRoot = path.resolve(process.cwd(), targetDir, nounsKebab);

  console.log(`🏛️ Scaffolding NestJS Modular Monolith: ${NounPascal}`);
  console.log(`📁 Module directory (plural): ${nounsKebab}/`);
  console.log(`📄 Internal files (singular): ${nounKebab}.*.ts`);
  console.log(`⚙️  Stack: orm=${orm}, contracts=${contracts}, tests=${runner}`);
  if (isDryRun) {
    console.log(`🔎 Mode: [DRY RUN - No files will be written]`);
  }
  console.log('');

  const createDtoContent =
    contracts === 'zod'
      ? `import { createZodDto } from 'nestjs-zod';

import { create${NounPascal}Schema } from '@${scope}/contracts/${nounsKebab}';

export class Create${NounPascal}Dto extends createZodDto(create${NounPascal}Schema) {}
`
      : `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class Create${NounPascal}Dto {
  @ApiProperty({ description: 'Nombre o título descriptivo', example: 'Ejemplo de ${NounPascal}' })
  @IsString()
  @IsNotEmpty()
  readonly name!: string;

  @ApiPropertyOptional({ description: 'Notas o descripción adicional' })
  @IsOptional()
  @IsString()
  readonly description?: string;
}
`;

  const updateDtoContent =
    contracts === 'zod'
      ? `import { createZodDto } from 'nestjs-zod';

import { update${NounPascal}Schema } from '@${scope}/contracts/${nounsKebab}';

export class Update${NounPascal}Dto extends createZodDto(update${NounPascal}Schema) {}
`
      : `import { OmitType, PartialType } from '@nestjs/swagger';

import { Create${NounPascal}Dto } from './create-${nounKebab}.dto';

export class Update${NounPascal}Dto extends PartialType(
  OmitType(Create${NounPascal}Dto, [] as const),
) {}
`;

  const files = [
    // 1. Entity
    {
      path: path.join(moduleRoot, 'entities', `${nounKebab}.entity.ts`),
      content: `export interface ${NounPascal}PersistenceRecord {
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly ownerId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class ${NounPascal} {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly description: string | null,
    readonly ownerId: string,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  /**
   * Static factory to map a raw persistence record to an immutable domain entity.
   */
  static fromPersistence(record: ${NounPascal}PersistenceRecord): ${NounPascal} {
    return new ${NounPascal}(
      record.id,
      record.name,
      record.description ?? null,
      record.ownerId,
      record.createdAt,
      record.updatedAt,
    );
  }
}
`,
    },
    // 2. Entities Index
    {
      path: path.join(moduleRoot, 'entities', 'index.ts'),
      content: `export * from './${nounKebab}.entity';\n`,
    },
    // 3. Create DTO
    {
      path: path.join(moduleRoot, 'dto', `create-${nounKebab}.dto.ts`),
      content: createDtoContent,
    },
    // 4. Update DTO
    {
      path: path.join(moduleRoot, 'dto', `update-${nounKebab}.dto.ts`),
      content: updateDtoContent,
    },
    // 5. Query DTO
    {
      path: path.join(moduleRoot, 'dto', `find-${nounsKebab}-query.dto.ts`),
      content: `import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Min, Max, IsInt, IsString, IsOptional } from 'class-validator';

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
    },
    // 6. Response DTO (single + paginated envelope)
    {
      path: path.join(moduleRoot, 'dto', `${nounKebab}-response.dto.ts`),
      content: `import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { ${NounPascal} } from '../entities';

export class ${NounPascal}ResponseDto {
  @ApiProperty({ description: 'Identificador único UUID', example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @Expose()
  readonly id!: string;

  @ApiProperty({ description: 'Nombre o título descriptivo', example: 'Ejemplo de ${NounPascal}' })
  @Expose()
  readonly name!: string;

  @ApiPropertyOptional({ description: 'Descripción detallada', nullable: true })
  @Expose()
  readonly description!: string | null;

  @ApiProperty({ description: 'Fecha de creación (ISO 8601)' })
  @Expose()
  readonly createdAt!: Date;

  @ApiProperty({ description: 'Fecha de última actualización (ISO 8601)' })
  @Expose()
  readonly updatedAt!: Date;

  constructor(partial: Partial<${NounPascal}ResponseDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(entity: ${NounPascal}): ${NounPascal}ResponseDto {
    return new ${NounPascal}ResponseDto({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}

export class Paginated${NounPascal}ResponseDto {
  @ApiProperty({ type: [${NounPascal}ResponseDto], description: 'Elementos de la página actual' })
  @Expose()
  readonly items!: ${NounPascal}ResponseDto[];

  @ApiProperty({ description: 'Total de registros coincidentes', example: 42 })
  @Expose()
  readonly total!: number;

  @ApiProperty({ description: 'Página actual', example: 1 })
  @Expose()
  readonly page!: number;

  @ApiProperty({ description: 'Registros por página', example: 20 })
  @Expose()
  readonly limit!: number;

  constructor(partial: Partial<Paginated${NounPascal}ResponseDto>) {
    Object.assign(this, partial);
  }

  static fromPaginatedResult(result: {
    items: ${NounPascal}[];
    total: number;
    page: number;
    limit: number;
  }): Paginated${NounPascal}ResponseDto {
    return new Paginated${NounPascal}ResponseDto({
      items: result.items.map((entity) => ${NounPascal}ResponseDto.fromEntity(entity)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  }
}
`,
    },
    // 7. DTO Index
    {
      path: path.join(moduleRoot, 'dto', 'index.ts'),
      content: `export * from './create-${nounKebab}.dto';
export * from './update-${nounKebab}.dto';
export * from './find-${nounsKebab}-query.dto';
export * from './${nounKebab}-response.dto';
`,
    },
    // 8. Repository Contract & Token
    {
      path: path.join(moduleRoot, 'repositories', 'repository.ts'),
      content: `import type { ${NounPascal} } from '../entities';

export const ${nounConstant}_REPOSITORY_TOKEN = '${nounConstant}_REPOSITORY';

export interface Create${NounPascal}Data {
  readonly name: string;
  readonly description?: string;
  readonly ownerId: string;
}

export interface Update${NounPascal}Data {
  readonly name?: string;
  readonly description?: string;
}

export interface Find${NounsPascal}Params {
  readonly skip?: number;
  readonly take?: number;
  readonly search?: string;
  readonly ownerId?: string;
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
    },
    // 9. Repository Implementation
    {
      path: path.join(moduleRoot, 'repositories', `${nounKebab}.repository.ts`),
      content: buildRepositoryTemplate({ orm, NounPascal, nounKebab, nounCamel, NounsPascal }),
    },
    // 10. Repository Spec
    {
      path: path.join(moduleRoot, 'repositories', `${nounKebab}.repository.spec.ts`),
      content: buildRepoSpecTemplate({ runner, orm, NounPascal, nounKebab, nounCamel }),
    },
    // 11. Repositories Index
    {
      path: path.join(moduleRoot, 'repositories', 'index.ts'),
      content: `export * from './repository';
export * from './${nounKebab}.repository';
`,
    },
    // 12. Service
    {
      path: path.join(moduleRoot, 'services', `${nounKebab}.service.ts`),
      content: `import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import type { ${NounPascal} } from '../entities';
import { ${nounConstant}_REPOSITORY_TOKEN, type I${NounPascal}Repository } from '../repositories';
import type { Create${NounPascal}Dto, Update${NounPascal}Dto, Find${NounsPascal}QueryDto } from '../dto';

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
    private readonly ${nounCamel}Repository: I${NounPascal}Repository,
  ) {}

  async create(dto: Create${NounPascal}Dto, requesterId: string, _requesterRole: string): Promise<${NounPascal}> {
    return this.${nounCamel}Repository.create({
      ...dto,
      ownerId: requesterId,
    });
  }

  async findAll(
    query: Find${NounsPascal}QueryDto,
    requesterId: string,
    requesterRole: string,
  ): Promise<PaginatedResult<${NounPascal}>> {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;
    const ownerId = requesterRole === 'admin' ? undefined : requesterId;

    const [items, total] = await this.${nounCamel}Repository.findMany({
      skip,
      take: limit,
      search,
      ownerId,
    });

    return { items, total, page, limit };
  }

  async findOne(id: string, requesterId: string, requesterRole: string): Promise<${NounPascal}> {
    const entity = await this.${nounCamel}Repository.findById(id);
    if (!entity) {
      throw new NotFoundException('${NounPascal} no encontrado');
    }
    if (requesterRole !== 'admin' && entity.ownerId !== requesterId) {
      throw new ForbiddenException('No tienes permisos suficientes para acceder a este recurso');
    }
    return entity;
  }

  async update(
    id: string,
    dto: Update${NounPascal}Dto,
    requesterId: string,
    requesterRole: string,
  ): Promise<${NounPascal}> {
    await this.findOne(id, requesterId, requesterRole);
    return this.${nounCamel}Repository.update(id, dto);
  }

  async remove(id: string, requesterId: string, requesterRole: string): Promise<void> {
    await this.findOne(id, requesterId, requesterRole);
    await this.${nounCamel}Repository.remove(id);
  }
}
`,
    },
    // 13. Service Spec
    {
      path: path.join(moduleRoot, 'services', `${nounKebab}.service.spec.ts`),
      content: buildServiceSpecTemplate({ runner, NounPascal, nounKebab }),
    },
    // 14. Services Index
    {
      path: path.join(moduleRoot, 'services', 'index.ts'),
      content: `export * from './${nounKebab}.service';\n`,
    },
    // 15. Controller
    {
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
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ${NounPascal}Service } from '../services';
import {
  Create${NounPascal}Dto,
  Update${NounPascal}Dto,
  Find${NounsPascal}QueryDto,
  ${NounPascal}ResponseDto,
  Paginated${NounPascal}ResponseDto,
} from '../dto';

/** Adaptor-agnostic request shape populated by JwtAuthGuard (prefer @CurrentUser() in production). */
export interface AuthenticatedRequest {
  readonly user: {
    readonly id: string;
    readonly role: string;
  };
}

@ApiTags('${NounsPascal}')
@ApiBearerAuth()
@Controller('${nounsKebab}')
export class ${NounPascal}Controller {
  constructor(private readonly ${nounCamel}Service: ${NounPascal}Service) {}

  @Post()
  @ApiOperation({ summary: 'Crear ${NounPascal}', description: 'Crea un nuevo registro en el dominio.' })
  @ApiCreatedResponse({ type: ${NounPascal}ResponseDto, description: 'Creado exitosamente.' })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
  @ApiBody({ type: Create${NounPascal}Dto })
  async create(
    @Body() dto: Create${NounPascal}Dto,
    @Req() req: AuthenticatedRequest,
  ): Promise<${NounPascal}ResponseDto> {
    const entity = await this.${nounCamel}Service.create(dto, req.user.id, req.user.role);
    return ${NounPascal}ResponseDto.fromEntity(entity);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ${NounsPascal}', description: 'Retorna listado paginado con filtros.' })
  @ApiOkResponse({ type: Paginated${NounPascal}ResponseDto, description: 'Listado paginado obtenido.' })
  @ApiBadRequestResponse({ description: 'Parámetros de consulta inválidos.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  async findAll(
    @Query() query: Find${NounsPascal}QueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Paginated${NounPascal}ResponseDto> {
    const result = await this.${nounCamel}Service.findAll(query, req.user.id, req.user.role);
    return Paginated${NounPascal}ResponseDto.fromPaginatedResult(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar ${NounPascal}', description: 'Obtiene detalle por identificador UUID.' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del registro' })
  @ApiOkResponse({ type: ${NounPascal}ResponseDto, description: 'Registro encontrado.' })
  @ApiBadRequestResponse({ description: 'UUID inválido.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<${NounPascal}ResponseDto> {
    const entity = await this.${nounCamel}Service.findOne(id, req.user.id, req.user.role);
    return ${NounPascal}ResponseDto.fromEntity(entity);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar ${NounPascal}', description: 'Actualiza campos de un registro.' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del registro' })
  @ApiOkResponse({ type: ${NounPascal}ResponseDto, description: 'Actualizado exitosamente.' })
  @ApiBadRequestResponse({ description: 'Datos o UUID inválidos.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: Update${NounPascal}Dto,
    @Req() req: AuthenticatedRequest,
  ): Promise<${NounPascal}ResponseDto> {
    const entity = await this.${nounCamel}Service.update(id, dto, req.user.id, req.user.role);
    return ${NounPascal}ResponseDto.fromEntity(entity);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar ${NounPascal}', description: 'Elimina un registro del sistema.' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del registro' })
  @ApiNoContentResponse({ description: 'Eliminado exitosamente.' })
  @ApiBadRequestResponse({ description: 'UUID inválido.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.${nounCamel}Service.remove(id, req.user.id, req.user.role);
  }
}
`,
    },
    // 16. Controller Spec
    {
      path: path.join(moduleRoot, 'controllers', `${nounKebab}.controller.spec.ts`),
      content: buildControllerSpecTemplate({ runner, NounPascal, nounKebab }),
    },
    // 17. Controllers Index
    {
      path: path.join(moduleRoot, 'controllers', 'index.ts'),
      content: `export * from './${nounKebab}.controller';\n`,
    },
    // 18. Module (only exports Service, never repository token)
    {
      path: path.join(moduleRoot, `${nounKebab}.module.ts`),
      content: `import { Module } from '@nestjs/common';

import { ${NounPascal}Service } from './services';
import { ${NounPascal}Controller } from './controllers';
import { ${NounPascal}Repository, ${nounConstant}_REPOSITORY_TOKEN } from './repositories';

@Module({
  controllers: [${NounPascal}Controller],
  providers: [
    ${NounPascal}Service,
    {
      provide: ${nounConstant}_REPOSITORY_TOKEN,
      useClass: ${NounPascal}Repository,
    },
  ],
  exports: [${NounPascal}Service],
})
export class ${NounPascal}Module {}
`,
    },
  ];

  const conflicts = files.map((item) => item.path).filter((file) => fs.existsSync(file));
  if (conflicts.length > 0 && !isForce) {
    console.error(`❌ Error: ${conflicts.length} target file(s) already exist:`);
    for (const file of conflicts) {
      console.error(`   - ${path.relative(process.cwd(), file)}`);
    }
    console.error(`\nNo files were written. Re-run with --force to overwrite them.`);
    process.exit(1);
  }

  const total = String(files.length).padStart(2, '0');
  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    const displayPath = path.relative(process.cwd(), item.path);
    const counter = `[${String(i + 1).padStart(2, '0')}/${total}]`;
    if (isDryRun) {
      const action = conflicts.includes(item.path) ? 'overwrite' : 'create';
      console.log(`  ${counter} [DRY-RUN] Would ${action}: ${displayPath}`);
      continue;
    }
    fs.mkdirSync(path.dirname(item.path), { recursive: true });
    fs.writeFileSync(item.path, item.content, 'utf8');
    console.log(`  ${counter} Created: ${displayPath}`);
  }

  if (isDryRun) {
    console.log(`\n🔎 Dry run complete: ${files.length} files would be written. Nothing was changed.`);
    return;
  }

  const testCmd = runner === 'vitest' ? 'pnpm exec vitest run' : 'pnpm exec jest';
  console.log(`\n✅ Module '${NounPascal}Module' successfully scaffolded (18 files, including 3 spec files)!`);
  console.log(`\n📌 Next steps:`);
  console.log(`   1. Add ${NounPascal}Module to 'imports' in src/app.module.ts`);
  console.log(`   2. Define ${NounPascal} table/schema in your persistence layer (Prisma, TypeORM, Drizzle, etc.)`);
  console.log(`   3. Run your project's database migration command`);
  console.log(`   4. Run '${testCmd}' to verify the generated unit specs pass.`);
}

main();
