# Platform, Native Performance and Accessibility

A mobile app has to account for operating system differences (iOS vs Android), rendering optimizations for 60/120 fps and strict accessibility standards.

---

## 📱 Platform-Specific Extensions (`.ios` / `.android`)

When a component's or service's implementation differs substantially between platforms:

1. **Location:** place the variants inside the component's **same leaf folder**:
   ```
   src/features/billing/components/payment-sheet/
   ├── payment-sheet.ios.tsx       # Apple Pay / StoreKit implementation
   ├── payment-sheet.android.tsx   # Google Pay implementation
   ├── payment-sheet.test.tsx      # Test that checks shared behavior
   └── index.ts                    # Re-exports './payment-sheet' (Metro resolves the extension)
   ```
2. **Platform-agnostic barrel:** `index.ts` must only export `export * from './payment-sheet'`; the bundler (Metro) resolves `.ios.tsx` or `.android.tsx` automatically.

---

## ⚡ Native Performance and 60 FPS

### 1. `react-native-safe-area-context`
Avoid fixed margins on full screens; use `useSafeAreaInsets` or wrap with `SafeAreaView` to handle notches, the Dynamic Island and Android navigation bars:

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

### 2. High-Performance Lists (`@shopify/flash-list`)
For feeds or lists of more than 20 items, replace `FlatList` with `FlashList` and memoize the items:

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

### 3. Images with `expo-image`
Use `Image` from `expo-image` instead of React Native's primitive. It provides automatic disk and memory caching, progressive decoding and smooth transitions (`transition={200}`).

### 4. Animations on the Native Thread
Use `react-native-reanimated` for complex animations (gestures, drags, layout transitions), making sure they run 100% on the UI thread without saturating the JS bridge.

---

## ♿ Mobile Accessibility (a11y)

Accessibility ensures that VoiceOver (iOS) and TalkBack (Android) can interact smoothly with the app.

### Critical Rules:
1. **Semantic Roles and Labels:**
   - On `Pressable`, always specify `accessibilityRole="button"`.
   - If the button contains only an icon, you must add `accessibilityLabel="Close modal"`.
2. **Minimum touch target:** every interactive element must have a touch area of at least **44x44 pt** (use `hitSlop` if the visual element is smaller).
3. **Dynamic Type font scaling:** do not limit `maxFontSizeMultiplier` unless there are strict design requirements, to avoid severe truncation.
4. **Test queries:** query the UI in tests with `@testing-library/react-native` using `getByRole`, `getByLabelText` or `getByText`; never query by style selectors or CSS classes.
