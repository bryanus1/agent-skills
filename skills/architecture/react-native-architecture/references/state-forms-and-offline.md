# Client State, Forms and Offline Support

The mobile architecture clearly distinguishes server state, global UI state and a component's local state, complemented by persistence and tolerance to disconnection.

---

## 🧭 State Decision Matrix

| State Type | Tool | Location in the Tree | Example |
| --- | --- | --- | --- |
| **Server (async/remote)** | TanStack Query | `src/features/<feat>/hooks/` | Invoice list, user profile, mutations. |
| **Global UI or Session** | Zustand | `src/features/<feat>/stores/` | Active search filters, a draft in progress, auth session. |
| **Component-local** | `useState` / `useReducer` | Inside `{component}.tsx` | An open dropdown, transient input text. |
| **App-wide** | Zustand | `src/stores/<store-name>/` | Light/dark theme, network preferences, connectivity. |

---

## 📦 Zustand Stores in Features (`stores/<name>/`)

When a feature needs to coordinate state across several screens without persisting it to the backend:

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

## 📝 Typed Forms with Zod and React Hook Form

Use `react-hook-form` with `@hookform/resolvers/zod`, binding the schemas from `schemas/` directly:

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
            <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</Text>
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
        <Text className="font-semibold text-white">{isSubmitting ? 'Saving...' : 'Create Invoice'}</Text>
      </Pressable>
    </View>
  );
}
```

---

## 📡 Offline Support and Connection Handling

In React Native, TanStack Query's automatic refetch when the app regains focus requires an explicit subscription to the native lifecycle (`AppState`) and to the network (`NetInfo`):

```ts
// src/config/query-client.ts
import { AppState, type AppStateStatus, Platform } from 'react-native';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

// 1. Background network detection
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected));
  });
});

// 2. Refocus when the user returns to the app
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
      staleTime: 1000 * 60 * 5, // 5 minutes of freshness
      gcTime: 1000 * 60 * 60 * 24, // 24 hours in cache for offline use
    },
  },
});
```

To persist the cache across app restarts, use `@tanstack/react-query-persist-client` with synchronous storage such as `react-native-mmkv` or asynchronous `AsyncStorage`.

---

## 🛡️ Strict Environment Variable Validation (`src/config/env.ts`)

Never access `process.env.EXPO_PUBLIC_*` in scattered places without validating the types:

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
