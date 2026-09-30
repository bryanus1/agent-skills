// File templates for internal workspace packages. Every function returns
// [{ path, content }] with absolute paths, ready for applyFiles().

import path from 'node:path';
import { json, toCamelCase } from './scaffold.mjs';

export const PACKAGE_KINDS = ['lib', 'contracts', 'api-client', 'config'];

const LIB_SCRIPTS = {
  build: 'tsc -p tsconfig.json',
  dev: 'tsc -p tsconfig.json --watch',
  typecheck: 'tsc -p tsconfig.json --noEmit',
  lint: 'eslint src',
  test: 'vitest run --passWithNoTests',
};

// Compiled packages: `exports` always points at dist/, never at src/.
const entry = (subdir) => ({ types: `./dist/${subdir}index.d.ts`, default: `./dist/${subdir}index.js` });
export const exportEntry = entry;

function libraryPackage({ root, scope, name, exportsMap, dependencies, devDependencies, scripts, files }) {
  const dir = path.join(root, 'packages', name);
  const pkg = {
    name: `@${scope}/${name}`,
    version: '0.0.0',
    private: true,
    files: ['dist'],
    exports: exportsMap,
    scripts: { ...LIB_SCRIPTS, ...scripts },
    ...(dependencies ? { dependencies } : {}),
    devDependencies: {
      [`@${scope}/eslint-config`]: 'workspace:*',
      [`@${scope}/tsconfig`]: 'workspace:*',
      eslint: '^9.0.0',
      typescript: '^5.6.0',
      vitest: '^3.0.0',
      ...devDependencies,
    },
  };
  const tsconfig = {
    extends: `@${scope}/tsconfig/library.json`,
    compilerOptions: { outDir: 'dist', rootDir: 'src' },
    include: ['src'],
    exclude: ['dist', 'src/**/*.test.ts'],
  };
  return [
    { path: path.join(dir, 'package.json'), content: json(pkg) },
    { path: path.join(dir, 'tsconfig.json'), content: json(tsconfig) },
    { path: path.join(dir, 'eslint.config.mjs'), content: `export { default } from '@${scope}/eslint-config/base';\n` },
    ...Object.entries(files).map(([rel, content]) => ({ path: path.join(dir, rel), content })),
  ];
}

function libFiles({ root, scope, name }) {
  const fn = `${toCamelCase(name)}Ready`;
  return libraryPackage({
    root,
    scope,
    name,
    exportsMap: { '.': entry('') },
    files: {
      'src/index.ts': `/**
 * Public API of @${scope}/${name}.
 * Only what is exported here can be imported by other workspaces.
 * TODO: replace this placeholder with the package's real API.
 */
export function ${fn}(): boolean {
  return true;
}
`,
      'src/index.test.ts': `import { describe, expect, it } from 'vitest';
import { ${fn} } from './index';

describe('@${scope}/${name}', () => {
  it('exposes its public API', () => {
    expect(${fn}()).toBe(true);
  });
});
`,
    },
  });
}

function contractsFiles({ root, scope, name }) {
  return libraryPackage({
    root,
    scope,
    name,
    // One subpath per domain folder: import from '@scope/contracts/<nouns>'.
    exportsMap: { './common': entry('common/') },
    dependencies: { zod: '^3.23.0' },
    files: {
      'src/common/pagination.schema.ts': `import { z } from 'zod';

/** Query parameters shared by every paginated list endpoint. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Envelope returned by paginated endpoints. */
export const paginatedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
  });
`,
      'src/common/index.ts': `export * from './pagination.schema';\n`,
    },
  });
}

function apiClientFiles({ root, scope, name }) {
  return libraryPackage({
    root,
    scope,
    name,
    exportsMap: { './client': entry('client/'), './schema': entry('generated/') },
    dependencies: { 'openapi-fetch': '^0.13.0' },
    devDependencies: { 'openapi-typescript': '^7.0.0' },
    // NestJS serves the OpenAPI document at /<swagger-path>-json (SwaggerModule.setup('api', ...) → /api-json).
    scripts: {
      generate: 'openapi-typescript http://localhost:3000/api-json -o src/generated/schema.ts',
      // Generated code is never linted.
      lint: 'eslint src --ignore-pattern "src/generated/**"',
    },
    files: {
      'src/generated/schema.ts': `/**
 * Placeholder. Regenerate from the API's OpenAPI document with:
 *   pnpm --filter @${scope}/${name} generate
 * Never edit this file by hand.
 */
export interface paths {}
export interface components {}
export interface operations {}
`,
      'src/generated/index.ts': `export type * from './schema';\n`,
      'src/client/create-api-client.ts': `import createClient from 'openapi-fetch';
import type { paths } from '../generated';

/** Typed HTTP client for the API. Types come from the generated OpenAPI schema. */
export function createApiClient(baseUrl: string) {
  return createClient<paths>({ baseUrl });
}

export type ApiClient = ReturnType<typeof createApiClient>;
`,
      'src/client/create-api-client.test.ts': `import { describe, expect, it } from 'vitest';
import { createApiClient } from './create-api-client';

describe('createApiClient', () => {
  it('returns a client with typed HTTP methods', () => {
    const client = createApiClient('http://localhost:3000');
    expect(typeof client.GET).toBe('function');
    expect(typeof client.POST).toBe('function');
  });
});
`,
      'src/client/index.ts': `export * from './create-api-client';\n`,
    },
  });
}

function configFiles({ root, scope, name }) {
  const dir = path.join(root, 'packages', name);
  return [
    {
      path: path.join(dir, 'package.json'),
      content: json({ name: `@${scope}/${name}`, version: '0.0.0', private: true, files: ['*.json', '*.js', '*.mjs'], exports: { './*': './*' } }),
    },
    {
      path: path.join(dir, 'README.md'),
      content: `# @${scope}/${name}\n\nShared configuration files. Consumers reference them by path, e.g. \`@${scope}/${name}/<file>\`.\n`,
    },
  ];
}

export function packageFiles({ root, scope, name, kind }) {
  switch (kind) {
    case 'lib':
      return libFiles({ root, scope, name });
    case 'contracts':
      return contractsFiles({ root, scope, name });
    case 'api-client':
      return apiClientFiles({ root, scope, name });
    case 'config':
      return configFiles({ root, scope, name });
    default:
      throw new Error(`Unknown package kind '${kind}'.`);
  }
}

export function tsconfigPackageFiles({ root, scope }) {
  const dir = path.join(root, 'packages', 'tsconfig');
  const base = {
    $schema: 'https://json.schemastore.org/tsconfig',
    compilerOptions: {
      target: 'ES2022',
      lib: ['ES2022'],
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
    },
  };
  // Node16 resolution honours package.json "exports" in both libraries and NestJS.
  const library = { extends: './base.json', compilerOptions: { module: 'Node16', moduleResolution: 'Node16' } };
  const nestjs = {
    extends: './base.json',
    compilerOptions: {
      module: 'Node16',
      moduleResolution: 'Node16',
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      strictPropertyInitialization: false,
    },
  };
  const nextjs = {
    extends: './base.json',
    compilerOptions: {
      lib: ['DOM', 'DOM.Iterable', 'ES2022'],
      module: 'ESNext',
      moduleResolution: 'Bundler',
      jsx: 'preserve',
      allowJs: true,
      noEmit: true,
      incremental: true,
      isolatedModules: true,
      declaration: false,
      declarationMap: false,
      plugins: [{ name: 'next' }],
    },
  };
  return [
    { path: path.join(dir, 'package.json'), content: json({ name: `@${scope}/tsconfig`, version: '0.0.0', private: true, files: ['*.json'] }) },
    { path: path.join(dir, 'base.json'), content: json(base) },
    { path: path.join(dir, 'library.json'), content: json(library) },
    { path: path.join(dir, 'nestjs.json'), content: json(nestjs) },
    { path: path.join(dir, 'nextjs.json'), content: json(nextjs) },
  ];
}

export function eslintConfigPackageFiles({ root, scope }) {
  const dir = path.join(root, 'packages', 'eslint-config');
  const pkg = {
    name: `@${scope}/eslint-config`,
    version: '0.0.0',
    private: true,
    type: 'module',
    exports: { './base': './base.js' },
    dependencies: { '@eslint/js': '^9.0.0', 'typescript-eslint': '^8.0.0' },
    peerDependencies: { eslint: '^9.0.0' },
  };
  return [
    { path: path.join(dir, 'package.json'), content: json(pkg) },
    {
      path: path.join(dir, 'base.js'),
      content: `import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/** Base flat config shared by every workspace. Apps extend it with their framework rules. */
export default tseslint.config(
  { ignores: ['dist/**', '.next/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
`,
    },
  ];
}
