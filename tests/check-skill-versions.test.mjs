import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { checkSkillVersions, compareSemver } from '../scripts/check-skill-versions.mjs';
import { makeTempDir, writeFiles } from './helpers.mjs';

const skill = (name, version) => `---\nname: ${name}\nversion: ${version}\n---\n# ${name}\n`;

function git(cwd, ...args) {
  const result = spawnSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...args], { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}

function commitAll(cwd, message) {
  git(cwd, 'add', '-A');
  git(cwd, 'commit', '-q', '-m', message);
}

/** Repo with two skills on main and a checked-out feature branch. */
function makeRepo(t) {
  const cwd = makeTempDir(t);
  git(cwd, 'init', '-q', '-b', 'main');
  writeFiles(cwd, {
    'skills/cat/alpha/SKILL.md': skill('alpha', '1.0.0'),
    'skills/cat/alpha/scripts/run.mjs': 'console.log(1);\n',
    'skills/cat/alpha/evals/evals.json': '{}\n',
    'skills/beta/SKILL.md': skill('beta', '2.3.4'),
  });
  commitAll(cwd, 'init');
  git(cwd, 'checkout', '-q', '-b', 'feature');
  return cwd;
}

const byPath = (results) => Object.fromEntries(results.map((r) => [r.skillPath, r]));

test('compareSemver orders versions numerically', () => {
  assert.equal(compareSemver('1.10.0', '1.9.9'), 1);
  assert.equal(compareSemver('1.0.0', '1.0.0'), 0);
  assert.equal(compareSemver('1.0.0-beta.1', '1.0.1'), -1);
});

test('no changes means nothing to check', (t) => {
  const cwd = makeRepo(t);
  assert.deepEqual(checkSkillVersions(cwd, 'main'), []);
});

test('fails when a skill script changes without a version bump', (t) => {
  const cwd = makeRepo(t);
  writeFiles(cwd, { 'skills/cat/alpha/scripts/run.mjs': 'console.log(2);\n' });
  commitAll(cwd, 'change alpha');
  const { 'skills/cat/alpha/SKILL.md': alpha } = byPath(checkSkillVersions(cwd, 'main'));
  assert.equal(alpha.ok, false);
  assert.match(alpha.reason, /without a version bump/);
});

test('passes when the version is bumped, even for a skill directly under skills/', (t) => {
  const cwd = makeRepo(t);
  writeFiles(cwd, {
    'skills/cat/alpha/scripts/run.mjs': 'console.log(2);\n',
    'skills/cat/alpha/SKILL.md': skill('alpha', '1.1.0'),
    'skills/beta/SKILL.md': `${skill('beta', '2.3.5')}\nMore docs.\n`,
  });
  commitAll(cwd, 'bump');
  const results = byPath(checkSkillVersions(cwd, 'main'));
  assert.equal(results['skills/cat/alpha/SKILL.md'].ok, true);
  assert.equal(results['skills/beta/SKILL.md'].ok, true);
});

test('a lower version is rejected', (t) => {
  const cwd = makeRepo(t);
  writeFiles(cwd, { 'skills/beta/SKILL.md': skill('beta', '2.3.3') });
  commitAll(cwd, 'downgrade');
  assert.equal(byPath(checkSkillVersions(cwd, 'main'))['skills/beta/SKILL.md'].ok, false);
});

test('evals-only changes and new skills do not need a bump', (t) => {
  const cwd = makeRepo(t);
  writeFiles(cwd, {
    'skills/cat/alpha/evals/evals.json': '{"evals": []}\n',
    'skills/cat/gamma/SKILL.md': skill('gamma', '0.1.0'),
  });
  commitAll(cwd, 'evals and new skill');
  const results = byPath(checkSkillVersions(cwd, 'main'));
  assert.deepEqual(
    [results['skills/cat/alpha/SKILL.md'].reason, results['skills/cat/gamma/SKILL.md'].reason],
    ['evals-only change', 'new skill'],
  );
  assert.ok(Object.values(results).every((r) => r.ok));
});
