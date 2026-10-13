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

export const barrel = (name) => `export * from './${name}';\n`;

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
  /** Fired when the user confirms. */
  readonly onConfirm?: () => void;
  /** Optional content. */
  readonly children?: React.ReactNode;
}

/**
 * ${pascal} modal.
 */
export function ${pascal}({
  visible,
  onClose,
  onConfirm,
  children,
}: Readonly<I${pascal}Props>): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-2xl bg-white p-4">
          {children ?? <Text>${pascal}</Text>}
          <View className="mt-4 flex-row justify-end gap-2">
            <Pressable accessibilityRole="button" onPress={onClose} className="rounded-md border px-4 py-2">
              <Text>Cancelar</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onConfirm} className="rounded-md bg-blue-600 px-4 py-2">
              <Text className="text-white">Guardar</Text>
            </Pressable>
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
  it('calls onConfirm and onClose from its buttons', () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    render(<${pascal} visible onClose={onClose} onConfirm={onConfirm} />);

    fireEvent.press(screen.getByText('Guardar'));
    fireEvent.press(screen.getByText('Cancelar'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
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
