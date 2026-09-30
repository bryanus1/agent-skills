import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { checkBoundaries, extractImports, isExported } from '../skills/architecture/monorepo-architecture/scripts/check-boundaries.mjs';
import { rootDir, makeTempDir, runScript, listFiles, writeFiles } from './helpers.mjs';

const SCRIPTS = 'skills/architecture/monorepo-architecture/scripts';
const MONOREPO = `${SCRIPTS}/scaffold-monorepo.mjs`;
const PACKAGE = `${SCRIPTS}/scaffold-package.mjs`;
const FULLSTACK = `${SCRIPTS}/scaffold-fullstack-feature.mjs`;
const BOUNDARIES = `${SCRIPTS}/check-boundaries.mjs`;

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

/** Monorepo root (zod or openapi) plus minimal apps/api and apps/web. */
function makeMonorepo(t, contracts = 'zod') {
  const cwd = makeTempDir(t);
  const result = runScript(MONOREPO, ['--scope', 'acme', '--contracts', contracts, '--pnpm-version', '10.0.0'], cwd);
  assert.equal(result.code, 0, result.stderr);
  writeFiles(cwd, {
    'apps/api/package.json': JSON.stringify({ name: 'api', private: true }),
    'apps/web/package.json': JSON.stringify({ name: 'web', private: true }),
  });
  return cwd;
}

// ─── Shared safety contract ─────────────────────────────────────────────────

const scaffolds = [
  { name: 'scaffold-monorepo', script: MONOREPO, args: ['--scope', 'acme', '--contracts', 'zod', '--pnpm-version', '10.0.0'], setup: () => {}, probe: 'turbo.json' },
  {
    name: 'scaffold-package',
    script: PACKAGE,
    args: ['utils'],
    setup: (cwd) => writeFiles(cwd, { 'pnpm-workspace.yaml': 'packages:\n  - "packages/*"\n', 'package.json': '{"name":"acme"}' }),
    probe: 'packages/utils/src/index.ts',
  },
];

for (const { name, script, args, setup, probe } of scaffolds) {
  test(`${name}: --dry-run writes nothing`, (t) => {
    const cwd = makeTempDir(t);
    setup(cwd);
    const before = listFiles(cwd);
    const result = runScript(script, [...args, '--dry-run'], cwd);
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(listFiles(cwd), before);
  });

  test(`${name}: aborts without writing on conflicts, --force overwrites`, (t) => {
    const cwd = makeTempDir(t);
    setup(cwd);
    assert.equal(runScript(script, args, cwd).code, 0);
    fs.writeFileSync(path.join(cwd, probe), '// user edits\n');
    const before = listFiles(cwd);

    const again = runScript(script, args, cwd);
    assert.equal(again.code, 1);
    assert.match(again.stderr, /already exist/);
    assert.deepEqual(listFiles(cwd), before);
    assert.equal(fs.readFileSync(path.join(cwd, probe), 'utf8'), '// user edits\n');

    assert.equal(runScript(script, [...args, '--force'], cwd).code, 0);
    assert.notEqual(fs.readFileSync(path.join(cwd, probe), 'utf8'), '// user edits\n');
  });
}

test('every script supports --help', (t) => {
  const cwd = makeTempDir(t);
  for (const script of [MONOREPO, PACKAGE, FULLSTACK, BOUNDARIES]) {
    assert.equal(runScript(script, ['--help'], cwd).code, 0, script);
  }
});

// ─── scaffold-monorepo ──────────────────────────────────────────────────────

const COMMON_ROOT_FILES = [
  '.gitignore',
  '.npmrc',
  'package.json',
  'packages/eslint-config/base.js',
  'packages/eslint-config/package.json',
  'packages/tsconfig/base.json',
  'packages/tsconfig/library.json',
  'packages/tsconfig/nestjs.json',
  'packages/tsconfig/nextjs.json',
  'packages/tsconfig/package.json',
  'pnpm-workspace.yaml',
  'scripts/check-boundaries.mjs',
  'turbo.json',
];

test('scaffold-monorepo (zod): root files, contracts package and pipeline', (t) => {
  const cwd = makeTempDir(t);
  assert.equal(runScript(MONOREPO, ['--scope', '@acme', '--contracts', 'zod', '--pnpm-version', '10.1.0'], cwd).code, 0);
  assert.deepEqual(
    listFiles(cwd),
    [
      ...COMMON_ROOT_FILES,
      'packages/contracts/eslint.config.mjs',
      'packages/contracts/package.json',
      'packages/contracts/src/common/index.ts',
      'packages/contracts/src/common/pagination.schema.ts',
      'packages/contracts/tsconfig.json',
    ].sort(),
  );

  const pkg = readJson(path.join(cwd, 'package.json'));
  assert.equal(pkg.name, 'acme');
  assert.equal(pkg.packageManager, 'pnpm@10.1.0');
  assert.equal(pkg.scripts['check:boundaries'], 'node scripts/check-boundaries.mjs');

  const turbo = readJson(path.join(cwd, 'turbo.json'));
  for (const task of ['build', 'dev', 'lint', 'typecheck', 'test']) assert.ok(turbo.tasks[task], task);
  assert.deepEqual(turbo.tasks.build.dependsOn, ['^build']);
  assert.equal(fs.readFileSync(path.join(cwd, 'pnpm-workspace.yaml'), 'utf8'), 'packages:\n  - "apps/*"\n  - "packages/*"\n');

  const contracts = readJson(path.join(cwd, 'packages/contracts/package.json'));
  assert.equal(contracts.name, '@acme/contracts');
  assert.deepEqual(contracts.exports['./common'], { types: './dist/common/index.d.ts', default: './dist/common/index.js' });
  assert.equal(contracts.devDependencies['@acme/tsconfig'], 'workspace:*');
  assert.ok(!fs.existsSync(path.join(cwd, 'packages/contracts/src/index.ts')), 'contracts src/ is a container: no barrel');

  // The vendored checker is identical to the skill's and runs clean on the new repo.
  assert.equal(fs.readFileSync(path.join(cwd, 'scripts/check-boundaries.mjs'), 'utf8'), fs.readFileSync(path.join(rootDir, BOUNDARIES), 'utf8'));
  assert.equal(spawnSync(process.execPath, ['scripts/check-boundaries.mjs'], { cwd }).status, 0);
});

test('scaffold-monorepo (openapi): api-client package instead of contracts', (t) => {
  const cwd = makeTempDir(t);
  assert.equal(runScript(MONOREPO, ['--scope', 'acme', '--contracts', 'openapi', '--pnpm-version', '10.0.0'], cwd).code, 0);
  const files = listFiles(cwd);
  assert.ok(!files.some((f) => f.startsWith('packages/contracts/')));
  for (const f of ['packages/api-client/src/generated/schema.ts', 'packages/api-client/src/client/create-api-client.ts', 'packages/api-client/src/client/create-api-client.test.ts']) {
    assert.ok(files.includes(f), f);
  }
  const client = readJson(path.join(cwd, 'packages/api-client/package.json'));
  assert.match(client.scripts.generate, /^openapi-typescript .*api-json -o src\/generated\/schema\.ts$/);
  assert.match(client.scripts.lint, /--ignore-pattern "src\/generated\/\*\*"/);
  assert.deepEqual(Object.keys(client.exports), ['./client', './schema']);
});

test('scaffold-monorepo: requires --scope and a valid --contracts', (t) => {
  const cwd = makeTempDir(t);
  assert.equal(runScript(MONOREPO, ['--contracts', 'zod', '--pnpm-version', '10.0.0'], cwd).code, 1);
  const bad = runScript(MONOREPO, ['--scope', 'acme', '--contracts', 'graphql', '--pnpm-version', '10.0.0'], cwd);
  assert.equal(bad.code, 1);
  assert.match(bad.stderr, /zod' or 'openapi/);
  assert.equal(runScript(MONOREPO, ['--scope', 'Acme_Inc', '--contracts', 'zod', '--pnpm-version', '10.0.0'], cwd).code, 1);
  assert.deepEqual(listFiles(cwd), []);
});

// ─── scaffold-package ───────────────────────────────────────────────────────

test('scaffold-package: lib detects the scope and exports dist only', (t) => {
  const cwd = makeMonorepo(t);
  assert.equal(runScript(PACKAGE, ['money-utils'], cwd).code, 0);
  const dir = path.join(cwd, 'packages/money-utils');
  assert.deepEqual(listFiles(dir), ['eslint.config.mjs', 'package.json', 'src/index.test.ts', 'src/index.ts', 'tsconfig.json']);

  const pkg = readJson(path.join(dir, 'package.json'));
  assert.equal(pkg.name, '@acme/money-utils');
  assert.deepEqual(pkg.exports, { '.': { types: './dist/index.d.ts', default: './dist/index.js' } });
  for (const script of ['build', 'dev', 'lint', 'typecheck', 'test']) assert.ok(pkg.scripts[script], script);
  assert.equal(readJson(path.join(dir, 'tsconfig.json')).extends, '@acme/tsconfig/library.json');
  assert.match(fs.readFileSync(path.join(dir, 'src/index.ts'), 'utf8'), /export function moneyUtilsReady/);
});

test('scaffold-package: config kind has no build step', (t) => {
  const cwd = makeMonorepo(t);
  assert.equal(runScript(PACKAGE, ['prettier-config', '--kind', 'config'], cwd).code, 0);
  const pkg = readJson(path.join(cwd, 'packages/prettier-config/package.json'));
  assert.equal(pkg.scripts, undefined);
  assert.deepEqual(pkg.exports, { './*': './*' });
});

test('scaffold-package: validates name, kind and location', (t) => {
  const cwd = makeMonorepo(t);
  assert.equal(runScript(PACKAGE, ['Bad_Name'], cwd).code, 1);
  assert.equal(runScript(PACKAGE, ['ui', '--kind', 'widget'], cwd).code, 1);
  const outside = makeTempDir(t);
  assert.match(runScript(PACKAGE, ['ui'], outside).stderr, /pnpm-workspace\.yaml not found/);
});

// ─── scaffold-fullstack-feature ─────────────────────────────────────────────

test('scaffold-fullstack-feature (zod): contract, NestJS module, Next.js feature and deps', (t) => {
  const cwd = makeMonorepo(t);
  const result = runScript(FULLSTACK, ['invoice'], cwd);
  assert.equal(result.code, 0, result.stderr);

  assert.deepEqual(listFiles(path.join(cwd, 'packages/contracts/src/invoices')), ['index.ts', 'invoice.schema.ts']);
  const schema = fs.readFileSync(path.join(cwd, 'packages/contracts/src/invoices/invoice.schema.ts'), 'utf8');
  assert.match(schema, /export const createInvoiceSchema/);
  assert.match(schema, /export type Invoice = z\.infer<typeof invoiceSchema>/);

  const contracts = readJson(path.join(cwd, 'packages/contracts/package.json'));
  assert.deepEqual(Object.keys(contracts.exports), ['./common', './invoices']);

  const apiFiles = listFiles(path.join(cwd, 'apps/api/src/modules/invoices'));
  assert.equal(apiFiles.length, 18, apiFiles.join('\n'));
  assert.ok(apiFiles.includes('invoice.module.ts'));

  const webFiles = listFiles(path.join(cwd, 'apps/web/src/features/invoices'));
  assert.ok(webFiles.includes('models/invoices.ts'), webFiles.join('\n'));

  for (const app of ['api', 'web']) {
    assert.equal(readJson(path.join(cwd, `apps/${app}/package.json`)).dependencies['@acme/contracts'], 'workspace:*', app);
  }
  assert.equal(checkBoundaries(cwd).length, 0);
});

test('scaffold-fullstack-feature (openapi): no contract, web depends on api-client', (t) => {
  const cwd = makeMonorepo(t, 'openapi');
  const result = runScript(FULLSTACK, ['order'], cwd);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(listFiles(path.join(cwd, 'apps/api/src/modules/orders')).length, 18);
  assert.equal(readJson(path.join(cwd, 'apps/web/package.json')).dependencies['@acme/api-client'], 'workspace:*');
  assert.equal(readJson(path.join(cwd, 'apps/api/package.json')).dependencies, undefined);
});

test('scaffold-fullstack-feature: --dry-run writes nothing in any workspace', (t) => {
  const cwd = makeMonorepo(t);
  const before = listFiles(cwd);
  const beforeContracts = fs.readFileSync(path.join(cwd, 'packages/contracts/package.json'), 'utf8');
  const result = runScript(FULLSTACK, ['invoice', '--dry-run'], cwd);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /NestJS module/);
  assert.match(result.stdout, /Next\.js feature/);
  assert.deepEqual(listFiles(cwd), before);
  assert.equal(fs.readFileSync(path.join(cwd, 'packages/contracts/package.json'), 'utf8'), beforeContracts);
});

test('scaffold-fullstack-feature: a conflict in one app aborts every part', (t) => {
  const cwd = makeMonorepo(t);
  writeFiles(cwd, { 'apps/web/src/features/invoices/models/invoices.ts': '// existing\n' });
  const before = listFiles(cwd);
  const beforeContracts = fs.readFileSync(path.join(cwd, 'packages/contracts/package.json'), 'utf8');

  const result = runScript(FULLSTACK, ['invoice'], cwd);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Next\.js feature cannot be generated/);
  assert.match(result.stderr, /No files were written in any workspace/);
  assert.deepEqual(listFiles(cwd), before);
  assert.equal(fs.readFileSync(path.join(cwd, 'packages/contracts/package.json'), 'utf8'), beforeContracts);
});

test('scaffold-fullstack-feature: an existing contract export is a conflict', (t) => {
  const cwd = makeMonorepo(t);
  assert.equal(runScript(FULLSTACK, ['invoice'], cwd).code, 0);
  const again = runScript(FULLSTACK, ['invoice'], cwd);
  assert.equal(again.code, 1);
  assert.match(again.stderr, /exports\["\.\/invoices"\]/);
});

test('scaffold-fullstack-feature: fails clearly without the apps or the sibling skills', (t) => {
  const cwd = makeMonorepo(t);
  fs.rmSync(path.join(cwd, 'apps/web'), { recursive: true });
  assert.match(runScript(FULLSTACK, ['invoice'], cwd).stderr, /--web-dir 'apps\/web' does not exist/);

  // Copy only this skill somewhere without its siblings.
  const isolated = makeTempDir(t);
  fs.cpSync(path.join(rootDir, 'skills/architecture/monorepo-architecture'), path.join(isolated, 'monorepo-architecture'), { recursive: true });
  const repo = makeMonorepo(t);
  const result = spawnSync(process.execPath, [path.join(isolated, 'monorepo-architecture/scripts/scaffold-fullstack-feature.mjs'), 'invoice'], { cwd: repo, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /npx skills add bryanus1\/agent-skills --skill nestjs-architecture/);
});

// ─── check-boundaries ───────────────────────────────────────────────────────

/** Clean fixture: web and api depend on contracts, which exports "./invoices". */
function boundaryFixture(t, extra = {}) {
  const cwd = makeTempDir(t);
  writeFiles(cwd, {
    'pnpm-workspace.yaml': 'packages:\n  - "apps/*"\n  - "packages/*"\n',
    'apps/web/package.json': JSON.stringify({ name: 'web', dependencies: { '@acme/contracts': 'workspace:*' } }),
    'apps/web/src/page.tsx': "import { createInvoiceSchema } from '@acme/contracts/invoices';\nimport './local.css';\n",
    'apps/api/package.json': JSON.stringify({ name: 'api', dependencies: { '@acme/contracts': 'workspace:*' } }),
    'apps/api/src/main.ts': "const c = require('@acme/contracts/invoices');\nexport * from './app';\n",
    'packages/contracts/package.json': JSON.stringify({ name: '@acme/contracts', exports: { './invoices': './dist/invoices/index.js' } }),
    'packages/contracts/src/invoices/index.ts': "export * from './invoice.schema';\n",
    'packages/contracts/dist/invoices/index.js': "require('../../../../apps/web/src/page');\n",
    ...extra,
  });
  return cwd;
}

const rulesOf = (cwd) => checkBoundaries(cwd).map((v) => `${v.rule} ${v.file}:${v.line}`);

test('check-boundaries: a clean monorepo has no violations (dist/ is ignored)', (t) => {
  assert.deepEqual(checkBoundaries(boundaryFixture(t)), []);
});

const violationCases = [
  ['app-import', { 'apps/admin/package.json': '{"name":"admin"}', 'apps/admin/src/x.ts': "\n\nimport { a } from 'web';\n" }, 'app-import apps/admin/src/x.ts:3'],
  ['package-imports-app', { 'packages/contracts/src/bad.ts': "import { theme } from 'web/src/theme';\n" }, 'package-imports-app packages/contracts/src/bad.ts:1'],
  ['relative-escape', { 'apps/web/src/bad.ts': "import {\n  x,\n} from '../../../packages/contracts/src/invoices';\n" }, 'relative-escape apps/web/src/bad.ts:1'],
  [
    'undeclared',
    { 'packages/ui/package.json': '{"name":"@acme/ui"}', 'packages/ui/src/a.ts': "export type { Invoice } from '@acme/contracts/invoices';\n" },
    'undeclared packages/ui/src/a.ts:1',
  ],
  ['deep-import', { 'apps/web/src/bad.ts': "const m = await import('@acme/contracts/src/invoices');\n" }, 'deep-import apps/web/src/bad.ts:1'],
  [
    'cycle',
    {
      'packages/a/package.json': JSON.stringify({ name: '@acme/a', dependencies: { '@acme/b': 'workspace:*' } }),
      'packages/b/package.json': JSON.stringify({ name: '@acme/b', dependencies: { '@acme/a': 'workspace:*' } }),
    },
    'cycle packages/a/package.json:1',
  ],
];

for (const [rule, extra, expected] of violationCases) {
  test(`check-boundaries: reports ${rule}`, (t) => {
    assert.deepEqual(rulesOf(boundaryFixture(t, extra)), [expected]);
  });
}

test('check-boundaries: ignores imports inside comments', () => {
  const imports = extractImports("// import x from 'web';\n/* require('web') */\nimport y from 'zod';\n");
  assert.deepEqual(imports, [{ specifier: 'zod', line: 3 }]);
});

test('check-boundaries: exports matching supports subpath patterns', () => {
  assert.equal(isExported({ './*': './dist/*.js' }, './invoices'), true);
  assert.equal(isExported({ './invoices': './x.js' }, './orders'), false);
  assert.equal(isExported(undefined, '.'), true);
  assert.equal(isExported(undefined, './src/x'), false);
  assert.equal(isExported({ import: './a.mjs', require: './a.cjs' }, '.'), true);
});

test('check-boundaries CLI: exit codes and --json', (t) => {
  const clean = boundaryFixture(t);
  assert.equal(runScript(BOUNDARIES, ['--root', clean], rootDir).code, 0);

  const dirty = boundaryFixture(t, { 'apps/web/src/bad.ts': "import '../../api/src/main';\n" });
  const result = runScript(BOUNDARIES, ['--json'], dirty);
  assert.equal(result.code, 1);
  assert.deepEqual(JSON.parse(result.stdout).map((v) => v.rule), ['relative-escape']);

  assert.equal(runScript(BOUNDARIES, [], makeTempDir(t)).code, 1, 'missing pnpm-workspace.yaml');
});
