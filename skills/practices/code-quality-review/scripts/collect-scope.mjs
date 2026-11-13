#!/usr/bin/env node
// collect-scope: lista los archivos que cambió una rama o el árbol de trabajo, los clasifica
// por área (frontend, backend, datos, tests, config/docs) y recomienda qué lentes aplicar.
// Solo lectura: ejecuta `git diff` y `git ls-files`; no modifica nada.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const HELP = `collect-scope: clasifica los archivos cambiados y recomienda lentes de revisión (solo lectura).

Uso:
  node <skill-dir>/scripts/collect-scope.mjs [opciones] [-- rutas...]
  (sin git, indica las rutas a revisar tras '--' y se clasifican tal cual)

Opciones:
  --base <ref>   Compara contra el ancestro común con <ref> (por defecto main, master o develop si existe).
  --working      Solo cambios sin commitear (staged, unstaged y archivos nuevos).
  --cwd <dir>    Directorio del repositorio (por defecto, el actual).
  --json         Salida JSON.
  -h, --help     Muestra esta ayuda.

Salida: archivos por área, líneas añadidas/eliminadas y lentes recomendadas
(clean-code, solid-principles, design-patterns, tdd-workflow, frontend-best-practices, backend-best-practices).
Códigos de salida: 0 informe generado, 2 error de uso o de git.`;

const args = process.argv.slice(2);
const opts = { base: null, working: false, cwd: process.cwd(), json: false, paths: [] };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '-h' || a === '--help') { console.log(HELP); process.exit(0); }
  else if (a === '--json') opts.json = true;
  else if (a === '--working') opts.working = true;
  else if (a === '--base') opts.base = args[++i];
  else if (a === '--cwd') opts.cwd = path.resolve(args[++i] ?? '');
  else if (a === '--') { opts.paths = args.slice(i + 1); break; }
  else { console.error(`Opción desconocida: ${a}\n\n${HELP}`); process.exit(2); }
}
if (opts.base === undefined || (args.includes('--base') && !opts.base)) {
  console.error('--base requiere un valor'); process.exit(2);
}

function git(...gitArgs) {
  return execFileSync('git', gitArgs, { cwd: opts.cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
function refExists(ref) {
  try { git('rev-parse', '--verify', '--quiet', ref); return true; } catch { return false; }
}

let isRepo = true;
try { git('rev-parse', '--is-inside-work-tree'); } catch { isRepo = false; }
if (!isRepo && opts.paths.length === 0) {
  console.error('No es un repositorio git. Indica los archivos a revisar: collect-scope.mjs -- <rutas...>');
  process.exit(2);
}

let baseRef = null;
if (isRepo && !opts.working) {
  baseRef = opts.base ?? ['main', 'master', 'develop'].find(refExists) ?? null;
  if (opts.base && !refExists(opts.base)) { console.error(`La referencia ${opts.base} no existe.`); process.exit(2); }
}

const pathspec = opts.paths.length ? ['--', ...opts.paths] : [];
const changed = new Map(); // archivo -> { added, removed, status }

function addNumstat(output) {
  for (const line of output.split('\n').filter(Boolean)) {
    const [add, del, ...rest] = line.split('\t');
    const file = rest.join('\t');
    const prev = changed.get(file) ?? { added: 0, removed: 0, status: 'modified' };
    prev.added += add === '-' ? 0 : Number(add);
    prev.removed += del === '-' ? 0 : Number(del);
    changed.set(file, prev);
  }
}

let mode;
if (!isRepo) {
  // Sin git: se clasifican las rutas indicadas (archivos o directorios) tal cual.
  mode = 'lista manual (sin git)';
  const walk = (target) => {
    const abs = path.resolve(opts.cwd, target);
    let stat; try { stat = statSync(abs); } catch { return; }
    if (stat.isDirectory()) {
      for (const entry of readdirSync(abs)) { if (!['node_modules', '.git'].includes(entry)) walk(path.join(target, entry)); }
    } else {
      let lines = 0; try { lines = readFileSync(abs, 'utf8').split('\n').length; } catch { /* binario */ }
      changed.set(path.normalize(target).split(path.sep).join('/'), { added: lines, removed: 0, status: 'new' });
    }
  };
  for (const p of opts.paths) walk(p);
} else try {
  let mergeBase = null;
  if (baseRef) {
    try { mergeBase = git('merge-base', baseRef, 'HEAD').trim(); } catch { mergeBase = null; }
  }
  if (mergeBase && git('rev-parse', 'HEAD').trim() !== mergeBase) {
    mode = `rama contra ${baseRef}`;
    addNumstat(git('diff', '--numstat', mergeBase, 'HEAD', ...pathspec));
  } else {
    mode = 'árbol de trabajo';
  }
  // Cambios sin commitear (siempre se incluyen)
  addNumstat(git('diff', '--numstat', 'HEAD', ...pathspec));
  for (const file of git('ls-files', '--others', '--exclude-standard', ...pathspec).split('\n').filter(Boolean)) {
    let lines = 0;
    try { lines = git('diff', '--no-index', '--numstat', '/dev/null', file).split('\t')[0] | 0; } catch (e) {
      const out = String(e.stdout ?? ''); lines = Number(out.split('\t')[0]) || 0;
    }
    changed.set(file, { added: lines, removed: 0, status: 'new' });
  }
} catch (error) {
  console.error(`Error de git: ${String(error.stderr ?? error.message).trim()}`);
  process.exit(2);
}

const TEST_RE = /(^|\/)(__tests__|tests?|spec|e2e)\/|\.(test|spec)\.[a-z]+$|_test\.(go|py)$|(^|\/)test_[^/]+\.py$/i;
const FRONT_EXT = /\.(tsx|jsx|vue|svelte|astro|css|scss|sass|less|html)$/i;
const FRONT_DIR = /(^|\/)(components|pages|app|views|screens|hooks|styles|ui)\//i;
const BACK_DIR = /(^|\/)(api|routes?|controllers?|services?|handlers?|resolvers?|middlewares?|repositories|repository|modules|server|workers?|jobs|queues?)\//i;
const CODE_EXT = /\.(ts|js|mjs|cjs|py|go|rs|java|kt|rb|php|cs)$/i;
const DATA_RE = /\.(sql|prisma)$|(^|\/)(migrations?|schema|seeds?)\//i;
const DOC_RE = /\.(md|mdx|txt|ya?ml|json|toml|lock|svg|png|jpe?g|gif|ico)$|(^|\/)(\.github|\.husky|docs)\//i;

function classify(file) {
  if (TEST_RE.test(file)) return 'tests';
  if (DATA_RE.test(file)) return 'data';
  if (FRONT_EXT.test(file)) return 'frontend';
  if (CODE_EXT.test(file) && FRONT_DIR.test(file) && !BACK_DIR.test(file)) return 'frontend';
  if (CODE_EXT.test(file) && BACK_DIR.test(file)) return 'backend';
  if (CODE_EXT.test(file)) return 'code';
  if (DOC_RE.test(file)) return 'config-docs';
  return 'other';
}

const areas = { frontend: [], backend: [], data: [], code: [], tests: [], 'config-docs': [], other: [] };
let added = 0; let removed = 0;
for (const [file, info] of [...changed.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  areas[classify(file)].push({ file, added: info.added, removed: info.removed, status: info.status });
  added += info.added; removed += info.removed;
}

const sourceCount = areas.frontend.length + areas.backend.length + areas.data.length + areas.code.length;
const lenses = [];
if (sourceCount > 0) lenses.push({ skill: 'clean-code', why: 'hay código fuente cambiado' });
if (areas.frontend.length) lenses.push({ skill: 'frontend-best-practices', why: `${areas.frontend.length} archivo(s) de interfaz` });
if (areas.backend.length || areas.data.length) lenses.push({ skill: 'backend-best-practices', why: `${areas.backend.length + areas.data.length} archivo(s) de servidor o datos` });
if (areas.backend.length + areas.code.length + areas.frontend.length >= 3) lenses.push({ skill: 'solid-principles', why: 'varias unidades de código: revisa responsabilidades y dependencias' });
if (sourceCount > 0) lenses.push({ skill: 'design-patterns', why: 'solo si el cambio introduce o debería introducir un patrón (condicional)', conditional: true });
if (sourceCount > 0) lenses.push({ skill: 'tdd-workflow', why: areas.tests.length ? 'hay tests cambiados: comprobar que cubren el cambio' : 'cambia código sin tests: revisar la cobertura del cambio' });

const warnings = [];
if (sourceCount > 0 && areas.tests.length === 0) warnings.push('Cambia código fuente sin tocar ningún test.');
if (added + removed > 800) warnings.push(`Cambio grande (${added + removed} líneas): revisa por partes o por área.`);
if (changed.size === 0) warnings.push('No se detectaron cambios.');

const result = { mode, base: baseRef, files: changed.size, added, removed, areas, lenses, warnings };

if (opts.json) { console.log(JSON.stringify(result, null, 2)); process.exit(0); }

console.log(`Alcance: ${mode} · ${changed.size} archivo(s) · +${added} −${removed}`);
for (const [area, items] of Object.entries(areas)) {
  if (!items.length) continue;
  console.log(`\n${area} (${items.length})`);
  for (const item of items) console.log(`  ${item.status === 'new' ? '+' : ' '} ${item.file}  +${item.added} −${item.removed}`);
}
if (lenses.length) {
  console.log('\nLentes recomendadas');
  for (const lens of lenses) console.log(`  - ${lens.skill}${lens.conditional ? ' (condicional)' : ''}: ${lens.why}`);
}
if (warnings.length) {
  console.log('\nAvisos');
  for (const w of warnings) console.log(`  ! ${w}`);
}
