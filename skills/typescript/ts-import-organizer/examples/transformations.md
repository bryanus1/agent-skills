# Ejemplos de Transformación — ts-import-organizer

## Ejemplo 1: Archivo React con imports mezclados

### Antes
```tsx
import { useCallback } from 'react'
import styles from './Dashboard.module.css'
import { formatCurrency, formatDate } from '../../../utils/formatters'
import type { DashboardProps } from '../../../types/dashboard'
import axios from 'axios'
import { useState, useEffect } from 'react'
import { UserCard } from '../../components/UserCard'
import { fetchDashboardData } from '../../services/dashboard'
import 'reflect-metadata'
```

### Después
```tsx
import axios from 'axios'
import { useState, useEffect, useCallback } from 'react'

import type { DashboardProps } from '@/types/dashboard'
import { UserCard } from '@/components/UserCard'
import { fetchDashboardData } from '@/services/dashboard'
import { formatDate, formatCurrency } from '@/utils/formatters'

import 'reflect-metadata'
import styles from './Dashboard.module.css'
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
import express from 'express'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import { Router } from 'express'
```

### Después
```ts
import fs from 'node:fs'
import path from 'node:path'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

import cors from 'cors'
import helmet from 'helmet'
import { Router } from 'express'
import express from 'express'
```

**Cambios aplicados:**
- ✅ Built-ins movidos al grupo 1 con prefijo `node:`
- ✅ Dependencias externas en grupo 2, ordenadas por longitud
- ✅ `Router` y `express` en el mismo grupo (mismo proveedor pero módulos distintos)

---

## Ejemplo 3: Solo ordenar (sin conversiones)

### Antes
```ts
import { z } from 'zod'
import type { NextRequest, NextResponse } from 'next/server'
import { db } from '../lib/db'
import { validateUser } from '../middleware/auth'
import { ApiError } from './errors'
```

### Después
```ts
import { z } from 'zod'
import type { NextRequest, NextResponse } from 'next/server'

import { db } from '../lib/db'
import { ApiError } from './errors'
import { validateUser } from '../middleware/auth'
```

**Cambios aplicados:**
- ✅ `import type` ya estaba correcto, se conservó
- ✅ `./` y `../` (un nivel) se respetan, no se convierten
- ✅ Reordenados por longitud dentro del grupo de aliases/relativos
