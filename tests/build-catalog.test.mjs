import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCatalog, renderTable, replaceBlock } from '../scripts/build-catalog.mjs';
import { findSkillFiles } from '../scripts/lib/skills.mjs';
import { rootDir, runScript } from './helpers.mjs';

test('catalog lists every published skill with its category, SKILL.md path and README.md path', () => {
  const catalog = buildCatalog();
  const skillFiles = findSkillFiles(path.join(rootDir, 'skills'));
  assert.equal(catalog.skills.length, skillFiles.length);
  for (const skill of catalog.skills) {
    assert.ok(fs.existsSync(path.join(rootDir, skill.path)), skill.path);
    assert.ok(fs.existsSync(path.join(rootDir, skill.readme)), skill.readme);
    assert.equal(skill.path, `skills/${skill.category}/${skill.name}/SKILL.md`);
    assert.equal(skill.readme, `skills/${skill.category}/${skill.name}/README.md`);
    assert.match(skill.version, /^\d+\.\d+\.\d+/);
    assert.ok(Array.isArray(skill.requires), `${skill.name}: requires must be a list`);
    for (const required of skill.requires) {
      assert.ok(catalog.skills.some((s) => s.name === required), `${skill.name} requires unknown skill '${required}'`);
    }
  }
});

test('committed catalog.json and README blocks are up to date', () => {
  const result = runScript('scripts/build-catalog.mjs', ['--check'], rootDir);
  assert.equal(result.code, 0, `${result.stdout}${result.stderr}`);
});

test('table cells escape pipes and angle brackets and link to skill README.md', () => {
  const table = renderTable({
    skills: [
      {
        name: 'x',
        path: 'skills/c/x/SKILL.md',
        readme: 'skills/c/x/README.md',
        category: 'c',
        version: '1.0.0',
        agents: ['all'],
        description: 'a | b <feature>\nnext',
      },
    ],
  });
  assert.match(table, /\*\*\[`x`\]\(skills\/c\/x\/README\.md\)\*\*/);
  assert.match(table, /a \\\| b &lt;feature&gt; next \|$/m);
  assert.match(table, /\| Todos \|/);
});

test('replaceBlock swaps only the marked region and is idempotent', () => {
  const doc = 'before\n<!-- demo:start -->\nold\n<!-- demo:end -->\nafter\n';
  const once = replaceBlock(doc, 'demo', 'new');
  assert.equal(once, 'before\n<!-- demo:start -->\nnew\n<!-- demo:end -->\nafter\n');
  assert.equal(replaceBlock(once, 'demo', 'new'), once);
  assert.throws(() => replaceBlock('no markers', 'demo', 'x'), /missing/);
});
