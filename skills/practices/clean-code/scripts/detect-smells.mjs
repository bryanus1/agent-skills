#!/usr/bin/env node
// Heuristic, dependency-free code smell detector for JS/TS files.
// Reports long functions, deep nesting, too many parameters, long files,
// magic numbers, nested ternaries and TODO/FIXME markers. Read-only.
// Usage: node detect-smells.mjs [paths...] [--json] [--max-lines N] [--max-depth N]
//        [--max-params N] [--max-file-lines N] [--fail-on-findings] [--help]

import fs from 'node:fs';
import path from 'node:path';

const HELP = `detect-smells: detector heurístico de code smells para JS/TS (solo lectura).

Uso:
  node <skill-dir>/scripts/detect-smells.mjs [rutas...] [opciones]

Rutas: archivos o directorios. Por defecto, src/ si existe; si no, el directorio actual.

Opciones:
  --json                 Salida JSON.
  --max-lines <n>        Líneas máximas por función (por defecto 40).
  --max-depth <n>        Anidamiento máximo de bloques de control por función (por defecto 3).
  --max-params <n>       Parámetros máximos por función (por defecto 3).
  --max-file-lines <n>   Líneas máximas por archivo (por defecto 300).
  --fail-on-findings     Sale con código 1 si hay hallazgos.
  -h, --help             Muestra esta ayuda.

Reglas: long-function, deep-nesting, too-many-params, long-file, magic-number,
nested-ternary, todo-comment. Son señales para revisar, no veredictos.
Códigos de salida: 0 informe generado, 1 hallazgos con --fail-on-findings, 2 error de uso.`;

const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.mts', '.cts']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage', 'out', 'vendor']);
const CONTROL_KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'with']);
const CONTROL_BARE = new Set(['else', 'try', 'finally', 'do']);
const NOT_FUNCTION_NAMES = new Set([...CONTROL_KEYWORDS, 'return', 'typeof', 'new', 'await', 'yield', 'in', 'of', 'super', 'import']);
const ALLOWED_NUMBERS = new Set(['0', '1', '-1', '2']);
const MAX_MAGIC_PER_FILE = 10;
const REGEX_PRECEDERS = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '~', '^']); // not '<' or '>': JSX closing tags (</p>) are not regexes

function parseArgs(argv) {
  const opts = { paths: [], json: false, failOnFindings: false, maxLines: 40, maxDepth: 3, maxParams: 3, maxFileLines: 300 };
  const numeric = { '--max-lines': 'maxLines', '--max-depth': 'maxDepth', '--max-params': 'maxParams', '--max-file-lines': 'maxFileLines' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') opts.help = true;
    else if (arg === '--json') opts.json = true;
    else if (arg === '--fail-on-findings') opts.failOnFindings = true;
    else if (numeric[arg]) {
      const value = Number(argv[++i]);
      if (!Number.isInteger(value) || value < 0) throw new Error(`${arg} requiere un entero >= 0`);
      opts[numeric[arg]] = value;
    } else if (arg.startsWith('-')) throw new Error(`Opción desconocida: ${arg}`);
    else opts.paths.push(arg);
  }
  return opts;
}

function collectFiles(target, out) {
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    if (EXTENSIONS.has(path.extname(target)) && !/\.d\.[cm]?ts$|\.min\.js$/.test(target)) out.push(target);
    return;
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    collectFiles(path.join(target, entry.name), out);
  }
}

/**
 * Blanks out comments, strings, template literal text and regex literals,
 * keeping newlines and character offsets, so structural scanning is safe.
 */
function stripCode(src) {
  const out = src.split('');
  const blank = (from, to) => {
    for (let k = from; k < to; k++) if (out[k] !== '\n') out[k] = ' ';
  };
  const templateDepth = []; // brace depth at which each open `${` started
  let braceDepth = 0;
  let i = 0;
  const lastSignificant = (pos) => {
    let k = pos - 1;
    while (k >= 0 && /\s/.test(out[k])) k--;
    return k;
  };
  const scanTemplate = (start) => {
    // `start` points just after an opening backtick or a closing `}` of `${}`.
    let k = start;
    while (k < src.length) {
      if (src[k] === '\\') { k += 2; continue; }
      if (src[k] === '`') { blank(start, k); return { end: k + 1, interpolation: false }; }
      if (src[k] === '$' && src[k + 1] === '{') { blank(start, k); return { end: k + 2, interpolation: true }; }
      k++;
    }
    blank(start, src.length);
    return { end: src.length, interpolation: false };
  };

  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];
    if (ch === '/' && next === '/') {
      const end = src.indexOf('\n', i);
      const stop = end === -1 ? src.length : end;
      blank(i, stop);
      i = stop;
    } else if (ch === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? src.length : end + 2;
      blank(i, stop);
      i = stop;
    } else if (ch === '"' || ch === "'") {
      // JS strings cannot span lines: stopping at a newline limits the damage of
      // apostrophes in JSX text ("Don't").
      let k = i + 1;
      while (k < src.length && src[k] !== ch && src[k] !== '\n') k += src[k] === '\\' ? 2 : 1;
      blank(i + 1, Math.min(k, src.length));
      i = k + 1;
    } else if (ch === '`') {
      const { end, interpolation } = scanTemplate(i + 1);
      if (interpolation) templateDepth.push(braceDepth);
      i = end;
    } else if (ch === '{') {
      braceDepth++;
      i++;
    } else if (ch === '}') {
      if (templateDepth.length && templateDepth[templateDepth.length - 1] === braceDepth) {
        templateDepth.pop();
        const { end, interpolation } = scanTemplate(i + 1);
        if (interpolation) templateDepth.push(braceDepth);
        i = end;
      } else {
        braceDepth--;
        i++;
      }
    } else if (ch === '/') {
      const prevIndex = lastSignificant(i);
      const prev = prevIndex >= 0 ? out[prevIndex] : '';
      const prevWord = /[\w$]/.test(prev) ? out.slice(0, prevIndex + 1).join('').match(/[\w$]+$/)[0] : '';
      const isRegex = prevIndex < 0 || REGEX_PRECEDERS.has(prev) || ['return', 'typeof', 'case', 'in', 'of'].includes(prevWord);
      if (!isRegex) { i++; continue; }
      let k = i + 1;
      let inClass = false;
      while (k < src.length && src[k] !== '\n') {
        if (src[k] === '\\') { k += 2; continue; }
        if (src[k] === '[') inClass = true;
        else if (src[k] === ']') inClass = false;
        else if (src[k] === '/' && !inClass) break;
        k++;
      }
      if (src[k] !== '/') { i++; continue; } // not a regex after all (e.g. division)
      blank(i + 1, k);
      i = k + 1;
    } else {
      i++;
    }
  }
  return out.join('');
}

function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return starts;
}

function lineOf(starts, offset) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

function countParams(text) {
  if (!text.trim()) return 0;
  let depth = 0;
  let count = 1;
  for (const ch of text) {
    if ('([{<'.includes(ch)) depth++;
    else if (')]}>'.includes(ch)) depth--;
    else if (ch === ',' && depth === 0) count++;
  }
  return text.trim().endsWith(',') ? count - 1 : count;
}

function wordBefore(code, pos) {
  let k = pos - 1;
  while (k >= 0 && /\s/.test(code[k])) k--;
  if (code[k] === '>') {
    // skip a generic parameter list: foo<T>(...)
    let depth = 0;
    for (; k >= 0; k--) {
      if (code[k] === '>') depth++;
      else if (code[k] === '<' && --depth === 0) { k--; break; }
    }
    while (k >= 0 && /\s/.test(code[k])) k--;
  }
  const match = code.slice(Math.max(0, k - 80), k + 1).match(/[\w$]+$/);
  return match ? { word: match[0], start: k + 1 - match[0].length } : { word: '', start: k + 1 };
}

function assignedName(code, pos) {
  const before = code.slice(Math.max(0, pos - 160), pos);
  const assign = before.match(/([\w$]+)\s*(?::[^=;{}()]*)?=\s*(?:async\s*)?(?:function\s*\*?\s*)?(?:<[^<>]*>\s*)?$/);
  if (assign) return assign[1];
  const property = before.match(/([\w$]+)\s*:\s*(?:async\s*)?(?:function\s*\*?\s*)?$/);
  return property ? property[1] : null;
}

/**
 * Walks back from `k` (last char before a `{`) over a return type annotation
 * such as `): Promise<{ ok: boolean }>` and returns the offset of the `)` that
 * closes the parameter list, or -1.
 */
function findAnnotatedClose(code, k, closeToOpen) {
  let depth = 0;
  for (let j = k; j >= 0 && k - j < 300; j--) {
    const c = code[j];
    if (c === '>' && code[j - 1] === '=') { j--; continue; } // `=>` inside a function type
    if ('>}]'.includes(c)) depth++;
    else if ('<{['.includes(c)) {
      if (--depth < 0) return -1;
    } else if (c === ')') {
      if (depth === 0 && /^\s*:/.test(code.slice(j + 1, k + 1))) return j;
      if (!closeToOpen.has(j)) return -1;
      j = closeToOpen.get(j); // skip a parenthesized part of the type
    } else if (depth === 0 && (c === ';' || c === '=' || c === '(')) return -1;
  }
  return -1;
}

/**
 * Classifies the `{` at `pos`: a function body, a control block or anything else
 * (object literal, class body, type, plain block). Returns function metadata.
 */
function classifyBrace(code, pos, closeToOpen) {
  let k = pos - 1;
  while (k >= 0 && /\s/.test(code[k])) k--;

  // Arrow function body: `=> {`
  if (code[k] === '>' && code[k - 1] === '=') {
    let a = k - 2;
    while (a >= 0 && /\s/.test(code[a])) a--;
    // optional return type between `)` and `=>` is rare enough to ignore
    if (code[a] === ')' && closeToOpen.has(a)) {
      const open = closeToOpen.get(a);
      return { type: 'fn', name: assignedName(code, open) ?? '<anonymous>', params: countParams(code.slice(open + 1, a)), head: open };
    }
    const single = code.slice(0, a + 1).match(/([\w$]+)$/);
    if (single) return { type: 'fn', name: assignedName(code, a + 1 - single[1].length) ?? '<anonymous>', params: 1, head: a };
    return { type: 'other' };
  }

  // Bare control keywords: else { / try { / finally { / do {
  const bare = code.slice(Math.max(0, k - 10), k + 1).match(/[\w$]+$/);
  if (bare && CONTROL_BARE.has(bare[0])) return { type: 'control' };

  // `) {` possibly with a return type annotation in between: `): Promise<X> {`
  const close = code[k] === ')' ? k : findAnnotatedClose(code, k, closeToOpen);
  if (close >= 0 && closeToOpen.has(close)) {
    const open = closeToOpen.get(close);
    const { word, start } = wordBefore(code, open);
    if (CONTROL_KEYWORDS.has(word)) return { type: 'control' };
    if (word === 'function') {
      return { type: 'fn', name: assignedName(code, start) ?? '<anonymous>', params: countParams(code.slice(open + 1, close)), head: open };
    }
    if (word && !NOT_FUNCTION_NAMES.has(word) && !/^\d/.test(word)) {
      return { type: 'fn', name: word, params: countParams(code.slice(open + 1, close)), head: open };
    }
  }
  return { type: 'other' };
}

function analyzeFunctions(code, starts, opts, findings, file) {
  const closeToOpen = new Map();
  const parenStack = [];
  const braceStack = [];
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (ch === '(') parenStack.push(i);
    else if (ch === ')') {
      if (parenStack.length) closeToOpen.set(i, parenStack.pop());
    } else if (ch === '{') {
      const info = classifyBrace(code, i, closeToOpen);
      const entry = { ...info, open: i, maxDepth: 0 };
      braceStack.push(entry);
      if (info.type === 'control') {
        // depth of control blocks since the innermost enclosing function
        let depth = 0;
        let fn = null;
        for (let s = braceStack.length - 1; s >= 0; s--) {
          if (braceStack[s].type === 'fn') { fn = braceStack[s]; break; }
          if (braceStack[s].type === 'control') depth++;
        }
        if (fn) fn.maxDepth = Math.max(fn.maxDepth, depth);
      }
    } else if (ch === '}') {
      const entry = braceStack.pop();
      if (!entry || entry.type !== 'fn') continue;
      const line = lineOf(starts, entry.head);
      const lines = lineOf(starts, i) - lineOf(starts, entry.open) + 1;
      const symbol = entry.name;
      if (lines > opts.maxLines) {
        findings.push({ file, line, rule: 'long-function', symbol, value: lines, max: opts.maxLines, message: `${symbol}: ${lines} líneas (máx. ${opts.maxLines})` });
      }
      if (entry.maxDepth > opts.maxDepth) {
        findings.push({ file, line, rule: 'deep-nesting', symbol, value: entry.maxDepth, max: opts.maxDepth, message: `${symbol}: anidamiento ${entry.maxDepth} (máx. ${opts.maxDepth})` });
      }
      if (entry.params > opts.maxParams) {
        findings.push({ file, line, rule: 'too-many-params', symbol, value: entry.params, max: opts.maxParams, message: `${symbol}: ${entry.params} parámetros (máx. ${opts.maxParams})` });
      }
    }
  }
}

function isTernaryMark(code, i) {
  if (code[i] !== '?') return false;
  const next = code[i + 1];
  const prev = code[i - 1];
  if (next === '.' || next === '?' || prev === '?') return false; // ?. and ??
  let k = i + 1;
  while (k < code.length && /\s/.test(code[k])) k++;
  return ![':', ')', ',', '=', ';'].includes(code[k]); // TS optional members/params
}

function analyzeFile(file, opts) {
  const src = fs.readFileSync(file, 'utf8');
  const code = stripCode(src);
  const starts = lineStarts(code);
  const rawLines = src.split('\n');
  const findings = [];
  const rel = path.relative(process.cwd(), file).split(path.sep).join('/') || file;

  const totalLines = rawLines.length - (src.endsWith('\n') ? 1 : 0);
  if (totalLines > opts.maxFileLines) {
    findings.push({ file: rel, line: 1, rule: 'long-file', symbol: null, value: totalLines, max: opts.maxFileLines, message: `${totalLines} líneas (máx. ${opts.maxFileLines})` });
  }

  analyzeFunctions(code, starts, opts, findings, rel);

  // Nested ternaries: two or more ternary `?` within one statement.
  let statementStart = 0;
  let ternaries = 0;
  for (let i = 0; i <= code.length; i++) {
    const ch = code[i];
    if (i === code.length || ch === ';' || ch === '{' || ch === '}') {
      if (ternaries >= 2) {
        const line = lineOf(starts, statementStart + code.slice(statementStart).search(/\S/));
        findings.push({ file: rel, line, rule: 'nested-ternary', symbol: null, value: ternaries, max: 1, message: `${ternaries} ternarios encadenados en una expresión` });
      }
      ternaries = 0;
      statementStart = i + 1;
    } else if (isTernaryMark(code, i)) ternaries++;
  }

  // Magic numbers (skipped in test files, constant declarations, enums and imports).
  if (!/\.(test|spec)\.[cm]?[jt]sx?$/.test(file)) {
    const codeLines = code.split('\n');
    let magic = 0;
    let skipped = 0;
    let inEnum = false;
    codeLines.forEach((text, index) => {
      if (/\benum\s+[\w$]+\s*\{/.test(text)) inEnum = true;
      if (inEnum) {
        if (text.includes('}')) inEnum = false;
        return;
      }
      if (/^\s*(export\s+)?const\s+[A-Z][A-Z0-9_]*\s*(:[^=]+)?=/.test(text) || /^\s*import\b/.test(text)) return;
      for (const m of text.matchAll(/(?<![\w$.])(-?\d+(?:\.\d+)?(?:e\d+)?)(?![\w$.])/gi)) {
        if (ALLOWED_NUMBERS.has(m[1])) continue;
        // array index access like items[3] is reported too: it hides meaning
        if (magic < MAX_MAGIC_PER_FILE) {
          findings.push({ file: rel, line: index + 1, rule: 'magic-number', symbol: null, value: Number(m[1]), max: null, message: `número mágico ${m[1]}` });
          magic++;
        } else skipped++;
      }
    });
    if (skipped) {
      findings.push({ file: rel, line: 1, rule: 'magic-number', symbol: null, value: skipped, max: null, message: `y ${skipped} números mágicos más (no listados)` });
    }
  }

  // TODO / FIXME markers.
  rawLines.forEach((text, index) => {
    const marker = text.match(/(?:\/\/|\/\*|\*)\s*(TODO|FIXME|HACK|XXX)\b/);
    if (marker) findings.push({ file: rel, line: index + 1, rule: 'todo-comment', symbol: null, value: marker[1], max: null, message: `marcador ${marker[1]} pendiente` });
  });

  return findings.sort((a, b) => a.line - b.line || a.rule.localeCompare(b.rule));
}

function printHuman(result) {
  const byFile = new Map();
  for (const f of result.findings) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file).push(f);
  }
  const lines = [];
  for (const [file, findings] of byFile) {
    lines.push(file);
    for (const f of findings) lines.push(`  ${String(f.line).padStart(5)}  ${f.rule.padEnd(16)} ${f.message}`);
    lines.push('');
  }
  const counts = Object.entries(result.summary).map(([rule, n]) => `${rule}: ${n}`).join(', ');
  lines.push(`${result.findings.length} hallazgos en ${byFile.size} de ${result.scanned} archivos analizados${counts ? ` (${counts})` : ''}.`);
  lines.push('Son señales heurísticas: confirma cada una leyendo el código antes de refactorizar.');
  console.log(lines.join('\n'));
}

try {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(HELP);
    process.exit(0);
  }
  const targets = opts.paths.length ? opts.paths : [fs.existsSync('src') ? 'src' : '.'];
  const files = [];
  for (const target of targets) {
    if (!fs.existsSync(target)) throw new Error(`No existe la ruta: ${target}`);
    collectFiles(path.resolve(target), files);
  }
  const findings = files.flatMap((file) => analyzeFile(file, opts));
  const summary = findings.reduce((acc, f) => ({ ...acc, [f.rule]: (acc[f.rule] ?? 0) + 1 }), {});
  const result = {
    scanned: files.length,
    thresholds: { maxLines: opts.maxLines, maxDepth: opts.maxDepth, maxParams: opts.maxParams, maxFileLines: opts.maxFileLines },
    summary,
    findings,
  };
  if (opts.json) console.log(JSON.stringify(result, null, 2));
  else printHuman(result);
  process.exit(opts.failOnFindings && findings.length ? 1 : 0);
} catch (error) {
  console.error(`Error: ${error.message}`);
  console.error('Usa --help para ver las opciones.');
  process.exit(2);
}
