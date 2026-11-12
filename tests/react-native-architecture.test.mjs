import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeTempDir, runScript, listFiles } from './helpers.mjs';
import { checkArchitecture } from '../skills/architecture/react-native-architecture/scripts/check-architecture.mjs';

const RN_FEATURE = 'skills/architecture/react-native-architecture/scripts/scaffold-feature.mjs';
const RN_COMPONENT = 'skills/architecture/react-native-architecture/scripts/scaffold-component.mjs';
const RN_HOOK = 'skills/architecture/react-native-architecture/scripts/scaffold-hook.mjs';
const RN_SERVICE = 'skills/architecture/react-native-architecture/scripts/scaffold-service.mjs';
const RN_TOOLING = 'skills/architecture/react-native-architecture/scripts/setup-tooling.mjs';

test('scaffold-hook: generates query hook, hierarchical keys and test', (t) => {
  const cwd = makeTempDir(t);
  const result = runScript(RN_HOOK, ['use-invoices', '--feature', 'billing'], cwd);
  assert.equal(result.code, 0, result.stderr);

  const files = listFiles(cwd);
  assert.ok(files.includes('src/features/billing/hooks/billing-keys/billing.keys.ts'));
  assert.ok(files.includes('src/features/billing/hooks/billing-keys/index.ts'));
  assert.ok(files.includes('src/features/billing/hooks/use-invoices/use-invoices.hook.ts'));
  assert.ok(files.includes('src/features/billing/hooks/use-invoices/use-invoices.hook.test.ts'));
  assert.ok(files.includes('src/features/billing/hooks/use-invoices/index.ts'));

  const hookContent = fs.readFileSync(path.join(cwd, 'src/features/billing/hooks/use-invoices/use-invoices.hook.ts'), 'utf8');
  assert.match(hookContent, /useQuery/);
  assert.match(hookContent, /billingKeys\.list/);

  const keysContent = fs.readFileSync(path.join(cwd, 'src/features/billing/hooks/billing-keys/billing.keys.ts'), 'utf8');
  assert.match(keysContent, /billingKeys = \{/);
  assert.match(keysContent, /lists:/);
  assert.match(keysContent, /details:/);
});

test('scaffold-hook: generates mutation hook and invalidates lists', (t) => {
  const cwd = makeTempDir(t);
  const result = runScript(
    RN_HOOK,
    ['use-create-invoice', '--feature', 'billing', '--kind', 'mutation', '--entity', 'invoice'],
    cwd,
  );
  assert.equal(result.code, 0, result.stderr);

  const hookContent = fs.readFileSync(
    path.join(cwd, 'src/features/billing/hooks/use-create-invoice/use-create-invoice.hook.ts'),
    'utf8',
  );
  assert.match(hookContent, /useMutation/);
  assert.match(hookContent, /invalidateQueries\(\{ queryKey: invoiceKeys\.lists\(\) \}\)/);
});

test('scaffold-hook: validates hook name and required feature', (t) => {
  const cwd = makeTempDir(t);
  assert.equal(runScript(RN_HOOK, ['invoices', '--feature', 'billing'], cwd).code, 1);
  assert.equal(runScript(RN_HOOK, ['use-invoices'], cwd).code, 1);
});

test('scaffold-service: generates service and mock test for <verb>-<noun>', (t) => {
  const cwd = makeTempDir(t);
  const result = runScript(RN_SERVICE, ['get-invoices', '--feature', 'billing'], cwd);
  assert.equal(result.code, 0, result.stderr);

  const files = listFiles(cwd);
  assert.ok(files.includes('src/features/billing/services/get-invoices/get-invoices.service.ts'));
  assert.ok(files.includes('src/features/billing/services/get-invoices/get-invoices.service.test.ts'));
  assert.ok(files.includes('src/features/billing/services/get-invoices/index.ts'));

  const service = fs.readFileSync(
    path.join(cwd, 'src/features/billing/services/get-invoices/get-invoices.service.ts'),
    'utf8',
  );
  assert.match(service, /apiClient\.get/);

  const testFile = fs.readFileSync(
    path.join(cwd, 'src/features/billing/services/get-invoices/get-invoices.service.test.ts'),
    'utf8',
  );
  assert.match(testFile, /jest\.mock\('@\/config\/api-client'/);
});

test('scaffold-service: rejects names that do not follow <verb>-<noun>', (t) => {
  const cwd = makeTempDir(t);
  assert.equal(runScript(RN_SERVICE, ['invoices', '--feature', 'billing'], cwd).code, 1);
  assert.equal(runScript(RN_SERVICE, ['get-invoices'], cwd).code, 1);
});

test('setup-tooling: creates oxlint, oxfmt and jest configurations', (t) => {
  const cwd = makeTempDir(t);
  const result = runScript(RN_TOOLING, [], cwd);
  assert.equal(result.code, 0, result.stderr);

  assert.ok(fs.existsSync(path.join(cwd, '.oxlintrc.json')));
  assert.ok(fs.existsSync(path.join(cwd, '.oxfmtrc.json')));
  assert.ok(fs.existsSync(path.join(cwd, 'jest.config.js')));
  assert.ok(fs.existsSync(path.join(cwd, 'src/test/setup.ts')));

  const oxlint = JSON.parse(fs.readFileSync(path.join(cwd, '.oxlintrc.json'), 'utf8'));
  assert.ok(oxlint.rules['no-restricted-imports']);
  assert.ok(oxlint.rules['no-restricted-globals']);
  assert.ok(oxlint.overrides.length > 0);

  const oxfmt = JSON.parse(fs.readFileSync(path.join(cwd, '.oxfmtrc.json'), 'utf8'));
  assert.equal(oxfmt.sortTailwindcss, true);
});

test('setup-tooling: honors --only flag', (t) => {
  const cwd = makeTempDir(t);
  assert.equal(runScript(RN_TOOLING, ['--only', 'lint'], cwd).code, 0);
  assert.ok(fs.existsSync(path.join(cwd, '.oxlintrc.json')));
  assert.ok(!fs.existsSync(path.join(cwd, '.oxfmtrc.json')));
  assert.ok(!fs.existsSync(path.join(cwd, 'jest.config.js')));
});

test('setup-tooling: safety contract (--dry-run and --force)', (t) => {
  const cwd = makeTempDir(t);
  // dry-run writes nothing
  assert.equal(runScript(RN_TOOLING, ['--dry-run'], cwd).code, 0);
  assert.deepEqual(fs.readdirSync(cwd), []);

  // normal write
  assert.equal(runScript(RN_TOOLING, [], cwd).code, 0);
  assert.ok(fs.existsSync(path.join(cwd, '.oxlintrc.json')));

  // conflict without force fails
  assert.equal(runScript(RN_TOOLING, [], cwd).code, 1);

  // with force succeeds
  assert.equal(runScript(RN_TOOLING, ['--force'], cwd).code, 0);
});

test('check-architecture: passes on a clean scaffolded project', (t) => {
  const cwd = makeTempDir(t);
  runScript(RN_FEATURE, ['billing', '--with-starter', '--with-route'], cwd);
  runScript(RN_HOOK, ['use-invoices', '--feature', 'billing'], cwd);
  runScript(RN_SERVICE, ['get-invoices', '--feature', 'billing'], cwd);
  runScript(RN_COMPONENT, ['invoice-card', '--target-dir', 'src/features/billing/components'], cwd);

  const violations = checkArchitecture({ cwd, srcDir: 'src', includeImports: true });
  assert.deepEqual(violations, []);
});

test('check-architecture: detects structural violations', (t) => {
  const cwd = makeTempDir(t);
  const featRoot = path.join(cwd, 'src/features/billing');
  fs.mkdirSync(path.join(featRoot, 'components/button'), { recursive: true });
  fs.mkdirSync(path.join(cwd, 'src/app/billing'), { recursive: true });

  // 1. Root barrel
  fs.writeFileSync(path.join(featRoot, 'index.ts'), "export * from './components';\n");

  // 2. Grouper barrel
  fs.writeFileSync(path.join(featRoot, 'components', 'index.ts'), "export * from './button';\n");

  // 3. Test inside app/
  fs.writeFileSync(path.join(cwd, 'src/app/billing/billing.test.tsx'), '// test in app\n');

  // 4. Leaf without adjacent test
  fs.writeFileSync(path.join(featRoot, 'components/button/button.tsx'), 'export const Button = () => null;\n');

  const violations = checkArchitecture({ cwd, srcDir: 'src' });
  const rules = violations.map((v) => v.rule).sort();

  assert.ok(rules.includes('forbidden-root-barrel'));
  assert.ok(rules.includes('forbidden-grouper-barrel'));
  assert.ok(rules.includes('route-has-tests'));
  assert.ok(rules.includes('missing-leaf-test'));
});

test('check-architecture: detects import and content violations with --include-imports', (t) => {
  const cwd = makeTempDir(t);
  const badFile = path.join(cwd, 'src/features/billing/screens/bad/bad.tsx');
  fs.mkdirSync(path.dirname(badFile), { recursive: true });

  fs.writeFileSync(
    badFile,
    `import { useBilling } from '@/features/billing';
import { Button } from '@/features/billing/components';
export function Bad() {
  localStorage.setItem('x', '1');
  const w = window.innerWidth;
  return <div><span>{w}</span></div>;
}
`,
  );

  const violations = checkArchitecture({ cwd, srcDir: 'src', includeImports: true });
  const rules = violations.map((v) => v.rule);

  assert.ok(rules.includes('container-import'));
  assert.ok(rules.includes('grouper-import'));
  assert.ok(rules.includes('forbidden-web-api'));
  assert.ok(rules.includes('forbidden-dom-element'));
});
