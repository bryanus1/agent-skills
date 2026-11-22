# Navigation and Authentication with Expo Router

Expo Router maps the file structure in `src/app/` to the native navigation tree (Stack, Tabs or Drawer). Following Screaming Architecture, **`src/app/` contains only thin routes** that act as adapters; all business logic, presentation and authentication state live in `src/features/`.

---

## 🗂️ Route Structure by Groups

Use groups in parentheses `(group)` to organize the flow without changing the URL or the deep linking hierarchy:

```
src/app/
├── _layout.tsx                 # Root layout: providers (QueryClient, Theme, AuthProvider)
├── +not-found.tsx              # 404 fallback
├── (auth)/                     # Unauthenticated flows
│   ├── _layout.tsx             # Stack with headerShown: false
│   ├── login.tsx               # Re-exports LoginScreen from features/auth
│   └── register.tsx
└── (app)/                      # Protected authenticated flows
    ├── _layout.tsx             # Protected with Stack.Protected or a redirect
    ├── (tabs)/
    │   ├── _layout.tsx         # Tabs (Home, Billing, Settings)
    │   ├── index.tsx           # Dashboard / Home
    │   └── billing.tsx         # Re-exports BillingHome
    └── modals/
        └── invoice-detail.tsx  # presentation: 'modal'
```

---

## 🔒 Protected Routes and Session Management

### 1. Where the session lives
Session state, tokens and the user profile live in `src/features/auth/` (in a Zustand store or a TanStack Query hook). **Never check credentials or tokens directly in screens or routes.**

### 2. Protecting with `Stack.Protected` (Expo SDK 53+)

```tsx
// src/app/(app)/_layout.tsx
import { Stack } from 'expo-router';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';

export default function AppLayout() {
  const { isSignedIn, isHydrated } = useAuthSession();

  // Wait for SecureStore hydration to avoid flicker
  if (!isHydrated) return null;

  return (
    <Stack>
      <Stack.Protected guard={isSignedIn} fallbackRoute="/(auth)/login">
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modals/invoice-detail"
          options={{ presentation: 'modal', title: 'Invoice Detail' }}
        />
      </Stack.Protected>
    </Stack>
  );
}
```

*On SDK versions before 53, or for simple layouts, use a conditional `<Redirect href="/(auth)/login" />`.*

---

## 🔑 Secure Token Storage (`expo-secure-store`)

**Non-negotiable rule:** never store JWTs, refresh tokens or session keys in `AsyncStorage`. Always use `expo-secure-store`, backed by the hardware keychain/keystore.

```ts
// src/features/auth/services/token-storage/token-storage.service.ts
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },
  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};
```

The HTTP client interceptor in `src/config/api-client.ts` calls `tokenStorage.getAccessToken()` to inject the `Authorization: Bearer <token>` header and handles the refresh on `401` responses.

---

## 🌐 Deep Linking and Typed Routes

1. **Scheme:** define the scheme in `app.json`:
   ```json
   {
     "expo": {
       "scheme": "myapp",
       "experiments": { "typedRoutes": true }
     }
   }
   ```
2. **Strongly typed navigation:** with `typedRoutes: true`, `router.push('/(app)/billing')` is checked by TypeScript at compile time.
3. **API Routes (`+api.ts`):** Expo Router's backend support is outside the scope of this mobile architecture; all data calls consume external REST/GraphQL APIs through `src/config/api-client.ts`.

---

## 🧪 Navigation Testing

Do not put tests inside `src/app/**`. If you need to verify full navigation flows between screens:
1. Use `renderRouter` from `expo-router/testing-library` inside a test located in the matching feature (e.g. `src/features/auth/screens/login-screen/login-screen.test.tsx`).
2. Or test the screen by isolating navigation with an `expo-router` mock:
   ```tsx
   import { useRouter } from 'expo-router';
   jest.mock('expo-router', () => ({
     useRouter: jest.fn(),
     useLocalSearchParams: jest.fn(() => ({ id: 'inv-123' })),
   }));
   ```
