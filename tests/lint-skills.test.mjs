import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { lintSkills, validateSkill } from '../scripts/lint-skills.mjs';
import { findSkillFiles, loadSkill } from '../scripts/lib/skills.mjs';
import { rootDir, makeTempDir, runScript, writeFiles } from './helpers.mjs';

const VALID_BODY = `
# Demo Skill

## 🎯 Propósito
Demo.

## ⚡ Cuándo Activar esta Skill
- Always.

## 📋 Flujo de Trabajo Paso a Paso
1. Read [the guide](references/guide.md).

## ⚠️ Reglas Críticas
- None.
`;

function frontmatter(overrides = {}) {
  const fields = {
    name: 'demo-skill',
    version: '1.0.0',
    description: 'Demo skill used by the linter tests.',
    agents: '[claude-code, cursor]',
    triggers: '\n  - demo one\n  - demo two',
    ...overrides,
  };
  const lines = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${value}`);
  return `---\n${lines.join('\n')}\n---\n`;
}

/** Writes a skill under <tmp>/<folder>/ and returns its validation result. */
function lintTempSkill(t, { folder = 'demo-skill', head = frontmatter(), body = VALID_BODY, extraFiles = {} } = {}) {
  const dir = makeTempDir(t);
  writeFiles(dir, {
    [`${folder}/SKILL.md`]: head + body,
    [`${folder}/references/guide.md`]: '# Guide\n',
    ...Object.fromEntries(Object.entries(extraFiles).map(([p, c]) => [`${folder}/${p}`, c])),
  });
  return validateSkill(loadSkill(path.join(dir, folder, 'SKILL.md')));
}

test('a well-formed skill has no errors or warnings', (t) => {
  assert.deepEqual(lintTempSkill(t), { errors: [], warnings: [] });
});

test('every skill and template in the repo passes in strict mode', () => {
  const files = [...findSkillFiles(path.join(rootDir, 'skills')), ...findSkillFiles(path.join(rootDir, 'templates'))];
  assert.ok(files.length > 0);
  for (const { skill, errors, warnings } of lintSkills(files)) {
    assert.deepEqual({ errors, warnings }, { errors: [], warnings: [] }, skill.relativePath);
  }
});

test('reports invalid YAML', (t) => {
  const { errors } = lintTempSkill(t, { head: '---\nname: [unclosed\n---\n' });
  assert.match(errors[0], /Invalid YAML frontmatter/);
});

test('reports missing frontmatter delimiters', (t) => {
  const { errors } = lintTempSkill(t, { head: '' });
  assert.match(errors[0], /frontmatter delimiters/);
});

const errorCases = [
  ['name not matching its folder', { folder: 'other-folder' }, /must match its directory name/],
  ['non kebab-case name', { folder: 'Demo_Skill', head: frontmatter({ name: 'Demo_Skill' }) }, /Must be kebab-case/],
  ['name over 40 chars', { folder: 'a'.repeat(41), head: frontmatter({ name: 'a'.repeat(41) }) }, /too long/],
  ['non-SemVer version', { head: frontmatter({ version: 'v1' }) }, /Must follow SemVer/],
  ['missing description', { head: frontmatter({ description: undefined }) }, /'description'/],
  ['a single trigger', { head: frontmatter({ triggers: '\n  - only one' }) }, /at least 2 trigger/],
  ['unknown agent', { head: frontmatter({ agents: '[claude-code, gemini]' }) }, /Unknown agent\(s\) 'gemini'/],
  ['broken relative link', { body: `${VALID_BODY}\nSee [missing](references/missing.md).\n` }, /Broken link 'references\/missing.md'/],
  ['file:// link', { body: `${VALID_BODY}\nSee [abs](file:///tmp/guide.md).\n` }, /is absolute/],
  ['machine-specific path in a script', { extraFiles: { 'scripts/run.sh': 'cd /Users/someone/project\n' } }, /absolute path at scripts\/run\.sh:1/],
  ['empty body', { body: '\n' }, /body is empty/],
];

for (const [label, options, pattern] of errorCases) {
  test(`reports an error for ${label}`, (t) => {
    const { errors } = lintTempSkill(t, options);
    assert.ok(errors.some((e) => pattern.test(e)), `expected ${pattern} in:\n${errors.join('\n')}`);
  });
}

test('ignores links inside code, URLs and <skill-dir> placeholders', (t) => {
  const body = `${VALID_BODY}
\`[not a link](missing.md)\`
[web](https://example.com) [anchor](#top) [placeholder](<skill-dir>/scripts/x.mjs)
\`\`\`md
[also not a link](missing.md)
\`\`\`
`;
  assert.deepEqual(lintTempSkill(t, { body }).errors, []);
});

test('warns about long descriptions, missing H1 and missing sections', (t) => {
  const { errors, warnings } = lintTempSkill(t, {
    head: frontmatter({ description: 'x'.repeat(351) }),
    body: '\n## 🎯 Purpose\nOnly one section.\n',
  });
  assert.deepEqual(errors, []);
  assert.ok(warnings.some((w) => /exceeds/.test(w)));
  assert.ok(warnings.some((w) => /H1/.test(w)));
  for (const section of ['When to Trigger', 'Workflow', 'Critical Rules']) {
    assert.ok(warnings.some((w) => w.includes(section)), `missing warning for ${section}`);
  }
});

test('reports duplicate names across skills', (t) => {
  const dir = makeTempDir(t);
  writeFiles(dir, {
    'a/demo-skill/SKILL.md': frontmatter() + VALID_BODY,
    'a/demo-skill/references/guide.md': '# Guide\n',
    'b/demo-skill/SKILL.md': frontmatter() + VALID_BODY,
    'b/demo-skill/references/guide.md': '# Guide\n',
  });
  const results = lintSkills(findSkillFiles(dir));
  assert.equal(results.length, 2);
  for (const { errors } of results) {
    assert.ok(errors.some((e) => /Duplicate skill name 'demo-skill'/.test(e)), errors.join('\n'));
  }
});

test('requirements.skills must reference skills that exist in the catalog', (t) => {
  const dir = makeTempDir(t);
  const needsOthers = frontmatter({ name: 'consumer', requirements: '\n  skills: [provider, missing-skill]' });
  writeFiles(dir, {
    'consumer/SKILL.md': needsOthers + VALID_BODY,
    'consumer/references/guide.md': '# Guide\n',
    'provider/SKILL.md': frontmatter({ name: 'provider' }) + VALID_BODY,
    'provider/references/guide.md': '# Guide\n',
  });
  const results = Object.fromEntries(lintSkills(findSkillFiles(dir)).map((r) => [r.skill.data.name, r.errors]));
  assert.deepEqual(results.provider, []);
  assert.deepEqual(results.consumer, ["Required skill 'missing-skill' (requirements.skills) does not exist in the catalog."]);
});

test('requirements.skills must be a list of names', (t) => {
  const { errors } = lintTempSkill(t, { head: frontmatter({ requirements: '\n  skills: nestjs-architecture' }) });
  assert.ok(errors.some((e) => /must be a list of skill names/.test(e)), errors.join('\n'));
});

test('skill discovery skips *-workspace and dot directories', (t) => {
  const dir = makeTempDir(t);
  writeFiles(dir, {
    'real/SKILL.md': 'x',
    'real-workspace/copy/SKILL.md': 'x',
    '.hidden/SKILL.md': 'x',
  });
  assert.deepEqual(findSkillFiles(dir).map((f) => path.relative(dir, f)), [path.join('real', 'SKILL.md')]);
});

test('CLI: --strict turns warnings into a failure', (t) => {
  const dir = makeTempDir(t);
  writeFiles(dir, {
    'demo-skill/SKILL.md': frontmatter() + '\n# Demo\n\n## Propósito\nOnly this.\n',
  });
  const target = path.join(dir, 'demo-skill');
  assert.equal(runScript('scripts/lint-skills.mjs', [target], rootDir).code, 0);
  assert.equal(runScript('scripts/lint-skills.mjs', ['--strict', target], rootDir).code, 1);
});
