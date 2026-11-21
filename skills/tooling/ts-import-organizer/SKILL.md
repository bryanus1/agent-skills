---
name: ts-import-organizer
version: 1.2.0
description: >-
  Organizes imports in TypeScript/JavaScript (.ts, .tsx, .js, .jsx), always AFTER the code is formatted. Groups: builtins → external → path aliases → side effects. Sorts lines and members ({ ... }) by length, removes unused imports and turns deep relative paths into aliases. Use when sorting imports or writing code.
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

## 🎯 Purpose

Standardizes the imports in any TypeScript or JavaScript file so they are readable, consistent and free of noise.

**Guiding principle**: This skill is the **last step** on a file and runs **strictly AFTER the code has been formatted** (with Prettier, Biome, ESLint or the IDE/agent formatter). That keeps formatters from breaking the length order, re-wrapping import lines or undoing the group separation.

It fixes: unordered imports, mixed styles, deep relative paths (`../../..`), duplicates, types imported without `import type`, and misalignments caused by automatic formatters.

## ⚡ When to Trigger

- As the **last step** after writing, refactoring or formatting TypeScript/JavaScript code.
- The user asks to "sort", "organize", "clean up", "format" or "fix" the imports of a file.
- You notice unordered, duplicated or unused imports, or deep relative paths (`../../..`).
- The user mentions path aliases, import order, or lint errors about imports.

Applies to: `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`.

## 📋 Workflow

### 🚨 Cardinal Rule: Format FIRST, Organize Imports AFTER
Any syntax formatting (Prettier, Biome, ESLint with `--fix`, IDE shortcuts or agent formatters) must run **BEFORE** the rules of this skill.
- **Why**: Formatters wrap lines based on `printWidth`, splitting long imports over several lines and reordering tokens. Formatting afterwards destroys the length order.
- **Takeaway**: Reorganizing imports is always the **last change** saved to the file.

---

### Flow A: Reorganizing or cleaning imports in existing files

1. **(Prerequisite) Format the file first**:
   - If the project has format scripts (`pnpm prettier --write`, `npx @biomejs/biome format --write`, etc.), run them on the file before touching the imports.
   - If there is no CLI script, make sure the indentation and structure of the file body are already formatted.

2. **Read the whole file** with `view_file` to understand the context:
   - Find the aliases configured in `tsconfig.json` or `vite.config` (e.g. `@/*`).
   - Find the project's quote style (single `'` or double `"`).
   - Check which imported identifiers the code actually uses.

3. **Find and clean up imports**:
   - **Remove unused imports**: Drop imports the formatted file does not use.
   - **Merge duplicates**: If the same module is imported on several lines, merge them into one.
   - **Convert relative paths**: Replace deep relative paths (`../../`, `../../../`) with the matching path alias (`@/`). One-level paths (`./`, `../`) stay as they are.
   - **Split types**: Use `import type` for pure TypeScript interfaces or types.

4. **Group and sort (final touch)**:
   - Put each import in exactly one of the 4 groups:
     1. Node built-ins (`node:fs`, `node:path`)
     2. External dependencies from `node_modules` (`react`, `axios`, `zod`)
     3. Project path aliases (`@/components`, `@/services`) and local relative imports (`./`, `../`)
     4. Side effects (`./styles.css`, `reflect-metadata`)
   - **Within each group**:
     1. Place **multi-line imports FIRST** (with their members sorted by length, shortest to longest).
     2. Place **single-line imports AFTER** them (sorted by ascending line length, with their `{ ... }` members also sorted by length).
   - Insert exactly **one blank line** between groups.

5. **Apply and lock the block**:
   - Rewrite the import block with `replace_file_content`.
   - **IMPORTANT**: Do not run automatic formatters over the import block again after this step.

---

### Flow B: Writing new code or refactoring logic

1. **Write the code and logic**: Write the functions, components and calls with the imports they need.
2. **Format the generated code**: Run the project's formatter or cleanly format the whole file.
3. **Finish with ts-import-organizer**:
   - Check for orphaned or duplicated imports left by the implementation.
   - Sort the members inside `{ ... }` by ascending length.
   - Group into the 4 blocks, with multi-line imports first and single-line imports after (sorted by length), and make sure `import type` is used.

---

## 📐 Organization Rules

### Groups and order

Always organize imports into exactly these 4 groups, with **one blank line** between them:

```
1. Node built-ins            → import fs from 'node:fs'
2. External dependencies     → import React from 'react'
3. Path aliases and relative → import { Button } from '@/components/Button'
4. Side-effect imports       → import './styles.css'
```

> Relative imports `./` and `../` also go in group 3 (next to aliases), but **only** when they are one level deep: same directory (`./foo`) or one level up (`../foo`). Deeper paths must be converted to an alias.

### Order within each group

Within each of the 4 groups, follow this hierarchy strictly:

1. **Multi-line imports FIRST**: Declarations split over several lines always go at the **start of the group**.
   - The specifiers inside their `{ ... }` are sorted by ascending length (shortest to longest), one per line.
   - If a group has several multi-line imports, sort them among themselves (by number of lines or by the length of their closing `} from '...'` line).

2. **Single-line imports AFTER**:
   - They come right after the multi-line imports.
   - Sort them by **total line length**, shortest to longest (shortest imports first).
   - The members inside their `{ ... }` are also sorted by ascending length.

### Specifier order inside `{ ... }` (named imports)

In both **single-line** and **multi-line** imports, the identifiers inside the braces `{ ... }` MUST be sorted by **ascending character length (shortest to longest)**. When two identifiers have the same length, break the tie alphabetically.

**Canonical example (multi-line first + members by length; single-line after + members by length):**
```ts
// ❌ Unordered
import { Controller, Get, Param, Query, VERSION_NEUTRAL } from '@nestjs/common';
import {
  ApiParam,
  ApiTags,
  ApiOkResponse,
  ApiOperation,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

// ✅ Ordered (multi-line first with 7→8→12→13→19→21 chars; single-line after with 3→5→5→10→15 chars)
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

**Single-line example:**
```ts
// ❌ Unordered
import { useCallback, useState, useEffect } from 'react'

// ✅ Sorted by length (8 → 9 → 11 characters)
import { useState, useEffect, useCallback } from 'react'
```

### Handling imports after formatting (single-line vs multi-line)

When you apply this skill after formatting:
1. **Prefer a single line**: If, after merging or removing unused specifiers, the declaration fits on one readable line, keep it on one line and sort its `{ a, b, c }` members by ascending length.
2. **Multi-line declarations go FIRST**: If an import has many members and the formatter split it over several lines:
   - Sort each member by ascending identifier length (shortest to longest, one per line).
   - Place the multi-line declaration **at the start of its group** (before the single-line imports).
   - Single-line imports follow, sorted by ascending line length.

### Converting deep relative paths to path aliases

If a path goes up 2 or more levels (`../../`, `../../../`...), convert it to the equivalent path alias. Infer the alias from `tsconfig.json` / `vite.config` when available; otherwise use `@/` as the default convention.

**Example:**
```ts
// ❌ Before
import { formatDate } from '../../../utils/date'
import { ApiClient } from '../../services/api'

// ✅ After
import { formatDate } from '@/utils/date'
import { ApiClient } from '@/services/api'
```

`./` and `../` (one level) are **allowed** and left alone.

### Unused imports

Remove every import the file does not use. If one named import inside `{ A, B, C }` is unused, remove only that one. If all the named imports of a module are unused, remove the whole line.

### Merging duplicates

If the same module is imported on more than one line, merge them into one:

```ts
// ❌ Before
import { useState } from 'react'
import { useEffect } from 'react'

// ✅ After
import { useState, useEffect } from 'react'
```

### `import type` for TypeScript types

When an import brings only types (interfaces, types, enums used only as types), use `import type`:

```ts
// ❌ Before
import { User, ApiResponse } from './types'

// ✅ After
import type { User, ApiResponse } from '@/types'
```

If a module mixes values and types, use a regular `import` or the inline `import { value, type MyType }` form from TS 4.5+.

### Quote style

Keep the quote style the file already uses (single `'` or double `"`). For a new file, default to single quotes.

## ⚠️ Critical Rules

- Reply in the user's language, even though this skill is written in English.
- **Format BEFORE organizing imports (non-negotiable)**: Always format the code BEFORE organizing the imports, NEVER after. If a global formatter changes the imports after you organized them, sort the imports again as the final step.
- **Do not reorder anything outside the import block.** Leave the rest of the file untouched.
- **Do not convert to an alias if you cannot infer the right one.** Keep the relative path and tell the user to configure `paths` in their `tsconfig.json`.
- **Do not remove side-effect imports**, even if they look unused: they are intentional (`import 'reflect-metadata'`, `import './theme.css'`).
- **Do not break the code.** If you are unsure whether an import is really unused (e.g. used by an implicit JSX type or a directive), keep it.
- **Do not use `import *` (star imports)** unless they were already there or the user asks for them.

## 📚 References

- [Transformation examples](examples/transformations.md)
