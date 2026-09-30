import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { findSkillFiles, loadSkill } from '../scripts/lib/skills.mjs';
import { rootDir } from './helpers.mjs';

const skills = findSkillFiles(path.join(rootDir, 'skills')).map(loadSkill);

for (const skill of skills) {
  test(`${skill.data.name}: evals/evals.json is present and well-formed`, () => {
    const evalsPath = path.join(skill.skillDir, 'evals', 'evals.json');
    assert.ok(fs.existsSync(evalsPath), `missing ${path.relative(rootDir, evalsPath)}`);

    const { skill_name: skillName, evals } = JSON.parse(fs.readFileSync(evalsPath, 'utf8'));
    assert.equal(skillName, skill.data.name);
    assert.ok(Array.isArray(evals) && evals.length >= 2, 'expected at least 2 evals');

    const ids = evals.map((e) => e.id);
    assert.equal(new Set(ids).size, ids.length, 'eval ids must be unique');

    for (const evalCase of evals) {
      assert.equal(typeof evalCase.prompt, 'string');
      assert.ok(evalCase.prompt.trim(), `eval ${evalCase.id}: empty prompt`);
      assert.equal(typeof evalCase.expected_output, 'string');
      assert.ok(evalCase.expected_output.trim(), `eval ${evalCase.id}: empty expected_output`);
      assert.ok(Array.isArray(evalCase.files), `eval ${evalCase.id}: files must be a list`);
      for (const file of evalCase.files) {
        assert.ok(!path.isAbsolute(file), `eval ${evalCase.id}: '${file}' must be relative to the skill`);
        assert.ok(fs.existsSync(path.join(skill.skillDir, file)), `eval ${evalCase.id}: '${file}' does not exist`);
      }
    }
  });
}
