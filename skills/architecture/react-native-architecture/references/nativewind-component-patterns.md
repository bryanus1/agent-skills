# Patrones de componentes con NativeWind

## Descubrimiento en 3 niveles

1. Reutilizar de `src/components/common/`.
2. Si hay una librería UI ya adoptada por el proyecto, usarla antes de crear una nueva.
3. Crear un componente custom con `scaffold-component.mjs`.

## Primitivas

| Web | React Native |
| --- | --- |
| `div`, `section` | `View` |
| `span`, `p`, `h1` | `Text` |
| `button` | `Pressable` (con `accessibilityRole="button"`) |
| `input` | `TextInput` |
| `ul` | `FlatList` |

## Estilos

Usa `className` de NativeWind; evita `StyleSheet` salvo valores dinámicos. Acepta `className` como prop para permitir overrides. Recuerda configurar `nativewind/babel`, `tailwind.config.js` y `global.css`.

## Modales

El arquetipo `--type modal` usa `Modal` de RN controlado (`visible`, `onClose`, `onConfirm`). Para flujos de pantalla completa prefiere una ruta modal de Expo Router (`presentation: 'modal'`) con una screen de la feature.

## Testing

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';

render(<InvoiceModal visible onClose={onClose} onConfirm={onConfirm} />);
fireEvent.press(screen.getByText('Guardar'));
expect(onConfirm).toHaveBeenCalledTimes(1);
```

Consulta por texto o `accessibilityRole`/`testID`, no por `className`. Documenta props con TSDoc.
