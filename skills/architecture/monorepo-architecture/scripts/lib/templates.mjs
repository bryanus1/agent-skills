// File templates for internal workspace packages and app wiring.
// Every function returns [{ path, content }] with absolute paths, ready for applyFiles().

import path from 'node:path';
import { json, toCamelCase } from './scaffold.mjs';

export const PACKAGE_KINDS = ['lib', 'contracts', 'api-client', 'design-tokens', 'ui-web', 'ui-native', 'config'];
export const LINTER_MODES = ['oxc', 'eslint', 'both'];

// Compiled packages: `exports` always points at dist/, never at src/.
const entry = (subdir) => ({ types: `./dist/${subdir}index.d.ts`, default: `./dist/${subdir}index.js` });
export const exportEntry = entry;

function lintConfigFor({ scope, linter = 'oxc', ignoreGenerated = false }) {
  const useOxc = linter === 'oxc' || linter === 'both';
  const useEslint = linter === 'eslint' || linter === 'both';

  const lintParts = [];
  if (useOxc) lintParts.push('oxlint --deny-warnings src');
  if (useEslint) lintParts.push(ignoreGenerated ? 'eslint src --ignore-pattern "src/generated/**"' : 'eslint src');

  const scripts = { lint: lintParts.join(' && ') };
  if (useOxc) scripts['format:check'] = 'oxfmt --check src';

  const devDependencies = {};
  if (useOxc) {
    devDependencies[`@${scope}/oxc-config`] = 'workspace:*';
    devDependencies.oxlint = '^1.0.0';
    devDependencies.oxfmt = '^0.10.0';
  }
  if (useEslint) {
    devDependencies[`@${scope}/eslint-config`] = 'workspace:*';
    devDependencies.eslint = '^9.0.0';
  }

  const configFiles = {};
  if (useOxc) {
    const oxlintCfg = {
      extends: [`./node_modules/@${scope}/oxc-config/base.json`],
      ...(ignoreGenerated ? { ignorePatterns: ['src/generated/**'] } : {}),
    };
    configFiles['.oxlintrc.json'] = json(oxlintCfg);
  }
  if (useEslint) {
    configFiles['eslint.config.mjs'] = `export { default } from '@${scope}/eslint-config/base';\n`;
  }

  return { scripts, devDependencies, configFiles };
}

function libraryPackage({
  root,
  scope,
  name,
  platform = 'universal',
  linter = 'oxc',
  ignoreGenerated = false,
  exportsMap,
  dependencies,
  peerDependencies,
  devDependencies,
  scripts,
  tsconfigOverrides,
  files,
}) {
  const dir = path.join(root, 'packages', name);
  const lint = lintConfigFor({ scope, linter, ignoreGenerated });
  const pkg = {
    name: `@${scope}/${name}`,
    version: '0.0.0',
    private: true,
    monorepo: { layer: 'package', platform },
    files: ['dist'],
    exports: exportsMap,
    scripts: {
      build: 'tsc -p tsconfig.json',
      dev: 'tsc -p tsconfig.json --watch',
      typecheck: 'tsc -p tsconfig.json --noEmit',
      test: 'vitest run --passWithNoTests',
      ...lint.scripts,
      ...scripts,
    },
    ...(dependencies ? { dependencies } : {}),
    ...(peerDependencies ? { peerDependencies } : {}),
    devDependencies: {
      [`@${scope}/tsconfig`]: 'workspace:*',
      typescript: '^5.6.0',
      vitest: '^3.0.0',
      ...lint.devDependencies,
      ...devDependencies,
    },
  };
  const tsconfig = {
    extends: `@${scope}/tsconfig/library.json`,
    compilerOptions: { outDir: 'dist', rootDir: 'src', ...tsconfigOverrides },
    include: ['src'],
    exclude: ['dist', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
  };
  return [
    { path: path.join(dir, 'package.json'), content: json(pkg) },
    { path: path.join(dir, 'tsconfig.json'), content: json(tsconfig) },
    ...Object.entries({ ...lint.configFiles, ...files }).map(([rel, content]) => ({ path: path.join(dir, rel), content })),
  ];
}

function libFiles({ root, scope, name, linter }) {
  const fn = `${toCamelCase(name)}Ready`;
  return libraryPackage({
    root,
    scope,
    name,
    platform: 'universal',
    linter,
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

function contractsFiles({ root, scope, name, linter }) {
  return libraryPackage({
    root,
    scope,
    name,
    platform: 'universal',
    linter,
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

function apiClientFiles({ root, scope, name, linter }) {
  return libraryPackage({
    root,
    scope,
    name,
    platform: 'universal',
    linter,
    ignoreGenerated: true,
    exportsMap: { './client': entry('client/'), './schema': entry('generated/') },
    dependencies: { 'openapi-fetch': '^0.13.0' },
    devDependencies: { 'openapi-typescript': '^7.0.0' },
    // NestJS serves the OpenAPI document at /<swagger-path>-json (SwaggerModule.setup('api', ...) → /api-json).
    scripts: {
      generate: 'openapi-typescript ${OPENAPI_SCHEMA_URL:-http://localhost:3000/api-json} -o src/generated/schema.ts',
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
      'src/client/create-api-client.ts': `import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from '../generated';

export interface CreateApiClientOptions {
  /** Optional async header provider (e.g. Bearer token from SecureStore on mobile or cookies/headers on SSR). */
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
  fetch?: typeof globalThis.fetch;
}

/** Typed cross-platform HTTP client for the API (Web, Astro islands, and Expo Mobile). */
export function createApiClient(baseUrl: string, options: CreateApiClientOptions = {}) {
  const client = createClient<paths>({
    baseUrl,
    ...(options.fetch ? { fetch: options.fetch } : {}),
  });

  if (options.getHeaders) {
    const getHeaders = options.getHeaders;
    const authMiddleware: Middleware = {
      async onRequest({ request }) {
        const extra = await getHeaders();
        for (const [key, value] of Object.entries(extra)) {
          if (value !== undefined) request.headers.set(key, value);
        }
        return request;
      },
    };
    client.use(authMiddleware);
  }

  return client;
}

export type ApiClient = ReturnType<typeof createApiClient>;
`,
      'src/client/create-api-client.test.ts': `import { describe, expect, it } from 'vitest';
import { createApiClient } from './create-api-client';

describe('createApiClient', () => {
  it('returns a client with typed HTTP methods and accepts header providers', () => {
    const client = createApiClient('http://localhost:3000', {
      getHeaders: async () => ({ Authorization: 'Bearer test-token' }),
    });
    expect(typeof client.GET).toBe('function');
    expect(typeof client.POST).toBe('function');
  });
});
`,
      'src/client/index.ts': `export * from './create-api-client';\n`,
    },
  });
}

function designTokensFiles({ root, scope, name, linter }) {
  return libraryPackage({
    root,
    scope,
    name,
    platform: 'universal',
    linter,
    exportsMap: {
      '.': entry(''),
      './colors': entry('colors/'),
      './spacing': entry('spacing/'),
      './typography': entry('typography/'),
    },
    files: {
      'src/colors/index.ts': `/** Cross-platform semantic color tokens shared by Next.js, Astro, and Expo NativeWind. */
export const colors = {
  brand: {
    primary: '#2563EB',
    primaryForeground: '#FFFFFF',
    accent: '#0EA5E9',
  },
  surface: {
    background: '#FFFFFF',
    card: '#F8FAFC',
    border: '#E2E8F0',
  },
  text: {
    primary: '#0F172A',
    muted: '#475569',
  },
  status: {
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
  },
} as const;

export type ColorTokens = typeof colors;
`,
      'src/spacing/index.ts': `/** Numeric spacing scale (px / RN density-independent units). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
} as const;
`,
      'src/typography/index.ts': `export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;
`,
      'src/index.ts': `import { colors } from './colors';
import { radii, spacing } from './spacing';
import { fontSizes } from './typography';

export { colors } from './colors';
export type { ColorTokens } from './colors';
export { radii, spacing } from './spacing';
export { fontSizes } from './typography';

/** Tailwind / NativeWind theme extension ready to spread in tailwind.config.* */
export const tailwindThemeExtend = {
  colors,
  borderRadius: {
    sm: \`\${radii.sm}px\`,
    md: \`\${radii.md}px\`,
    lg: \`\${radii.lg}px\`,
  },
} as const;

export const tokens = { colors, spacing, radii, fontSizes } as const;
`,
      'src/index.test.ts': `import { describe, expect, it } from 'vitest';
import { colors, tailwindThemeExtend, tokens } from './index';

describe('@${scope}/${name}', () => {
  it('exposes cross-platform tokens without DOM or native globals', () => {
    expect(colors.brand.primary).toMatch(/^#/);
    expect(tokens.spacing.md).toBe(16);
    expect(tailwindThemeExtend.colors.brand.primary).toBe(colors.brand.primary);
  });
});
`,
    },
  });
}

function uiWebFiles({ root, scope, name, linter }) {
  return libraryPackage({
    root,
    scope,
    name,
    platform: 'web',
    linter,
    exportsMap: { '.': entry('') },
    peerDependencies: { react: '>=18.0.0' },
    tsconfigOverrides: {
      lib: ['DOM', 'DOM.Iterable', 'ES2022'],
      jsx: 'react-jsx',
    },
    files: {
      'src/surface-card.tsx': `import type { ReactNode } from 'react';

export interface SurfaceCardProps {
  title: string;
  children: ReactNode;
}

/** Web-only React primitive (Next.js / Astro React islands). Never import from apps/mobile. */
export function SurfaceCard({ title, children }: SurfaceCardProps) {
  return (
    <section className="rounded-lg border p-4">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}
`,
      'src/index.ts': `export { SurfaceCard, type SurfaceCardProps } from './surface-card';\n`,
      'src/index.test.ts': `import { describe, expect, it } from 'vitest';
import { SurfaceCard } from './index';

describe('@${scope}/${name}', () => {
  it('exports web UI components', () => {
    expect(typeof SurfaceCard).toBe('function');
  });
});
`,
    },
  });
}

function uiNativeFiles({ root, scope, name, linter }) {
  return libraryPackage({
    root,
    scope,
    name,
    platform: 'native',
    linter,
    exportsMap: { '.': entry('') },
    peerDependencies: { react: '>=18.0.0', 'react-native': '>=0.73.0' },
    tsconfigOverrides: {
      lib: ['ES2022'],
      jsx: 'react-native',
    },
    files: {
      'src/types.ts': `/** Shared props contract for React Native primitives. Never import DOM/web packages here. */
export interface NativeActionProps {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}
`,
      'src/index.ts': `export type { NativeActionProps } from './types';\n`,
      'src/index.test.ts': `import { describe, expect, it } from 'vitest';

describe('@${scope}/${name}', () => {
  it('compiles cleanly for native consumers', () => {
    expect(true).toBe(true);
  });
});
`,
    },
  });
}

function configFiles({ root, scope, name }) {
  const dir = path.join(root, 'packages', name);
  return [
    {
      path: path.join(dir, 'package.json'),
      content: json({
        name: `@${scope}/${name}`,
        version: '0.0.0',
        private: true,
        monorepo: { layer: 'config', platform: 'universal' },
        files: ['*.json', '*.js', '*.mjs'],
        exports: { './*': './*' },
      }),
    },
    {
      path: path.join(dir, 'README.md'),
      content: `# @${scope}/${name}\n\nShared configuration files. Consumers reference them by path, e.g. \`@${scope}/${name}/<file>\`.\n`,
    },
  ];
}

export function packageFiles({ root, scope, name, kind, linter = 'oxc' }) {
  switch (kind) {
    case 'lib':
      return libFiles({ root, scope, name, linter });
    case 'contracts':
      return contractsFiles({ root, scope, name, linter });
    case 'api-client':
      return apiClientFiles({ root, scope, name, linter });
    case 'design-tokens':
      return designTokensFiles({ root, scope, name, linter });
    case 'ui-web':
      return uiWebFiles({ root, scope, name, linter });
    case 'ui-native':
      return uiNativeFiles({ root, scope, name, linter });
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
  // Node16 resolution honours package.json "exports" in libraries, NestJS, and Node workers.
  const library = { extends: './base.json', compilerOptions: { module: 'Node16', moduleResolution: 'Node16' } };
  const node = { extends: './library.json' };
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
  const expo = {
    extends: './base.json',
    compilerOptions: {
      lib: ['ES2022'],
      module: 'ESNext',
      moduleResolution: 'Bundler',
      jsx: 'react-native',
      noEmit: true,
      isolatedModules: true,
      declaration: false,
      declarationMap: false,
    },
  };
  const astro = {
    extends: './base.json',
    compilerOptions: {
      lib: ['DOM', 'DOM.Iterable', 'ES2022'],
      module: 'ESNext',
      moduleResolution: 'Bundler',
      jsx: 'preserve',
      verbatimModuleSyntax: true,
      noEmit: true,
      isolatedModules: true,
      declaration: false,
      declarationMap: false,
    },
  };
  const reactSpa = {
    extends: './base.json',
    compilerOptions: {
      lib: ['DOM', 'DOM.Iterable', 'ES2022'],
      module: 'ESNext',
      moduleResolution: 'Bundler',
      jsx: 'react-jsx',
      noEmit: true,
      isolatedModules: true,
      declaration: false,
      declarationMap: false,
    },
  };
  return [
    {
      path: path.join(dir, 'package.json'),
      content: json({
        name: `@${scope}/tsconfig`,
        version: '0.0.0',
        private: true,
        monorepo: { layer: 'config', platform: 'universal' },
        files: ['*.json'],
      }),
    },
    { path: path.join(dir, 'base.json'), content: json(base) },
    { path: path.join(dir, 'library.json'), content: json(library) },
    { path: path.join(dir, 'node.json'), content: json(node) },
    { path: path.join(dir, 'nestjs.json'), content: json(nestjs) },
    { path: path.join(dir, 'nextjs.json'), content: json(nextjs) },
    { path: path.join(dir, 'expo.json'), content: json(expo) },
    { path: path.join(dir, 'astro.json'), content: json(astro) },
    { path: path.join(dir, 'react-spa.json'), content: json(reactSpa) },
  ];
}

export function oxcConfigPackageFiles({ root, scope }) {
  const dir = path.join(root, 'packages', 'oxc-config');
  const pkg = {
    name: `@${scope}/oxc-config`,
    version: '0.0.0',
    private: true,
    monorepo: { layer: 'config', platform: 'universal' },
    files: ['*.json'],
    exports: {
      './base.json': './base.json',
      './oxfmt.json': './oxfmt.json',
    },
  };
  const base = {
    $schema: './node_modules/oxlint/configuration_schema.json',
    plugins: ['typescript', 'unicorn', 'import'],
    categories: {
      correctness: 'error',
      suspicious: 'warn',
    },
    ignorePatterns: ['dist/**', '.next/**', '.astro/**', '.expo/**', 'coverage/**'],
  };
  const oxfmt = {
    printWidth: 100,
    singleQuote: true,
    semi: true,
  };
  return [
    { path: path.join(dir, 'package.json'), content: json(pkg) },
    { path: path.join(dir, 'base.json'), content: json(base) },
    { path: path.join(dir, 'oxfmt.json'), content: json(oxfmt) },
  ];
}

export function eslintConfigPackageFiles({ root, scope }) {
  const dir = path.join(root, 'packages', 'eslint-config');
  const pkg = {
    name: `@${scope}/eslint-config`,
    version: '0.0.0',
    private: true,
    type: 'module',
    monorepo: { layer: 'config', platform: 'universal' },
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
  { ignores: ['dist/**', '.next/**', '.astro/**', '.expo/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
`,
    },
  ];
}

/** Generates monorepo wiring files for an app/service of a given preset. */
export function appWiringFiles({ root, scope, name, relDir, preset, contractDep, linter = 'oxc' }) {
  const dir = path.join(root, relDir);

  if (preset.id === 'polyglot') {
    const pkg = {
      name,
      version: '0.0.0',
      private: true,
      monorepo: { layer: 'app', type: preset.id, platform: preset.platform },
      scripts: {
        dev: 'echo "Replace with your service dev command (e.g. uv run uvicorn app.main:app --reload)"',
        build: 'echo "Replace with your service build command"',
        lint: 'echo "Replace with your service lint command (e.g. ruff check .)"',
        typecheck: 'echo "Replace with your service typecheck command (e.g. pyright / go vet ./...)"',
        test: 'echo "Replace with your service test command (e.g. uv run pytest / go test ./...)"',
      },
    };
    const readme = `# ${name} (${preset.label})

Non-Node service integrated into Turborepo via a lightweight \`package.json\` script shim.

## Contracts

- Expose an OpenAPI schema (e.g. \`openapi.json\` or \`/openapi.json\`) and consume it from \`packages/api-client\` (or vice versa).
- Never import source files across workspaces; communicate exclusively over HTTP/queues/OpenAPI contracts.
`;
    return [
      { path: path.join(dir, 'package.json'), content: json(pkg) },
      { path: path.join(dir, 'README.md'), content: readme },
    ];
  }

  const useOxc = linter === 'oxc' || linter === 'both';
  const useEslint = linter === 'eslint' || linter === 'both';

  const dependencies = {};
  if (contractDep) dependencies[contractDep] = 'workspace:*';

  const devDependencies = {
    [`@${scope}/tsconfig`]: 'workspace:*',
    typescript: '^5.6.0',
  };
  if (useOxc) {
    devDependencies[`@${scope}/oxc-config`] = 'workspace:*';
    devDependencies.oxlint = '^1.0.0';
    devDependencies.oxfmt = '^0.10.0';
  }
  if (useEslint) {
    devDependencies[`@${scope}/eslint-config`] = 'workspace:*';
    devDependencies.eslint = '^9.0.0';
  }

  const typecheckCmd = preset.id === 'landing' || preset.id === 'docs' ? 'astro check' : 'tsc --noEmit';
  const lintCmd =
    useOxc && useEslint
      ? 'oxlint --deny-warnings src && eslint src'
      : useOxc
        ? 'oxlint --deny-warnings src'
        : 'eslint src';

  const scripts = {
    dev: preset.id === 'worker' ? 'tsx watch src/index.ts' : 'echo "Wire framework dev script"',
    build: preset.id === 'worker' ? 'tsc -p tsconfig.json' : 'echo "Wire framework build script"',
    lint: lintCmd,
    ...(useOxc ? { 'format:check': 'oxfmt --check src' } : {}),
    typecheck: typecheckCmd,
    test: preset.id === 'mobile' ? 'jest --passWithNoTests' : 'vitest run --passWithNoTests',
  };

  const pkg = {
    name,
    version: '0.0.0',
    private: true,
    monorepo: { layer: 'app', type: preset.id, platform: preset.platform },
    scripts,
    ...(Object.keys(dependencies).length > 0 ? { dependencies } : {}),
    devDependencies,
  };

  const tsconfig = {
    extends: `@${scope}/tsconfig/${preset.tsconfigPreset}`,
    compilerOptions: {
      ...(preset.id === 'worker' ? { outDir: 'dist', rootDir: 'src' } : { paths: { '@/*': ['./src/*'] } }),
    },
    include: preset.id === 'web' ? ['next-env.d.ts', 'src/**/*.ts', 'src/**/*.tsx', '.next/types/**/*.ts'] : ['src'],
    exclude: ['node_modules', 'dist', '.next', '.astro', '.expo'],
  };

  const files = [
    { path: path.join(dir, 'package.json'), content: json(pkg) },
    { path: path.join(dir, 'tsconfig.json'), content: json(tsconfig) },
  ];

  if (useOxc) {
    files.push({
      path: path.join(dir, '.oxlintrc.json'),
      content: json({ extends: [`./node_modules/@${scope}/oxc-config/base.json`] }),
    });
  }
  if (useEslint) {
    files.push({
      path: path.join(dir, 'eslint.config.mjs'),
      content: `export { default } from '@${scope}/eslint-config/base';\n`,
    });
  }

  if (preset.id === 'mobile') {
    files.push({
      path: path.join(dir, 'metro.config.js'),
      content: `const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
`,
    });
  }

  if (preset.id === 'worker') {
    files.push(
      {
        path: path.join(dir, 'src', 'index.ts'),
        content: `export function bootstrapWorker(): string {
  return '${name} worker ready';
}
`,
      },
      {
        path: path.join(dir, 'src', 'index.test.ts'),
        content: `import { describe, expect, it } from 'vitest';
import { bootstrapWorker } from './index';

describe('${name} worker', () => {
  it('boots cleanly', () => {
    expect(bootstrapWorker()).toContain('worker ready');
  });
});
`,
      },
    );
  }

  return files;
}
