# Gestión de Estado con BLoC y Cubit

Esta guía detalla los estándares de implementación para controladores de estado reactivos en Flutter utilizando el paquete oficial `flutter_bloc` y pruebas con `bloc_test`.

---

## 🎯 BLoC vs Cubit: ¿Cuándo usar cuál?

- **Usar Cubit**:
  - Para flujos lineales, operaciones simples CRUD o pantallas con pocos eventos reactivos (ej. formularios sencillos, cambio de tema, detalle estático).
  - Reduce código boilerplate al emitir estados directamente mediante métodos (`emit(NewState())`).
- **Usar BLoC (Event-Driven)**:
  - Para flujos complejos, con eventos asíncronos concurrentes, debounce/throttle de búsquedas, logging detallado de acciones o trazabilidad de eventos del usuario.

---

## 🏗️ Anatomía de Estados con Sealed Classes (Dart 3)

Se recomienda el uso de `sealed class` en lugar de clases base abstractas para garantizar que los `switch` sean exhaustivos en tiempo de compilación:

```dart
// features/auth/presentation/bloc/auth_state.dart
import 'package:equatable/equatable.dart';
import '../../domain/entities/user.dart';

sealed class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

final class AuthInitial extends AuthState {
  const AuthInitial();
}

final class AuthLoading extends AuthState {
  const AuthLoading();
}

final class Authenticated extends AuthState {
  final User user;

  const Authenticated(this.user);

  @override
  List<Object?> get props => [user];
}

final class AuthError extends AuthState {
  final String message;

  const AuthError(this.message);

  @override
  List<Object?> get props => [message];
}
```

---

## ⚡ Eventos Declarativos

```dart
// features/auth/presentation/bloc/auth_event.dart
import 'package:equatable/equatable.dart';

sealed class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

final class LoginRequested extends AuthEvent {
  final String email;
  final String password;

  const LoginRequested({required this.email, required this.password});

  @override
  List<Object?> get props => [email, password];
}

final class LogoutRequested extends AuthEvent {
  const LogoutRequested();
}
```

---

## 🧠 Implementación del BLoC

```dart
// features/auth/presentation/bloc/auth_bloc.dart
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/utils/result.dart';
import '../../domain/usecases/login_usecase.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final LoginUseCase _loginUseCase;

  AuthBloc({required LoginUseCase loginUseCase})
      : _loginUseCase = loginUseCase,
        super(const AuthInitial()) {
    on<LoginRequested>(_onLoginRequested);
  }

  Future<void> _onLoginRequested(
    LoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    final result = await _loginUseCase(
      LoginParams(email: event.email, password: event.password),
    );

    switch (result) {
      case Success(value: final user):
        emit(Authenticated(user));
      case Failure(value: final failure):
        emit(AuthError(failure.message));
    }
  }
}
```

---

## 🧪 Pruebas Unitarias con `bloc_test` y `mocktail`

```dart
// test/features/auth/presentation/bloc/auth_bloc_test.dart
import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:my_app/core/error/failures.dart';
import 'package:my_app/core/utils/result.dart';
import 'package:my_app/features/auth/domain/entities/user.dart';
import 'package:my_app/features/auth/domain/usecases/login_usecase.dart';
import 'package:my_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:my_app/features/auth/presentation/bloc/auth_event.dart';
import 'package:my_app/features/auth/presentation/bloc/auth_state.dart';

class MockLoginUseCase extends Mock implements LoginUseCase {}

void main() {
  late MockLoginUseCase mockLoginUseCase;
  late AuthBloc authBloc;

  const tUser = User(id: '1', email: 'test@example.com', name: 'User');
  const tParams = LoginParams(email: 'test@example.com', password: 'password123');

  setUp(() {
    mockLoginUseCase = MockLoginUseCase();
    authBloc = AuthBloc(loginUseCase: mockLoginUseCase);
  });

  tearDown(() {
    authBloc.close();
  });

  group('AuthBloc', () {
    test('initial state should be AuthInitial', () {
      expect(authBloc.state, const AuthInitial());
    });

    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, Authenticated] when LoginRequested succeeds',
      build: () {
        when(() => mockLoginUseCase(tParams))
            .thenAnswer((_) async => const Success(tUser));
        return authBloc;
      },
      act: (bloc) => bloc.add(const LoginRequested(
        email: 'test@example.com',
        password: 'password123',
      )),
      expect: () => [
        const AuthLoading(),
        const Authenticated(tUser),
      ],
      verify: (_) {
        verify(() => mockLoginUseCase(tParams)).called(1);
      },
    );

    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, AuthError] when LoginRequested fails',
      build: () {
        when(() => mockLoginUseCase(tParams))
            .thenAnswer((_) async => const Failure(ServerFailure(message: 'Credenciales inválidas')));
        return authBloc;
      },
      act: (bloc) => bloc.add(const LoginRequested(
        email: 'test@example.com',
        password: 'password123',
      )),
      expect: () => [
        const AuthLoading(),
        const AuthError('Credenciales inválidas'),
      ],
    );
  });
}
```
