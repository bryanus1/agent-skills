#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const NAME_REGEX = /^[a-z0-9-]+$/;
const SEMVER_REGEX = /^\d+\.\d+\.\d+/;
const MAX_DESCRIPTION_LEN = 350;

function parseYamlFrontmatter(content, filePath) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { error: 'Missing or malformed YAML frontmatter delimiters (---).' };
  }

  const rawYaml = match[1];
  const body = match[2];
  const data = {};

  const lines = rawYaml.split(/\r?\n/);
  let currentKey = null;
  let isArray = false;
  let isMultilineString = false;
  let multilineBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    // Multiline string handler (>-, |, >)
    if (isMultilineString) {
      if (line.startsWith('  ') || line.startsWith('\t')) {
        multilineBuffer.push(trimmed);
        continue;
      } else {
        data[currentKey] = multilineBuffer.join(' ');
        isMultilineString = false;
        multilineBuffer = [];
      }
    }

    // Array item
    if (trimmed.startsWith('- ') && currentKey && isArray) {
      data[currentKey].push(trimmed.slice(2).trim().replace(/^['"]|['"]$/g, ''));
      continue;
    }

    const keyValMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (keyValMatch) {
      if (isMultilineString) {
        data[currentKey] = multilineBuffer.join(' ');
        isMultilineString = false;
        multilineBuffer = [];
      }

      currentKey = keyValMatch[1].trim();
      const value = keyValMatch[2].trim();

      if (value === '>-' || value === '>' || value === '|') {
        isMultilineString = true;
        isArray = false;
        multilineBuffer = [];
      } else if (value.startsWith('[') && value.endsWith(']')) {
        isArray = false;
        const items = value.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
        data[currentKey] = items;
      } else if (value === '') {
        isArray = true;
        data[currentKey] = [];
      } else {
        isArray = false;
        data[currentKey] = value.replace(/^['"]|['"]$/g, '');
      }
    }
  }

  if (isMultilineString && currentKey) {
    data[currentKey] = multilineBuffer.join(' ');
  }

  return { data, body };
}

function findSkillFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findSkillFiles(fullPath));
    } else if (entry.isFile() && entry.name === 'SKILL.md') {
      results.push(fullPath);
    }
  }
  return results;
}

function validateSkill(filePath) {
  const errors = [];
  const warnings = [];
  const relativePath = path.relative(rootDir, filePath);

  const content = fs.readFileSync(filePath, 'utf8');
  const { data, body, error: yamlError } = parseYamlFrontmatter(content, filePath);

  if (yamlError) {
    errors.push(yamlError);
    return { filePath, relativePath, errors, warnings };
  }

  // Check required field: name
  if (!data.name) {
    errors.push("Missing required frontmatter field: 'name'.");
  } else if (!NAME_REGEX.test(data.name)) {
    errors.push(`Invalid name '${data.name}'. Must be kebab-case (a-z, 0-9, -).`);
  } else if (data.name.length > 40) {
    errors.push(`Name '${data.name}' is too long (${data.name.length} chars, max 40).`);
  }

  // Check required field: version
  if (!data.version) {
    errors.push("Missing required frontmatter field: 'version'.");
  } else if (!SEMVER_REGEX.test(data.version)) {
    errors.push(`Invalid version '${data.version}'. Must follow SemVer (e.g., 1.0.0).`);
  }

  // Check required field: description
  if (!data.description) {
    errors.push("Missing required frontmatter field: 'description'.");
  } else {
    if (data.description.length > MAX_DESCRIPTION_LEN) {
      warnings.push(`Description length (${data.description.length} chars) exceeds recommended progressive disclosure limit (${MAX_DESCRIPTION_LEN} chars).`);
    }
  }

  // Check triggers
  if (!data.triggers || !Array.isArray(data.triggers) || data.triggers.length < 2) {
    errors.push("Field 'triggers' must be a list with at least 2 trigger terms or phrases.");
  }

  // Check body structure
  if (!body || body.trim().length === 0) {
    errors.push("Skill content body is empty.");
  } else {
    if (!body.includes('# ')) {
      warnings.push("Skill body should include a top-level H1 title (# Title).");
    }
  }

  return { filePath, relativePath, name: data.name, version: data.version, errors, warnings };
}

function main() {
  console.log('🔍 Validating skills across repository...\n');

  const targetArg = process.argv[2];
  let skillFiles = [];

  if (targetArg) {
    const fullTarget = path.resolve(rootDir, targetArg);
    if (fs.existsSync(fullTarget)) {
      if (fs.statSync(fullTarget).isDirectory()) {
        skillFiles = findSkillFiles(fullTarget);
      } else if (fullTarget.endsWith('SKILL.md')) {
        skillFiles = [fullTarget];
      }
    } else {
      console.error(`❌ Path not found: ${targetArg}`);
      process.exit(1);
    }
  } else {
    const skillsDir = path.join(rootDir, 'skills');
    const templatesDir = path.join(rootDir, 'templates');
    skillFiles = [...findSkillFiles(skillsDir), ...findSkillFiles(templatesDir)];
  }

  if (skillFiles.length === 0) {
    console.log('⚠️ No SKILL.md files found to validate.');
    process.exit(0);
  }

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const file of skillFiles) {
    const result = validateSkill(file);
    const hasIssues = result.errors.length > 0 || result.warnings.length > 0;

    if (result.errors.length > 0) {
      console.log(`❌ \x1b[31mFAIL\x1b[0m: ${result.relativePath} (${result.name || 'unnamed'}@${result.version || 'unknown'})`);
      for (const err of result.errors) {
        console.log(`   ⛔ ${err}`);
      }
      totalErrors += result.errors.length;
    } else if (result.warnings.length > 0) {
      console.log(`⚠️  \x1b[33mWARN\x1b[0m: ${result.relativePath} (${result.name}@${result.version})`);
      for (const warn of result.warnings) {
        console.log(`   🔸 ${warn}`);
      }
      totalWarnings += result.warnings.length;
    } else {
      console.log(`✔  \x1b[32mPASS\x1b[0m: ${result.relativePath} (${result.name}@${result.version})`);
    }
  }

  console.log('\n----------------------------------------');
  console.log(`📊 Summary: ${skillFiles.length} skills checked, ${totalErrors} errors, ${totalWarnings} warnings.`);

  if (totalErrors > 0) {
    console.log('❌ Validation failed with errors.\n');
    process.exit(1);
  } else {
    console.log('✨ All skills passed validation successfully!\n');
    process.exit(0);
  }
}

main();
