// File templates for the react-native-architecture scaffolds (Expo Router + NativeWind).

export function modelTemplate(pascal) {
  return `/**
 * Domain model representing ${pascal}.
 */
export interface I${pascal} {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  // TODO: Add domain properties here
}
`;
}

export function screenTemplate(pascal, name) {
  return `import React from 'react';
import { Text, View } from 'react-native';

/**
 * Props for {@link ${pascal}Home}.
 */
export interface I${pascal}HomeProps {
  readonly title?: string;
}

/**
 * Main screen for the ${pascal} feature.
 */
export function ${pascal}Home({ title = '${pascal} Overview' }: Readonly<I${pascal}HomeProps>): React.JSX.Element {
  return (
    <View className="flex-1 p-4">
      <Text className="text-3xl font-bold">{title}</Text>
      <Text className="mt-2 text-gray-500">Feature domain module: ${name}</Text>
    </View>
  );
}
`;
}

export function screenTestTemplate(pascal, name) {
  return `import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ${pascal}Home } from './${name}-home';

describe('${pascal}Home Screen', () => {
  it('renders default title correctly', () => {
    render(<${pascal}Home />);
    expect(screen.getByText('${pascal} Overview')).toBeTruthy();
  });

  it('renders custom title when provided', () => {
    render(<${pascal}Home title="Custom Header" />);
    expect(screen.getByText('Custom Header')).toBeTruthy();
  });
});
`;
}

/** Thin Expo Router route: only re-exports the feature screen, no logic. */
export function routeTemplate(pascal, name) {
  return `import { ${pascal}Home } from '@/features/${name}/screens/${name}-home';

export default ${pascal}Home;
`;
}

export function componentTemplate(pascal, type) {
  if (type === 'modal') {
    return `import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

/**
 * Props for {@link ${pascal}}.
 */
export interface I${pascal}Props {
  /** Controls modal visibility. */
  readonly visible: boolean;
  /** Fired when the modal asks to be closed. */
  readonly onClose: () => void;
  /** Optional callback fired when the user confirms. */
  readonly onConfirm?: () => void;
  /** Label for the confirm button (default: 'Confirm'). */
  readonly confirmLabel?: string;
  /** Label for the cancel button (default: 'Cancel'). */
  readonly cancelLabel?: string;
  /** Optional content. */
  readonly children?: React.ReactNode;
}

/**
 * ${pascal} modal component with dark mode support.
 */
export function ${pascal}({
  visible,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  children,
}: Readonly<I${pascal}Props>): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-2xl bg-white p-4 dark:bg-zinc-900">
          {children ?? <Text className="text-zinc-900 dark:text-zinc-100">${pascal}</Text>}
          <View className="mt-4 flex-row justify-end gap-2">
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              className="rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-700"
            >
              <Text className="text-zinc-700 dark:text-zinc-300">{cancelLabel}</Text>
            </Pressable>
            {onConfirm && (
              <Pressable
                accessibilityRole="button"
                onPress={onConfirm}
                className="rounded-md bg-blue-600 px-4 py-2"
              >
                <Text className="font-semibold text-white">{confirmLabel}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
`;
  }
  const wrapper = type === 'section' ? 'View className={className ?? \'py-4\'}' : 'View className={className}';
  const heading = type === 'section' ? `\n      <Text className="mb-2 text-xl font-semibold">{title ?? '${pascal}'}</Text>` : '';
  const titleProp = type === 'section' ? `\n  /** Section title. */\n  readonly title?: string;` : '';
  const titleArg = type === 'section' ? '\n  title,' : '';
  const body = type === 'section' ? '{children}' : `{children ?? <Text>${pascal}</Text>}`;
  return `import React from 'react';
import { Text, View } from 'react-native';

/**
 * Props for {@link ${pascal}}.
 */
export interface I${pascal}Props {
  /** NativeWind class name override. */
  readonly className?: string;${titleProp}
  /** Main content or children. */
  readonly children?: React.ReactNode;
}

/**
 * ${pascal} component.
 */
export function ${pascal}({
  className,${titleArg}
  children,
}: Readonly<I${pascal}Props>): React.JSX.Element {
  return (
    <${wrapper}>${heading}
      ${body}
    </View>
  );
}
`;
}

export function componentTestTemplate(pascal, name, type) {
  if (type === 'modal') {
    return `import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ${pascal} } from './${name}';

describe('${pascal} Component', () => {
  it('calls onConfirm and onClose from its action buttons', () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    render(<${pascal} visible onClose={onClose} onConfirm={onConfirm} confirmLabel="Save" cancelLabel="Dismiss" />);

    fireEvent.press(screen.getByText('Save'));
    fireEvent.press(screen.getByText('Dismiss'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render confirm button when onConfirm is omitted', () => {
    const onClose = jest.fn();
    render(<${pascal} visible onClose={onClose} />);
    expect(screen.queryByText('Confirm')).toBeNull();
    fireEvent.press(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
`;
  }
  const defaultText = type === 'section' ? '' : `
  it('renders default content correctly', () => {
    render(<${pascal} />);
    expect(screen.getByText('${pascal}')).toBeTruthy();
  });
`;
  const titleTest = type === 'section' ? `
  it('renders the title', () => {
    render(<${pascal} title="My Title" />);
    expect(screen.getByText('My Title')).toBeTruthy();
  });
` : '';
  return `import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ${pascal} } from './${name}';

describe('${pascal} Component', () => {${defaultText}${titleTest}
  it('renders children when passed', () => {
    render(
      <${pascal}>
        <Text>Child Content</Text>
      </${pascal}>,
    );
    expect(screen.getByText('Child Content')).toBeTruthy();
  });
});
`;
}

/** Leaf barrel: re-exports the implementation file. */
export function barrel(name) {
  return `export * from './${name}';\n`;
}

/** Layout template for Expo Router with Stack. */
export function layoutTemplate(title) {
  return `import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '${title}' }} />
    </Stack>
  );
}
`;
}

/** Hierarchical TanStack Query keys factory. */
export function keysTemplate(entityName, entityPascal) {
  return `/**
 * Hierarchical key factory for ${entityPascal} queries and mutations.
 */
export const ${entityName}Keys = {
  all: ['${entityName}'] as const,
  lists: () => [...${entityName}Keys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...${entityName}Keys.lists(), filters ?? {}] as const,
  details: () => [...${entityName}Keys.all, 'detail'] as const,
  detail: (id: string) => [...${entityName}Keys.details(), id] as const,
};
`;
}

/** Hook template (query or mutation) with TanStack Query. */
export function hookTemplate(hookCamel, { feature, kind, entityName, entityPascal }) {
  if (kind === 'mutation') {
    return `import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ${entityName}Keys } from '@/features/${feature}/hooks/${entityName}-keys';

export interface I${entityPascal}Input {
  readonly title: string;
}

export function ${hookCamel}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: I${entityPascal}Input) => {
      // TODO: Replace with dedicated service call
      return Promise.resolve({ id: 'new-id', ...input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ${entityName}Keys.lists() });
    },
  });
}
`;
  }

  return `import { useQuery } from '@tanstack/react-query';
import { ${entityName}Keys } from '@/features/${feature}/hooks/${entityName}-keys';

export function ${hookCamel}(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ${entityName}Keys.list(filters),
    queryFn: async () => {
      // TODO: Replace with dedicated service call
      return Promise.resolve([]);
    },
  });
}
`;
}

/** Hook test template with QueryClientProvider. */
export function hookTestTemplate(hookCamel, { kind }) {
  if (kind === 'mutation') {
    return `import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ${hookCamel} } from './${hookCamel}';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('${hookCamel}', () => {
  it('executes mutation successfully', async () => {
    const { result } = renderHook(() => ${hookCamel}(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ title: 'New Item' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
`;
  }

  return `import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ${hookCamel} } from './${hookCamel}';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('${hookCamel}', () => {
  it('fetches data successfully', async () => {
    const { result } = renderHook(() => ${hookCamel}(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
`;
}

/** Service template with typed apiClient. */
export function serviceTemplate(camelName) {
  return `import { apiClient } from '@/config/api-client';

export interface I${camelName.charAt(0).toUpperCase() + camelName.slice(1)}Result {
  readonly success: boolean;
}

export async function ${camelName}(): Promise<I${camelName.charAt(0).toUpperCase() + camelName.slice(1)}Result> {
  const response = await apiClient.get<I${camelName.charAt(0).toUpperCase() + camelName.slice(1)}Result>('/${camelName}');
  return response.data;
}
`;
}

/** Service test template with mock apiClient. */
export function serviceTestTemplate(camelName, fileName) {
  return `import { apiClient } from '@/config/api-client';
import { ${camelName} } from './${fileName}';

jest.mock('@/config/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('${camelName}', () => {
  it('calls apiClient and returns data', async () => {
    const mockData = { success: true };
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockData, status: 200 });

    const result = await ${camelName}();
    expect(apiClient.get).toHaveBeenCalledWith('/${camelName}');
    expect(result).toEqual(mockData);
  });
});
`;
}

/** Oxlint config template enforcing mobile screaming architecture boundaries. */
export function oxlintrcTemplate() {
  return JSON.stringify(
    {
      $schema: './node_modules/oxlint/configuration_schema.json',
      plugins: ['typescript', 'react', 'import', 'jsx-a11y', 'jest', 'react-perf'],
      categories: { correctness: 'error', suspicious: 'warn' },
      env: { browser: false, es2024: true },
      rules: {
        'react/react-in-jsx-scope': 'off',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'no-restricted-globals': [
          'error',
          { name: 'window', message: 'No uses window en React Native.' },
          { name: 'localStorage', message: 'Usa expo-secure-store o AsyncStorage.' },
          { name: 'document', message: 'No existe DOM en React Native.' },
        ],
        'no-restricted-imports': [
          'error',
          {
            paths: [{ name: 'react-dom', message: 'No uses react-dom en React Native.' }],
            patterns: [
              { regex: '^@/features/[^/]+$', message: 'Prohibido importar de la raíz de la feature; importa desde la carpeta hoja.' },
              { regex: '^@/features/[^/]+/(components|hooks|screens|services)$', message: 'Prohibido importar de agrupadores; importa desde la carpeta hoja.' },
            ],
          },
        ],
      },
      overrides: [
        {
          files: ['src/app/**'],
          rules: {
            'no-restricted-imports': [
              'error',
              {
                patterns: [
                  { group: ['@tanstack/react-query'], message: 'Rutas delgadas: las queries van en hooks dentro de features.' },
                  { regex: '^@/features/[^/]+/services/', message: 'Rutas delgadas: la UI consume hooks, nunca servicios directamente.' },
                ],
              },
            ],
          },
        },
      ],
    },
    null,
    2,
  ) + '\n';
}

/** Oxfmt config template with automatic Tailwind class sorting. */
export function oxfmtrcTemplate() {
  return JSON.stringify(
    {
      $schema: './node_modules/oxfmt/configuration_schema.json',
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      sortTailwindcss: true,
    },
    null,
    2,
  ) + '\n';
}

/** Jest config template for Expo and Screaming Architecture. */
export function jestConfigTemplate() {
  return `module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@tanstack/.*|@shopify/.*|nativewind)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/app/**',
    '!src/features/**/models/**',
    '!src/features/**/schemas/**',
    '!src/features/**/hooks/*-keys/**',
    '!src/config/constants.ts',
    '!src/config/env.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
`;
}

/** Test setup template with common native mocks. */
export function testSetupTemplate() {
  return `import '@testing-library/react-native/extend-expect';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
`;
}
