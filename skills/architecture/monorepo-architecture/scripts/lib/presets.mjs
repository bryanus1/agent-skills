// Declarative registry of supported repository/app archetypes and platform compatibility rules.
// Adding a new repo stack only requires registering an entry in APP_PRESETS (plus a tsconfig preset if needed).

export const PLATFORMS = ['universal', 'web', 'native', 'node', 'astro'];

/**
 * Defines which package platforms a workspace of a given platform may import.
 * Overridable per repo via `monorepo.boundaries.json` in the monorepo root.
 */
export const DEFAULT_PLATFORM_ALLOW = {
  universal: ['universal'],
  web: ['universal', 'web'],
  astro: ['universal', 'web', 'astro'],
  native: ['universal', 'native'],
  node: ['universal', 'node'],
};

export const APP_PRESETS = {
  web: {
    id: 'web',
    label: 'Next.js Web App',
    platform: 'web',
    defaultDir: 'apps/web',
    tsconfigPreset: 'nextjs.json',
    skill: 'nextjs-architecture',
    featureTarget: { skill: 'nextjs-architecture', script: 'scaffold-feature.mjs', mode: 'nextjs' },
    envVars: ['NEXT_PUBLIC_API_URL'],
    turboOutputs: ['.next/**', '!.next/cache/**'],
    createCommand: (dir) =>
      `pnpm create next-app@latest ${dir} --ts --app --src-dir --eslint --import-alias "@/*" --use-pnpm --skip-install --yes`,
  },
  api: {
    id: 'api',
    label: 'NestJS Modular Monolith API',
    platform: 'node',
    defaultDir: 'apps/api',
    tsconfigPreset: 'nestjs.json',
    skill: 'nestjs-architecture',
    featureTarget: { skill: 'nestjs-architecture', script: 'scaffold-module.mjs', mode: 'nestjs' },
    envVars: [],
    turboOutputs: ['dist/**'],
    createCommand: (dir, name) =>
      `pnpm dlx @nestjs/cli new ${name} --directory ${dir} --package-manager pnpm --skip-git --skip-install`,
  },
  mobile: {
    id: 'mobile',
    label: 'Expo / React Native Mobile App',
    platform: 'native',
    defaultDir: 'apps/mobile',
    tsconfigPreset: 'expo.json',
    skill: 'react-native-architecture',
    featureTarget: { skill: 'react-native-architecture', script: 'scaffold-feature.mjs', mode: 'react-native' },
    envVars: ['EXPO_PUBLIC_API_URL'],
    turboOutputs: ['.expo/**'],
    createCommand: (dir) => `pnpm dlx create-expo-app@latest ${dir} --template tabs`,
  },
  landing: {
    id: 'landing',
    label: 'Astro Landing / Marketing Site',
    platform: 'astro',
    defaultDir: 'apps/landing',
    tsconfigPreset: 'astro.json',
    skill: 'astro-architecture',
    featureTarget: null,
    envVars: ['PUBLIC_API_URL', 'PUBLIC_SITE_URL'],
    turboOutputs: ['dist/**', '.astro/**'],
    createCommand: (dir) => `pnpm create astro@latest ${dir} -- --template minimal --typescript strict --no-install --no-git`,
  },
  spa: {
    id: 'spa',
    label: 'Vite + React SPA / Admin Dashboard',
    platform: 'web',
    defaultDir: 'apps/admin',
    tsconfigPreset: 'react-spa.json',
    skill: null,
    featureTarget: null,
    envVars: ['VITE_API_URL'],
    turboOutputs: ['dist/**'],
    createCommand: (dir) => `pnpm create vite@latest ${dir} --template react-ts`,
  },
  docs: {
    id: 'docs',
    label: 'Astro Starlight / Documentation Site',
    platform: 'astro',
    defaultDir: 'apps/docs',
    tsconfigPreset: 'astro.json',
    skill: 'astro-architecture',
    featureTarget: null,
    envVars: ['PUBLIC_SITE_URL'],
    turboOutputs: ['dist/**', '.astro/**'],
    createCommand: (dir) => `pnpm create astro@latest ${dir} -- --template starlight --no-install --no-git`,
  },
  worker: {
    id: 'worker',
    label: 'Node.js Background Worker / CLI / Cron',
    platform: 'node',
    defaultDir: 'apps/worker',
    tsconfigPreset: 'node.json',
    skill: null,
    featureTarget: null,
    envVars: [],
    turboOutputs: ['dist/**'],
    createCommand: null,
  },
  polyglot: {
    id: 'polyglot',
    label: 'Polyglot Service (Python / Go / Rust)',
    platform: 'node',
    defaultDir: 'services/ml-service',
    tsconfigPreset: null,
    skill: null,
    featureTarget: null,
    envVars: [],
    turboOutputs: ['dist/**', 'build/**'],
    createCommand: null,
  },
};

export const PRESET_IDS = Object.keys(APP_PRESETS);

export function getPreset(type) {
  return APP_PRESETS[type] ?? null;
}

/** Parses a comma-separated `--apps` list into validated preset descriptors. */
export function resolveAppSelection(appsArg) {
  const raw = (appsArg ?? 'web,api')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (raw.length === 0) throw new Error('--apps must include at least one preset.');
  const unique = [...new Set(raw)];
  const presets = [];
  for (const id of unique) {
    const preset = getPreset(id);
    if (!preset) {
      throw new Error(`Unknown app preset '${id}'. Valid presets: ${PRESET_IDS.join(', ')}.`);
    }
    presets.push(preset);
  }
  return presets;
}
