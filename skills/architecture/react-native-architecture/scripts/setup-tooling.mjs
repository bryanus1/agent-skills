#!/usr/bin/env node

import path from 'node:path';
import { applyFiles, fail, parseArgs } from './lib/scaffold.mjs';
import { jestConfigTemplate, oxfmtrcTemplate, oxlintrcTemplate, testSetupTemplate } from './lib/templates.mjs';

function printHelp() {
  console.log(`
Usage: node setup-tooling.mjs [options]

Options:
  --only <tool>       Limit generation to: lint, format, test (default: all)
  --dry-run           List what would be generated without writing anything
  --force             Overwrite files that already exist (default: abort on conflict)
  --help, -h          Show this help message
`);
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const { flags } = parseArgs(argv, {
    booleans: ['--dry-run', '--force'],
    strings: ['--only'],
  });

  const only = flags.only;
  if (only && !['lint', 'format', 'test'].includes(only)) {
    fail(`Invalid --only '${only}'. Use 'lint', 'format', or 'test'.`);
  }

  const cwd = process.cwd();
  const files = [];

  if (!only || only === 'lint') {
    files.push({
      path: path.join(cwd, '.oxlintrc.json'),
      content: oxlintrcTemplate(),
    });
  }

  if (!only || only === 'format') {
    files.push({
      path: path.join(cwd, '.oxfmtrc.json'),
      content: oxfmtrcTemplate(),
    });
  }

  if (!only || only === 'test') {
    files.push(
      {
        path: path.join(cwd, 'jest.config.js'),
        content: jestConfigTemplate(),
      },
      {
        path: path.join(cwd, 'src', 'test', 'setup.ts'),
        content: testSetupTemplate(),
      },
    );
  }

  console.log('🛠️ Setting up React Native Architecture Tooling (Jest + OXC)');
  if (flags['dry-run']) console.log('🔎 Mode: [DRY RUN - No files will be written]');
  console.log('');

  applyFiles(files, { dryRun: flags['dry-run'], force: flags.force });
  if (flags['dry-run']) return;

  console.log('\n✅ Configuration files generated successfully!');
  console.log('\n📦 Next step: Install dependencies with your package manager:');
  console.log('   pnpm add -D oxlint oxfmt jest-expo @testing-library/react-native\n');
}

main();
