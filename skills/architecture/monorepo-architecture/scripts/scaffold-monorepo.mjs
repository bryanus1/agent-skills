#!/usr/bin/env node
// scaffold-monorepo.mjs — Creates the root of a pnpm + Turborepo monorepo:
// workspace config, task pipeline, shared tsconfig/oxc/eslint packages, the
// contracts package for the chosen mode and a vendored boundary checker.
// App frameworks are NOT downloaded here: the script prints exact next commands.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PRESET_IDS, resolveAppSelection } from './lib/presets.mjs';
import { KEBAB_REGEX, applyFiles, fail, json, parseArgs } from './lib/scaffold.mjs';
import {
  LINTER_MODES,
  eslintConfigPackageFiles,
  oxcConfigPackageFiles,
  packageFiles,
  tsconfigPackageFiles,
} from './lib/templates.mjs';

const CONTRACT_MODES = { zod: { name: 'contracts', kind: 'contracts' }, openapi: { name: 'api-client', kind: 'api-client' } };

function printHelp() {
  console.log(`
Usage: node scaffold-monorepo.mjs --scope <scope> --contracts <zod|openapi> [options]

Options:
  --scope <scope>          npm scope for internal packages, e.g. acme → @acme/contracts
  --contracts <mode>       How apps share contracts (see references/shared-packages-and-contracts.md):
                             zod      packages/contracts with shared Zod schemas
                             openapi  packages/api-client generated from the API's Swagger document
  --apps <list>            Comma-separated app presets (default: web,api)
                           Available: ${PRESET_IDS.join(', ')}
  --linter <mode>          oxc (default) | eslint | both
  --pnpm-version <x.y.z>   Version for the packageManager field (default: detected from pnpm)
  --dry-run                List the files that would be generated without writing anything
  --force                  Overwrite generated files that already exist (default: abort on conflict)
  --help, -h               Show this help message

Examples:
  node scaffold-monorepo.mjs --scope acme --contracts zod --dry-run
  node scaffold-monorepo.mjs --scope acme --contracts openapi --apps web,api,mobile,landing
`);
}

function detectPnpmVersion() {
  const fromAgent = process.env.npm_config_user_agent?.match(/pnpm\/(\d+\.\d+\.\d+)/);
  if (fromAgent) return fromAgent[1];
  try {
    return execFileSync('pnpm', ['--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    process.exit(0);
  }
  const { flags } = parseArgs(argv, {
    booleans: ['--dry-run', '--force'],
    strings: ['--scope', '--contracts', '--apps', '--linter', '--pnpm-version'],
  });

  const scope = flags.scope?.replace(/^@/, '');
  if (!scope) fail('--scope is required (e.g. --scope acme).');
  if (!KEBAB_REGEX.test(scope)) fail(`Scope '${scope}' must be kebab-case.`);

  const mode = CONTRACT_MODES[flags.contracts];
  if (!mode) fail("--contracts is required: 'zod' or 'openapi'. See references/shared-packages-and-contracts.md to choose.");

  const linter = flags.linter ?? 'oxc';
  if (!LINTER_MODES.includes(linter)) fail(`Unknown --linter '${linter}'. Use one of: ${LINTER_MODES.join(', ')}.`);

  let selectedApps;
  try {
    selectedApps = resolveAppSelection(flags.apps);
  } catch (err) {
    fail(err.message);
  }

  const pnpmVersion = flags['pnpm-version'] ?? detectPnpmVersion();
  if (!pnpmVersion || !/^\d+\.\d+\.\d+$/.test(pnpmVersion)) fail('Could not detect pnpm. Install it or pass --pnpm-version <x.y.z>.');

  const root = process.cwd();
  const checker = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'check-boundaries.mjs'), 'utf8');

  const hasOxc = linter === 'oxc' || linter === 'both';
  const hasEslint = linter === 'eslint' || linter === 'both';
  const hasPolyglot = selectedApps.some((a) => a.id === 'polyglot');
  const hasMobile = selectedApps.some((a) => a.id === 'mobile');

  const buildOutputs = [...new Set(['dist/**', ...selectedApps.flatMap((a) => a.turboOutputs)])];
  const buildEnv = [...new Set(selectedApps.flatMap((a) => a.envVars))];

  const rootPackage = {
    name: scope,
    private: true,
    packageManager: `pnpm@${pnpmVersion}`,
    engines: { node: '>=20' },
    scripts: {
      build: 'turbo run build',
      dev: 'turbo run dev',
      lint: 'turbo run lint',
      ...(hasOxc ? { 'format:check': 'turbo run format:check' } : {}),
      typecheck: 'turbo run typecheck',
      test: 'turbo run test',
      'check:boundaries': 'node scripts/check-boundaries.mjs',
    },
    devDependencies: {
      turbo: '^2.5.0',
      typescript: '^5.6.0',
      ...(hasOxc ? { oxlint: '^1.0.0', oxfmt: '^0.10.0' } : {}),
    },
  };

  const turbo = {
    $schema: 'https://turbo.build/schema.json',
    tasks: {
      build: {
        dependsOn: ['^build'],
        ...(buildEnv.length > 0 ? { env: buildEnv } : {}),
        outputs: buildOutputs,
      },
      dev: { dependsOn: ['^build'], cache: false, persistent: true },
      lint: { dependsOn: ['^build'] },
      ...(hasOxc ? { 'format:check': {} } : {}),
      typecheck: { dependsOn: ['^build'] },
      test: { dependsOn: ['^build'], outputs: ['coverage/**'] },
    },
  };

  const workspaceLines = ['packages:', '  - "apps/*"', '  - "packages/*"'];
  if (hasPolyglot) workspaceLines.push('  - "services/*"');

  const npmrcLines = ['engine-strict=true'];
  if (hasMobile) {
    npmrcLines.push('# Expo / React Native monorepo: avoids duplicate React/RN copies across Metro');
    npmrcLines.push('public-hoist-pattern[]=*react*');
    npmrcLines.push('public-hoist-pattern[]=*expo*');
  }

  const gitignore = [
    'node_modules/',
    'dist/',
    '.next/',
    '.astro/',
    '.expo/',
    '.turbo/',
    'coverage/',
    '.env',
    '.env*.local',
    '*.log',
    '',
  ].join('\n');

  const files = [
    { path: path.join(root, 'package.json'), content: json(rootPackage) },
    { path: path.join(root, 'pnpm-workspace.yaml'), content: `${workspaceLines.join('\n')}\n` },
    { path: path.join(root, 'turbo.json'), content: json(turbo) },
    { path: path.join(root, '.npmrc'), content: `${npmrcLines.join('\n')}\n` },
    { path: path.join(root, '.gitignore'), content: gitignore },
    { path: path.join(root, 'scripts', 'check-boundaries.mjs'), content: checker, mode: 0o755 },
    ...tsconfigPackageFiles({ root, scope }),
    ...(hasOxc ? oxcConfigPackageFiles({ root, scope }) : []),
    ...(hasEslint ? eslintConfigPackageFiles({ root, scope }) : []),
    ...packageFiles({ root, scope, name: mode.name, kind: mode.kind, linter }),
  ];

  const appLabels = selectedApps.map((a) => a.id).join(', ');
  console.log(`🏗️  Scaffolding pnpm + Turborepo monorepo (@${scope}, contracts: ${flags.contracts}, apps: ${appLabels}, linter: ${linter})`);
  if (flags['dry-run']) console.log('🔎 Mode: [DRY RUN - No files will be written]');
  console.log('');

  applyFiles(files, { dryRun: flags['dry-run'], force: flags.force, cwd: root });

  if (flags['dry-run']) {
    console.log(`\n🔎 Dry run complete: ${files.length} files would be written. Nothing was changed.`);
    return;
  }

  const contractsDep = `"@${scope}/${mode.name}": "workspace:*"`;
  console.log(`\n✨ Monorepo root scaffolded (${files.length} files).`);
  console.log(`\n📌 Next steps (run after confirming with the user when commands download packages):`);
  let step = 1;
  for (const app of selectedApps) {
    if (app.createCommand) {
      console.log(`   ${step++}. [${app.id}] ${app.createCommand(app.defaultDir, app.id)}`);
      console.log(`      Then wire it: node <skill-dir>/scripts/scaffold-app.mjs ${app.id} --type ${app.id} --dir ${app.defaultDir}`);
    } else {
      console.log(`   ${step++}. [${app.id}] node <skill-dir>/scripts/scaffold-app.mjs ${app.id} --type ${app.id} --dir ${app.defaultDir}`);
    }
  }
  console.log(`   ${step++}. Ensure ${contractsDep} and "@${scope}/tsconfig": "workspace:*" are wired in consuming apps.`);
  console.log(`   ${step}. pnpm install && pnpm build && pnpm check:boundaries`);
}

main();
