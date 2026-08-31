---
name: ts-import-organizer
version: 1.0.0
description: >-
  Organiza y estandariza imports en TypeScript/JavaScript (.ts, .tsx, .js, .jsx, .mjs, .cjs).
  Activa cuando el usuario pida ordenar, limpiar, reorganizar o arreglar imports, o al escribir
  código nuevo. Agrupa: builtins → externos → path aliases → side-effects. Elimina unused,
  consolida duplicados, convierte rutas relativas profundas a path aliases.
tags: [typescript, javascript, imports, style, refactor, linting]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - organizar imports
  - ordenar imports
  - limpiar imports
  - reorganizar imports
  - arreglar imports
  - organize imports
  - sort imports
  - clean imports
  - fix imports
  - import order
  - unused imports
  - path alias
requirements:
  tools: [view_file, replace_file_content, run_command]
---

# TS/JS Import Organizer

## 🎯 Propósito

Estandariza los imports en cualquier archivo TypeScript o JavaScript para que sean legibles, consistentes y libres de ruido. Aplica tanto al **escribir código nuevo** como al **reorganizar imports existentes** a petición del usuario.

El problema que resuelve: imports desordenados, mezcla de estilos, rutas relativas profundas difíciles de rastrear, duplicados y tipos importados sin `import type`.

## ⚡ Cuándo Activar esta Skill

- El usuario pide "ordenar", "organizar", "limpiar" o "arreglar" los imports de un archivo.
- El agente está escribiendo o modificando código nuevo y necesita añadir imports.
- Se detectan imports desorganizados, duplicados, unused o con rutas relativas profundas (`../../..`).
- El usuario menciona path aliases, import order, o lint errors relacionados con imports.

Aplica a archivos: `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`.

## 📋 Flujo de Trabajo Paso a Paso

### Al reorganizar imports existentes

1. **Lee el archivo completo** con `view_file` para entender el contexto (aliases configurados en `tsconfig.json` o `vite.config`, estilo de comillas usado).

2. **Identifica todos los imports** al inicio del archivo.

3. **Aplica las reglas de transformación** (ver sección de Reglas) y reescribe el bloque de imports con `replace_file_content`.

4. **Verifica el resultado** leyendo de nuevo el bloque de imports para confirmar que está correcto.

### Al escribir código nuevo

Aplica las reglas directamente al generar los imports, sin necesidad de un paso de reorganización posterior.

## 📐 Reglas de Organización

### Grupos y orden

Siempre organiza los imports en exactamente estos 4 grupos, separados por **una línea en blanco** entre cada uno:

```
1. Node built-ins          → import fs from 'node:fs'
2. Dependencias externas   → import React from 'react'
3. Path aliases del proyecto → import { Button } from '@/components/Button'
4. Side-effect imports     → import './styles.css'
```

> Los imports relativos `./` y `../` también van en el grupo 3 (junto a aliases), pero **solo** si son de un nivel: mismo directorio (`./foo`) o un nivel arriba (`../foo`). Rutas más profundas deben convertirse a alias.

### Orden dentro de cada grupo

Ordena por **longitud de línea**, de menor a mayor (los imports cortos primero). Esto facilita el escaneo visual.

**Ejemplo:**
```ts
import fs from 'node:fs'
import path from 'node:path'
import { createReadStream } from 'node:fs'
```

### Conversión de rutas relativas profundas a path alias

Si encuentras una ruta con 2 o más niveles hacia arriba (`../../`, `../../../`...), conviértela al path alias equivalente. Infiere el alias desde el `tsconfig.json` / `vite.config` si está disponible; si no, usa `@/` como convención por defecto.

**Ejemplo:**
```ts
// ❌ Antes
import { formatDate } from '../../../utils/date'
import { ApiClient } from '../../services/api'

// ✅ Después
import { ApiClient } from '@/services/api'
import { formatDate } from '@/utils/date'
```

`./` y `../` (un solo nivel) están **permitidos** y no se tocan.

### Imports no utilizados (unused)

Elimina cualquier import que no se use en el archivo. Si un named import dentro de un `{ A, B, C }` no se usa, quítalo solo a él. Si todos los named imports de un módulo son unused, elimina la línea completa.

### Consolidación de duplicados

Si el mismo módulo aparece importado en más de una línea, combínalos en una sola:

```ts
// ❌ Antes
import { useState } from 'react'
import { useEffect } from 'react'

// ✅ Después
import { useState, useEffect } from 'react'
```

### `import type` para tipos de TypeScript

Cuando un import es exclusivamente de tipos (interfaces, types, enums usados solo como tipo), usa `import type`:

```ts
// ❌ Antes
import { User, ApiResponse } from './types'

// ✅ Después
import type { User, ApiResponse } from '@/types'
```

Si un módulo mezcla valores y tipos, usa `import` normal o el inline `import { value, type MyType }` de TS 4.5+.

### Estilo de comillas

Respeta el estilo de comillas que ya existe en el archivo (simples `'` o dobles `"`). Si el archivo es nuevo, usa comillas simples por defecto.

## ⚠️ Reglas Críticas

- **No reordenes nada fuera del bloque de imports.** El resto del archivo no se toca.
- **No conviertas a alias si no puedes inferir el alias correcto.** En ese caso, deja la ruta relativa y avisa al usuario que debe configurar `paths` en su `tsconfig.json`.
- **No elimines side-effect imports** aunque parezcan unused — son intencionales por naturaleza.
- **No rompas el código.** Si hay alguna duda sobre si un import está realmente unused (e.g., usado en un tipo JSX implícito), consérvalo.
- **No uses `import *` (star imports)** salvo que ya existían o el usuario los pida explícitamente.

## 📚 Referencias

- [Ejemplos de transformación](file:///Users/brayansanjuan/Development/personal/agent-skills/skills/typescript/ts-import-organizer/examples/transformations.md)
