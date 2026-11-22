# NativeWind Component Patterns

## 3-level discovery

1. Reuse from `src/components/common/`.
2. If the project has already adopted a UI library, use it before creating a new component.
3. Create a custom component with `scaffold-component.mjs`.

## Mobile Primitives and Web Equivalents

| Web / DOM | React Native / Expo | Mobile usage notes |
| --- | --- | --- |
| `div`, `section`, `article` | `View` | A flex container by default (`flex-col`). |
| `span`, `p`, `h1`-`h6` | `Text` | All text MUST be inside `<Text>`. |
| `button` | `Pressable` | Always add `accessibilityRole="button"`. |
| `input` | `TextInput` | Wrap in `KeyboardAvoidingView` for forms. |
| `img` | `Image` (`expo-image`) | Optimal performance, native caching and blurhash placeholders. |
| `ul` / short lists | `ScrollView` | For continuously scrolling views of finite size. |
| `ul` / medium lists | `FlatList` | Standard React Native virtualization. |
| `ul` / long lists / feeds | `FlashList` (`@shopify/flash-list`) | 5x to 10x more efficient than FlatList by recycling cells. |

## Standard setup: NativeWind v4

1. **`metro.config.js`:**
   ```js
   const { getDefaultConfig } = require('expo/metro-config');
   const { withNativeWind } = require('nativewind/metro');

   const config = getDefaultConfig(__dirname);
   module.exports = withNativeWind(config, { input: './global.css' });
   ```
2. **`tailwind.config.js`:**
   ```js
   /** @type {import('tailwindcss').Config} */
   module.exports = {
     content: ['./src/**/*.{ts,tsx}'],
     presets: [require('nativewind/preset')],
     darkMode: 'class',
     theme: { extend: {} },
     plugins: [],
   };
   ```
3. **`global.css`:**
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
4. **`babel.config.js`:**
   ```js
   module.exports = function (api) {
     api.cache(true);
     return {
       presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
     };
   };
   ```

Always accept `className` as a prop so parent components can override styles. Support dark mode with `dark:` prefixes.

## Modals

The `--type modal` archetype generates an accessible modal with animation and `dark:` support.

```tsx
export interface IModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onConfirm?: () => void;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly children?: React.ReactNode;
}
```

For complex full-screen flows (such as checkout or wizards), prefer an Expo Router modal route (`presentation: 'modal'`) in `src/app/` that re-exports a feature screen.

## UI Testing

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CreateInvoiceModal } from './create-invoice-modal';

describe('CreateInvoiceModal', () => {
  it('calls onConfirm when Save is pressed', () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();

    render(
      <CreateInvoiceModal
        visible
        onClose={onClose}
        onConfirm={onConfirm}
        confirmLabel="Save"
      />
    );

    fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
```

Always query by accessibility role (`getByRole`), label (`getByLabelText`) or visible text (`getByText`), **never by CSS selector or className**.
