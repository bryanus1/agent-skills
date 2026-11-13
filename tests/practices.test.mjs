import test from 'node:test';
import assert from 'node:assert/strict';
import { makeTempDir, runScript, writeFiles, listFiles } from './helpers.mjs';

const DETECT_RUNNER = 'skills/practices/tdd-workflow/scripts/detect-test-runner.mjs';
const DETECT_SMELLS = 'skills/practices/clean-code/scripts/detect-smells.mjs';

const json = (result) => {
  assert.equal(result.code, 0, result.stderr);
  return JSON.parse(result.stdout);
};

// ── detect-test-runner ──────────────────────────────────────────────

test('detect-test-runner: --help exits 0', () => {
  const result = runScript(DETECT_RUNNER, ['--help'], process.cwd());
  assert.equal(result.code, 0);
  assert.match(result.stdout, /--json/);
});

test('detect-test-runner: unknown option exits 2', (t) => {
  const result = runScript(DETECT_RUNNER, ['--nope'], makeTempDir(t));
  assert.equal(result.code, 2);
  assert.match(result.stderr, /desconocida/);
});

test('detect-test-runner: empty directory reports no runners', (t) => {
  const result = json(runScript(DETECT_RUNNER, ['--json'], makeTempDir(t)));
  assert.deepEqual(result.runners, []);
  assert.equal(result.conventions, null);
});

test('detect-test-runner: vitest with pnpm and colocated spec files', (t) => {
  const cwd = makeTempDir(t);
  writeFiles(cwd, {
    'package.json': JSON.stringify({ scripts: { test: 'vitest run' }, devDependencies: { vitest: '^3.0.0' } }),
    'pnpm-lock.yaml': '',
    'vitest.config.ts': 'export default {}',
    'src/a/a.spec.ts': '',
    'src/b/b.spec.ts': '',
  });
  const before = listFiles(cwd);
  const result = json(runScript(DETECT_RUNNER, ['--json'], cwd));
  assert.equal(result.packageManager, 'pnpm');
  assert.equal(result.testScript, 'pnpm test');
  assert.equal(result.runners[0].name, 'vitest');
  assert.equal(result.runners[0].config, 'vitest.config.ts');
  assert.equal(result.runners[0].commands.file, 'pnpm exec vitest run <file>');
  assert.equal(result.conventions.suffix, '.spec.ts');
  assert.match(result.conventions.placement, /colocated/);
  assert.deepEqual(listFiles(cwd), before, 'the script must not write files');
});

test('detect-test-runner: jest and playwright with npm', (t) => {
  const cwd = makeTempDir(t);
  writeFiles(cwd, {
    'package.json': JSON.stringify({ devDependencies: { jest: '^29.0.0', '@playwright/test': '^1.0.0' } }),
    'package-lock.json': '{}',
    'tests/x.test.js': '',
  });
  const result = json(runScript(DETECT_RUNNER, ['--json'], cwd));
  assert.equal(result.packageManager, 'npm');
  assert.deepEqual(result.runners.map((r) => r.name), ['jest', 'playwright']);
  assert.equal(result.runners[0].commands.all, 'npx jest');
  assert.equal(result.runners[1].kind, 'e2e');
  assert.match(result.conventions.placement, /separate/);
});

test('detect-test-runner: node:test uses the script that runs it', (t) => {
  const cwd = makeTempDir(t);
  writeFiles(cwd, { 'package.json': JSON.stringify({ scripts: { 'test:unit': 'node --test tests/' } }) });
  const result = json(runScript(DETECT_RUNNER, ['--json'], cwd));
  assert.equal(result.runners[0].name, 'node:test');
  assert.equal(result.runners[0].commands.all, 'npm run test:unit');
});

test('detect-test-runner: finds the lockfile in a parent monorepo root and honours --cwd', (t) => {
  const cwd = makeTempDir(t);
  writeFiles(cwd, {
    'pnpm-workspace.yaml': 'packages: [packages/*]',
    'pnpm-lock.yaml': '',
    'packages/api/package.json': JSON.stringify({ devDependencies: { vitest: '1' } }),
  });
  const result = json(runScript(DETECT_RUNNER, ['--json', '--cwd', 'packages/api'], cwd));
  assert.equal(result.packageManager, 'pnpm');
  assert.equal(result.monorepo, true);
});

test('detect-test-runner: non-JS runners', (t) => {
  const cwd = makeTempDir(t);
  writeFiles(cwd, { 'go.mod': 'module x', 'pyproject.toml': '[tool.pytest.ini_options]' });
  const names = json(runScript(DETECT_RUNNER, ['--json'], cwd)).runners.map((r) => r.name);
  assert.deepEqual(names, ['pytest', 'go test']);
});

// ── detect-smells ───────────────────────────────────────────────────

const SMELLY = `import { x } from './x';
const MAX_RETRIES = 5;
export function process(a: number, b: string, c: boolean, d?: string): Promise<{ ok: boolean }> {
  const re = /['"{]/g;
  const msg = \`hola \${a > 3 ? '{' : '}'} fin\`;
  if (a) {
    for (const i of [1]) {
      while (c) {
        if (b) {
          console.log("it's");
        }
      }
    }
  }
  return Promise.resolve({ ok: a > 42 });
}
const label = (s: number) => s === 1 ? 'a' : s === 2 ? 'b' : 'c';
// TODO: remove
export const View = () => <p>Don't {count > 1 ? 's' : ''}</p>;
const user = data?.user ?? null;
`;

const rulesAt = (findings) => findings.map((f) => `${f.line}:${f.rule}`).sort();

test('detect-smells: --help exits 0', () => {
  const result = runScript(DETECT_SMELLS, ['--help'], process.cwd());
  assert.equal(result.code, 0);
  assert.match(result.stdout, /long-function/);
});

test('detect-smells: missing path exits 2', (t) => {
  const result = runScript(DETECT_SMELLS, ['nope'], makeTempDir(t));
  assert.equal(result.code, 2);
});

test('detect-smells: reports each rule on a smelly file', (t) => {
  const cwd = makeTempDir(t);
  writeFiles(cwd, { 'src/smelly.tsx': SMELLY });
  const result = json(runScript(DETECT_SMELLS, ['--json', '--max-lines', '5'], cwd));
  assert.equal(result.scanned, 1);
  assert.deepEqual(rulesAt(result.findings), [
    '15:magic-number',
    '17:nested-ternary',
    '18:todo-comment',
    '3:deep-nesting',
    '3:long-function',
    '3:too-many-params',
    '5:magic-number',
  ]);
  const longFn = result.findings.find((f) => f.rule === 'long-function');
  assert.equal(longFn.symbol, 'process');
  assert.equal(longFn.value, 14);
  assert.equal(result.findings.find((f) => f.rule === 'deep-nesting').value, 4);
});

test('detect-smells: clean code yields no findings and constants are not magic', (t) => {
  const cwd = makeTempDir(t);
  writeFiles(cwd, {
    'src/clean.ts': `const FREE_SHIPPING_THRESHOLD = 50;
enum Rate { Base = 499 }
export function shippingFor(subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return Rate.Base;
}
`,
  });
  const result = json(runScript(DETECT_SMELLS, ['--json'], cwd));
  assert.deepEqual(result.findings, []);
});

test('detect-smells: JSX closing tags do not hide nested ternaries', (t) => {
  const cwd = makeTempDir(t);
  writeFiles(cwd, {
    'src/list.tsx': `export const L = () => (
  <div>
    {loading ? <p>Loading</p> : items.length === 0 ? <p>Empty</p> : null}
  </div>
);
`,
  });
  const result = json(runScript(DETECT_SMELLS, ['--json'], cwd));
  assert.deepEqual(rulesAt(result.findings), ['3:nested-ternary']);
});

test('detect-smells: skips magic numbers in test files and ignores node_modules', (t) => {
  const cwd = makeTempDir(t);
  writeFiles(cwd, {
    'src/a.test.ts': 'expect(total(7, 9)).toBe(63);\n',
    'node_modules/pkg/index.js': 'function f(a, b, c, d, e) {}\n',
  });
  const result = json(runScript(DETECT_SMELLS, ['--json', '.'], cwd));
  assert.equal(result.scanned, 1);
  assert.deepEqual(result.findings, []);
});

test('detect-smells: --fail-on-findings exits 1 and thresholds are configurable', (t) => {
  const cwd = makeTempDir(t);
  writeFiles(cwd, { 'src/f.js': 'export function f(a, b, c, d) { return a; }\n' });
  assert.equal(runScript(DETECT_SMELLS, ['--fail-on-findings'], cwd).code, 1);
  assert.equal(runScript(DETECT_SMELLS, ['--fail-on-findings', '--max-params', '4'], cwd).code, 0);
});
