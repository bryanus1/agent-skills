import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { checkBoundaries, extractImports, isExported } from '../skills/architecture/monorepo-architecture/scripts/check-boundaries.mjs';
import { rootDir, makeTempDir, runScript, listFiles, writeFiles } from './helpers.mjs';

const SCRIPTS = 'skills/architecture/monorepo-architecture/scripts';
const MONOREPO = `${SCRIPTS}/scaffold-monorepo.mjs`;
const APP = `${SCRIPTS}/scaffold-app.mjs`;
const PACKAGE = `${SCRIPTS}/scaffold-package.mjs`;
const FULLSTACK = `${SCRIPTS}/scaffold-fullstack-feature.mjs`;
const BOUNDARIES = `${SCRIPTS}/check-boundaries.mjs`;

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

/** Monorepo root (zod or openapi) plus minimal apps/api, apps/web, and optional extra apps. */
function makeMonorepo(t, contracts = 'zod', { withMobile = false, linter = 'oxc' } = {}) {
  const cwd = makeTempDir(t);
  const appsFlag = withMobile ? 'web,api,mobile' : 'web,api';
  const result = runScript(
    MONOREPO,
    ['--scope', 'acme', '--contracts', contracts, '--apps', appsFlag, '--linter', linter, '--pnpm-version', '10.0.0'],
    cwd,
  );
  assert.equal(result.code, 0, result.stderr);
  const apps = {
    'apps/api/package.json': JSON.stringify({ name: 'api', private: true, monorepo: { layer: 'app', type: 'api', platform: 'node' } }),
    'apps/web/package.json': JSON.stringify({ name: 'web', private: true, monorepo: { layer: 'app', type: 'web', platform: 'web' } }),
  };
  if (withMobile) {
    apps['apps/mobile/package.json'] = JSON.stringify({ name: 'mobile', private: true, monorepo: { layer: 'app', type: 'mobile', platform: 'native' } });
  }
  writeFiles(cwd, apps);
  return cwd;
}

// ─── Shared safety contract ─────────────────────────────────────────────────

const scaffolds = [
  { name: 'scaffold-monorepo', script: MONOREPO, args: ['--scope', 'acme', '--contracts', 'zod', '--pnpm-version', '10.0.0'], setup: () => {}, probe: 'turbo.json' },
  {
    name: 'scaffold-app',
    script: APP,
    args: ['mobile', '--type', 'mobile'],
    setup: (cwd) => writeFiles(cwd, { 'pnpm-workspace.yaml': 'packages:\n  - "apps/*"\n  - "packages/*"\n', 'package.json': '{"name":"acme"}' }),
    probe: 'apps/mobile/metro.config.js',
  },
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
  for (const script of [MONOREPO, APP, PACKAGE, FULLSTACK, BOUNDARIES]) {
    assert.equal(runScript(script, ['--help'], cwd).code, 0, script);
  }
});

// ─── scaffold-monorepo ──────────────────────────────────────────────────────

const COMMON_OXC_ROOT_FILES = [
  '.gitignore',
  '.npmrc',
  'package.json',
  'packages/oxc-config/base.json',
  'packages/oxc-config/oxfmt.json',
  'packages/oxc-config/package.json',
  'packages/tsconfig/astro.json',
  'packages/tsconfig/base.json',
  'packages/tsconfig/expo.json',
  'packages/tsconfig/library.json',
  'packages/tsconfig/nestjs.json',
  'packages/tsconfig/nextjs.json',
  'packages/tsconfig/node.json',
  'packages/tsconfig/package.json',
  'packages/tsconfig/react-spa.json',
  'pnpm-workspace.yaml',
  'scripts/check-boundaries.mjs',
  'turbo.json',
];

test('scaffold-monorepo (zod, default oxc): root files, contracts package and pipeline', (t) => {
  const cwd = makeTempDir(t);
  assert.equal(runScript(MONOREPO, ['--scope', '@acme', '--contracts', 'zod', '--pnpm-version', '10.1.0'], cwd).code, 0);
  assert.deepEqual(
    listFiles(cwd),
    [
      ...COMMON_OXC_ROOT_FILES,
      'packages/contracts/.oxlintrc.json',
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
  assert.equal(pkg.scripts['format:check'], 'turbo run format:check');

  const turbo = readJson(path.join(cwd, 'turbo.json'));
  for (const task of ['build', 'dev', 'lint', 'format:check', 'typecheck', 'test']) assert.ok(turbo.tasks[task], task);
  assert.deepEqual(turbo.tasks.build.dependsOn, ['^build']);
  assert.equal(fs.readFileSync(path.join(cwd, 'pnpm-workspace.yaml'), 'utf8'), 'packages:\n  - "apps/*"\n  - "packages/*"\n');

  const contracts = readJson(path.join(cwd, 'packages/contracts/package.json'));
  assert.equal(contracts.name, '@acme/contracts');
  assert.deepEqual(contracts.monorepo, { layer: 'package', platform: 'universal' });
  assert.deepEqual(contracts.exports['./common'], { types: './dist/common/index.d.ts', default: './dist/common/index.js' });
  assert.equal(contracts.devDependencies['@acme/tsconfig'], 'workspace:*');
  assert.equal(contracts.devDependencies['@acme/oxc-config'], 'workspace:*');
  assert.ok(!fs.existsSync(path.join(cwd, 'packages/contracts/src/index.ts')), 'contracts src/ is a container: no barrel');

  // The vendored checker is identical to the skill's and runs clean on the new repo.
  assert.equal(fs.readFileSync(path.join(cwd, 'scripts/check-boundaries.mjs'), 'utf8'), fs.readFileSync(path.join(rootDir, BOUNDARIES), 'utf8'));
  assert.equal(spawnSync(process.execPath, ['scripts/check-boundaries.mjs'], { cwd }).status, 0);
});

test('scaffold-monorepo (openapi, multi-app web+api+mobile+landing+polyglot, linter both)', (t) => {
  const cwd = makeTempDir(t);
  const res = runScript(
    MONOREPO,
    ['--scope', 'acme', '--contracts', 'openapi', '--apps', 'web,api,mobile,landing,polyglot', '--linter', 'both', '--pnpm-version', '10.0.0'],
    cwd,
  );
  assert.equal(res.code, 0, res.stderr);
  const files = listFiles(cwd);
  assert.ok(!files.some((f) => f.startsWith('packages/contracts/')));
  for (const f of [
    'packages/oxc-config/base.json',
    'packages/eslint-config/base.js',
    'packages/api-client/src/generated/schema.ts',
    'packages/api-client/src/client/create-api-client.ts',
    'packages/api-client/src/client/create-api-client.test.ts',
  ]) {
    assert.ok(files.includes(f), f);
  }
  const client = readJson(path.join(cwd, 'packages/api-client/package.json'));
  assert.match(client.scripts.generate, /^openapi-typescript .*api-json.* -o src\/generated\/schema\.ts$/);
  assert.match(client.scripts.lint, /oxlint --deny-warnings src && eslint src --ignore-pattern "src\/generated\/\*\*"/);
  assert.deepEqual(Object.keys(client.exports), ['./client', './schema']);

  const npmrc = fs.readFileSync(path.join(cwd, '.npmrc'), 'utf8');
  assert.match(npmrc, /public-hoist-pattern\[\]=\*react\*/);
  assert.equal(fs.readFileSync(path.join(cwd, 'pnpm-workspace.yaml'), 'utf8'), 'packages:\n  - "apps/*"\n  - "packages/*"\n  - "services/*"\n');

  const turbo = readJson(path.join(cwd, 'turbo.json'));
  for (const out of ['dist/**', '.next/**', '.expo/**', '.astro/**']) assert.ok(turbo.tasks.build.outputs.includes(out), out);
  for (const envVar of ['NEXT_PUBLIC_API_URL', 'EXPO_PUBLIC_API_URL', 'PUBLIC_API_URL', 'PUBLIC_SITE_URL']) {
    assert.ok(turbo.tasks.build.env.includes(envVar), envVar);
  }
});

test('scaffold-monorepo: supports --linter eslint and validates flags', (t) => {
  const cwd = makeTempDir(t);
  assert.equal(runScript(MONOREPO, ['--scope', 'acme', '--contracts', 'zod', '--linter', 'eslint', '--pnpm-version', '10.0.0'], cwd).code, 0);
  assert.ok(fs.existsSync(path.join(cwd, 'packages/eslint-config/base.js')));
  assert.ok(!fs.existsSync(path.join(cwd, 'packages/oxc-config/base.json')));

  const badDir = makeTempDir(t);
  assert.equal(runScript(MONOREPO, ['--contracts', 'zod', '--pnpm-version', '10.0.0'], badDir).code, 1);
  assert.match(runScript(MONOREPO, ['--scope', 'acme', '--contracts', 'graphql', '--pnpm-version', '10.0.0'], badDir).stderr, /zod' or 'openapi/);
  assert.equal(runScript(MONOREPO, ['--scope', 'acme', '--contracts', 'zod', '--apps', 'unknown', '--pnpm-version', '10.0.0'], badDir).code, 1);
  assert.equal(runScript(MONOREPO, ['--scope', 'acme', '--contracts', 'zod', '--linter', 'biome', '--pnpm-version', '10.0.0'], badDir).code, 1);
  assert.equal(runScript(MONOREPO, ['--scope', 'Acme_Inc', '--contracts', 'zod', '--pnpm-version', '10.0.0'], badDir).code, 1);
  assert.deepEqual(listFiles(badDir), []);
});

// ─── scaffold-app ───────────────────────────────────────────────────────────

test('scaffold-app: wires mobile (Expo), landing (Astro), worker (Node) and polyglot (services/)', (t) => {
  const cwd = makeMonorepo(t, 'openapi');

  assert.equal(runScript(APP, ['mobile', '--type', 'mobile'], cwd).code, 0);
  const mobilePkg = readJson(path.join(cwd, 'apps/mobile/package.json'));
  assert.deepEqual(mobilePkg.monorepo, { layer: 'app', type: 'mobile', platform: 'native' });
  assert.equal(mobilePkg.dependencies['@acme/api-client'], 'workspace:*');
  assert.equal(readJson(path.join(cwd, 'apps/mobile/tsconfig.json')).extends, '@acme/tsconfig/expo.json');
  assert.match(fs.readFileSync(path.join(cwd, 'apps/mobile/metro.config.js'), 'utf8'), /unstable_enablePackageExports = true/);

  assert.equal(runScript(APP, ['landing', '--type', 'landing'], cwd).code, 0);
  const landingPkg = readJson(path.join(cwd, 'apps/landing/package.json'));
  assert.deepEqual(landingPkg.monorepo, { layer: 'app', type: 'landing', platform: 'astro' });
  assert.equal(landingPkg.scripts.typecheck, 'astro check');
  assert.equal(readJson(path.join(cwd, 'apps/landing/tsconfig.json')).extends, '@acme/tsconfig/astro.json');

  assert.equal(runScript(APP, ['worker', '--type', 'worker'], cwd).code, 0);
  const workerPkg = readJson(path.join(cwd, 'apps/worker/package.json'));
  assert.deepEqual(workerPkg.monorepo, { layer: 'app', type: 'worker', platform: 'node' });
  assert.equal(workerPkg.dependencies, undefined); // openapi api-client is not added to node worker unless contracts zod
  assert.ok(fs.existsSync(path.join(cwd, 'apps/worker/src/index.ts')));
  assert.ok(fs.existsSync(path.join(cwd, 'apps/worker/src/index.test.ts')));

  assert.equal(runScript(APP, ['ml-engine', '--type', 'polyglot'], cwd).code, 0);
  assert.ok(fs.existsSync(path.join(cwd, 'services/ml-engine/package.json')));
  assert.match(fs.readFileSync(path.join(cwd, 'pnpm-workspace.yaml'), 'utf8'), /"services\/\*"/);
  assert.equal(checkBoundaries(cwd).length, 0);
});

test('scaffold-app: validates arguments and root workspace', (t) => {
  const cwd = makeMonorepo(t);
  assert.equal(runScript(APP, ['Bad_Name', '--type', 'web'], cwd).code, 1);
  assert.equal(runScript(APP, ['admin', '--type', 'unknown'], cwd).code, 1);
  assert.match(runScript(APP, ['web', '--type', 'web'], makeTempDir(t)).stderr, /pnpm-workspace\.yaml not found/);
});

// ─── scaffold-package ───────────────────────────────────────────────────────

test('scaffold-package: lib detects scope, oxc linter and exports dist only', (t) => {
  const cwd = makeMonorepo(t);
  assert.equal(runScript(PACKAGE, ['money-utils'], cwd).code, 0);
  const dir = path.join(cwd, 'packages/money-utils');
  assert.deepEqual(listFiles(dir), ['.oxlintrc.json', 'package.json', 'src/index.test.ts', 'src/index.ts', 'tsconfig.json']);

  const pkg = readJson(path.join(dir, 'package.json'));
  assert.equal(pkg.name, '@acme/money-utils');
  assert.deepEqual(pkg.monorepo, { layer: 'package', platform: 'universal' });
  assert.deepEqual(pkg.exports, { '.': { types: './dist/index.d.ts', default: './dist/index.js' } });
  for (const script of ['build', 'dev', 'lint', 'format:check', 'typecheck', 'test']) assert.ok(pkg.scripts[script], script);
  assert.equal(readJson(path.join(dir, 'tsconfig.json')).extends, '@acme/tsconfig/library.json');
  assert.match(fs.readFileSync(path.join(dir, 'src/index.ts'), 'utf8'), /export function moneyUtilsReady/);
});

test('scaffold-package: design-tokens, ui-web, ui-native and config kinds', (t) => {
  const cwd = makeMonorepo(t);

  assert.equal(runScript(PACKAGE, ['design-tokens', '--kind', 'design-tokens'], cwd).code, 0);
  const tokensPkg = readJson(path.join(cwd, 'packages/design-tokens/package.json'));
  assert.equal(tokensPkg.monorepo.platform, 'universal');
  assert.deepEqual(Object.keys(tokensPkg.exports), ['.', './colors', './spacing', './typography']);

  assert.equal(runScript(PACKAGE, ['ui-web', '--kind', 'ui-web'], cwd).code, 0);
  const uiWebPkg = readJson(path.join(cwd, 'packages/ui-web/package.json'));
  assert.equal(uiWebPkg.monorepo.platform, 'web');
  assert.equal(readJson(path.join(cwd, 'packages/ui-web/tsconfig.json')).compilerOptions.jsx, 'react-jsx');

  assert.equal(runScript(PACKAGE, ['ui-native', '--kind', 'ui-native'], cwd).code, 0);
  const uiNativePkg = readJson(path.join(cwd, 'packages/ui-native/package.json'));
  assert.equal(uiNativePkg.monorepo.platform, 'native');
  assert.equal(readJson(path.join(cwd, 'packages/ui-native/tsconfig.json')).compilerOptions.jsx, 'react-native');

  assert.equal(runScript(PACKAGE, ['prettier-config', '--kind', 'config'], cwd).code, 0);
  const cfgPkg = readJson(path.join(cwd, 'packages/prettier-config/package.json'));
  assert.equal(cfgPkg.scripts, undefined);
  assert.deepEqual(cfgPkg.exports, { './*': './*' });
});

test('scaffold-package: validates name, kind and location', (t) => {
  const cwd = makeMonorepo(t);
  assert.equal(runScript(PACKAGE, ['Bad_Name'], cwd).code, 1);
  assert.equal(runScript(PACKAGE, ['ui', '--kind', 'widget'], cwd).code, 1);
  const outside = makeTempDir(t);
  assert.match(runScript(PACKAGE, ['ui'], outside).stderr, /pnpm-workspace\.yaml not found/);
});

// ─── scaffold-fullstack-feature ─────────────────────────────────────────────

test('scaffold-fullstack-feature (zod): contract, NestJS, Next.js and React Native targets', (t) => {
  const cwd = makeMonorepo(t, 'zod', { withMobile: true });
  const result = runScript(FULLSTACK, ['invoice', '--targets', 'api,web,mobile'], cwd);
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

  const mobileFiles = listFiles(path.join(cwd, 'apps/mobile/src/features/invoices'));
  assert.ok(mobileFiles.includes('models/invoices.ts'), mobileFiles.join('\n'));
  assert.ok(mobileFiles.includes('screens/invoices-home/invoices-home.tsx'), mobileFiles.join('\n'));

  for (const app of ['api', 'web', 'mobile']) {
    assert.equal(readJson(path.join(cwd, `apps/${app}/package.json`)).dependencies['@acme/contracts'], 'workspace:*', app);
  }
  assert.equal(checkBoundaries(cwd).length, 0);
});

test('scaffold-fullstack-feature (openapi): auto-detects apps and wires api-client to web and mobile', (t) => {
  const cwd = makeMonorepo(t, 'openapi', { withMobile: true });
  const result = runScript(FULLSTACK, ['order'], cwd);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(listFiles(path.join(cwd, 'apps/api/src/modules/orders')).length, 18);
  assert.equal(readJson(path.join(cwd, 'apps/web/package.json')).dependencies['@acme/api-client'], 'workspace:*');
  assert.equal(readJson(path.join(cwd, 'apps/mobile/package.json')).dependencies['@acme/api-client'], 'workspace:*');
  assert.equal(readJson(path.join(cwd, 'apps/api/package.json')).dependencies, undefined);
});

test('scaffold-fullstack-feature: --dry-run writes nothing in any workspace', (t) => {
  const cwd = makeMonorepo(t, 'zod', { withMobile: true });
  const before = listFiles(cwd);
  const beforeContracts = fs.readFileSync(path.join(cwd, 'packages/contracts/package.json'), 'utf8');
  const result = runScript(FULLSTACK, ['invoice', '--dry-run'], cwd);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /NestJS module/);
  assert.match(result.stdout, /Next\.js feature/);
  assert.match(result.stdout, /React Native feature/);
  assert.deepEqual(listFiles(cwd), before);
  assert.equal(fs.readFileSync(path.join(cwd, 'packages/contracts/package.json'), 'utf8'), beforeContracts);
});

test('scaffold-fullstack-feature: a conflict in one app aborts every part', (t) => {
  const cwd = makeMonorepo(t, 'zod', { withMobile: true });
  writeFiles(cwd, { 'apps/mobile/src/features/invoices/models/invoices.ts': '// existing\n' });
  const before = listFiles(cwd);
  const beforeContracts = fs.readFileSync(path.join(cwd, 'packages/contracts/package.json'), 'utf8');

  const result = runScript(FULLSTACK, ['invoice'], cwd);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /React Native feature cannot be generated/);
  assert.match(result.stderr, /No files were written in any workspace/);
  assert.deepEqual(listFiles(cwd), before);
  assert.equal(fs.readFileSync(path.join(cwd, 'packages/contracts/package.json'), 'utf8'), beforeContracts);
});

test('scaffold-fullstack-feature: an existing contract export is a conflict and landing target is rejected', (t) => {
  const cwd = makeMonorepo(t);
  assert.equal(runScript(FULLSTACK, ['invoice'], cwd).code, 0);
  const again = runScript(FULLSTACK, ['invoice'], cwd);
  assert.equal(again.code, 1);
  assert.match(again.stderr, /exports\["\.\/invoices"\]/);

  const landingRes = runScript(FULLSTACK, ['order', '--targets', 'api,landing'], cwd);
  assert.equal(landingRes.code, 1);
  assert.match(landingRes.stderr, /landing.*does not use per-domain CRUD/i);
});

test('scaffold-fullstack-feature: fails clearly without target apps or sibling skills', (t) => {
  const cwd = makeMonorepo(t);
  fs.rmSync(path.join(cwd, 'apps/web'), { recursive: true });
  assert.match(runScript(FULLSTACK, ['invoice', '--targets', 'api,web'], cwd).stderr, /--web-dir 'apps\/web' does not exist/);

  // Copy only this skill somewhere without its siblings.
  const isolated = makeTempDir(t);
  fs.cpSync(path.join(rootDir, 'skills/architecture/monorepo-architecture'), path.join(isolated, 'monorepo-architecture'), { recursive: true });
  const repo = makeMonorepo(t);
  const result = spawnSync(process.execPath, [path.join(isolated, 'monorepo-architecture/scripts/scaffold-fullstack-feature.mjs'), 'invoice'], { cwd: repo, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /npx skills add bryanus1\/agent-skills --skill nestjs-architecture/);
});

// ─── check-boundaries ───────────────────────────────────────────────────────

/** Clean fixture: web, api, mobile, and landing depend on compatible packages. */
function boundaryFixture(t, extra = {}) {
  const cwd = makeTempDir(t);
  writeFiles(cwd, {
    'pnpm-workspace.yaml': 'packages:\n  - "apps/*"\n  - "packages/*"\n  - "services/*"\n',
    'apps/web/package.json': JSON.stringify({
      name: 'web',
      monorepo: { layer: 'app', type: 'web', platform: 'web' },
      dependencies: { '@acme/contracts': 'workspace:*', '@acme/ui-web': 'workspace:*' },
    }),
    'apps/web/src/page.tsx': "import { createInvoiceSchema } from '@acme/contracts/invoices';\nimport { SurfaceCard } from '@acme/ui-web';\nimport './local.css';\n",
    'apps/api/package.json': JSON.stringify({
      name: 'api',
      monorepo: { layer: 'app', type: 'api', platform: 'node' },
      dependencies: { '@acme/contracts': 'workspace:*' },
    }),
    'apps/api/src/main.ts': "const c = require('@acme/contracts/invoices');\nexport * from './app';\n",
    'apps/mobile/package.json': JSON.stringify({
      name: 'mobile',
      monorepo: { layer: 'app', type: 'mobile', platform: 'native' },
      dependencies: { '@acme/contracts': 'workspace:*', '@acme/design-tokens': 'workspace:*' },
    }),
    'apps/mobile/src/screen.tsx': "import { colors } from '@acme/design-tokens/colors';\n",
    'apps/landing/package.json': JSON.stringify({
      name: 'landing',
      monorepo: { layer: 'app', type: 'landing', platform: 'astro' },
      dependencies: { '@acme/design-tokens': 'workspace:*' },
    }),
    'apps/landing/src/pages/index.astro': "---\nimport { colors } from '@acme/design-tokens/colors';\n---\n<html><body><h1>Acme</h1></body></html>\n",
    'packages/contracts/package.json': JSON.stringify({
      name: '@acme/contracts',
      monorepo: { layer: 'package', platform: 'universal' },
      exports: { './invoices': './dist/invoices/index.js' },
    }),
    'packages/contracts/src/invoices/index.ts': "export * from './invoice.schema';\n",
    'packages/contracts/dist/invoices/index.js': "require('../../../../apps/web/src/page');\n",
    'packages/design-tokens/package.json': JSON.stringify({
      name: '@acme/design-tokens',
      monorepo: { layer: 'package', platform: 'universal' },
      exports: { '.': './dist/index.js', './colors': './dist/colors/index.js' },
    }),
    'packages/ui-web/package.json': JSON.stringify({
      name: '@acme/ui-web',
      monorepo: { layer: 'package', platform: 'web' },
      exports: { '.': './dist/index.js' },
    }),
    ...extra,
  });
  return cwd;
}

const rulesOf = (cwd) => checkBoundaries(cwd).map((v) => `${v.rule} ${v.file}:${v.line}`);

test('check-boundaries: clean multi-app monorepo (including .astro & mobile) has no violations', (t) => {
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
  [
    'platform-mismatch (native -> web)',
    {
      'apps/mobile/package.json': JSON.stringify({
        name: 'mobile',
        monorepo: { platform: 'native' },
        dependencies: { '@acme/design-tokens': 'workspace:*', '@acme/ui-web': 'workspace:*' },
      }),
      'apps/mobile/src/bad.tsx': "import { SurfaceCard } from '@acme/ui-web';\n",
    },
    'platform-mismatch apps/mobile/src/bad.tsx:1',
  ],
  [
    'platform-mismatch (universal -> web)',
    {
      'packages/contracts/package.json': JSON.stringify({
        name: '@acme/contracts',
        monorepo: { platform: 'universal' },
        dependencies: { '@acme/ui-web': 'workspace:*' },
        exports: { './invoices': './dist/invoices/index.js' },
      }),
      'packages/contracts/src/bad.ts': "import { SurfaceCard } from '@acme/ui-web';\n",
    },
    'platform-mismatch packages/contracts/src/bad.ts:1',
  ],
  [
    'astro frontmatter undeclared import',
    {
      'apps/landing/src/pages/pricing.astro': "---\nimport { createInvoiceSchema } from '@acme/contracts/invoices';\n---\n<div>Pricing</div>\n",
    },
    'undeclared apps/landing/src/pages/pricing.astro:2',
  ],
  [
    'polyglot service in services/ cannot be imported',
    {
      'services/ml/package.json': JSON.stringify({ name: 'ml', monorepo: { layer: 'app', type: 'polyglot', platform: 'node' } }),
      'apps/api/src/call.ts': "import { predict } from 'ml';\n",
    },
    'app-import apps/api/src/call.ts:1',
  ],
];

for (const [label, extra, expected] of violationCases) {
  test(`check-boundaries: reports ${label}`, (t) => {
    assert.deepEqual(rulesOf(boundaryFixture(t, extra)), [expected]);
  });
}

test('check-boundaries: ignores prose in .astro and comments in TS', () => {
  const imports = extractImports("// import x from 'web';\n/* require('web') */\nimport y from 'zod';\n");
  assert.deepEqual(imports, [{ specifier: 'zod', line: 3 }]);

  const astroImports = extractImports(
    "---\nimport { colors } from '@acme/design-tokens/colors';\n---\n<p>import x from 'web';</p>\n<script>\nimport { a } from '@acme/contracts/invoices';\n</script>\n",
    '.astro',
  );
  assert.deepEqual(astroImports, [
    { specifier: '@acme/design-tokens/colors', line: 2 },
    { specifier: '@acme/contracts/invoices', line: 6 },
  ]);
});

test('check-boundaries: monorepo.boundaries.json overrides platform rules', (t) => {
  const cwd = boundaryFixture(t, {
    'monorepo.boundaries.json': JSON.stringify({ allow: { native: ['universal', 'native', 'web'] } }),
    'apps/mobile/package.json': JSON.stringify({
      name: 'mobile',
      monorepo: { platform: 'native' },
      dependencies: { '@acme/design-tokens': 'workspace:*', '@acme/ui-web': 'workspace:*' },
    }),
    'apps/mobile/src/ok.tsx': "import { SurfaceCard } from '@acme/ui-web';\n",
  });
  assert.deepEqual(checkBoundaries(cwd), []);
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
