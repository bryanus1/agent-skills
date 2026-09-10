#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

function printHelp() {
  console.log(`
Usage: node organize-dart-imports.mjs <file-or-dir> [options]

Arguments:
  file-or-dir             Path to a .dart file or directory to process recursively

Options:
  --write                 Rewrite the file(s) with organized imports in-place
  --check                 Check if imports are sorted (exits with code 1 if unorganized)
  --dry-run               Show preview of changes without modifying files
  --package-name <name>   Override internal package name (default: auto-detected from pubspec.yaml)
  --help, -h              Show this help message

Examples:
  node organize-dart-imports.mjs lib/main.dart --dry-run
  node organize-dart-imports.mjs lib/features/auth --write
  node organize-dart-imports.mjs lib --check
`);
}

function detectPackageName(startPath) {
  let currentDir = fs.statSync(startPath).isDirectory() ? startPath : path.dirname(startPath);
  for (let i = 0; i < 6; i++) {
    const pubspecPath = path.join(currentDir, 'pubspec.yaml');
    if (fs.existsSync(pubspecPath)) {
      try {
        const content = fs.readFileSync(pubspecPath, 'utf8');
        const match = content.match(/^name:\s*([a-zA-Z0-9_]+)/m);
        if (match && match[1]) {
          return match[1].trim();
        }
      } catch {
        // Ignored
      }
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
  return null;
}

function compareStrings(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function sortShowHideClause(line) {
  return line.replace(/\b(show|hide)\s+([^;]+);/, (match, clause, symbolsStr) => {
    const symbols = symbolsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .sort(compareStrings);
    return `${clause} ${symbols.join(', ')};`;
  });
}

function extractUri(line) {
  const match = line.match(/['"]([^'"]+)['"]/);
  return match ? match[1] : '';
}

function classifyDirective(line, appPackageName) {
  const trimmed = line.trim();
  const uri = extractUri(trimmed);

  if (trimmed.startsWith('part ') || trimmed.startsWith('part of ')) {
    return 5; // Group 6: parts
  }
  if (trimmed.startsWith('export ')) {
    return 4; // Group 5: exports
  }
  if (trimmed.startsWith('import ')) {
    if (uri.startsWith('dart:')) {
      return 0; // Group 1: dart:*
    }
    if (appPackageName && uri.startsWith(`package:${appPackageName}/`)) {
      return 2; // Group 3: internal package
    }
    if (uri.startsWith('package:')) {
      return 1; // Group 2: external package / flutter
    }
    // Relative imports (./, ../)
    return 3; // Group 4: relative
  }
  return -1;
}

function organizeContent(originalContent, appPackageName) {
  const lines = originalContent.split(/\r?\n/);

  let firstDirectiveIndex = -1;
  let lastDirectiveIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      line.startsWith('import ') ||
      line.startsWith('export ') ||
      line.startsWith('part ') ||
      line.startsWith('part of ')
    ) {
      if (firstDirectiveIndex === -1) {
        firstDirectiveIndex = i;
      }
      lastDirectiveIndex = i;
    }
  }

  // If no directives found, return unchanged
  if (firstDirectiveIndex === -1) {
    return { modified: false, content: originalContent };
  }

  // Header lines before first directive
  const headerLines = lines.slice(0, firstDirectiveIndex);
  // Clean trailing blank lines from header
  while (headerLines.length > 0 && headerLines[headerLines.length - 1].trim() === '') {
    headerLines.pop();
  }

  // Directive lines to classify
  const rawDirectiveLines = lines.slice(firstDirectiveIndex, lastDirectiveIndex + 1);
  const directiveLines = [];

  for (let i = 0; i < rawDirectiveLines.length; i++) {
    const line = rawDirectiveLines[i].trim();
    if (
      line.startsWith('import ') ||
      line.startsWith('export ') ||
      line.startsWith('part ') ||
      line.startsWith('part of ')
    ) {
      directiveLines.push(sortShowHideClause(line));
    }
  }

  // Body lines after last directive
  const bodyLines = lines.slice(lastDirectiveIndex + 1);
  // Clean leading blank lines from body
  while (bodyLines.length > 0 && bodyLines[0].trim() === '') {
    bodyLines.shift();
  }

  // 6 Groups:
  // 0: dart:*
  // 1: third_party & flutter package:*
  // 2: app package:*
  // 3: relative (./, ../)
  // 4: export
  // 5: part
  const groups = [[], [], [], [], [], []];

  for (const line of directiveLines) {
    const groupIdx = classifyDirective(line, appPackageName);
    if (groupIdx >= 0 && groupIdx <= 5) {
      groups[groupIdx].push(line);
    }
  }

  // Sort each group alphabetically by URI using ASCII code point order
  for (let i = 0; i < groups.length; i++) {
    groups[i] = Array.from(new Set(groups[i])).sort((a, b) => {
      const uriA = extractUri(a);
      const uriB = extractUri(b);
      return compareStrings(uriA, uriB);
    });
  }

  // Build organized directives string
  const nonEmptyGroups = groups.filter((g) => g.length > 0);
  const organizedDirectivesText = nonEmptyGroups.map((g) => g.join('\n')).join('\n\n');

  let resultParts = [];
  if (headerLines.length > 0) {
    resultParts.push(headerLines.join('\n'));
  }
  resultParts.push(organizedDirectivesText);
  if (bodyLines.length > 0) {
    resultParts.push(bodyLines.join('\n'));
  }

  let finalContent = resultParts.join('\n\n');
  if (originalContent.endsWith('\n') && !finalContent.endsWith('\n')) {
    finalContent += '\n';
  }

  const isModified = finalContent !== originalContent;
  return { modified: isModified, content: finalContent };
}

function findDartFiles(targetPath) {
  if (!fs.existsSync(targetPath)) return [];
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    return targetPath.endsWith('.dart') ? [targetPath] : [];
  }

  const results = [];
  const entries = fs.readdirSync(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'build' || entry.name === 'node_modules') {
      continue;
    }
    const full = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...findDartFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.dart')) {
      results.push(full);
    }
  }
  return results;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const targetArg = args[0];
  let isWrite = false;
  let isCheck = false;
  let isDryRun = false;
  let packageName = null;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--write') isWrite = true;
    else if (args[i] === '--check') isCheck = true;
    else if (args[i] === '--dry-run') isDryRun = true;
    else if (args[i] === '--package-name' && args[i + 1]) packageName = args[++i];
  }

  const targetPath = path.resolve(process.cwd(), targetArg);
  if (!fs.existsSync(targetPath)) {
    console.error(`❌ Path does not exist: ${targetArg}`);
    process.exit(1);
  }

  if (!packageName) {
    packageName = detectPackageName(targetPath) || 'my_app';
  }

  const files = findDartFiles(targetPath);
  if (files.length === 0) {
    console.log(`⚠️  No .dart files found in: ${targetArg}`);
    process.exit(0);
  }

  console.log(`\n📦 \x1b[36mDart Import Organizer\x1b[0m`);
  console.log(`   🏷️  Detected App Package: \x1b[33m${packageName}\x1b[0m`);
  console.log(`   📂 Files to inspect:       \x1b[34m${files.length}\x1b[0m\n`);

  let modifiedCount = 0;

  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf8');
    const { modified, content: newContent } = organizeContent(content, packageName);

    if (modified) {
      modifiedCount++;
      if (isWrite) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`   ✔ \x1b[32mOrganized & Written\x1b[0m: ${rel}`);
      } else if (isDryRun) {
        console.log(`   🔎 \x1b[35m[DRY-RUN] Needs reorganization\x1b[0m: ${rel}`);
      } else if (isCheck) {
        console.log(`   ❌ \x1b[31mUnorganized\x1b[0m: ${rel}`);
      } else {
        console.log(`   🔸 Needs reorganization (pass --write to apply): ${rel}`);
      }
    } else {
      if (!isCheck) {
        console.log(`   - \x1b[90mAlready organized\x1b[0m: ${rel}`);
      }
    }
  }

  console.log('\n----------------------------------------');
  if (modifiedCount === 0) {
    console.log(`✨ All ${files.length} file(s) are perfectly organized!\n`);
    process.exit(0);
  } else {
    if (isWrite) {
      console.log(`✨ Successfully organized ${modifiedCount} file(s)!\n`);
      process.exit(0);
    } else if (isCheck) {
      console.log(`❌ ${modifiedCount} file(s) require import reorganization.\n`);
      process.exit(1);
    } else {
      console.log(`ℹ️  ${modifiedCount} file(s) can be organized. Run with --write to apply changes.\n`);
      process.exit(0);
    }
  }
}

main();
