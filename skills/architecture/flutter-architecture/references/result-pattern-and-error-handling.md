# Manejo de Errores y Patrón Result en Dart 3

Esta guía establece el estándar funcional para el retorno de resultados y la gestión de errores en **Clean Architecture** para Flutter sin lanzar excepciones descontroladas en el dominio.

---

## 🎯 Por qué evitar excepciones en UseCases y Repositorios

- **Falta de tipado explícito**: Las excepciones no forman parte de la firma de retorno del método (`Future<User> getUser()`). Un desarrollador o agente no sabe si debe rodear la llamada en `try/catch` ni qué excepciones específicas pueden lanzarse.
- **Riesgo de caídas en producción**: Si una excepción de red no se atrapa en la UI, la aplicación puede congelarse o mostrar una pantalla roja de error.
- **El Patrón Result**: Convierte el fallo en un valor de primera clase que el compilador obliga a gestionar mediante pattern matching exhaustivo.

---

## 🏗️ Implementación de la Sealed Class `Result` (Dart 3 Puro)

Colocar en `lib/core/utils/result.dart`:

```dart
// lib/core/utils/result.dart
import 'package:equatable/equatable.dart';

sealed class Result<S, F> extends Equatable {
  const Result();

  /// Retorna true si el resultado representa un éxito.
  bool get isSuccess => switch (this) {
        Success() => true,
        Failure() => false,
      };

  /// Retorna true si el resultado representa un fallo.
  bool get isFailure => !isSuccess;

  /// Extrae el valor exitoso o null si es un fallo.
  S? get successOrNull => switch (this) {
        Success(:final value) => value,
        Failure() => null,
      };

  /// Extrae el fallo o null si es exitoso.
  F? get failureOrNull => switch (this) {
        Success() => null,
        Failure(:final value) => value,
      };

  /// Transforma el valor exitoso manteniendo el fallo intacto.
  Result<T, F> map<T>(T Function(S value) transform) {
    return switch (this) {
      Success(:final value) => Success(transform(value)),
      Failure(:final value) => Failure(value),
    };
  }

  /// Mapea ambos casos a un valor de retorno único.
  T fold<T>({
    required T Function(S success) onSuccess,
    required T Function(F failure) onFailure,
  }) {
    return switch (this) {
      Success(:final value) => onSuccess(value),
      Failure(:final value) => onFailure(value),
    };
  }
}

final class Success<S, F> extends Result<S, F> {
  final S value;

  const Success(this.value);

  @override
  List<Object?> get props => [value];
}

final class Failure<S, F> extends Result<S, F> {
  final F value;

  const Failure(this.value);

  @override
  List<Object?> get props => [value];
}
```

---

## 🛑 Jerarquía Canónica de Failures y Excepciones

Colocar en `lib/core/error/failures.dart`:

```dart
// lib/core/error/failures.dart
import 'package:equatable/equatable.dart';

sealed class Failure extends Equatable {
  final String message;
  final int? statusCode;

  const Failure({required this.message, this.statusCode});

  @override
  List<Object?> get props => [message, statusCode];
}

final class ServerFailure extends Failure {
  const ServerFailure({super.message = 'Error de servidor. Intente más tarde.', super.statusCode});
}

final class NetworkFailure extends Failure {
  const NetworkFailure({super.message = 'Sin conexión a internet. Verifique su red.'});
}

final class CacheFailure extends Failure {
  const CacheFailure({super.message = 'No se encontraron datos en caché local.'});
}

final class ValidationFailure extends Failure {
  const ValidationFailure({required super.message});
}

final class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure({super.message = 'Sesión expirada o no autorizada.', super.statusCode = 401});
}
```

Colocar en `lib/core/error/exceptions.dart`:

```dart
// lib/core/error/exceptions.dart
class ServerException implements Exception {
  final String message;
  final int? statusCode;
  const ServerException({this.message = 'Error de servidor', this.statusCode});
}

class CacheException implements Exception {
  final String message;
  const CacheException({this.message = 'Error de caché local'});
}

class NetworkException implements Exception {
  final String message;
  const NetworkException({this.message = 'Sin conexión'});
}
```

---

## 🔄 Conversión en el Repositorio (`data/repositories/`)

La regla estricta es: **El DataSource lanza Exceptions; el RepositoryImpl las atrapa y retorna Result**:

```dart
// features/auth/data/repositories/auth_repository_impl.dart
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/result.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;

  const AuthRepositoryImpl({required AuthRemoteDataSource remoteDataSource})
      : _remoteDataSource = remoteDataSource;

  @override
  Future<Result<User, Failure>> login({
    required String email,
    required String password,
  }) async {
    try {
      final userModel = await _remoteDataSource.login(
        email: email,
        password: password,
      );
      return Success(userModel);
    } on ServerException catch (e) {
      return Failure(ServerFailure(message: e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      return Failure(NetworkFailure(message: e.message));
    } catch (e) {
      return Failure(ServerFailure(message: 'Error inesperado: $e'));
    }
  }
}
```
