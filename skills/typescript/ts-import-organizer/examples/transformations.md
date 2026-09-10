# Ejemplos de Transformación — ts-import-organizer

## Ejemplo 1: Archivo React con imports mezclados

### Antes

```tsx
import { useCallback } from "react";
import styles from "./Dashboard.module.css";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import type { DashboardProps } from "../../../types/dashboard";
import axios from "axios";
import { useState, useEffect } from "react";
import { UserCard } from "../../components/UserCard";
import { fetchDashboardData } from "../../services/dashboard";
import "reflect-metadata";
```

### Después

```tsx
import axios from "axios";
import { useState, useEffect, useCallback } from "react";

import { UserCard } from "@/components/UserCard";
import type { DashboardProps } from "@/types/dashboard";
import { fetchDashboardData } from "@/services/dashboard";
import { formatDate, formatCurrency } from "@/utils/formatters";

import "reflect-metadata";
import styles from "./Dashboard.module.css";
```

**Cambios aplicados:**

- ✅ `useState` y `useEffect` consolidados con `useCallback` en una sola línea
- ✅ `DashboardProps` convertido a `import type`
- ✅ Rutas `../../../` convertidas a `@/`
- ✅ Side-effects (`reflect-metadata`, CSS module) movidos al grupo 4
- ✅ Ordenado por longitud dentro de cada grupo

---

## Ejemplo 2: Archivo Node.js con built-ins mezclados

### Antes

```ts
import express from "express";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import { Router } from "express";
```

### Después

```ts
import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import cors from "cors";
import helmet from "helmet";
import { Router } from "express";
import express from "express";
```

**Cambios aplicados:**

- ✅ Built-ins movidos al grupo 1 con prefijo `node:`
- ✅ Dependencias externas en grupo 2, ordenadas por longitud
- ✅ `Router` y `express` en el mismo grupo (mismo proveedor pero módulos distintos)

---

## Ejemplo 3: Solo ordenar (sin conversiones)

### Antes

```ts
import { z } from "zod";
import type { NextRequest, NextResponse } from "next/server";
import { db } from "../lib/db";
import { validateUser } from "../middleware/auth";
import { ApiError } from "./errors";
```

### Después

```ts
import { z } from "zod";
import type { NextRequest, NextResponse } from "next/server";

import { db } from "../lib/db";
import { ApiError } from "./errors";
import { validateUser } from "../middleware/auth";
```

**Cambios aplicados:**

- ✅ `import type` ya estaba correcto, se conservó
- ✅ `./` y `../` (un nivel) se respetan, no se convierten
- ✅ Reordenados por longitud dentro del grupo de aliases/relativos

---

## Ejemplo 4: Flujo post-formateo con Prettier / Biome y multilínea

### 1. Archivo inicial (código desordenado e imports caóticos)

```ts
import {
  processPayment,
  calculateTax,
  validateCart,
  applyDiscount,
} from "../../../modules/checkout/services";
import { CartItem } from "../../../types/cart";
import { useState } from "react";
import { formatCurrency } from "../../utils/currency";
import { useEffect } from "react";
import "reflect-metadata";

export function Checkout({ items }: { items: CartItem[] }) {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    const tax = calculateTax(items);
    setTotal(tax);
  }, [items]);
  return total;
}
```

### 2. Paso 1: Se formatea el código primero con Prettier

> El formateador arregla la indentación del código, pero al exceder `printWidth` rompe el import largo en múltiples líneas y deja los imports desorganizados:

```ts
import {
  processPayment,
  calculateTax,
  validateCart,
  applyDiscount,
} from "../../../modules/checkout/services";
import { CartItem } from "../../../types/cart";
import { useState } from "react";
import { formatCurrency } from "../../utils/currency";
import { useEffect } from "react";
import "reflect-metadata";

export function Checkout({ items }: { items: CartItem[] }) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const tax = calculateTax(items);
    setTotal(tax);
  }, [items]);

  return total;
}
```

### 3. Paso 2: Aplicación final de `ts-import-organizer` (Post-formateo)

> Se eliminan `unused` (`processPayment`, `validateCart`, `applyDiscount`, `formatCurrency`), consolidando el import en una sola línea. Se convierte `CartItem` a `import type`, rutas relativas a `@/`, se consolidan hooks de React y se ordenan por longitud ascendente:

```ts
import { useState, useEffect } from "react";

import type { CartItem } from "@/types/cart";
import { calculateTax } from "@/modules/checkout/services";

import "reflect-metadata";

export function Checkout({ items }: { items: CartItem[] }) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const tax = calculateTax(items);
    setTotal(tax);
  }, [items]);

  return total;
}
```

**Beneficio obtenido:**

- ✅ El formateador normalizó el cuerpo del código primero sin riesgo de romper el bloque de imports posteriormente.
- ✅ Al eliminar los specifiers `unused` tras el formateo, la declaración multilínea de servicios se simplificó limpiamente a una sola línea.
- ✅ El bloque de imports queda sellado y listo en su orden canónico.

---

## Ejemplo 5: Ordenamiento multilínea primero y miembros por longitud (NestJS)

### Antes (monolínea antes de multilínea y especificadores desordenados)
```ts
import { Controller, Get, Param, Query, VERSION_NEUTRAL } from '@nestjs/common';
import {
  ApiParam,
  ApiTags,
  ApiOkResponse,
  ApiOperation,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
```

### Después (multilínea PRIMERO con miembros ordenados; monolínea DESPUÉS con miembros ordenados)
```ts
import {
  ApiTags,
  ApiParam,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { Get, Param, Query, Controller, VERSION_NEUTRAL } from '@nestjs/common';
```

**Cambios aplicados:**
- ✅ El import multilínea (`@nestjs/swagger`) se ubica **al inicio del grupo** de dependencias externas.
- ✅ Los especificadores de `@nestjs/swagger` quedan ordenados de menor a mayor (`7 → 8 → 12 → 13 → 19 → 21` caracteres).
- ✅ El import de una sola línea (`@nestjs/common`) se ubica **después** de los multilínea.
- ✅ Los miembros dentro de `@nestjs/common` también se ordenan por longitud ascendente (`Get` [3] → `Param` [5] → `Query` [5] → `Controller` [10] → `VERSION_NEUTRAL` [15]).
