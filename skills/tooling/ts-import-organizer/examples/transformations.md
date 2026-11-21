# Transformation Examples — ts-import-organizer

## Example 1: React file with mixed imports

### Before

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

### After

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

**Changes applied:**

- ✅ `useState` and `useEffect` merged with `useCallback` into a single line
- ✅ `DashboardProps` converted to `import type`
- ✅ `../../../` paths converted to `@/`
- ✅ Side effects (`reflect-metadata`, CSS module) moved to group 4
- ✅ Sorted by length within each group

---

## Example 2: Node.js file with mixed built-ins

### Before

```ts
import express from "express";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import { Router } from "express";
```

### After

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

**Changes applied:**

- ✅ Built-ins moved to group 1 with the `node:` prefix
- ✅ External dependencies in group 2, sorted by length
- ✅ `Router` and `express` in the same group (same package, different imports)

---

## Example 3: Sort only (no conversions)

### Before

```ts
import { z } from "zod";
import type { NextRequest, NextResponse } from "next/server";
import { db } from "../lib/db";
import { validateUser } from "../middleware/auth";
import { ApiError } from "./errors";
```

### After

```ts
import { z } from "zod";
import type { NextRequest, NextResponse } from "next/server";

import { db } from "../lib/db";
import { ApiError } from "./errors";
import { validateUser } from "../middleware/auth";
```

**Changes applied:**

- ✅ `import type` was already correct and is kept
- ✅ `./` and `../` (one level) are left alone, not converted
- ✅ Reordered by length within the aliases/relative group

---

## Example 4: Post-formatting flow with Prettier / Biome and multi-line imports

### 1. Starting file (messy code and chaotic imports)

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

### 2. Step 1: Format the code first with Prettier

> The formatter fixes the code's indentation, but because the long import exceeds `printWidth` it splits it over several lines and leaves the imports unordered:

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

### 3. Step 2: Final pass of `ts-import-organizer` (after formatting)

> The unused imports (`processPayment`, `validateCart`, `applyDiscount`, `formatCurrency`) are removed, which collapses the services import to one line. `CartItem` becomes `import type`, relative paths become `@/`, the React hooks are merged, and everything is sorted by ascending length:

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

**Result:**

- ✅ The formatter normalized the code body first, so it cannot break the import block afterwards.
- ✅ Removing the unused specifiers after formatting collapsed the multi-line services import into a single line.
- ✅ The import block is locked in its canonical order.

---

## Example 5: Multi-line first and members by length (NestJS)

### Before (single-line before multi-line, unordered specifiers)
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

### After (multi-line FIRST with sorted members; single-line AFTER with sorted members)
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

**Changes applied:**
- ✅ The multi-line import (`@nestjs/swagger`) goes **at the start** of the external dependencies group.
- ✅ The `@nestjs/swagger` specifiers are sorted shortest to longest (`7 → 8 → 12 → 13 → 19 → 21` characters).
- ✅ The single-line import (`@nestjs/common`) goes **after** the multi-line ones.
- ✅ The members of `@nestjs/common` are also sorted by ascending length (`Get` [3] → `Param` [5] → `Query` [5] → `Controller` [10] → `VERSION_NEUTRAL` [15]).
