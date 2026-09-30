#!/usr/bin/env node
// scaffold-fullstack-feature.mjs — Scaffolds one domain end to end in the monorepo:
//   1. zod mode: shared schemas in packages/contracts/src/<nouns>/ + exports entry
//   2. NestJS module in <api-dir>/src/modules/<nouns>/  (nestjs-architecture script)
//   3. Next.js feature in <web-dir>/src/features/<nouns>/ (nextjs-architecture script)
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
const SIBLINGS = {
  nest: { skill: 'nestjs-architecture', script: 'scaffold-module.mjs' },
  next: { skill: 'nextjs-architecture', script: 'scaffold-feature.mjs' },
};

function printHelp() {
  console.log(`
Usage: node scaffold-fullstack-feature.mjs <noun-singular> [options]

Arguments:
  noun-singular          Domain noun in kebab-case (e.g. invoice, user-profile)

Options:
  --contracts <mode>     zod | openapi (default: zod if packages/contracts exists,
                         openapi if packages/api-client exists)
  --plural <name>        Custom plural (default: auto-detected, same rules as nestjs-architecture)
  --api-dir <dir>        NestJS app directory (default: apps/api)
  --web-dir <dir>        Next.js app directory (default: apps/web)
  --scope <scope>        npm scope (default: detected from the root package.json name)
  --dry-run              Show everything that would be generated without writing anything
  --force                Overwrite generated files that already exist (default: abort on conflict)
  --help, -h             Show this help message

Requires the nestjs-architecture and nextjs-architecture skills installed next to this one.
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

/** Input accepted when creating a ${noun}. Shared by the API (validation) and the web (forms). */
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

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    process.exit(argv.length === 0 ? 1 : 0);
  }
  const { positional, flags } = parseArgs(argv, {
    booleans: ['--dry-run', '--force'],
    strings: ['--contracts', '--plural', '--api-dir', '--web-dir', '--scope'],
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

  const apiDir = path.resolve(root, flags['api-dir'] ?? 'apps/api');
  const webDir = path.resolve(root, flags['web-dir'] ?? 'apps/web');
  for (const [label, dir] of [['--api-dir', apiDir], ['--web-dir', webDir]]) {
    if (!fs.existsSync(dir)) fail(`${label} '${path.relative(root, dir)}' does not exist. Create the app first (see scaffold-monorepo next steps).`);
  }

  const nestScript = siblingScript(SIBLINGS.nest);
  const nextScript = siblingScript(SIBLINGS.next);
  const passthrough = flags.force ? ['--force'] : [];
  const nestArgs = [noun, '--target-dir', path.relative(root, path.join(apiDir, 'src', 'modules')), ...(flags.plural ? ['--plural', nouns] : []), ...passthrough];
  const nextArgs = [nouns, '--target-dir', path.relative(root, path.join(webDir, 'src', 'features')), '--with-starter', ...passthrough];

  // Shared files: contracts (zod) and workspace dependencies in the apps.
  const shared =
    mode === 'zod'
      ? [
          ...contractFiles({ root, noun, nouns, force: flags.force }),
          ...dependencyUpdate(apiDir, `@${scope}/contracts`),
          ...dependencyUpdate(webDir, `@${scope}/contracts`),
        ]
      : dependencyUpdate(webDir, `@${scope}/api-client`);

  console.log(`🧩 Full-stack feature '${noun}' (${nouns}) — contracts: ${mode}\n`);

  // 1. Dry-run every part first: nothing is written unless all parts are clean.
  const conflicts = findConflicts(shared);
  if (conflicts.length > 0 && !flags.force) {
    reportConflicts(conflicts, root);
    process.exit(1);
  }
  const previews = [
    ['NestJS module', run(nestScript, [...nestArgs, '--dry-run'], root)],
    ['Next.js feature', run(nextScript, [...nextArgs, '--dry-run'], root)],
  ];
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
  for (const [label, script, args] of [['NestJS module', nestScript, nestArgs], ['Next.js feature', nextScript, nextArgs]]) {
    console.log(`\n── ${label} ──`);
    const result = spawnSync(process.execPath, [script, ...args], { cwd: root, stdio: 'inherit' });
    if (result.status !== 0) fail(`${label} generation failed after the previous parts were written. Review the output above.`);
  }

  const Noun = toPascalCase(noun);
  console.log(`\n✨ Full-stack feature '${noun}' scaffolded.`);
  console.log('\n📌 Next steps:');
  if (mode === 'zod') {
    console.log(`   1. Define the real fields in packages/contracts/src/${nouns}/${noun}.schema.ts`);
    console.log(`   2. API: derive input DTOs from the schemas (nestjs-zod):`);
    console.log(`        export class Create${Noun}Dto extends createZodDto(create${Noun}Schema) {}`);
    console.log(`      Keep ${Noun}ResponseDto.fromEntity() as nestjs-architecture requires.`);
    console.log(`   3. Web: import { create${Noun}Schema } from '@${scope}/contracts/${nouns}' in forms and services.`);
  } else {
    console.log(`   1. Implement the endpoints, start the API and run: pnpm --filter @${scope}/api-client generate`);
    console.log(`   2. Web: call the API with createApiClient() from '@${scope}/api-client/client'.`);
  }
  console.log('   Then: pnpm install && pnpm turbo run typecheck test && pnpm check:boundaries');
}

main();
