# Patrones de componentes con NativeWind

## Descubrimiento en 3 niveles

1. Reutilizar de `src/components/common/`.
2. Si hay una librería UI ya adoptada por el proyecto, usarla antes de crear una nueva.
3. Crear un componente custom con `scaffold-component.mjs`.

## Primitivas Móviles y Equivalencias Web

| Web / DOM | React Native / Expo | Notas de uso móvil |
| --- | --- | --- |
| `div`, `section`, `article` | `View` | Contenedor flex por defecto (`flex-col`). |
| `span`, `p`, `h1`-`h6` | `Text` | Todo texto DEBE estar dentro de `<Text>`. |
| `button` | `Pressable` | Siempre añadir `accessibilityRole="button"`. |
| `input` | `TextInput` | Envolver en `KeyboardAvoidingView` para formularios. |
| `img` | `Image` (`expo-image`) | Rendimiento óptimo, caché nativa y placeholders blurhash. |
| `ul` / listas cortas | `ScrollView` | Para vistas con scroll continuo de tamaño finito. |
| `ul` / listas medias | `FlatList` | Virtualización estándar de React Native. |
| `ul` / listas largas / feeds | `FlashList` (`@shopify/flash-list`) | 5x a 10x más eficiente que FlatList reciclando celdas. |

## Configuración estándar: NativeWind v4

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

Acepta siempre `className` como prop para permitir overrides desde componentes padres. Soporta modo oscuro usando prefijos `dark:`.

## Modales

El arquetipo `--type modal` genera un modal accesible con animación y soporte `dark:`.

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

Para flujos de pantalla completa complejos (como checkout o wizards), prefiere una ruta modal de Expo Router (`presentation: 'modal'`) en `src/app/` que reexporta una screen de la feature.

## Testing de UI

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CreateInvoiceModal } from './create-invoice-modal';

describe('CreateInvoiceModal', () => {
  it('dispara onConfirm al pulsar Guardar', () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();

    render(
      <CreateInvoiceModal
        visible
        onClose={onClose}
        onConfirm={onConfirm}
        confirmLabel="Guardar"
      />
    );

    fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
```

Consulta siempre por rol de accesibilidad (`getByRole`), label (`getByLabelText`) o texto visible (`getByText`), **nunca por selector CSS o className**.
