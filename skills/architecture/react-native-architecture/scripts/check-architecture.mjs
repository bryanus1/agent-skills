#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from './lib/scaffold.mjs';

const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const GROUPERS = new Set(['components', 'hooks', 'models', 'schemas', 'screens', 'services', 'stores', 'utils']);

function printHelp() {
  console.log(`
Usage: node check-architecture.mjs [options]

Options:
  --src-dir <dir>       Source directory to validate (default: src)
  --include-imports     Also check imports (leaf barrels, cross-feature UI, web APIs)
  --json                Output violations as JSON
  --help, -h            Show this help message
`);
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (['node_modules', '.git', 'dist', 'build', 'coverage'].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

export function checkArchitecture({ srcDir = 'src', includeImports = false, cwd = process.cwd() } = {}) {
  const violations = [];
  const root = path.resolve(cwd, srcDir);
  if (!fs.existsSync(root)) return violations;

  const featuresDir = path.join(root, 'features');
  const appDir = path.join(root, 'app');

  // 1. Check feature barrels and structure
  if (fs.existsSync(featuresDir)) {
    const features = fs.readdirSync(featuresDir, { withFileTypes: true }).filter((d) => d.isDirectory());
    for (const feat of features) {
      const featPath = path.join(featuresDir, feat.name);

      // Feature root barrel check
      for (const barrelName of ['index.ts', 'index.tsx']) {
        const rootBarrel = path.join(featPath, barrelName);
        if (fs.existsSync(rootBarrel)) {
          violations.push({
            rule: 'forbidden-root-barrel',
            file: path.relative(cwd, rootBarrel),
            message: `Feature root '${feat.name}' must not have an index barrel. Follow Leaf-Folder Barrel Policy.`,
          });
        }
      }

      // Container grouper barrel check (e.g. features/billing/components/index.ts)
      for (const grouper of GROUPERS) {
        if (['models', 'schemas', 'utils'].includes(grouper)) continue; // these are direct leaf folders
        const grouperPath = path.join(featPath, grouper);
        if (fs.existsSync(grouperPath) && fs.statSync(grouperPath).isDirectory()) {
          for (const b of ['index.ts', 'index.tsx']) {
            const bPath = path.join(grouperPath, b);
            if (fs.existsSync(bPath)) {
              violations.push({
                rule: 'forbidden-grouper-barrel',
                file: path.relative(cwd, bPath),
                message: `Grouper folder '${feat.name}/${grouper}' must not have an index barrel. Export only from leaf subfolders.`,
              });
            }
          }

          // Check leaf subfolders for adjacent tests (e.g. components/<comp>/<comp>.test.tsx)
          const leaves = fs.readdirSync(grouperPath, { withFileTypes: true }).filter((d) => d.isDirectory());
          for (const leaf of leaves) {
            if (grouper === 'hooks' && leaf.name.endsWith('-keys')) continue; // keys factories have no tests
            const leafPath = path.join(grouperPath, leaf.name);
            const leafFiles = fs.readdirSync(leafPath);
            const hasTest = leafFiles.some((f) => f.includes('.test.') || f.includes('.spec.'));
            if (!hasTest) {
              violations.push({
                rule: 'missing-leaf-test',
                file: path.relative(cwd, leafPath),
                message: `Leaf folder '${feat.name}/${grouper}/${leaf.name}' lacks an adjacent test file (.test.ts/tsx).`,
              });
            }
          }
        }
      }
    }
  }

  // 2. Check app/ thin routes constraints
  if (fs.existsSync(appDir)) {
    const appFiles = walkDir(appDir);
    for (const f of appFiles) {
      const rel = path.relative(cwd, f);
      if (f.includes('.test.') || f.includes('.spec.')) {
        violations.push({
          rule: 'route-has-tests',
          file: rel,
          message: `Expo Router directory '${srcDir}/app' must not contain test files. Move tests to the feature.`,
        });
      }
    }
  }

  // 3. Optional: Check file imports and content
  if (includeImports) {
    const allFiles = walkDir(root).filter((f) => SOURCE_EXTS.has(path.extname(f)));
    for (const f of allFiles) {
      const rel = path.relative(cwd, f);
      const content = fs.readFileSync(f, 'utf8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // Container imports
        if (/@\/features\/[a-z0-9-]+['"]/.test(line)) {
          violations.push({
            rule: 'container-import',
            file: `${rel}:${lineNum}`,
            message: 'Importing directly from feature root is forbidden. Import from leaf subfolders.',
          });
        }
        if (/@\/features\/[a-z0-9-]+\/(components|hooks|screens|services)['"]/.test(line)) {
          violations.push({
            rule: 'grouper-import',
            file: `${rel}:${lineNum}`,
            message: 'Importing directly from container groupers is forbidden. Import from leaf subfolders.',
          });
        }

        // Web APIs
        if (/\b(?:window\.|localStorage\.)/.test(line)) {
          violations.push({
            rule: 'forbidden-web-api',
            file: `${rel}:${lineNum}`,
            message: 'Web globals (window, localStorage) are forbidden in React Native. Use expo-secure-store.',
          });
        }
        if (/<\s*(?:div|span|button|h[1-6])\b/.test(line) && !line.includes('//')) {
          violations.push({
            rule: 'forbidden-dom-element',
            file: `${rel}:${lineNum}`,
            message: 'DOM elements are forbidden in React Native. Use View, Text, or Pressable.',
          });
        }

        // App routes importing services directly
        if (rel.startsWith(path.join(srcDir, 'app')) && (/@\/features\/[^/]+\/services\//.test(line) || /@tanstack\/react-query/.test(line))) {
          violations.push({
            rule: 'route-not-thin',
            file: `${rel}:${lineNum}`,
            message: 'Expo Router routes must be thin. Logic and queries belong in feature screens or hooks.',
          });
        }
      }
    }
  }

  return violations;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const { flags } = parseArgs(argv, {
    booleans: ['--include-imports', '--json'],
    strings: ['--src-dir'],
  });

  const violations = checkArchitecture({
    srcDir: flags['src-dir'] ?? 'src',
    includeImports: flags['include-imports'],
  });

  if (flags.json) {
    console.log(JSON.stringify({ violations, total: violations.length }, null, 2));
    process.exit(violations.length === 0 ? 0 : 1);
  }

  if (violations.length === 0) {
    console.log('✅ Screaming Architecture check passed: 0 violations found.');
    process.exit(0);
  }

  console.error(`❌ Found ${violations.length} Screaming Architecture violation(s):\n`);
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}`);
    console.error(`    ↳ ${v.message}`);
  }
  console.error('');
  process.exit(1);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isDirectRun) {
  main();
}
