#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { rootDir, ALLOWED_AGENTS, findSkillFiles, loadSkill } from './lib/skills.mjs';

const CATALOG_PATH = path.join(rootDir, 'catalog', 'catalog.json');
const README_PATH = path.join(rootDir, 'README.md');
const REPO_SLUG = 'bryanus1/agent-skills';
const ALL_AGENTS = ALLOWED_AGENTS.filter((agent) => agent !== 'all');

const toPosix = (p) => p.split(path.sep).join('/');

/** Builds catalog entries for every published skill under skills/. */
export function buildCatalog() {
  const skills = findSkillFiles(path.join(rootDir, 'skills')).map(loadSkill);
  const broken = skills.filter((skill) => skill.error);
  if (broken.length > 0) {
    throw new Error(`Cannot build catalog, invalid frontmatter in: ${broken.map((s) => s.relativePath).join(', ')}`);
  }

  return {
    repository: REPO_SLUG,
    skills: skills.map(({ data, skillDir, relativePath }) => {
      const segments = toPosix(path.relative(path.join(rootDir, 'skills'), skillDir)).split('/');
      return {
        name: data.name,
        version: String(data.version),
        description: data.description.trim(),
        category: segments.length > 1 ? segments[0] : null,
        path: toPosix(relativePath),
        tags: data.tags ?? [],
        agents: data.agents ?? [],
        triggers: data.triggers ?? [],
      };
    }),
  };
}

function formatAgents(agents) {
  if (agents.includes('all') || ALL_AGENTS.every((agent) => agents.includes(agent))) return 'Todos';
  return agents.length > 0 ? agents.join(', ') : '—';
}

const escapeCell = (text) =>
  text.replace(/\|/g, '\\|').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\s+/g, ' ');

export function renderTable(catalog) {
  const rows = catalog.skills.map((skill) =>
    `| **[\`${skill.name}\`](${skill.path})** | ${skill.category ? `\`${skill.category}\`` : '—'} | \`${skill.version}\` | ${formatAgents(skill.agents)} | ${escapeCell(skill.description)} |`,
  );
  return ['| Skill | Categoría | Versión | Agentes | Descripción |', '| :--- | :--- | :--- | :--- | :--- |', ...rows].join('\n');
}

export function renderInstallList(catalog) {
  const commands = catalog.skills.map((skill) => `npx skills add ${REPO_SLUG} --skill ${skill.name}`);
  return ['```bash', ...commands, '```'].join('\n');
}

export function replaceBlock(content, marker, replacement) {
  const start = `<!-- ${marker}:start -->`;
  const end = `<!-- ${marker}:end -->`;
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!pattern.test(content)) {
    throw new Error(`README.md is missing the '${start}' / '${end}' markers.`);
  }
  return content.replace(pattern, () => `${start}\n${replacement}\n${end}`);
}

function main() {
  const check = process.argv.includes('--check');
  const catalog = buildCatalog();

  const catalogJson = `${JSON.stringify(catalog, null, 2)}\n`;
  let readme = fs.readFileSync(README_PATH, 'utf8');
  readme = replaceBlock(readme, 'catalog-table', renderTable(catalog));
  readme = replaceBlock(readme, 'catalog-install', renderInstallList(catalog));

  const outputs = [
    [CATALOG_PATH, catalogJson],
    [README_PATH, readme],
  ];

  if (check) {
    const stale = outputs.filter(([file, content]) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content);
    if (stale.length > 0) {
      console.error(`❌ Out of date: ${stale.map(([file]) => path.relative(rootDir, file)).join(', ')}`);
      console.error('   Run `pnpm catalog` and commit the result.');
      process.exit(1);
    }
    console.log(`✔ Catalog and README are up to date (${catalog.skills.length} skills).`);
    return;
  }

  fs.mkdirSync(path.dirname(CATALOG_PATH), { recursive: true });
  for (const [file, content] of outputs) {
    fs.writeFileSync(file, content, 'utf8');
  }
  console.log(`✔ Wrote catalog/catalog.json and README.md (${catalog.skills.length} skills).`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
