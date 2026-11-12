# Plataforma, Rendimiento Nativo y Accesibilidad

Una app móvil requiere contemplar diferencias de sistema operativo (iOS vs Android), optimizaciones de renderizado para 60/120 fps y estándares estrictos de accesibilidad.

---

## 📱 Extensiones Específicas de Plataforma (`.ios` / `.android`)

Cuando la implementación de un componente o servicio difiere sustancialmente entre plataformas:

1. **Ubicación:** coloca las variantes dentro de la **misma carpeta hoja** del componente:
   ```
   src/features/billing/components/payment-sheet/
   ├── payment-sheet.ios.tsx       # Implementación Apple Pay / StoreKit
   ├── payment-sheet.android.tsx   # Implementación Google Pay
   ├── payment-sheet.test.tsx      # Test que verifica comportamiento común
   └── index.ts                    # Reexporta './payment-sheet' (Metro resuelve la extensión)
   ```
2. **Barrel agnóstico:** `index.ts` solo debe exportar `export * from './payment-sheet'`; el bundler (Metro) resuelve automáticamente `.ios.tsx` o `.android.tsx`.

---

## ⚡ Rendimiento Nativo y 60 FPS

### 1. `react-native-safe-area-context`
Evita márgenes fijos en pantallas completas; usa `useSafeAreaInsets` o envuelve con `SafeAreaView` para muescas (notches), Dynamic Island y barras de navegación en Android:

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ScreenContainer({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }} className="flex-1 bg-white dark:bg-black">
      {children}
    </View>
  );
}
```

### 2. Listas de Alto Rendimiento (`@shopify/flash-list`)
Para feeds o listas de más de 20 elementos, sustituye `FlatList` por `FlashList` y memoiza los ítems:

```tsx
import { FlashList } from '@shopify/flash-list';

export function InvoiceList({ items }: { items: readonly IInvoice[] }) {
  return (
    <FlashList
      data={items}
      renderItem={({ item }) => <InvoiceRow item={item} />}
      estimatedItemSize={72}
      keyExtractor={(item) => item.id}
    />
  );
}
```

### 3. Imágenes con `expo-image`
Usa `Image` de `expo-image` en lugar del primitivo de React Native. Proporciona caché automática en disco y memoria, decodificación progresiva y transiciones suaves (`transition={200}`).

### 4. Animaciones en el Hilo Nativo
Usa `react-native-reanimated` para animaciones complejas (gestos, arrastres, transiciones de layout) asegurando que corran al 100% en el UI Thread sin saturar el bridge JS.

---

## ♿ Accesibilidad (a11y) Móvil

La accesibilidad garantiza que VoiceOver (iOS) y TalkBack (Android) puedan interactuar fluidamente con la app.

### Reglas Críticas:
1. **Roles y Labels Semánticos:**
   - En `Pressable`, especifica siempre `accessibilityRole="button"`.
   - Si el botón solo contiene un ícono, añade obligatoriamente `accessibilityLabel="Cerrar modal"`.
2. **Área táctil mínima:** todo elemento interactivo debe tener un área táctil de al menos **44x44 pt** (usa `hitSlop` si el elemento visual es menor).
3. **Escalado Dinámico de Fuentes (Dynamic Type):** no limites `maxFontSizeMultiplier` salvo requerimientos de diseño estrictos para evitar truncado severo.
4. **Queries de Test:** consulta la UI en tests con `@testing-library/react-native` usando `getByRole`, `getByLabelText` o `getByText`; nunca consultes selectores de estilo o clases CSS.
