import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeTempDir, runScript, listFiles } from './helpers.mjs';

const NEST = 'skills/architecture/nestjs-architecture/scripts/scaffold-module.mjs';

const readGenerated = (cwd, rel) => fs.readFileSync(path.join(cwd, 'src/modules/invoices', rel), 'utf8');

test('nestjs scaffold-module: generates strict TypeScript without any and exports only Service', (t) => {
  const cwd = makeTempDir(t);
  const result = runScript(NEST, ['--dry-run', 'invoice'], cwd);
  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(listFiles(cwd), []);

  assert.equal(runScript(NEST, ['invoice'], cwd).code, 0);
  const files = listFiles(cwd);
  assert.equal(files.length, 18);

  for (const file of files) {
    const content = fs.readFileSync(path.join(cwd, file), 'utf8');
    assert.doesNotMatch(content, /(?::\s*any\b|\bas\s+any\b|\|\s*any\b)/, `${file} must not use 'any'`);
    assert.doesNotMatch(content, /'anonymous'/, `${file} must not fall back to anonymous`);
  }

  const moduleFile = readGenerated(cwd, 'invoice.module.ts');
  assert.match(moduleFile, /exports:\s*\[InvoiceService\]/);
  assert.doesNotMatch(moduleFile, /exports:.*INVOICE_REPOSITORY_TOKEN/);

  const controller = readGenerated(cwd, 'controllers/invoice.controller.ts');
  assert.match(controller, /Promise<PaginatedInvoiceResponseDto>/);
  assert.match(controller, /PaginatedInvoiceResponseDto\.fromPaginatedResult/);

  const serviceSpec = readGenerated(cwd, 'services/invoice.service.spec.ts');
  assert.match(serviceSpec, /from 'vitest'/);
  assert.match(serviceSpec, /ForbiddenException/);
  assert.match(serviceSpec, /NotFoundException/);
});

test('nestjs scaffold-module: supports --orm prisma|typeorm|drizzle, --contracts zod, and --test-runner jest', (t) => {
  const cwd = makeTempDir(t);
  const result = runScript(
    NEST,
    ['invoice', '--orm', 'prisma', '--contracts', 'zod', '--scope', 'acme', '--test-runner', 'jest'],
    cwd,
  );
  assert.equal(result.code, 0, result.stderr);

  const repo = readGenerated(cwd, 'repositories/invoice.repository.ts');
  assert.match(repo, /PrismaService/);
  assert.match(repo, /this\.prisma\.invoice\.findUnique/);

  const createDto = readGenerated(cwd, 'dto/create-invoice.dto.ts');
  assert.match(createDto, /createZodDto\(createInvoiceSchema\)/);
  assert.match(createDto, /@acme\/contracts\/invoices/);

  const serviceSpec = readGenerated(cwd, 'services/invoice.service.spec.ts');
  assert.match(serviceSpec, /jest\.fn/);
  assert.doesNotMatch(serviceSpec, /from 'vitest'/);

  const typeormCwd = makeTempDir(t);
  assert.equal(runScript(NEST, ['invoice', '--orm', 'typeorm'], typeormCwd).code, 0);
  const typeormSpec = readGenerated(typeormCwd, 'repositories/invoice.repository.spec.ts');
  assert.match(typeormSpec, /mockOrmRepo\.findOne/);
});

test('nestjs scaffold-module: handles --plural, --target-dir, and auth singular exception', (t) => {
  const cwd = makeTempDir(t);
  assert.equal(runScript(NEST, ['person', '--plural', 'people', '--target-dir', 'apps/api/src/modules'], cwd).code, 0);
  assert.ok(fs.existsSync(path.join(cwd, 'apps/api/src/modules/people/person.module.ts')));

  assert.equal(runScript(NEST, ['auth'], cwd).code, 0);
  assert.ok(fs.existsSync(path.join(cwd, 'src/modules/auth/auth.module.ts')));
});

test('nestjs scaffold-module: rejects unknown flags, missing flag values, and invalid options', (t) => {
  const cwd = makeTempDir(t);
  assert.equal(runScript(NEST, ['invoice', '--unknown-flag'], cwd).code, 1);
  assert.equal(runScript(NEST, ['invoice', '--target-dir'], cwd).code, 1);
  assert.equal(runScript(NEST, ['invoice', '--plural', 'Bad_Plural'], cwd).code, 1);
  assert.equal(runScript(NEST, ['invoice', '--orm', 'mongoose'], cwd).code, 1);
  assert.equal(runScript(NEST, ['invoice', '--contracts', 'zod'], cwd).code, 1);
  assert.equal(runScript(NEST, ['invoice', '--test-runner', 'mocha'], cwd).code, 1);
  assert.deepEqual(listFiles(cwd), []);
});
