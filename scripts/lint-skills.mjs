#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  rootDir,
  NAME_REGEX,
  SEMVER_REGEX,
  MAX_NAME_LEN,
  MAX_DESCRIPTION_LEN,
  ALLOWED_AGENTS,
  REQUIRED_SECTIONS,
  findSkillFiles,
  loadSkill,
} from './lib/skills.mjs';

const TEXT_EXTENSIONS = new Set(['.md', '.json', '.sh', '.mjs', '.js', '.py', '.yaml', '.yml', '.txt']);
const ABSOLUTE_PATH_REGEX = /file:\/\/|\/Users\/[A-Za-z]|\/home\/[a-z][\w-]*\//;
const MARKDOWN_LINK_REGEX = /\[[^\]]*\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g;

function stripCode(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
}

function listTextFiles(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) results = results.concat(listTextFiles(fullPath));
    } else if (TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
}

function checkLinks(skill, errors) {
  for (const [, rawTarget] of stripCode(skill.body).matchAll(MARKDOWN_LINK_REGEX)) {
    const target = rawTarget.trim();
    if (/^(https?:|mailto:|#)/.test(target) || target.includes('<')) continue;
    if (target.startsWith('file:') || path.isAbsolute(target)) {
      errors.push(`Link '${target}' is absolute. Use a path relative to the skill directory.`);
      continue;
    }
    const resolved = path.resolve(skill.skillDir, decodeURIComponent(target.split('#')[0]));
    if (!fs.existsSync(resolved)) {
      errors.push(`Broken link '${target}': ${path.relative(rootDir, resolved)} does not exist.`);
    }
  }
}

function checkAbsolutePaths(skill, errors) {
  for (const file of listTextFiles(skill.skillDir)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (ABSOLUTE_PATH_REGEX.test(line)) {
        const location = `${path.relative(skill.skillDir, file)}:${index + 1}`;
        errors.push(`Machine-specific absolute path at ${location}. Skills are installed elsewhere; use relative paths.`);
      }
    });
  }
}

/** Validates one loaded skill. Cross-skill checks (duplicate names) live in lintSkills. */
export function validateSkill(skill) {
  const errors = [];
  const warnings = [];

  if (skill.error) {
    errors.push(skill.error);
    return { errors, warnings };
  }

  const { data, body } = skill;
  const folderName = path.basename(skill.skillDir);

  if (typeof data.name !== 'string' || !data.name) {
    errors.push("Missing required frontmatter field: 'name'.");
  } else if (!NAME_REGEX.test(data.name)) {
    errors.push(`Invalid name '${data.name}'. Must be kebab-case (a-z, 0-9, -).`);
  } else if (data.name.length > MAX_NAME_LEN) {
    errors.push(`Name '${data.name}' is too long (${data.name.length} chars, max ${MAX_NAME_LEN}).`);
  } else if (!skill.isTemplate && data.name !== folderName) {
    errors.push(`Name '${data.name}' must match its directory name '${folderName}'.`);
  }

  if (data.version === undefined || data.version === null) {
    errors.push("Missing required frontmatter field: 'version'.");
  } else if (!SEMVER_REGEX.test(String(data.version))) {
    errors.push(`Invalid version '${data.version}'. Must follow SemVer (e.g., 1.0.0).`);
  }

  if (typeof data.description !== 'string' || !data.description.trim()) {
    errors.push("Missing required frontmatter field: 'description'.");
  } else if (data.description.trim().length > MAX_DESCRIPTION_LEN) {
    warnings.push(`Description length (${data.description.trim().length} chars) exceeds the progressive disclosure limit (${MAX_DESCRIPTION_LEN} chars).`);
  }

  const triggers = data.triggers;
  if (!Array.isArray(triggers) || triggers.filter((t) => typeof t === 'string' && t.trim()).length < 2) {
    errors.push("Field 'triggers' must be a list with at least 2 trigger terms or phrases.");
  }

  if (data.agents !== undefined) {
    if (!Array.isArray(data.agents)) {
      errors.push("Field 'agents' must be a list.");
    } else {
      const unknown = data.agents.filter((agent) => !ALLOWED_AGENTS.includes(agent));
      if (unknown.length > 0) {
        errors.push(`Unknown agent(s) ${unknown.map((a) => `'${a}'`).join(', ')}. Allowed: ${ALLOWED_AGENTS.join(', ')}.`);
      }
    }
  }

  if (data.tags !== undefined && !Array.isArray(data.tags)) {
    errors.push("Field 'tags' must be a list.");
  }

  if (!body || body.trim().length === 0) {
    errors.push('Skill content body is empty.');
  } else {
    if (!/^# /m.test(body)) {
      warnings.push('Skill body should include a top-level H1 title (# Title).');
    }
    const headings = body.split('\n').filter((line) => line.startsWith('## '));
    for (const section of REQUIRED_SECTIONS) {
      if (!headings.some((heading) => section.pattern.test(heading))) {
        warnings.push(`Missing required section: '${section.label}'.`);
      }
    }
    checkLinks(skill, errors);
  }

  checkAbsolutePaths(skill, errors);

  return { errors, warnings };
}

/** Lints a list of SKILL.md paths and returns per-file results. */
export function lintSkills(skillFiles) {
  const skills = skillFiles.map(loadSkill);
  const results = skills.map((skill) => ({ skill, ...validateSkill(skill) }));

  const byName = new Map();
  for (const result of results) {
    const name = result.skill.data?.name;
    if (typeof name !== 'string') continue;
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(result);
  }
  for (const [name, group] of byName) {
    if (group.length < 2) continue;
    for (const result of group) {
      const others = group.filter((r) => r !== result).map((r) => r.skill.relativePath);
      result.errors.push(`Duplicate skill name '${name}' (also used by ${others.join(', ')}).`);
    }
  }

  return results;
}

function main() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const targetArg = args.find((arg) => !arg.startsWith('--'));

  console.log(`🔍 Validating skills across repository...${strict ? ' (strict: warnings fail)' : ''}\n`);

  let skillFiles;
  if (targetArg) {
    const fullTarget = path.resolve(rootDir, targetArg);
    if (!fs.existsSync(fullTarget)) {
      console.error(`❌ Path not found: ${targetArg}`);
      process.exit(1);
    }
    skillFiles = fs.statSync(fullTarget).isDirectory() ? findSkillFiles(fullTarget) : [fullTarget];
  } else {
    skillFiles = [...findSkillFiles(path.join(rootDir, 'skills')), ...findSkillFiles(path.join(rootDir, 'templates'))];
  }

  if (skillFiles.length === 0) {
    console.log('⚠️ No SKILL.md files found to validate.');
    process.exit(0);
  }

  // Duplicate names are checked across the whole catalog even when linting one path.
  const allFiles = [...findSkillFiles(path.join(rootDir, 'skills')), ...findSkillFiles(path.join(rootDir, 'templates'))];
  const allResults = lintSkills([...new Set([...allFiles, ...skillFiles])]);
  const results = allResults.filter((result) => skillFiles.includes(result.skill.filePath));

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const { skill, errors, warnings } of results) {
    const label = `${skill.relativePath} (${skill.data?.name || 'unnamed'}@${skill.data?.version || 'unknown'})`;
    if (errors.length > 0) {
      console.log(`❌ \x1b[31mFAIL\x1b[0m: ${label}`);
    } else if (warnings.length > 0) {
      console.log(`⚠️  \x1b[33mWARN\x1b[0m: ${label}`);
    } else {
      console.log(`✔  \x1b[32mPASS\x1b[0m: ${label}`);
    }
    for (const err of errors) console.log(`   ⛔ ${err}`);
    for (const warn of warnings) console.log(`   🔸 ${warn}`);
    totalErrors += errors.length;
    totalWarnings += warnings.length;
  }

  console.log('\n----------------------------------------');
  console.log(`📊 Summary: ${results.length} skills checked, ${totalErrors} errors, ${totalWarnings} warnings.`);

  if (totalErrors > 0 || (strict && totalWarnings > 0)) {
    console.log('❌ Validation failed.\n');
    process.exit(1);
  }
  console.log('✨ All skills passed validation successfully!\n');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
