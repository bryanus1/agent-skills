# Navegación y Autenticación con Expo Router

Expo Router mapea la estructura de archivos en `src/app/` al árbol de navegación nativo (Stack, Tabs o Drawer). Siguiendo Screaming Architecture, **`src/app/` contiene únicamente rutas delgadas** que actúan como adaptadores; toda la lógica de negocio, presentación y estado de autenticación reside en `src/features/`.

---

## 🗂️ Estructura de Rutas por Grupos

Usa grupos entre paréntesis `(grupo)` para organizar el flujo sin alterar la URL ni la jerarquía de deep linking:

```
src/app/
├── _layout.tsx                 # Root layout: providers (QueryClient, Theme, AuthProvider)
├── +not-found.tsx              # Fallback 404
├── (auth)/                     # Flujos no autenticados
│   ├── _layout.tsx             # Stack con headerShown: false
│   ├── login.tsx               # Reexporta LoginScreen de features/auth
│   └── register.tsx
└── (app)/                      # Flujos autenticados protegidos
    ├── _layout.tsx             # Protegido con Stack.Protected o redirección
    ├── (tabs)/
    │   ├── _layout.tsx         # Tabs (Home, Billing, Settings)
    │   ├── index.tsx           # Dashboard / Home
    │   └── billing.tsx         # Reexporta BillingHome
    └── modals/
        └── invoice-detail.tsx  # presentation: 'modal'
```

---

## 🔒 Rutas Protegidas y Gestión de Sesión

### 1. Dónde vive la sesión
El estado de la sesión, tokens y perfil de usuario viven en `src/features/auth/` (en un store de Zustand o hook con TanStack Query). **Nunca verifiques credenciales ni tokens directamente en las pantallas o rutas.**

### 2. Protección con `Stack.Protected` (Expo SDK 53+)

```tsx
// src/app/(app)/_layout.tsx
import { Stack } from 'expo-router';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';

export default function AppLayout() {
  const { isSignedIn, isHydrated } = useAuthSession();

  // Esperar hidratación de SecureStore para evitar parpadeos
  if (!isHydrated) return null;

  return (
    <Stack>
      <Stack.Protected guard={isSignedIn} fallbackRoute="/(auth)/login">
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modals/invoice-detail"
          options={{ presentation: 'modal', title: 'Detalle de Factura' }}
        />
      </Stack.Protected>
    </Stack>
  );
}
```

*En versiones anteriores a SDK 53 o layouts simples, usa `<Redirect href="/(auth)/login" />` condicional.*

---

## 🔑 Almacenamiento Seguro de Tokens (`expo-secure-store`)

**Regla no negociable:** nunca almacenes tokens JWT, refresh tokens o claves de sesión en `AsyncStorage`. Usa siempre `expo-secure-store` con hardware keychain/keystore.

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

El interceptor del cliente HTTP en `src/config/api-client.ts` invoca `tokenStorage.getAccessToken()` para inyectar el header `Authorization: Bearer <token>` y maneja el refresh ante respuestas `401`.

---

## 🌐 Deep Linking y Typed Routes

1. **Esquema:** define el esquema en `app.json`:
   ```json
   {
     "expo": {
       "scheme": "miapp",
       "experiments": { "typedRoutes": true }
     }
   }
   ```
2. **Navegación fuertemente tipada:** con `typedRoutes: true`, `router.push('/(app)/billing')` es verificado por TypeScript en tiempo de compilación.
3. **API Routes (`+api.ts`):** el soporte backend de Expo Router queda fuera del alcance de esta arquitectura móvil; todas las llamadas de datos consumen APIs REST/GraphQL externas mediante `src/config/api-client.ts`.

---

## 🧪 Testing de Navegación

No coloques tests dentro de `src/app/**`. Si necesitas verificar flujos completos de navegación entre pantallas:
1. Usa `renderRouter` de `expo-router/testing-library` dentro de un test ubicado en la feature correspondiente (p. ej. `src/features/auth/screens/login-screen/login-screen.test.tsx`).
2. O bien testea la pantalla aislando la navegación con un mock de `expo-router`:
   ```tsx
   import { useRouter } from 'expo-router';
   jest.mock('expo-router', () => ({
     useRouter: jest.fn(),
     useLocalSearchParams: jest.fn(() => ({ id: 'inv-123' })),
   }));
   ```
