# Ejemplos: Antes y Después de Organizar Imports en Dart

Este documento ilustra la transformación de archivos Dart con directivas desorganizadas, rutas relativas profundas y mezclas de paquetes hacia el estándar limpio de 6 grupos jerárquicos.

---

## 📋 Caso 1: Pantalla con BLoC, Flutter y Utilidades del Core

### ❌ Antes (Desorganizado, mezcla de librerías, sin separación, rutas profundas)

```dart
import 'package:flutter_bloc/flutter_bloc.dart';
import 'dart:async';
import 'package:my_app/features/auth/presentation/bloc/auth_bloc.dart';
import '../../../../core/utils/result.dart';
import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:dio/dio.dart';
import '../widgets/custom_text_field.dart';
import 'package:my_app/core/error/failures.dart';
import 'package:flutter/services.dart' show SystemChannels, HapticFeedback, Clipboard;
part 'login_screen.g.dart';
import './login_header.dart';
```

### ✅ Después (6 Grupos Jerárquicos, Alfabético, Sin Relativos Profundos)

```dart
import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show Clipboard, HapticFeedback, SystemChannels;
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:my_app/core/error/failures.dart';
import 'package:my_app/core/utils/result.dart';
import 'package:my_app/features/auth/presentation/bloc/auth_bloc.dart';

import './login_header.dart';
import '../widgets/custom_text_field.dart';

part 'login_screen.g.dart';
```

---

## 📋 Caso 2: Barrel File / Librería de Feature con Exports

### ❌ Antes

```dart
export './presentation/screens/auth_screen.dart';
import 'package:my_app/features/auth/domain/entities/user.dart';
export './domain/entities/user.dart';
import 'dart:io';
export './domain/repositories/auth_repository.dart';
import 'package:flutter/foundation.dart';
```

### ✅ Después

```dart
import 'dart:io';

import 'package:flutter/foundation.dart';

import 'package:my_app/features/auth/domain/entities/user.dart';

export './domain/entities/user.dart';
export './domain/repositories/auth_repository.dart';
export './presentation/screens/auth_screen.dart';
```

---

## 📋 Caso 3: Modelo con Freezed y Code Generation

### ❌ Antes

```dart
import 'package:freezed_annotation/freezed_annotation.dart';
part 'product_model.freezed.dart';
import '../../domain/entities/product.dart';
import 'dart:math';
part 'product_model.g.dart';
import 'package:my_app/core/utils/json_converters.dart';
```

### ✅ Después

```dart
import 'dart:math';

import 'package:freezed_annotation/freezed_annotation.dart';

import 'package:my_app/core/utils/json_converters.dart';
import 'package:my_app/features/catalog/domain/entities/product.dart';

part 'product_model.freezed.dart';
part 'product_model.g.dart';
```
