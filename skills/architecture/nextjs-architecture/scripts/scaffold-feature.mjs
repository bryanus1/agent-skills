#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

function printHelp() {
  console.log(`
Usage: node scaffold-feature.mjs <feature-name> [options]

Arguments:
  feature-name        Name of the feature in kebab-case (e.g., billing, user-profile)

Options:
  --target-dir <dir>  Base directory for features (default: src/features)
  --with-starter      Generate starter model and screen files
  --dry-run           List what would be generated without writing anything
  --force             Overwrite starter files that already exist (default: abort on conflict)
  --help, -h          Show this help message
`);
}

function toPascalCase(str) {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const featureName = args[0];
  if (!/^[a-z0-9-]+$/.test(featureName)) {
    console.error(`❌ Error: Feature name '${featureName}' must be in kebab-case (lowercase letters, numbers, hyphens).`);
    process.exit(1);
  }

  let targetDir = 'src/features';
  let withStarter = false;
  let isDryRun = false;
  let isForce = false;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--target-dir' && args[i + 1]) {
      targetDir = args[i + 1];
      i++;
    } else if (args[i] === '--with-starter') {
      withStarter = true;
    } else if (args[i] === '--dry-run') {
      isDryRun = true;
    } else if (args[i] === '--force') {
      isForce = true;
    }
  }

  const featureRoot = path.resolve(process.cwd(), targetDir, featureName);

  const subdirectories = [
    'components',
    'hooks',
    'models',
    'schemas',
    'screens',
    'services',
    'utils',
  ];

  console.log(`🚀 Scaffolding Next.js Screaming Feature: ${featureName}`);
  console.log(`📁 Target directory: ${featureRoot}`);
  if (isDryRun) {
    console.log(`🔎 Mode: [DRY RUN - No files will be written]`);
  }
  console.log('');

  const files = [];

  if (withStarter) {
    const pascalName = toPascalCase(featureName);

    // 1. Flat model file (NO subfolder, NO barrel)
    const modelFile = path.join(featureRoot, 'models', `${featureName}.ts`);
    const modelContent = `/**
 * Domain model representing ${pascalName}.
 */
export interface I${pascalName} {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  // TODO: Add domain properties here
}
`;
    files.push({ path: modelFile, content: modelContent });

    const modelIndexFile = path.join(featureRoot, 'models', 'index.ts');
    const modelIndexContent = `export * from './${featureName}';\n`;
    files.push({ path: modelIndexFile, content: modelIndexContent });

    // 2. Starter Screen (Encapsulated subfolder)
    const screenSubdir = path.join(featureRoot, 'screens', `${featureName}-home`);

    const screenFile = path.join(screenSubdir, `${featureName}-home.tsx`);
    const screenTest = path.join(screenSubdir, `${featureName}-home.test.tsx`);
    const screenIndex = path.join(screenSubdir, 'index.ts');

    const screenContent = `import React from 'react';

/**
 * Props for {@link ${pascalName}Home}.
 */
export interface I${pascalName}HomeProps {
  readonly title?: string;
}

/**
 * Main dashboard screen for the ${pascalName} feature.
 */
export function ${pascalName}Home({ title = '${pascalName} Overview' }: Readonly<I${pascalName}HomeProps>): React.JSX.Element {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted-foreground">Feature domain module: ${featureName}</p>
    </div>
  );
}
`;

    const screenTestContent = `import React from 'react';
import { render, screen } from '@testing-library/react';
import { ${pascalName}Home } from './${featureName}-home';

describe('${pascalName}Home Screen', () => {
  it('renders default title correctly', () => {
    render(<${pascalName}Home />);
    expect(screen.getByText('${pascalName} Overview')).toBeInTheDocument();
  });

  it('renders custom title when provided', () => {
    render(<${pascalName}Home title="Custom Header" />);
    expect(screen.getByText('Custom Header')).toBeInTheDocument();
  });
});
`;

    const screenIndexContent = `export * from './${featureName}-home';\n`;

    files.push({ path: screenFile, content: screenContent });
    files.push({ path: screenTest, content: screenTestContent });
    files.push({ path: screenIndex, content: screenIndexContent });
  }

  const conflicts = files.map((item) => item.path).filter((file) => fs.existsSync(file));
  if (conflicts.length > 0 && !isForce) {
    console.error(`❌ Error: ${conflicts.length} starter file(s) already exist:`);
    for (const file of conflicts) {
      console.error(`   - ${path.relative(process.cwd(), file)}`);
    }
    console.error(`\nNo files were written. Re-run with --force to overwrite them.`);
    process.exit(1);
  }

  for (const dir of subdirectories) {
    const dirPath = path.join(featureRoot, dir);
    const displayPath = `${path.relative(process.cwd(), dirPath)}/`;
    if (isDryRun) {
      console.log(`  [DRY-RUN] Would ensure directory: ${displayPath}`);
      continue;
    }
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  ✓ Directory ready: ${displayPath}`);
  }

  for (const item of files) {
    const displayPath = path.relative(process.cwd(), item.path);
    if (isDryRun) {
      const action = conflicts.includes(item.path) ? 'overwrite' : 'create';
      console.log(`  [DRY-RUN] Would ${action}: ${displayPath}`);
      continue;
    }
    fs.mkdirSync(path.dirname(item.path), { recursive: true });
    fs.writeFileSync(item.path, item.content, 'utf8');
    console.log(`  ✓ Created: ${displayPath}`);
  }

  if (isDryRun) {
    console.log(`\n🔎 Dry run complete. Nothing was changed.`);
    return;
  }

  console.log(`\n✅ Feature '${featureName}' scaffolded successfully!`);
  console.log(`⚠️ Reminder: Leaf-folder barrel policy (import from leaf folder with index.ts):`);
  console.log(`   - import { ... } from '@/features/${featureName}/screens/${featureName}-home';`);
  console.log(`   - import { ... } from '@/features/${featureName}/models';`);
  console.log(`   - import { ... } from '@/features/${featureName}/utils';`);
  console.log(`   Do NOT create container barrels at src/features/${featureName}/index.ts or components/index.ts`);
}

main();
