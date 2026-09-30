import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { rootDir, makeTempDir, writeFiles } from './helpers.mjs';

const SCRIPTS = path.join(rootDir, 'skills/github/gh-cli/scripts');

// Fake `gh`: records every call (calls separated by \x1e, args by \x1f, so
// multi-line arguments survive) and answers from GH_STUB_* environment variables.
const GH_STUB = `#!/usr/bin/env bash
printf '%s\\x1f' "$@" >> "$GH_STUB_LOG"; printf '\\x1e' >> "$GH_STUB_LOG"
case "$1 $2" in
  "pr view") [ -n "\${GH_STUB_OPEN_PR:-}" ] && { echo "$GH_STUB_OPEN_PR"; exit 0; }; exit 1 ;;
  "label list") printf '%s\\n' "\${GH_STUB_LABELS:-}" ;;
  "pr create") echo "https://github.com/acme/app/pull/7" ;;
  "pr checks") echo "lint  fail  1m" ;;
  "run list") if [[ " $* " == *" --status "* ]]; then echo "\${GH_STUB_RUN_ID:-}"; else echo "recent runs"; fi ;;
  "run view") if [[ " $* " == *" --log-failed "* ]]; then printf 'lint\\tRun eslint\\tlint error A\\nlint\\tRun eslint\\tlint error B\\ntest\\tRun jest\\ttest error C\\n'; else echo "run summary"; fi ;;
  "release view") exit "\${GH_STUB_RELEASE_EXISTS:-1}" ;;
  "release create") echo "created" ;;
esac
exit 0
`;

function git(cwd, ...args) {
  const result = spawnSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...args], { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

/** Repo with an `origin` remote (local bare repo) and a feature branch with one commit. */
function setup(t, branch = 'feat/42-login-form') {
  const root = makeTempDir(t);
  const cwd = path.join(root, 'repo');
  const bin = path.join(root, 'bin');
  const remote = path.join(root, 'remote.git');
  fs.mkdirSync(cwd);
  writeFiles(bin, { gh: GH_STUB });
  fs.chmodSync(path.join(bin, 'gh'), 0o755);

  git(root, 'init', '-q', '--bare', '-b', 'main', remote);
  git(cwd, 'init', '-q', '-b', 'main');
  git(cwd, 'commit', '-q', '--allow-empty', '-m', 'init');
  git(cwd, 'remote', 'add', 'origin', remote);
  git(cwd, 'push', '-q', '-u', 'origin', 'main');
  git(cwd, 'checkout', '-q', '-b', branch);
  git(cwd, 'commit', '-q', '--allow-empty', '-m', 'feat: add login form');

  const log = path.join(root, 'gh.log');
  const run = (script, args = [], env = {}) => {
    const result = spawnSync('bash', [path.join(SCRIPTS, script), ...args], {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}`, GH_STUB_LOG: log, ...env },
    });
    return { code: result.status, stdout: result.stdout, stderr: result.stderr };
  };
  const calls = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\x1e').filter(Boolean).map((l) => l.split('\x1f').filter(Boolean)) : []);
  return { cwd, run, calls };
}

const findCall = (calls, a, b) => calls.find((c) => c[0] === a && c[1] === b);

test('every script supports --help with exit 0', (t) => {
  const { run } = setup(t);
  for (const script of ['check_env.sh', 'create_pr.sh', 'diagnose_run.sh', 'release_helper.sh']) {
    assert.equal(run(script, ['--help']).code, 0, script);
  }
});

test('create_pr --dry-run: issue scope, type label, Closes line, no GitHub calls', (t) => {
  const { run, calls } = setup(t);
  const result = run('create_pr.sh', ['--dry-run']);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /Title: +feat\(#42\): ✨ login form/);
  assert.match(result.stdout, /Labels: +enhancement/);
  assert.match(result.stdout, /Closes\\? #42/);
  assert.match(result.stdout, /Upstream: +no/);
  assert.deepEqual(calls(), []);
});

test('create_pr --dry-run: no scope and no type label for chore branches', (t) => {
  const { run } = setup(t, 'chore/upgrade-zod');
  const result = run('create_pr.sh', ['--dry-run']);
  assert.match(result.stdout, /Title: +chore: 🔧 upgrade zod/);
  assert.match(result.stdout, /Labels: +none/);
  assert.doesNotMatch(result.stdout, /Closes/);
});

test('create_pr validates domains against .gh-domains', (t) => {
  const { cwd, run } = setup(t);
  fs.writeFileSync(path.join(cwd, '.gh-domains'), '# domains\nauth\nbilling # payments\n');
  assert.match(run('create_pr.sh', ['--domain', 'auth', '--dry-run']).stdout, /Labels: +enhancement, domain: auth/);
  const rejected = run('create_pr.sh', ['--domain', 'payments', '--dry-run']);
  assert.equal(rejected.code, 1);
  assert.match(rejected.stderr, /Allowed domains: auth, billing/);
  assert.equal(run('create_pr.sh', ['--domain', 'Auth_Team', '--dry-run']).code, 1);
});

test('create_pr appends the repository PR template', (t) => {
  const { cwd, run } = setup(t);
  writeFiles(cwd, { '.github/pull_request_template.md': '## Checklist\n- [ ] Screenshots\n' });
  const result = run('create_pr.sh', ['--dry-run']);
  assert.match(result.stdout, /Template: +\.github\/pull_request_template\.md/);
  assert.match(result.stdout, /Screenshots/);
});

test('create_pr refuses to run on the base branch or without commits', (t) => {
  const { cwd, run } = setup(t);
  assert.equal(run('create_pr.sh', ['--dry-run', '--base', 'feat/42-login-form']).code, 1);
  git(cwd, 'checkout', '-q', '-b', 'feat/empty', 'main');
  const empty = run('create_pr.sh', ['--dry-run']);
  assert.equal(empty.code, 1);
  assert.match(empty.stderr, /No commits/);
});

test('create_pr aborts when a label does not exist, before pushing or creating', (t) => {
  const { run, calls } = setup(t);
  const result = run('create_pr.sh', ['--domain', 'auth', '--push'], { GH_STUB_LABELS: 'enhancement\nbug' });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /do not exist in the repository: domain: auth/);
  assert.equal(findCall(calls(), 'pr', 'create'), undefined);
});

test('create_pr aborts when an open PR already exists for the branch', (t) => {
  const { run, calls } = setup(t);
  const result = run('create_pr.sh', ['--push'], { GH_STUB_OPEN_PR: 'https://github.com/acme/app/pull/3' });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /already exists.*pull\/3/);
  assert.equal(findCall(calls(), 'pr', 'create'), undefined);
});

test('create_pr requires --push when the branch has no upstream', (t) => {
  const { run, calls } = setup(t);
  const result = run('create_pr.sh', [], { GH_STUB_LABELS: 'enhancement' });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /no upstream/);
  assert.equal(findCall(calls(), 'pr', 'create'), undefined);
});

test('create_pr --push publishes the branch and calls gh pr create with all flags', (t) => {
  const { cwd, run, calls } = setup(t);
  const result = run('create_pr.sh', ['--domain', 'auth', '--reviewer', 'octocat', '--assign-me', '--draft', '--push'], {
    GH_STUB_LABELS: 'enhancement\ndomain: auth\nbug',
  });
  assert.equal(result.code, 0, result.stderr);
  assert.match(git(cwd, 'rev-parse', '--abbrev-ref', '@{u}'), /origin\/feat\/42-login-form/);

  const create = findCall(calls(), 'pr', 'create');
  assert.ok(create, 'gh pr create was not called');
  const value = (flag) => create[create.indexOf(flag) + 1];
  assert.equal(value('--base'), 'main');
  assert.equal(value('--head'), 'feat/42-login-form');
  assert.equal(value('--title'), 'feat(#42): ✨ login form');
  assert.match(value('--body'), /Closes #42/);
  assert.match(value('--body'), /- feat: add login form/);
  assert.deepEqual(create.filter((_, i) => create[i - 1] === '--label'), ['enhancement', 'domain: auth']);
  assert.equal(value('--reviewer'), 'octocat');
  assert.equal(value('--assignee'), '@me');
  assert.ok(create.includes('--draft'));
});

test('diagnose_run: picks the latest failed run and filters logs by job', (t) => {
  const { run, calls } = setup(t);
  const result = run('diagnose_run.sh', ['--job', 'lint'], { GH_STUB_RUN_ID: '9001' });
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /lint error A/);
  assert.match(result.stdout, /lint error B/);
  assert.doesNotMatch(result.stdout, /test error C/);
  const list = findCall(calls(), 'run', 'list');
  assert.equal(list[list.indexOf('--branch') + 1], 'feat/42-login-form');
  assert.ok(calls().some((c) => c[1] === 'view' && c.includes('9001') && c.includes('--log-failed')));
});

test('diagnose_run: reports success when there are no failed runs', (t) => {
  const { run } = setup(t);
  const result = run('diagnose_run.sh', [], { GH_STUB_RUN_ID: '' });
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /No failed workflow runs/);
});

test('diagnose_run: --pr shows the PR checks first', (t) => {
  const { run } = setup(t);
  const result = run('diagnose_run.sh', ['--pr', '#57', '--branch', 'feat/42-login-form'], { GH_STUB_RUN_ID: '1' });
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /Checks for PR #57/);
  assert.match(result.stdout, /lint +fail/);
});

test('release_helper create: validates SemVer, supports --dry-run and refuses duplicates', (t) => {
  const { run, calls } = setup(t);
  assert.equal(run('release_helper.sh', ['create', 'latest']).code, 1);

  const dry = run('release_helper.sh', ['create', 'v1.4.0', '--draft', '--dry-run']);
  assert.equal(dry.code, 0, dry.stderr);
  assert.match(dry.stdout, /gh release create v1\.4\.0 --generate-notes --title v1\.4\.0 --draft/);
  assert.deepEqual(calls(), []);

  const duplicate = run('release_helper.sh', ['create', 'v1.4.0'], { GH_STUB_RELEASE_EXISTS: '0' });
  assert.equal(duplicate.code, 1);
  assert.match(duplicate.stderr, /already exists/);

  const created = run('release_helper.sh', ['create', 'v1.4.0', '--target', 'main']);
  assert.equal(created.code, 0, created.stderr);
  const create = findCall(calls(), 'release', 'create');
  assert.deepEqual(create, ['release', 'create', 'v1.4.0', '--generate-notes', '--title', 'v1.4.0', '--target', 'main']);
});
