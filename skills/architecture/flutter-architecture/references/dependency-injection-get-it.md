# Inyección de Dependencias con GetIt e Injectable

Esta guía explica el registro de dependencias y el desacoplamiento de capas mediante Service Locator (`get_it`) e Inversión de Control (IoC).

---

## 🎯 Contenedor de Inyección (`core/di/injection_container.dart`)

Se define un contenedor centralizado de dependencias donde se registran clientes de red, repositorios, casos de uso y controladores BLoC:

```dart
// lib/core/di/injection_container.dart
import 'package:dio/dio.dart';
import 'package:get_it/get_it.dart';

// Import features (ejemplo con auth y catalog)
import '../../features/auth/data/datasources/auth_remote_data_source.dart';
import '../../features/auth/data/repositories/auth_repository_impl.dart';
import '../../features/auth/domain/repositories/auth_repository.dart';
import '../../features/auth/domain/usecases/login_usecase.dart';
import '../../features/auth/presentation/bloc/auth_bloc.dart';

final sl = GetIt.instance; // sl = Service Locator

Future<void> init() async {
  //! ----------------------------------------------------
  //! 1. External / Core
  //! ----------------------------------------------------
  sl.registerLazySingleton<Dio>(() {
    final dio = Dio(
      BaseOptions(
        baseUrl: 'https://api.example.com',
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {'Content-Type': 'application/json'},
      ),
    );
    // sl<Dio>().interceptors.add(LogInterceptor());
    return dio;
  });

  //! ----------------------------------------------------
  //! 2. Feature: Authentication
  //! ----------------------------------------------------
  // Presentation Layer (BLoC) -> SIEMPRE Factory
  sl.registerFactory<AuthBloc>(
    () => AuthBloc(loginUseCase: sl()),
  );

  // Domain Layer (UseCases) -> LazySingleton
  sl.registerLazySingleton<LoginUseCase>(
    () => LoginUseCase(sl()),
  );

  // Domain & Data Layer (Repository) -> Registrar interfaz con implementación concreta
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(remoteDataSource: sl()),
  );

  // Data Layer (DataSources) -> LazySingleton
  sl.registerLazySingleton<AuthRemoteDataSource>(
    () => AuthRemoteDataSourceImpl(client: sl()),
  );
}
```

---

## ⚖️ Reglas de Registro: `Factory` vs `LazySingleton` vs `Singleton`

| Tipo de Registro | Cuándo Usar | Justificación |
| :--- | :--- | :--- |
| **`registerFactory`** | **BLoC / Cubit / Controllers de Pantalla** | Cada pantalla o navegación requiere una nueva instancia con su estado inicial limpio. Si se usa singleton, el estado de una pantalla anterior contaminará la siguiente. |
| **`registerLazySingleton`** | **DataSources, Repositorios, UseCases, Dio** | Objetos sin estado o con estado persistente/caché. Se instancian únicamente bajo demanda la primera vez que se solicitan, optimizando el tiempo de arranque (*cold start*). |
| **`registerSingleton`** | **Configuraciones inmediatas** | Solo para objetos que deben crearse de forma síncrona en el arranque (ej. SharedPreferences precargado o Crashlytics). |

---

## 🚀 Inicialización en `main.dart`

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'core/di/injection_container.dart' as di;
import 'features/auth/presentation/screens/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Inicializar dependencias antes de correr la app
  await di.init();
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Enterprise Flutter App',
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: Colors.indigo,
      ),
      home: const LoginScreen(),
    );
  }
}
```

---

## 📱 Consumo en Pantallas (`Presentation Screen`)

Para inyectar el BLoC desde GetIt sin acoplar el Widget a la creación manual:

```dart
// features/auth/presentation/screens/login_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/di/injection_container.dart';
import '../bloc/auth_bloc.dart';
import '../widgets/login_form_widget.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<AuthBloc>(
      create: (_) => sl<AuthBloc>(),
      child: Scaffold(
        appBar: AppBar(title: const Text('Iniciar Sesión')),
        body: const SafeArea(
          child: Padding(
            padding: EdgeInsets.all(16.0),
            child: LoginFormWidget(),
          ),
        ),
      ),
    );
  }
}
```
