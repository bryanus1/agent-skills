#!/usr/bin/env node
/**
 * Audits an Astro project against astro-architecture standards:
 * strict TypeScript, Zero-JS island discipline, astro:assets usage, and basic SEO.
 */
import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const options = {
    targetDir: '.',
    strict: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--target-dir' && argv[i + 1]) {
      options.targetDir = argv[++i];
    } else if (arg === '--strict') {
      options.strict = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node audit-astro.mjs [options]

Options:
  --target-dir <path>  Root directory of the Astro project (default: ".")
  --strict             Exit with code 1 if warnings are found
  -h, --help           Show this help message`);
}

function collectFiles(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

function checkTsConfig(rootDir, warnings) {
  const tsconfigPath = path.join(rootDir, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    warnings.push('tsconfig.json not found.');
    return;
  }
  const raw = fs.readFileSync(tsconfigPath, 'utf8');
  const hasStrict =
    raw.includes('astro/tsconfigs/strict') ||
    raw.includes('"strict": true') ||
    raw.includes('"strict":true');

  if (!hasStrict) {
    warnings.push(
      'tsconfig.json should extend "astro/tsconfigs/strict" or enable "strict": true.',
    );
  }
}

function checkSourceFiles(rootDir, errors, warnings) {
  const srcDir = path.join(rootDir, 'src');
  if (!fs.existsSync(srcDir)) {
    errors.push('src/ directory not found.');
    return;
  }

  const astroFiles = collectFiles(srcDir, ['.astro']);
  let hasDescriptionMeta = false;
  let hasCanonical = false;

  for (const file of astroFiles) {
    const rel = path.relative(rootDir, file);
    const content = fs.readFileSync(file, 'utf8');

    if (content.includes('client:load')) {
      warnings.push(
        `${rel}: uses client:load — verify this island is critical above-the-fold; prefer client:visible or client:idle.`,
      );
    }

    if (/<img\b/i.test(content)) {
      warnings.push(
        `${rel}: raw <img> tag detected — prefer <Image /> or <Picture /> from "astro:assets".`,
      );
    }

    if (/name=["']description["']/i.test(content)) {
      hasDescriptionMeta = true;
    }
    if (/rel=["']canonical["']/i.test(content)) {
      hasCanonical = true;
    }
  }

  if (!hasDescriptionMeta) {
    warnings.push('No <meta name="description"> found in src/**/*.astro.');
  }
  if (!hasCanonical) {
    warnings.push('No <link rel="canonical"> found in src/**/*.astro.');
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const rootDir = path.resolve(options.targetDir);
  const errors = [];
  const warnings = [];

  checkTsConfig(rootDir, warnings);
  checkSourceFiles(rootDir, errors, warnings);

  if (!fs.existsSync(path.join(rootDir, 'public', 'robots.txt'))) {
    warnings.push('public/robots.txt not found.');
  }

  if (!fs.existsSync(path.join(rootDir, '.oxlintrc.json'))) {
    warnings.push('.oxlintrc.json not found (recommended for OXC linting).');
  }

  const hasPlaywrightConfig =
    fs.existsSync(path.join(rootDir, 'playwright.config.ts')) ||
    fs.existsSync(path.join(rootDir, 'playwright.config.mjs'));
  if (!hasPlaywrightConfig) {
    warnings.push(
      'playwright.config.ts/mjs not found (recommended for E2E verification).',
    );
  }

  for (const err of errors) {
    console.error(`ERROR: ${err}`);
  }
  for (const warn of warnings) {
    console.warn(`WARN:  ${warn}`);
  }

  console.log(
    `\nAudit complete: ${errors.length} error(s), ${warnings.length} warning(s).`,
  );

  if (errors.length > 0 || (options.strict && warnings.length > 0)) {
    process.exit(1);
  }
}

main();
