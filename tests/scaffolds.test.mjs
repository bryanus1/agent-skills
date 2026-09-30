import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeTempDir, runScript, listFiles } from './helpers.mjs';

const FLUTTER = 'skills/architecture/flutter-architecture/scripts/scaffold-feature.mjs';
const NEST = 'skills/architecture/nestjs-architecture/scripts/scaffold-module.mjs';
const NEXT_FEATURE = 'skills/architecture/nextjs-architecture/scripts/scaffold-feature.mjs';
const NEXT_COMPONENT = 'skills/architecture/nextjs-architecture/scripts/scaffold-component.mjs';

// Every scaffold must follow the same safety contract (docs/SPECIFICATION.md §5).
const scaffolds = [
  { name: 'flutter scaffold-feature', script: FLUTTER, args: ['billing', '--model', 'invoice'], probe: 'lib/features/billing/domain/entities/invoice.dart' },
  { name: 'nestjs scaffold-module', script: NEST, args: ['invoice'], probe: 'src/modules/invoices/invoice.module.ts' },
  { name: 'nextjs scaffold-feature', script: NEXT_FEATURE, args: ['billing', '--with-starter'], probe: 'src/features/billing/models/billing.ts' },
  { name: 'nextjs scaffold-component', script: NEXT_COMPONENT, args: ['user-card', '--type', 'dialog'], probe: 'src/components/common/user-card/user-card.tsx' },
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

test('flutter scaffold-feature: generates the 13 BLoC files', (t) => {
  const cwd = makeTempDir(t);
  fs.writeFileSync(path.join(cwd, 'pubspec.yaml'), 'name: shop_app\n');
  assert.equal(runScript(FLUTTER, ['billing', '--model', 'invoice'], cwd).code, 0);

  assert.deepEqual(listFiles(cwd), [
    'lib/features/billing/data/datasources/invoice_remote_data_source.dart',
    'lib/features/billing/data/models/invoice_model.dart',
    'lib/features/billing/data/repositories/invoice_repository_impl.dart',
    'lib/features/billing/domain/entities/invoice.dart',
    'lib/features/billing/domain/repositories/invoice_repository.dart',
    'lib/features/billing/domain/usecases/get_invoice.dart',
    'lib/features/billing/presentation/bloc/invoice_bloc.dart',
    'lib/features/billing/presentation/bloc/invoice_event.dart',
    'lib/features/billing/presentation/bloc/invoice_state.dart',
    'lib/features/billing/presentation/screens/invoice_screen.dart',
    'lib/features/billing/presentation/widgets/invoice_item_widget.dart',
    'pubspec.yaml',
    'test/features/billing/domain/usecases/get_invoice_test.dart',
    'test/features/billing/presentation/bloc/invoice_bloc_test.dart',
  ]);
  const entity = fs.readFileSync(path.join(cwd, 'lib/features/billing/domain/entities/invoice.dart'), 'utf8');
  assert.match(entity, /class Invoice extends Equatable/);
  const repositoryImpl = fs.readFileSync(path.join(cwd, 'lib/features/billing/data/repositories/invoice_repository_impl.dart'), 'utf8');
  assert.match(repositoryImpl, /package:shop_app\//, 'uses the package name detected from pubspec.yaml');
});

test('flutter scaffold-feature: --cubit generates a cubit instead of a bloc', (t) => {
  const cwd = makeTempDir(t);
  assert.equal(runScript(FLUTTER, ['cart', '--model', 'cart_item', '--cubit'], cwd).code, 0);
  const files = listFiles(cwd);
  assert.ok(files.some((f) => f.startsWith('lib/features/cart/presentation/cubit/')), files.join('\n'));
  assert.ok(!files.some((f) => f.includes('/bloc/')), files.join('\n'));
});

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

test('nextjs scaffold-feature: creates the 7 feature folders, starter files only with --with-starter', (t) => {
  const cwd = makeTempDir(t);
  assert.equal(runScript(NEXT_FEATURE, ['billing'], cwd).code, 0);
  const featureRoot = path.join(cwd, 'src/features/billing');
  assert.deepEqual(fs.readdirSync(featureRoot).sort(), ['components', 'hooks', 'models', 'schemas', 'screens', 'services', 'utils']);
  assert.deepEqual(listFiles(cwd), []);

  // Re-running without starter files is a no-op and must succeed.
  assert.equal(runScript(NEXT_FEATURE, ['billing'], cwd).code, 0);

  assert.equal(runScript(NEXT_FEATURE, ['billing', '--with-starter'], cwd).code, 0);
  assert.deepEqual(listFiles(cwd), [
    'src/features/billing/models/billing.ts',
    'src/features/billing/models/index.ts',
    'src/features/billing/screens/billing-home/billing-home.test.tsx',
    'src/features/billing/screens/billing-home/billing-home.tsx',
    'src/features/billing/screens/billing-home/index.ts',
  ]);
  assert.ok(!fs.existsSync(path.join(featureRoot, 'index.ts')), 'feature root must not have a barrel');
});

test('nextjs scaffold-component: generates component, test and barrel for each type', (t) => {
  const cwd = makeTempDir(t);
  for (const type of ['default', 'dialog', 'section']) {
    const name = `${type}-card`;
    assert.equal(runScript(NEXT_COMPONENT, [name, '--type', type], cwd).code, 0);
    assert.deepEqual(listFiles(path.join(cwd, 'src/components/common', name)), [`${name}.test.tsx`, `${name}.tsx`, 'index.ts'].sort());
  }
  const dialog = fs.readFileSync(path.join(cwd, 'src/components/common/dialog-card/dialog-card.tsx'), 'utf8');
  assert.match(dialog, /FormDialog/);
});

test('nextjs scaffold-component: rejects an unknown --type', (t) => {
  const cwd = makeTempDir(t);
  const result = runScript(NEXT_COMPONENT, ['user-card', '--type', 'modal'], cwd);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Unknown --type/);
  assert.deepEqual(listFiles(cwd), []);
});
