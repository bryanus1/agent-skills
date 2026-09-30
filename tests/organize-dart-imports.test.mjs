import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { organizeContent } from '../skills/dart/dart-import-organizer/scripts/organize-dart-imports.mjs';
import { makeTempDir, runScript, writeFiles } from './helpers.mjs';

const SCRIPT = 'skills/dart/dart-import-organizer/scripts/organize-dart-imports.mjs';

const UNORGANIZED = `// Copyright header
import '../widgets/button.dart';
import 'package:my_app/core/result.dart';
import 'package:flutter/material.dart';
import 'dart:async';
part 'login_state.dart';
import 'package:bloc/bloc.dart' show Emitter, Bloc;
export 'login_event.dart';
import 'dart:async';

class LoginBloc {}
`;

const ORGANIZED = `// Copyright header

import 'dart:async';

import 'package:bloc/bloc.dart' show Bloc, Emitter;
import 'package:flutter/material.dart';

import 'package:my_app/core/result.dart';

import '../widgets/button.dart';

export 'login_event.dart';

part 'login_state.dart';

class LoginBloc {}
`;

test('groups directives into the 6 canonical blocks, sorted and deduplicated', () => {
  const result = organizeContent(UNORGANIZED, 'my_app');
  assert.equal(result.modified, true);
  assert.equal(result.content, ORGANIZED);
});

test('is idempotent on an already organized file', () => {
  assert.deepEqual(organizeContent(ORGANIZED, 'my_app'), { modified: false, content: ORGANIZED });
});

test('leaves files without directives untouched', () => {
  const source = 'void main() {}\n';
  assert.deepEqual(organizeContent(source, 'my_app'), { modified: false, content: source });
});

test('skips files with multi-line directives instead of dropping lines', () => {
  const source = `import 'package:b/b.dart';
import 'package:a/a.dart'
    show Foo, Bar;

void main() {}
`;
  const result = organizeContent(source, 'my_app');
  assert.equal(result.modified, false);
  assert.equal(result.content, source);
  assert.match(result.skipped, /line 2/);
});

test('skips files with comments between directives instead of dropping them', () => {
  const source = `import 'package:b/b.dart';
// ignore: unused_import
import 'package:a/a.dart';
`;
  const result = organizeContent(source, 'my_app');
  assert.equal(result.content, source);
  assert.ok(result.skipped);
});

test('CLI: --check fails on unorganized files, --write fixes them, skipped files stay intact', (t) => {
  const cwd = makeTempDir(t);
  const multiline = `import 'package:b/b.dart';\nimport 'package:a/a.dart'\n    show Foo;\n`;
  writeFiles(cwd, {
    'pubspec.yaml': 'name: my_app\n',
    'lib/login_bloc.dart': UNORGANIZED,
    'lib/multiline.dart': multiline,
  });

  assert.equal(runScript(SCRIPT, ['lib', '--check'], cwd).code, 1);
  assert.equal(runScript(SCRIPT, ['lib', '--dry-run'], cwd).code, 0);
  assert.equal(fs.readFileSync(path.join(cwd, 'lib/login_bloc.dart'), 'utf8'), UNORGANIZED);

  const write = runScript(SCRIPT, ['lib', '--write'], cwd);
  assert.equal(write.code, 0, write.stderr);
  assert.match(write.stdout, /Skipped/);
  assert.equal(fs.readFileSync(path.join(cwd, 'lib/login_bloc.dart'), 'utf8'), ORGANIZED);
  assert.equal(fs.readFileSync(path.join(cwd, 'lib/multiline.dart'), 'utf8'), multiline);

  assert.equal(runScript(SCRIPT, ['lib/login_bloc.dart', '--check'], cwd).code, 0);
});
