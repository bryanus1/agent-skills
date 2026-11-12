# Estado del Cliente, Formularios y Soporte Offline

La arquitectura móvil distingue claramente el estado del servidor, el estado de UI global y el estado local de un componente, complementándolo con persistencia y tolerancia a desconexión.

---

## 🧭 Matriz de Decisión para Estado

| Tipo de Estado | Herramienta | Ubicación en el Árbol | Ejemplo |
| --- | --- | --- | --- |
| **Servidor (asíncrono/remoto)** | TanStack Query | `src/features/<feat>/hooks/` | Lista de facturas, perfil de usuario, mutaciones. |
| **UI Global o de Sesión** | Zustand | `src/features/<feat>/stores/` | Filtros de búsqueda activos, draft en curso, sesión auth. |
| **Local de Componente** | `useState` / `useReducer` | Dentro de `{component}.tsx` | Dropdown abierto, texto de input transitorio. |
| **Transversal a toda la app** | Zustand | `src/stores/<store-name>/` | Tema claro/oscuro, preferencias de red, conectividad. |

---

## 📦 Zustand Stores en Features (`stores/<name>/`)

Cuando una feature necesita coordinar estado entre múltiples pantallas sin persistirlo en backend:

```ts
// src/features/billing/stores/billing-filter/billing-filter.store.ts
import { create } from 'zustand';

export interface IBillingFilterState {
  readonly status: 'all' | 'paid' | 'pending';
  readonly setStatus: (status: 'all' | 'paid' | 'pending') => void;
  readonly resetFilters: () => void;
}

export const useBillingFilterStore = create<IBillingFilterState>((set) => ({
  status: 'all',
  setStatus: (status) => set({ status }),
  resetFilters: () => set({ status: 'all' }),
}));
```

---

## 📝 Formularios Tipados con Zod y React Hook Form

Usa `react-hook-form` con `@hookform/resolvers/zod` vinculando directamente los esquemas de `schemas/`:

```tsx
// src/features/billing/components/create-invoice-form/create-invoice-form.tsx
import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createInvoiceSchema, type ICreateInvoiceInput } from '@/features/billing/schemas';

export interface ICreateInvoiceFormProps {
  readonly onSubmit: (data: ICreateInvoiceInput) => void;
  readonly isSubmitting?: boolean;
}

export function CreateInvoiceForm({ onSubmit, isSubmitting }: Readonly<ICreateInvoiceFormProps>) {
  const { control, handleSubmit, formState: { errors } } = useForm<ICreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: { amount: 0, description: '' },
  });

  return (
    <View className="gap-4 p-4">
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Descripción</Text>
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              className="mt-1 rounded-md border border-zinc-300 p-2 dark:border-zinc-700 dark:text-white"
            />
            {errors.description && <Text className="mt-1 text-xs text-red-500">{errors.description.message}</Text>}
          </View>
        )}
      />
      <Pressable
        accessibilityRole="button"
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        className="rounded-md bg-blue-600 p-3 items-center"
      >
        <Text className="font-semibold text-white">{isSubmitting ? 'Guardando...' : 'Crear Factura'}</Text>
      </Pressable>
    </View>
  );
}
```

---

## 📡 Soporte Offline y Gestión de Conexión

En React Native, el refresco automático de TanStack Query al reenfocar la app requiere suscripción explícita al ciclo de vida nativo (`AppState`) y a la red (`NetInfo`):

```ts
// src/config/query-client.ts
import { AppState, type AppStateStatus, Platform } from 'react-native';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

// 1. Detección de red en segundo plano
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected));
  });
});

// 2. Refocus cuando el usuario vuelve a la app
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}
const sub = AppState.addEventListener('change', onAppStateChange);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutos de frescura
      gcTime: 1000 * 60 * 60 * 24, // 24 horas en caché para offline
    },
  },
});
```

Para persistencia de caché entre reinicios de la app, usa `@tanstack/react-query-persist-client` con un storage sincrónico como `react-native-mmkv` o asincrónico `AsyncStorage`.

---

## 🛡️ Validación Estricta de Variables de Entorno (`src/config/env.ts`)

Nunca accedas a `process.env.EXPO_PUBLIC_*` de forma dispersa sin validar tipos:

```ts
// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
  EXPO_PUBLIC_ENV: z.enum(['development', 'staging', 'production']).default('development'),
});

export const env = envSchema.parse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV,
});
```
