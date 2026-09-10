---
name: ts-import-organizer
version: 1.1.0
description: >-
  Organiza imports en TypeScript/JavaScript (.ts, .tsx, .js, .jsx). Se aplica siempre DESPUÉS de formatear el código. Agrupa: builtins → externos → path aliases → side-effects. Ordena líneas y miembros ({ ... }) por longitud, elimina unused y convierte rutas relativas a aliases. Activa al ordenar imports o escribir código.
tags: [typescript, javascript, imports, style, refactor, linting, formatter]
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
  - formatear y ordenar imports
  - organizar imports post formateo
  - format and sort imports
  - post format imports
  - ordenar named imports
  - sort named imports
requirements:
  tools: [view_file, replace_file_content, run_command]
---

# TS/JS Import Organizer

## 🎯 Propósito

Estandariza los imports en cualquier archivo TypeScript o JavaScript para que sean legibles, consistentes y libres de ruido.

**Principio rector de ejecución**: Esta skill opera como el **paso final** sobre el archivo, aplicándose **estrictamente DESPUÉS de que el código ha sido formateado** (con Prettier, Biome, ESLint o el formateador del IDE/agente). Esto previene que herramientas de formateo rompan el orden por longitud, reestructuren saltos de línea de imports o invaliden la separación de grupos.

Resuelve: imports desordenados, mezcla de estilos, rutas relativas profundas (`../../..`), duplicados, tipos importados sin `import type` y desalineaciones causadas por formateadores automáticos.

## ⚡ Cuándo Activar esta Skill

- Como **paso final** después de escribir, refactorizar o formatear código TypeScript/JavaScript.
- El usuario pide "ordenar", "organizar", "limpiar", "formatear" o "arreglar" los imports de un archivo.
- Se detectan imports desorganizados, duplicados, unused o con rutas relativas profundas (`../../..`).
- El usuario menciona path aliases, import order, o lint errors relacionados con imports.

Aplica a archivos: `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`.

## 📋 Flujo de Trabajo Paso a Paso

### 🚨 Regla Cardinal: Formatear PRIMERO, Organizar Imports DESPUÉS
Cualquier formateo de sintaxis (Prettier, Biome, ESLint con `--fix`, atajos de IDE o formateadores de agentes) debe ejecutarse **ANTES** de aplicar las reglas de esta skill.
- **Por qué**: Los formateadores configuran saltos de línea basados en `printWidth`, rompiendo imports largos en varias líneas y reordenando tokens. Si se formatea después, se pierde el orden visual por longitud.
- **Conclusión**: La reorganización de imports es siempre la **última modificación** que se guarda en el archivo.

---

### Flujo A: Al reorganizar o limpiar imports en archivos existentes

1. **(Paso Previo) Formatea el archivo primero**:
   - Si el proyecto cuenta con scripts de formato (`pnpm prettier --write`, `npx @biomejs/biome format --write`, etc.), ejecútalo en el archivo antes de tocar los imports.
   - Si no hay script CLI, asegúrate de que la indentación y estructura del cuerpo del archivo ya estén formateadas.

2. **Lee el archivo completo** con `view_file` para entender el contexto:
   - Identifica aliases configurados en `tsconfig.json` o `vite.config` (ej. `@/*`).
   - Identifica el estilo de comillas del proyecto (simples `'` o dobles `"`).
   - Verifica qué identificadores importados realmente se usan en el cuerpo del código.

3. **Identifica y depura imports**:
   - **Elimina unused**: Quita imports que no se usen en el archivo ya formateado.
   - **Consolida duplicados**: Si un mismo módulo se importa en varias líneas, únelo en una sola.
   - **Convierte rutas relativas**: Reemplaza rutas relativas profundas (`../../`, `../../../`) por su path alias correspondiente (`@/`). Las rutas de un solo nivel (`./`, `../`) se conservan.
   - **Separa tipos**: Usa `import type` para interfaces o tipos puros de TypeScript.

4. **Agrupa y ordena (Toque Final)**:
   - Clasifica cada import en exactamente uno de los 4 grupos:
     1. Node built-ins (`node:fs`, `node:path`)
     2. Dependencias externas de `node_modules` (`react`, `axios`, `zod`)
     3. Path aliases del proyecto (`@/components`, `@/services`) e imports relativos locales (`./`, `../`)
     4. Side-effects (`./styles.css`, `reflect-metadata`)
   - **Dentro de cada grupo**:
     1. Ubica los **imports multilínea PRIMERO** (con sus miembros ordenados por longitud de menor a mayor).
     2. Ubica los **imports de una sola línea DESPUÉS** (ordenados por longitud de línea ascendente, con sus miembros internos `{ ... }` también ordenados por longitud).
   - Inserta exactamente **una línea en blanco** entre cada grupo.

5. **Aplica y asegura el bloque**:
   - Reescribe el bloque de imports con `replace_file_content`.
   - **IMPORTANTE**: No vuelvas a pasar formateadores automáticos sobre el bloque de imports tras este paso.

---

### Flujo B: Al escribir código nuevo o refactorizar lógica

1. **Escribe el código y la lógica**: Escribe las funciones, componentes y llamadas preliminares con los imports necesarios.
2. **Formatea el código generado**: Aplica el formateador del proyecto o dale formato limpio a toda la estructura del archivo.
3. **Aplica ts-import-organizer como cierre**:
   - Revisa si quedaron imports huérfanos o duplicados tras la implementación.
   - Ordena los miembros dentro de `{ ... }` por longitud ascendente.
   - Agrupa en los 4 bloques, colocando multilíneas primero y monolíneas después ordenadas por longitud, y asegura los `import type`.

---

## 📐 Reglas de Organización

### Grupos y orden

Siempre organiza los imports en exactamente estos 4 grupos, separados por **una línea en blanco** entre cada uno:

```
1. Node built-ins            → import fs from 'node:fs'
2. Dependencias externas     → import React from 'react'
3. Path aliases y relativos  → import { Button } from '@/components/Button'
4. Side-effect imports       → import './styles.css'
```

> Los imports relativos `./` y `../` también van en el grupo 3 (junto a aliases), pero **solo** si son de un nivel: mismo directorio (`./foo`) o un nivel arriba (`../foo`). Rutas más profundas deben convertirse a alias.

### Orden dentro de cada grupo

Dentro de cada uno de los 4 grupos, la organización sigue estrictamente esta jerarquía:

1. **Imports Multilínea PRIMERO**: Las declaraciones divididas en varios renglones van siempre al **inicio del grupo**.
   - Los especificadores internos dentro de sus `{ ... }` se ordenan por longitud ascendente (de menor a mayor), uno por renglón.
   - Si existen múltiples imports multilínea en el mismo grupo, se ordenan entre sí (por número de líneas o longitud de su línea de cierre `} from '...'`).

2. **Imports de Una Sola Línea (Monolínea) DESPUÉS**:
   - Van a continuación de los imports multilínea.
   - Se ordenan por **longitud total de línea**, de menor a mayor (los imports más cortos primero).
   - Los miembros dentro de sus `{ ... }` también se ordenan por longitud ascendente (de menor a mayor).

### Orden de especificadores dentro de `{ ... }` (Named Imports)

Tanto en imports de **una sola línea** como en **multilínea**, los identificadores o miembros dentro de las llaves `{ ... }` DEBEN estar ordenados por **longitud de caracteres ascendente (de menor a mayor)**. Si dos identificadores tienen exactamente la misma longitud, se desempata por orden alfabético.

**Ejemplo canónico (Multilínea primero + miembros por longitud; monolínea después + miembros por longitud):**
```ts
// ❌ Desordenado
import { Controller, Get, Param, Query, VERSION_NEUTRAL } from '@nestjs/common';
import {
  ApiParam,
  ApiTags,
  ApiOkResponse,
  ApiOperation,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

// ✅ Ordenado (Multilínea primero con 7→8→12→13→19→21 chars; monolínea después con 3→5→5→10→15 chars)
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

**Ejemplo en una sola línea:**
```ts
// ❌ Desordenado
import { useCallback, useState, useEffect } from 'react'

// ✅ Ordenado por longitud (8 → 9 → 11 caracteres)
import { useState, useEffect, useCallback } from 'react'
```

### Manejo de imports tras formateo (Monolínea vs Multilínea)

Al aplicar esta skill después del formateo:
1. **Preferir formato en una sola línea**: Si tras consolidar o limpiar specifiers unused la declaración cabe en una sola línea respetando la legibilidad, mantenla en una sola línea y ordena sus miembros `{ a, b, c }` por longitud ascendente.
2. **Declaraciones multilínea van PRIMERO**: Si un import contiene muchos elementos y fue dividido en múltiples renglones por el formateador:
   - Ordena cada miembro interno por longitud de identificador ascendente (de menor a mayor, uno por renglón).
   - Coloca la declaración multilínea **al inicio de su grupo respectivo** (antes de los imports de una sola línea).
   - Los imports de una sola línea se colocan después, ordenados por longitud de línea ascendente.

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

- **Formateo ANTES de organizar imports (Inviolable)**: El código debe formatearse siempre ANTES de organizar los imports, NUNCA después. Si un formateador global altera los imports después de organizarlos, re-aplica el ordenamiento de imports como paso definitivo.
- **No reordenes nada fuera del bloque de imports.** El resto del archivo no se toca.
- **No conviertas a alias si no puedes inferir el alias correcto.** En ese caso, deja la ruta relativa y avisa al usuario que debe configurar `paths` en su `tsconfig.json`.
- **No elimines side-effect imports** aunque parezcan unused — son intencionales por naturaleza (`import 'reflect-metadata'`, `import './theme.css'`).
- **No rompas el código.** Si hay alguna duda sobre si un import está realmente unused (e.g., usado en un tipo JSX implícito o directiva), consérvalo.
- **No uses `import *` (star imports)** salvo que ya existieran o el usuario los pida explícitamente.

## 📚 Referencias

- [Ejemplos de transformación](file:///Users/brayansanjuan/Development/personal/agent-skills/skills/typescript/ts-import-organizer/examples/transformations.md)
