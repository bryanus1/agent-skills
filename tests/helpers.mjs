import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Creates a temp directory that is removed when the test finishes. */
export function makeTempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-skills-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** Runs a Node script from the repo with `cwd` as working directory. */
export function runScript(scriptPath, args, cwd) {
  const result = spawnSync(process.execPath, [path.join(rootDir, scriptPath), ...args], { cwd, encoding: 'utf8' });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** Lists every file under `dir` as sorted POSIX paths relative to it. */
export function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else results.push(path.relative(dir, full).split(path.sep).join('/'));
    }
  };
  walk(dir);
  return results.sort();
}

/** Writes `files` ({ relativePath: content }) under `dir`. */
export function writeFiles(dir, files) {
  for (const [relativePath, content] of Object.entries(files)) {
    const full = path.join(dir, relativePath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }
}
