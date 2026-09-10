---
name: dart-import-organizer
version: 1.0.0
description: >-
  Organiza y estandariza imports en Dart y Flutter (.dart). Se aplica DESPUÉS de formatear el código. Agrupa jerárquicamente en 6 bloques: dart:* → flutter/terceros → package de app → relativos → export → part, con orden alfabético y líneas en blanco entre grupos.
tags: [dart, flutter, imports, clean-code, linter, formatting, refactor]
agents: [antigravity, claude-code, codex, cursor, windsurf]
triggers:
  - organizar imports flutter
  - ordenar imports dart
  - organize dart imports
  - flutter import order
  - dart import organizer
  - limpiar imports flutter
  - fix dart imports
  - sort dart imports
requirements:
  tools: [view_file, replace_file_content, run_command]
  bins: [node, dart]
---

# 🎯 Dart & Flutter Import Organizer

## 🎯 Propósito

Estandarizar y limpiar las directivas de importación (`import`), exportación (`export`) y partición (`part`) en cualquier archivo Dart o Flutter (`.dart`), garantizando consistencia visual absoluta, eliminación de dependencias no utilizadas y cumplimiento riguroso con los lineamientos de **Effective Dart** y arquitectura limpia empresarial.

**Principio rector de ejecución**: Esta skill opera como el **paso final** sobre el archivo, aplicándose **estrictamente DESPUÉS de formatear el código** (`dart format`). Esto evita que el formateador reestructure saltos de línea o altere las separaciones intencionales entre grupos de importación.

---

## ⚡ Cuándo Activar esta Skill

- Como **paso final** después de escribir, refactorizar o generar código en Dart / Flutter.
- Cuando el usuario solicita "ordenar", "organizar", "limpiar" o "reorganizar" imports en Dart.
- Cuando se detectan advertencias del linter como `directives_ordering`, `avoid_relative_lib_imports`, o imports huérfanos/duplicados.
- Al preparar un commit o pull request en repositorios Flutter.

Aplica a todos los archivos: `*.dart`.

---

## 📋 Flujo de Trabajo Paso a Paso

### 🚨 Regla Cardinal: Formatear PRIMERO, Organizar Imports DESPUÉS

Cualquier comando de formato sintáctico (`dart format .` o el formateador integrado del IDE) debe ejecutarse **ANTES** de aplicar las reglas de esta skill:
1. `dart format` ajusta indentaciones y cadenas largas.
2. Si se ejecuta `dart format` después de agrupar imports, podría invalidar separaciones o configuraciones personalizadas.
3. La organización de imports es siempre la **última modificación guardada** en el archivo.

---

### Flujo de Ejecución para Agentes

1. **(Paso Previo) Formatea el archivo**:
   - Ejecuta `dart format <ruta-al-archivo>` o asegúrate de que la sintaxis general del cuerpo del archivo ya esté formateada.

2. **Inspecciona el archivo con `view_file`**:
   - Lee el encabezado del archivo para identificar las directivas actuales (`import`, `export`, `part`).
   - Identifica el nombre del paquete actual desde `pubspec.yaml` (ej. `name: my_app`).
   - Revisa qué símbolos importados realmente se usan en el cuerpo para purgar imports innecesarios.

3. **Clasifica las directivas en los 6 Grupos Canónicos**:
   - Separa cada directiva en exactamente uno de los siguientes 6 bloques:
     1. **Dart SDK Built-ins**: `import 'dart:...';` (`dart:async`, `dart:convert`, `dart:io`, `dart:math`).
     2. **Flutter SDK y Dependencias de Terceros**: `import 'package:flutter/...';`, `import 'package:flutter_bloc/...';`, `import 'package:dio/...';`.
     3. **Paquete Interno del Proyecto**: `import 'package:<current_app_name>/...';`.
     4. **Imports Relativos Locales**: `import './...';`, `import '../...';`.
     5. **Directivas de Exportación**: `export '...';`.
     6. **Directivas Part / Code Generation**: `part '...';` o `part of '...';` (`.g.dart`, `.freezed.dart`).

4. **Ordena dentro de cada grupo**:
   - Ordena las líneas **alfabéticamente** por la URI del paquete o ruta entrecomillada.
   - Si una directiva incluye `show` u `hide`, ordena alfabéticamente los identificadores contenidos (`show Alpha, Beta, Zeta;`).
   - Inserta **exactamente una línea en blanco** entre cada grupo presente.

5. **Aplica los cambios**:
   - Reemplaza el bloque de directivas con `replace_file_content` o utiliza el script CLI auxiliar `organize-dart-imports.mjs`.

---

## 📐 Jerarquía y Reglas de Agrupación

```dart
// 1. Dart SDK Built-ins
import 'dart:async';
import 'dart:convert';
import 'dart:io';

// 2. Flutter SDK y Paquetes de Terceros (package:*)
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';
import 'package:mocktail/mocktail.dart';

// 3. Paquete Interno de la Aplicación (package:<app_name>/*)
import 'package:my_app/core/error/failures.dart';
import 'package:my_app/core/utils/result.dart';
import 'package:my_app/features/auth/domain/entities/user.dart';

// 4. Imports Relativos Locales (solo mismo nivel o carpeta adyacente)
import '../widgets/custom_text_field.dart';
import './login_button.dart';

// 5. Exports (si es un barrel file o biblioteca pública)
export 'package:my_app/features/auth/domain/entities/user.dart';

// 6. Directivas Part (archivos generados por build_runner)
part 'user_dto.g.dart';
part 'user_dto.freezed.dart';
```

---

## ⚠️ Reglas Críticas

1. **Separación de Terceros vs Internos**:
   - `package:flutter/*` y cualquier paquete externo de `pub.dev` pertenecen al **Grupo 2**.
   - `package:<nombre_de_tu_app>/*` pertenece exclusivamente al **Grupo 3**. No mezclar ambos en un solo bloque continuo.
2. **Uso Restringido de Imports Relativos**:
   - Se permiten imports relativos (`./`, `../`) **únicamente** dentro de la misma feature o carpeta hoja para archivos hermanos inmediatos.
   - **PROHIBIDO**: Imports relativos que escapen de la feature (ej. `../../../../core/utils/result.dart`). Estos deben convertirse siempre a la ruta absoluta del paquete (`package:<app>/core/utils/result.dart`).
3. **Consistencia de Comillas**:
   - Preferir comillas simples `'` en todas las directivas de Dart, a menos que el proyecto use dobles `"` en su estándar. Mantener consistencia uniforme en todo el archivo.
4. **Orden en Cláusulas `show` y `hide`**:
   - Los elementos listados en `show` o `hide` deben ordenarse alfabéticamente:
     ```dart
     // ❌ Desordenado:
     import 'package:flutter/widgets.dart' show Widget, BuildContext, Container, Key;

     // ✅ Ordenado:
     import 'package:flutter/widgets.dart' show BuildContext, Container, Key, Widget;
     ```
5. **Comentarios de Cabecera**:
   - Si el archivo contiene comentarios de licencia, directivas `// ignore_for_file: ...` o `library;`, estos deben permanecer al inicio del archivo, antes del primer grupo de imports.

---

## 🛠️ Scripts y Herramientas Auxiliares

### CLI Import Organizer: `organize-dart-imports.mjs`

Para procesar archivos o árboles completos de forma automática:

```bash
# Organizar y reescribir un archivo Dart específico:
node skills/dart/dart-import-organizer/scripts/organize-dart-imports.mjs lib/features/auth/presentation/screens/login_screen.dart --write

# Organizar recursivamente toda la carpeta lib/:
node skills/dart/dart-import-organizer/scripts/organize-dart-imports.mjs lib --write

# Verificar en modo CI sin modificar (exit code > 0 si hay desorden):
node skills/dart/dart-import-organizer/scripts/organize-dart-imports.mjs lib --check

# Vista previa de cambios (Dry-Run):
node skills/dart/dart-import-organizer/scripts/organize-dart-imports.mjs lib/main.dart --dry-run
```

---

## 📚 Referencias Adicionales

- [Ejemplos Antes y Después](examples/before-after-imports.md): Casos reales de refactorización y ordenamiento de imports en Flutter.
