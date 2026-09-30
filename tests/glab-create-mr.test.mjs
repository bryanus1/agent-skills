import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { rootDir, makeTempDir } from './helpers.mjs';

const SCRIPT = path.join(rootDir, 'skills/gitlab/glab-cli/scripts/create_mr.sh');

function git(cwd, ...args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}

/** Creates a repo with `main` and a checked-out feature branch holding one commit. */
function makeRepo(t, branch) {
  const cwd = makeTempDir(t);
  git(cwd, 'init', '-q', '-b', 'main');
  git(cwd, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-q', '--allow-empty', '-m', 'init');
  git(cwd, 'checkout', '-q', '-b', branch);
  git(cwd, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-q', '--allow-empty', '-m', 'work');
  return cwd;
}

function createMr(cwd, ...args) {
  const result = spawnSync('bash', [SCRIPT, '--dry-run', ...args], { cwd, encoding: 'utf8' });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

test('title uses the issue id as the only scope', (t) => {
  const cwd = makeRepo(t, 'feat/42-pet-registration');
  const result = createMr(cwd, '--domain', 'pets');
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /Title: +feat\(#42\): ✨ pet registration/);
  assert.match(result.stdout, /Labels: +type::feature,layer::backend,domain::pets/);
});

test('title has no scope when there is no issue', (t) => {
  const cwd = makeRepo(t, 'chore/upgrade-zod');
  const result = createMr(cwd);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /Title: +chore: 🔧 upgrade zod/);
});

test('any kebab-case domain is accepted when no domains file exists', (t) => {
  const cwd = makeRepo(t, 'feat/invoices');
  const result = createMr(cwd, '--domain', 'billing');
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /domain::billing/);
});

test('domains are validated against .glab-domains when present', (t) => {
  const cwd = makeRepo(t, 'feat/invoices');
  fs.writeFileSync(path.join(cwd, '.glab-domains'), '# Project domains\nauth\nbilling  # invoices and payments\n\n');

  assert.equal(createMr(cwd, '--domain', 'billing').code, 0);
  assert.equal(createMr(cwd, '--domain', 'domain::auth').code, 0);

  const rejected = createMr(cwd, '--domain', 'pets');
  assert.equal(rejected.code, 1);
  assert.match(rejected.stderr, /not listed/);
  assert.match(rejected.stderr, /Allowed domains: auth, billing/);
});

test('--domains-file overrides the default location', (t) => {
  const cwd = makeRepo(t, 'feat/invoices');
  fs.writeFileSync(path.join(cwd, 'domains.txt'), 'clinical\n');
  assert.equal(createMr(cwd, '--domain', 'clinical', '--domains-file', 'domains.txt').code, 0);
  assert.equal(createMr(cwd, '--domain', 'billing', '--domains-file', 'domains.txt').code, 1);
  assert.equal(createMr(cwd, '--domain', 'billing', '--domains-file', 'missing.txt').code, 1);
});

test('rejects invalid domain, layer and priority values', (t) => {
  const cwd = makeRepo(t, 'feat/invoices');
  assert.equal(createMr(cwd, '--domain', 'Billing_Team').code, 1);
  assert.equal(createMr(cwd, '--layer', 'mobile').code, 1);
  assert.equal(createMr(cwd, '--priority', 'urgent').code, 1);
});

test('an explicit --layer wins over next.config auto-detection', (t) => {
  const cwd = makeRepo(t, 'feat/invoices');
  fs.writeFileSync(path.join(cwd, 'next.config.mjs'), 'export default {};\n');
  assert.match(createMr(cwd).stdout, /layer::frontend/);
  assert.match(createMr(cwd, '--layer', 'backend').stdout, /layer::backend/);
});

test('refuses to run on the target branch and --help exits 0', (t) => {
  const cwd = makeRepo(t, 'feat/invoices');
  git(cwd, 'checkout', '-q', 'main');
  assert.equal(createMr(cwd).code, 1);
  assert.equal(spawnSync('bash', [SCRIPT, '--help'], { cwd }).status, 0);
});
