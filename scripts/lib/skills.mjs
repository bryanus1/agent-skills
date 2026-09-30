import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

export const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const NAME_REGEX = /^[a-z0-9-]+$/;
export const SEMVER_REGEX = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
export const MAX_NAME_LEN = 40;
export const MAX_DESCRIPTION_LEN = 350;
export const ALLOWED_AGENTS = ['antigravity', 'claude-code', 'codex', 'cursor', 'windsurf', 'all'];

// Sections required by docs/SPECIFICATION.md, matched in Spanish or English.
export const REQUIRED_SECTIONS = [
  { label: 'Propósito / Purpose', pattern: /prop[oó]sito|purpose/i },
  { label: 'Cuándo Activar / When to Trigger', pattern: /cu[aá]ndo activar|when to (trigger|activate)/i },
  { label: 'Flujo de Trabajo / Workflow', pattern: /flujo de trabajo|workflow/i },
  { label: 'Reglas Críticas / Critical Rules', pattern: /reglas (cr[ií]ticas|y consideraciones)|critical rules/i },
];

// Directories that never contain publishable skills.
const IGNORED_DIRS = new Set(['node_modules', '.git']);
const isIgnoredDir = (name) => IGNORED_DIRS.has(name) || name.startsWith('.') || name.endsWith('-workspace');

export function findSkillFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!isIgnoredDir(entry.name)) results = results.concat(findSkillFiles(fullPath));
    } else if (entry.isFile() && entry.name === 'SKILL.md') {
      results.push(fullPath);
    }
  }
  return results.sort();
}

export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { error: 'Missing or malformed YAML frontmatter delimiters (---).' };
  }
  try {
    const data = parseYaml(match[1]);
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      return { error: 'Frontmatter must be a YAML mapping (key: value).' };
    }
    return { data, body: match[2] };
  } catch (err) {
    return { error: `Invalid YAML frontmatter: ${err.message.split('\n')[0]}` };
  }
}

/** Reads a SKILL.md and returns its parsed metadata plus location info. */
export function loadSkill(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = parseFrontmatter(content);
  const skillDir = path.dirname(filePath);
  return {
    filePath,
    skillDir,
    relativePath: path.relative(rootDir, filePath),
    isTemplate: path.relative(rootDir, filePath).startsWith(`templates${path.sep}`),
    content,
    ...parsed,
  };
}
