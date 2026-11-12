#!/usr/bin/env node
// scaffold-fullstack-feature.mjs — Scaffolds one domain end to end across selected monorepo apps:
//   1. zod mode: shared schemas in packages/contracts/src/<nouns>/ + exports entry
//   2. api target:    NestJS module in <api-dir>/src/modules/<nouns>/     (nestjs-architecture)
//   3. web target:    Next.js feature in <web-dir>/src/features/<nouns>/   (nextjs-architecture)
//   4. mobile target: Expo/RN feature in <mobile-dir>/src/features/<nouns>/ (react-native-architecture)
// Every part is dry-run first; if any part would conflict, nothing is written.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  KEBAB_REGEX,
  applyFiles,
  detectScope,
  fail,
  findConflicts,
  json,
  parseArgs,
  pluralize,
  readJson,
  reportConflicts,
  toCamelCase,
  toPascalCase,
} from './lib/scaffold.mjs';
import { exportEntry } from './lib/templates.mjs';

const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VALID_TARGETS = ['api', 'web', 'mobile'];
const SIBLINGS = {
  api: { label: 'NestJS module', skill: 'nestjs-architecture', script: 'scaffold-module.mjs' },
  web: { label: 'Next.js feature', skill: 'nextjs-architecture', script: 'scaffold-feature.mjs' },
  mobile: { label: 'React Native feature', skill: 'react-native-architecture', script: 'scaffold-feature.mjs' },
};

function printHelp() {
  console.log(`
Usage: node scaffold-fullstack-feature.mjs <noun-singular> [options]

Arguments:
  noun-singular          Domain noun in kebab-case (e.g. invoice, user-profile)

Options:
  --targets <list>       Comma-separated targets: api,web,mobile
                         (default: auto-detected from existing --api-dir, --web-dir, --mobile-dir)
  --contracts <mode>     zod | openapi (default: zod if packages/contracts exists,
                         openapi if packages/api-client exists)
  --plural <name>        Custom plural (default: auto-detected, same rules as nestjs-architecture)
  --api-dir <dir>        NestJS app directory (default: apps/api)
  --web-dir <dir>        Next.js app directory (default: apps/web)
  --mobile-dir <dir>     Expo/React Native app directory (default: apps/mobile)
  --scope <scope>        npm scope (default: detected from the root package.json name)
  --dry-run              Show everything that would be generated without writing anything
  --force                Overwrite generated files that already exist (default: abort on conflict)
  --help, -h             Show this help message

Requires the matching sibling skills (nestjs-architecture, nextjs-architecture, react-native-architecture) installed next to this one.
`);
}

function siblingScript({ skill, script }) {
  const file = path.resolve(skillDir, '..', skill, 'scripts', script);
  if (!fs.existsSync(file)) {
    fail(`Required skill '${skill}' not found next to monorepo-architecture.\n   Install it: npx skills add bryanus1/agent-skills --skill ${skill}`);
  }
  return file;
}

function run(script, args, root) {
  return spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });
}

function contractFiles({ root, noun, nouns, force }) {
  const Noun = toPascalCase(noun);
  const nounCamel = toCamelCase(noun);
  const dir = path.join(root, 'packages', 'contracts');
  const pkgPath = path.join(dir, 'package.json');
  const pkg = readJson(pkgPath);
  const exportKey = `./${nouns}`;
  if (pkg.exports?.[exportKey] && !force) {
    reportConflicts([{ path: `${pkgPath} → exports["${exportKey}"]` }], root);
    process.exit(1);
  }
  pkg.exports = { ...pkg.exports, [exportKey]: exportEntry(`${nouns}/`) };

  const schema = `import { z } from 'zod';

/** Input accepted when creating a ${noun}. Shared by API validation, web forms, and mobile forms. */
export const create${Noun}Schema = z.object({
  // TODO: add the real fields of ${Noun}
  name: z.string().trim().min(1).max(120),
});

/** Input accepted when updating a ${noun}: every field optional. */
export const update${Noun}Schema = create${Noun}Schema.partial();

/** Public shape returned by the API for a ${noun}. */
export const ${nounCamel}Schema = create${Noun}Schema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Create${Noun}Input = z.infer<typeof create${Noun}Schema>;
export type Update${Noun}Input = z.infer<typeof update${Noun}Schema>;
export type ${Noun} = z.infer<typeof ${nounCamel}Schema>;
`;

  return [
    { path: path.join(dir, 'src', nouns, `${noun}.schema.ts`), content: schema },
    { path: path.join(dir, 'src', nouns, 'index.ts'), content: `export * from './${noun}.schema';\n` },
    { path: pkgPath, content: json(pkg), update: true },
  ];
}

/** Adds `"<dep>": "workspace:*"` to an app's package.json when missing. */
function dependencyUpdate(appDir, dep) {
  const pkgPath = path.join(appDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return [];
  const pkg = readJson(pkgPath);
  if (pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]) return [];
  pkg.dependencies = { ...pkg.dependencies, [dep]: 'workspace:*' };
  return [{ path: pkgPath, content: json(pkg), update: true }];
}

function resolveTargets(flags, dirs) {
  if (flags.targets) {
    const requested = [...new Set(flags.targets.split(',').map((t) => t.trim()).filter(Boolean))];
    if (requested.length === 0) fail('--targets must list at least one target (api, web, mobile).');
    for (const target of requested) {
      if (target === 'landing') {
        fail("Target 'landing' (Astro) does not use per-domain CRUD feature scaffolds; import @<scope>/design-tokens, @<scope>/contracts or @<scope>/api-client directly.");
      }
      if (!VALID_TARGETS.includes(target)) {
        fail(`Unknown target '${target}'. Valid targets: ${VALID_TARGETS.join(', ')}.`);
      }
    }
    return requested;
  }

  const detected = VALID_TARGETS.filter((t) => fs.existsSync(dirs[t]));
  if (detected.length === 0) {
    fail("No target app directories found (checked apps/api, apps/web, apps/mobile). Create an app first or pass --targets / --*-dir.");
  }
  return detected;
}

function buildTargetPlan({ target, dir, root, noun, nouns, mode, scope, hasCustomPlural, passthrough }) {
  const script = siblingScript(SIBLINGS[target]);
  if (target === 'api') {
    return {
      target,
      label: SIBLINGS.api.label,
      script,
      args: [
        noun,
        '--target-dir',
        path.relative(root, path.join(dir, 'src', 'modules')),
        ...(hasCustomPlural ? ['--plural', nouns] : []),
        ...(mode === 'zod' ? ['--contracts', 'zod', '--scope', scope] : []),
        ...passthrough,
      ],
    };
  }
  if (target === 'web') {
    return {
      target,
      label: SIBLINGS.web.label,
      script,
      args: [nouns, '--target-dir', path.relative(root, path.join(dir, 'src', 'features')), '--with-starter', ...passthrough],
    };
  }
  return {
    target,
    label: SIBLINGS.mobile.label,
    script,
    args: [
      nouns,
      '--target-dir',
      path.relative(root, path.join(dir, 'src', 'features')),
      '--app-dir',
      path.relative(root, path.join(dir, 'src', 'app')),
      '--with-starter',
      ...passthrough,
    ],
  };
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    process.exit(argv.length === 0 ? 1 : 0);
  }
  const { positional, flags } = parseArgs(argv, {
    booleans: ['--dry-run', '--force'],
    strings: ['--targets', '--contracts', '--plural', '--api-dir', '--web-dir', '--mobile-dir', '--scope'],
  });

  const [noun] = positional;
  if (!noun || !KEBAB_REGEX.test(noun)) fail(`Noun '${noun ?? ''}' must be a singular kebab-case name (e.g. invoice).`);
  const nouns = flags.plural ?? pluralize(noun);
  if (!KEBAB_REGEX.test(nouns)) fail(`Plural '${nouns}' must be kebab-case.`);

  const root = process.cwd();
  if (!fs.existsSync(path.join(root, 'pnpm-workspace.yaml'))) fail('pnpm-workspace.yaml not found. Run from the monorepo root.');
  const scope = flags.scope?.replace(/^@/, '') ?? detectScope(root);
  if (!scope) fail('Could not detect the scope from package.json. Pass --scope <scope>.');

  const hasContracts = fs.existsSync(path.join(root, 'packages', 'contracts', 'package.json'));
  const hasApiClient = fs.existsSync(path.join(root, 'packages', 'api-client', 'package.json'));
  const mode = flags.contracts ?? (hasContracts ? 'zod' : hasApiClient ? 'openapi' : null);
  if (mode !== 'zod' && mode !== 'openapi') fail("Pass --contracts zod|openapi (no packages/contracts or packages/api-client found to infer it).");
  if (mode === 'zod' && !hasContracts) fail('packages/contracts not found. Create it: scaffold-package.mjs contracts --kind contracts');
  if (mode === 'openapi' && !hasApiClient) fail('packages/api-client not found. Create it: scaffold-package.mjs api-client --kind api-client');

  const dirs = {
    api: path.resolve(root, flags['api-dir'] ?? 'apps/api'),
    web: path.resolve(root, flags['web-dir'] ?? 'apps/web'),
    mobile: path.resolve(root, flags['mobile-dir'] ?? 'apps/mobile'),
  };

  const targets = resolveTargets(flags, dirs);
  for (const target of targets) {
    if (!fs.existsSync(dirs[target])) {
      fail(`--${target}-dir '${path.relative(root, dirs[target])}' does not exist. Create the app first (see scaffold-app.mjs).`);
    }
  }

  const passthrough = flags.force ? ['--force'] : [];
  const plans = targets.map((target) =>
    buildTargetPlan({
      target,
      dir: dirs[target],
      root,
      noun,
      nouns,
      mode,
      scope,
      hasCustomPlural: Boolean(flags.plural),
      passthrough,
    }),
  );

  // Shared files: contracts (zod) and workspace dependencies in the selected target apps.
  const depName = mode === 'zod' ? `@${scope}/contracts` : `@${scope}/api-client`;
  const depUpdates = targets
    .filter((t) => mode === 'zod' || t !== 'api')
    .flatMap((t) => dependencyUpdate(dirs[t], depName));

  const shared =
    mode === 'zod'
      ? [...contractFiles({ root, noun, nouns, force: flags.force }), ...depUpdates]
      : depUpdates;

  console.log(`🧩 Full-stack feature '${noun}' (${nouns}) — targets: ${targets.join(', ')} — contracts: ${mode}\n`);

  // 1. Dry-run every part first: nothing is written unless all parts are clean.
  const conflicts = findConflicts(shared);
  if (conflicts.length > 0 && !flags.force) {
    reportConflicts(conflicts, root);
    process.exit(1);
  }
  const previews = plans.map((plan) => [plan.label, run(plan.script, [...plan.args, '--dry-run'], root)]);
  const failed = previews.filter(([, result]) => result.status !== 0);
  if (failed.length > 0) {
    for (const [label, result] of failed) {
      console.error(`❌ ${label} cannot be generated:\n${result.stderr || result.stdout}`);
    }
    console.error('No files were written in any workspace.');
    process.exit(1);
  }

  if (flags['dry-run']) {
    console.log('📄 Shared files:');
    applyFiles(shared, { dryRun: true, force: flags.force, cwd: root });
    for (const [label, result] of previews) console.log(`\n── ${label} ──\n${result.stdout.trim()}`);
    console.log('\n🔎 Dry run complete. Nothing was changed.');
    return;
  }

  // 2. Write for real, in dependency order.
  console.log('📄 Shared files:');
  applyFiles(shared, { force: flags.force, cwd: root });
  for (const plan of plans) {
    console.log(`\n── ${plan.label} ──`);
    const result = spawnSync(process.execPath, [plan.script, ...plan.args], { cwd: root, stdio: 'inherit' });
    if (result.status !== 0) fail(`${plan.label} generation failed after the previous parts were written. Review the output above.`);
  }

  const Noun = toPascalCase(noun);
  console.log(`\n✨ Full-stack feature '${noun}' scaffolded across: ${targets.join(', ')}.`);
  console.log('\n📌 Next steps:');
  if (mode === 'zod') {
    console.log(`   1. Define the real fields in packages/contracts/src/${nouns}/${noun}.schema.ts`);
    if (targets.includes('api')) {
      console.log(`   2. API: derive input DTOs from the schemas (nestjs-zod):`);
      console.log(`        export class Create${Noun}Dto extends createZodDto(create${Noun}Schema) {}`);
      console.log(`      Keep ${Noun}ResponseDto.fromEntity() as nestjs-architecture requires.`);
    }
    if (targets.includes('web') || targets.includes('mobile')) {
      console.log(`   3. Clients: import { create${Noun}Schema } from '@${scope}/contracts/${nouns}' in forms and services.`);
    }
  } else {
    console.log(`   1. Implement the endpoints, start the API and run: pnpm --filter @${scope}/api-client generate`);
    console.log(`   2. Clients: call the API with createApiClient() from '@${scope}/api-client/client'.`);
  }
  console.log('   Then: pnpm install && pnpm turbo run typecheck test && pnpm check:boundaries');
}

main();
