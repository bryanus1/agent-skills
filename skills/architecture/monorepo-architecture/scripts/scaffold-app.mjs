#!/usr/bin/env node
// scaffold-app.mjs — Wires or scaffolds an app/service of any supported preset
// inside an existing pnpm + Turborepo monorepo.

import fs from 'node:fs';
import path from 'node:path';
import { PRESET_IDS, getPreset } from './lib/presets.mjs';
import { KEBAB_REGEX, applyFiles, detectScope, fail, parseArgs } from './lib/scaffold.mjs';
import { LINTER_MODES, appWiringFiles } from './lib/templates.mjs';

function printHelp() {
  console.log(`
Usage: node scaffold-app.mjs <name> --type <preset> [options]

Arguments:
  name                Workspace folder/app name in kebab-case (e.g. web, mobile, landing, billing-worker)

Options:
  --type <preset>     App/repo archetype: ${PRESET_IDS.join(' | ')}
  --dir <path>        Target directory relative to root (default: apps/<name>, or services/<name> for polyglot)
  --scope <scope>     npm scope (default: detected from root package.json)
  --linter <mode>     oxc | eslint | both (default: auto-detected from packages/oxc-config or eslint-config)
  --dry-run           List the files that would be generated without writing anything
  --force             Overwrite generated files that already exist (default: abort on conflict)
  --help, -h          Show this help message

Run it from the monorepo root (the folder with pnpm-workspace.yaml).
`);
}

function detectLinter(root) {
  const hasOxc = fs.existsSync(path.join(root, 'packages', 'oxc-config', 'package.json'));
  const hasEslint = fs.existsSync(path.join(root, 'packages', 'eslint-config', 'package.json'));
  if (hasOxc && hasEslint) return 'both';
  if (hasEslint && !hasOxc) return 'eslint';
  return 'oxc';
}

function detectContractDep(root, scope, preset) {
  if (preset.id === 'polyglot') return null;
  if (fs.existsSync(path.join(root, 'packages', 'contracts', 'package.json'))) return `@${scope}/contracts`;
  if (preset.platform !== 'node' && fs.existsSync(path.join(root, 'packages', 'api-client', 'package.json'))) {
    return `@${scope}/api-client`;
  }
  return null;
}

function ensureServicesWorkspace(root, relDir) {
  if (!relDir.startsWith('services/')) return [];
  const wsPath = path.join(root, 'pnpm-workspace.yaml');
  const current = fs.readFileSync(wsPath, 'utf8');
  if (/["']?services\/\*["']?/.test(current)) return [];
  const next = `${current.trimEnd()}\n  - "services/*"\n`;
  return [{ path: wsPath, content: next, update: true }];
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    process.exit(argv.length === 0 ? 1 : 0);
  }
  const { positional, flags } = parseArgs(argv, {
    booleans: ['--dry-run', '--force'],
    strings: ['--type', '--dir', '--scope', '--linter'],
  });

  const [name] = positional;
  if (!name || !KEBAB_REGEX.test(name)) fail(`App name '${name ?? ''}' must be kebab-case.`);

  const preset = getPreset(flags.type);
  if (!preset) fail(`--type is required and must be one of: ${PRESET_IDS.join(', ')}.`);

  const root = process.cwd();
  if (!fs.existsSync(path.join(root, 'pnpm-workspace.yaml'))) fail('pnpm-workspace.yaml not found. Run from the monorepo root.');

  const scope = flags.scope?.replace(/^@/, '') ?? detectScope(root);
  if (!scope) fail('Could not detect the scope from package.json. Pass --scope <scope>.');

  const linter = flags.linter ?? detectLinter(root);
  if (!LINTER_MODES.includes(linter)) fail(`Unknown --linter '${linter}'. Use one of: ${LINTER_MODES.join(', ')}.`);

  const defaultDir = preset.id === 'polyglot' ? `services/${name}` : `apps/${name}`;
  const relDir = (flags.dir ?? defaultDir).replace(/\\/g, '/').replace(/\/+$/, '');
  const contractDep = detectContractDep(root, scope, preset);

  const files = [
    ...ensureServicesWorkspace(root, relDir),
    ...appWiringFiles({ root, scope, name, relDir, preset, contractDep, linter }),
  ];

  console.log(`🧩 Wiring ${preset.label} '${name}' (${relDir}, platform: ${preset.platform})`);
  if (flags['dry-run']) console.log('🔎 Mode: [DRY RUN - No files will be written]');
  console.log('');

  applyFiles(files, { dryRun: flags['dry-run'], force: flags.force, cwd: root });

  if (flags['dry-run']) {
    console.log(`\n🔎 Dry run complete: ${files.length} files would be written/updated. Nothing was changed.`);
    return;
  }

  console.log(`\n✨ Workspace '${name}' configured in ${relDir}.`);
  console.log(`\n📌 Next steps:`);
  if (preset.createCommand && !fs.existsSync(path.join(root, relDir, 'src'))) {
    console.log(`   1. If you haven't created the framework code yet (ask user before running):`);
    console.log(`      ${preset.createCommand(relDir, name)}`);
    console.log(`      (Re-run scaffold-app.mjs --force if the CLI overwrote package.json/tsconfig.json)`);
  }
  if (preset.skill) {
    console.log(`   - Follow '${preset.skill}' rules inside ${relDir}/src/.`);
  }
  console.log(`   - Run: pnpm install && pnpm turbo run typecheck --filter ${name}... && pnpm check:boundaries`);
}

main();
