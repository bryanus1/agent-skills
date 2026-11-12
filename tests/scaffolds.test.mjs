import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeTempDir, runScript, listFiles } from './helpers.mjs';

const NEST = 'skills/architecture/nestjs-architecture/scripts/scaffold-module.mjs';
const NEXT_FEATURE = 'skills/architecture/nextjs-architecture/scripts/scaffold-feature.mjs';
const NEXT_COMPONENT = 'skills/architecture/nextjs-architecture/scripts/scaffold-component.mjs';
const RN_FEATURE = 'skills/architecture/react-native-architecture/scripts/scaffold-feature.mjs';
const RN_COMPONENT = 'skills/architecture/react-native-architecture/scripts/scaffold-component.mjs';
const RN_HOOK = 'skills/architecture/react-native-architecture/scripts/scaffold-hook.mjs';
const RN_SERVICE = 'skills/architecture/react-native-architecture/scripts/scaffold-service.mjs';

// Every scaffold must follow the same safety contract (docs/SPECIFICATION.md §5).
const scaffolds = [
  { name: 'nestjs scaffold-module', script: NEST, args: ['invoice'], probe: 'src/modules/invoices/invoice.module.ts' },
  { name: 'nextjs scaffold-feature', script: NEXT_FEATURE, args: ['billing', '--with-starter', '--with-route'], probe: 'src/features/billing/models/billing.ts' },
  { name: 'nextjs scaffold-component', script: NEXT_COMPONENT, args: ['user-card', '--type', 'dialog'], probe: 'src/components/common/user-card/user-card.tsx' },
  { name: 'react-native scaffold-feature', script: RN_FEATURE, args: ['billing', '--with-starter', '--with-route'], probe: 'src/features/billing/models/billing.ts' },
  { name: 'react-native scaffold-component', script: RN_COMPONENT, args: ['user-card', '--type', 'modal'], probe: 'src/components/common/user-card/user-card.tsx' },
  { name: 'react-native scaffold-hook', script: RN_HOOK, args: ['use-invoices', '--feature', 'billing'], probe: 'src/features/billing/hooks/use-invoices/use-invoices.hook.ts' },
  { name: 'react-native scaffold-service', script: RN_SERVICE, args: ['get-invoices', '--feature', 'billing'], probe: 'src/features/billing/services/get-invoices/get-invoices.service.ts' },
];

for (const { name, script, args, probe } of scaffolds) {
  test(`${name}: --dry-run writes nothing`, (t) => {
    const cwd = makeTempDir(t);
    const result = runScript(script, [...args, '--dry-run'], cwd);
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(listFiles(cwd), []);
    assert.deepEqual(fs.readdirSync(cwd), []);
  });

  test(`${name}: aborts without writing when a target file exists`, (t) => {
    const cwd = makeTempDir(t);
    assert.equal(runScript(script, args, cwd).code, 0);

    const probePath = path.join(cwd, probe);
    fs.writeFileSync(probePath, '// user edits\n');
    const before = listFiles(cwd);

    const result = runScript(script, args, cwd);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /already exist/);
    assert.match(result.stderr, /--force/);
    assert.equal(fs.readFileSync(probePath, 'utf8'), '// user edits\n');
    assert.deepEqual(listFiles(cwd), before);
  });

  test(`${name}: --force overwrites existing files`, (t) => {
    const cwd = makeTempDir(t);
    assert.equal(runScript(script, args, cwd).code, 0);
    const probePath = path.join(cwd, probe);
    fs.writeFileSync(probePath, '// user edits\n');

    const result = runScript(script, [...args, '--force'], cwd);
    assert.equal(result.code, 0, result.stderr);
    assert.notEqual(fs.readFileSync(probePath, 'utf8'), '// user edits\n');
  });

  test(`${name}: --help exits 0 and no args exits 1`, (t) => {
    const cwd = makeTempDir(t);
    assert.equal(runScript(script, ['--help'], cwd).code, 0);
    assert.equal(runScript(script, [], cwd).code, 1);
  });
}

test('nestjs scaffold-module: generates 18 files under a plural folder', (t) => {
  const cwd = makeTempDir(t);
  assert.equal(runScript(NEST, ['invoice'], cwd).code, 0);
  const files = listFiles(cwd);
  assert.equal(files.length, 18, files.join('\n'));
  assert.ok(files.every((f) => f.startsWith('src/modules/invoices/')));
  assert.ok(!files.includes('src/modules/invoices/index.ts'), 'module root must not have a barrel');

  const contract = fs.readFileSync(path.join(cwd, 'src/modules/invoices/repositories/repository.ts'), 'utf8');
  assert.match(contract, /interface IInvoiceRepository/);
  assert.match(contract, /INVOICE_REPOSITORY_TOKEN/);
  const moduleFile = fs.readFileSync(path.join(cwd, 'src/modules/invoices/invoice.module.ts'), 'utf8');
  assert.match(moduleFile, /export class InvoiceModule/);
});

test('nestjs scaffold-module: rejects names that are not kebab-case', (t) => {
  const cwd = makeTempDir(t);
  assert.equal(runScript(NEST, ['Invoice_Item!'], cwd).code, 1);
  assert.deepEqual(listFiles(cwd), []);
});

test('nextjs scaffold-feature: creates the 7 feature folders, starter and route only on request', (t) => {
  const cwd = makeTempDir(t);
  assert.equal(runScript(NEXT_FEATURE, ['billing'], cwd).code, 0);
  const featureRoot = path.join(cwd, 'src/features/billing');
  assert.deepEqual(fs.readdirSync(featureRoot).sort(), ['components', 'hooks', 'models', 'schemas', 'screens', 'services', 'utils']);
  assert.deepEqual(listFiles(cwd), []);

  // Re-running without starter files is a no-op and must succeed.
  assert.equal(runScript(NEXT_FEATURE, ['billing'], cwd).code, 0);

  assert.equal(runScript(NEXT_FEATURE, ['billing', '--with-starter', '--with-route'], cwd).code, 0);
  assert.deepEqual(listFiles(cwd), [
    'src/app/billing/page.tsx',
    'src/features/billing/models/billing.ts',
    'src/features/billing/models/index.ts',
    'src/features/billing/screens/billing-home/billing-home.test.tsx',
    'src/features/billing/screens/billing-home/billing-home.tsx',
    'src/features/billing/screens/billing-home/index.ts',
  ]);
  assert.ok(!fs.existsSync(path.join(featureRoot, 'index.ts')), 'feature root must not have a barrel');

  const screenTest = fs.readFileSync(path.join(featureRoot, 'screens/billing-home/billing-home.test.tsx'), 'utf8');
  assert.match(screenTest, /from 'vitest'/);
  const route = fs.readFileSync(path.join(cwd, 'src/app/billing/page.tsx'), 'utf8');
  assert.match(route, /@\/features\/billing\/screens\/billing-home/);
});

test('nextjs scaffold-feature: --with-route requires --with-starter and honors --app-dir', (t) => {
  const cwd = makeTempDir(t);
  const result = runScript(NEXT_FEATURE, ['billing', '--with-route'], cwd);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /--with-starter/);
  assert.deepEqual(fs.readdirSync(cwd), []);

  assert.equal(runScript(NEXT_FEATURE, ['billing', '--with-starter', '--with-route', '--app-dir', 'apps/web/src/app'], cwd).code, 0);
  assert.ok(fs.existsSync(path.join(cwd, 'apps/web/src/app/billing/page.tsx')));
});

test('nextjs scaffold-feature: rejects names that are not kebab-case or unknown flags', (t) => {
  const cwd = makeTempDir(t);
  assert.equal(runScript(NEXT_FEATURE, ['Invoice_Item!'], cwd).code, 1);
  assert.equal(runScript(NEXT_FEATURE, ['-bad-name'], cwd).code, 1);
  assert.equal(runScript(NEXT_FEATURE, ['billing', '--unknown-flag'], cwd).code, 1);
  assert.deepEqual(fs.readdirSync(cwd), []);
});

test('nextjs scaffold-component: generates component, Vitest test and barrel for each type', (t) => {
  const cwd = makeTempDir(t);
  for (const type of ['default', 'dialog', 'section']) {
    const name = `${type}-card`;
    assert.equal(runScript(NEXT_COMPONENT, [name, '--type', type], cwd).code, 0);
    assert.deepEqual(listFiles(path.join(cwd, 'src/components/common', name)), [`${name}.test.tsx`, `${name}.tsx`, 'index.ts'].sort());
  }
  const dialog = fs.readFileSync(path.join(cwd, 'src/components/common/dialog-card/dialog-card.tsx'), 'utf8');
  assert.match(dialog, /FormDialog/);
  assert.match(dialog, /'use client'/);
  const dialogTest = fs.readFileSync(path.join(cwd, 'src/components/common/dialog-card/dialog-card.test.tsx'), 'utf8');
  assert.match(dialogTest, /from 'vitest'/);
  assert.match(dialogTest, /vi\.fn\(\)/);

  const section = fs.readFileSync(path.join(cwd, 'src/components/common/section-card/section-card.tsx'), 'utf8');
  assert.match(section, /<section/);
  assert.match(section, /<h2/);
});

test('nextjs scaffold-component: rejects an unknown --type', (t) => {
  const cwd = makeTempDir(t);
  const result = runScript(NEXT_COMPONENT, ['user-card', '--type', 'modal'], cwd);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Unknown --type/);
  assert.deepEqual(listFiles(cwd), []);
});

test('react-native scaffold-feature: creates the 7 folders, starter and route only on request', (t) => {
  const cwd = makeTempDir(t);
  assert.equal(runScript(RN_FEATURE, ['billing'], cwd).code, 0);
  const featureRoot = path.join(cwd, 'src/features/billing');
  assert.deepEqual(fs.readdirSync(featureRoot).sort(), ['components', 'hooks', 'models', 'schemas', 'screens', 'services', 'utils']);
  assert.deepEqual(listFiles(cwd), []);

  assert.equal(runScript(RN_FEATURE, ['billing', '--with-starter', '--with-route'], cwd).code, 0);
  assert.deepEqual(listFiles(cwd), [
    'src/app/billing/index.tsx',
    'src/features/billing/models/billing.ts',
    'src/features/billing/models/index.ts',
    'src/features/billing/screens/billing-home/billing-home.test.tsx',
    'src/features/billing/screens/billing-home/billing-home.tsx',
    'src/features/billing/screens/billing-home/index.ts',
  ]);
  assert.ok(!fs.existsSync(path.join(featureRoot, 'index.ts')), 'feature root must not have a barrel');

  const screen = fs.readFileSync(path.join(featureRoot, 'screens/billing-home/billing-home.tsx'), 'utf8');
  assert.match(screen, /from 'react-native'/);
  assert.match(screen, /className=/);
  assert.doesNotMatch(screen, /<div/);
  const route = fs.readFileSync(path.join(cwd, 'src/app/billing/index.tsx'), 'utf8');
  assert.match(route, /@\/features\/billing\/screens\/billing-home/);
});

test('react-native scaffold-feature: --with-route requires --with-starter and honors --app-dir', (t) => {
  const cwd = makeTempDir(t);
  const result = runScript(RN_FEATURE, ['billing', '--with-route'], cwd);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /--with-starter/);
  assert.deepEqual(fs.readdirSync(cwd), []);

  assert.equal(runScript(RN_FEATURE, ['billing', '--with-starter', '--with-route', '--app-dir', 'apps/mobile/src/app'], cwd).code, 0);
  assert.ok(fs.existsSync(path.join(cwd, 'apps/mobile/src/app/billing/index.tsx')));
});

test('react-native scaffold-feature: supports --route-path and --with-layout', (t) => {
  const cwd = makeTempDir(t);
  const result = runScript(RN_FEATURE, ['billing', '--with-starter', '--with-route', '--route-path', '(tabs)/billing', '--with-layout'], cwd);
  assert.equal(result.code, 0, result.stderr);
  assert.ok(fs.existsSync(path.join(cwd, 'src/app/(tabs)/billing/index.tsx')));
  assert.ok(fs.existsSync(path.join(cwd, 'src/app/(tabs)/billing/_layout.tsx')));

  const layout = fs.readFileSync(path.join(cwd, 'src/app/(tabs)/billing/_layout.tsx'), 'utf8');
  assert.match(layout, /Stack/);
  assert.match(layout, /options=\{\{ title: 'Billing' \}\}/);
});

test('react-native scaffold-feature: rejects names that are not kebab-case', (t) => {
  const cwd = makeTempDir(t);
  assert.equal(runScript(RN_FEATURE, ['Invoice_Item!'], cwd).code, 1);
  assert.deepEqual(fs.readdirSync(cwd), []);
});

test('react-native scaffold-feature: --minimal does not create empty subfolders', (t) => {
  const cwd = makeTempDir(t);
  assert.equal(runScript(RN_FEATURE, ['billing', '--minimal'], cwd).code, 0);
  assert.deepEqual(listFiles(cwd), []);
  assert.deepEqual(fs.readdirSync(cwd), []);

  assert.equal(runScript(RN_FEATURE, ['billing', '--minimal', '--with-starter'], cwd).code, 0);
  const featureRoot = path.join(cwd, 'src/features/billing');
  assert.deepEqual(fs.readdirSync(featureRoot).sort(), ['models', 'screens']);
});

test('react-native scaffold-component: generates component, test and barrel for each type', (t) => {
  const cwd = makeTempDir(t);
  for (const type of ['default', 'modal', 'section']) {
    const name = `${type}-card`;
    assert.equal(runScript(RN_COMPONENT, [name, '--type', type], cwd).code, 0);
    assert.deepEqual(listFiles(path.join(cwd, 'src/components/common', name)), [`${name}.test.tsx`, `${name}.tsx`, 'index.ts'].sort());
  }
  const modal = fs.readFileSync(path.join(cwd, 'src/components/common/modal-card/modal-card.tsx'), 'utf8');
  assert.match(modal, /Modal/);
  assert.match(modal, /from 'react-native'/);
  assert.match(modal, /confirmLabel = 'Confirm'/);
  assert.match(modal, /dark:bg-zinc-900/);
  assert.match(modal, /\{onConfirm && \(/);

  const modalTest = fs.readFileSync(path.join(cwd, 'src/components/common/modal-card/modal-card.test.tsx'), 'utf8');
  assert.match(modalTest, /cancelLabel="Dismiss"/);
});

test('react-native scaffold-component: rejects an unknown --type', (t) => {
  const cwd = makeTempDir(t);
  const result = runScript(RN_COMPONENT, ['user-card', '--type', 'dialog'], cwd);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Unknown --type/);
  assert.deepEqual(listFiles(cwd), []);
});
