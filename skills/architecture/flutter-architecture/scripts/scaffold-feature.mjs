#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

function printHelp() {
  console.log(`
Usage: node scaffold-feature.mjs <feature-name> [options]

Arguments:
  feature-name        Name of the feature in kebab-case or snake_case (e.g., auth, catalog, cart, user_profile)

Options:
  --model <name>      Primary entity/model singular name (default: derived from feature-name)
  --cubit             Use Cubit instead of BLoC for state management
  --dry-run           Simulate generation without writing files to disk
  --target-dir <dir>  Base directory for features (default: lib/features)
  --test-dir <dir>    Base directory for unit tests (default: test/features)
  --app-name <name>   Package name (default: auto-detected from pubspec.yaml or 'my_app')
  --help, -h          Show this help message

Examples:
  node scaffold-feature.mjs billing --model invoice
  node scaffold-feature.mjs cart --model cart_item --cubit
  node scaffold-feature.mjs authentication --model user --dry-run
`);
}

function toSnakeCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

function toPascalCase(str) {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function detectPackageName(cwd) {
  let currentDir = cwd;
  for (let i = 0; i < 5; i++) {
    const pubspecPath = path.join(currentDir, 'pubspec.yaml');
    if (fs.existsSync(pubspecPath)) {
      try {
        const content = fs.readFileSync(pubspecPath, 'utf8');
        const match = content.match(/^name:\s*([a-zA-Z0-9_]+)/m);
        if (match && match[1]) {
          return match[1].trim();
        }
      } catch {
        // Ignored
      }
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
  return 'my_app';
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const featureRaw = args[0];
  const featureSnake = toSnakeCase(featureRaw);

  let modelRaw = null;
  let useCubit = false;
  let isDryRun = false;
  let targetDir = 'lib/features';
  let testDir = 'test/features';
  let appName = null;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--model' && args[i + 1]) {
      modelRaw = args[++i];
    } else if (args[i] === '--cubit') {
      useCubit = true;
    } else if (args[i] === '--dry-run') {
      isDryRun = true;
    } else if (args[i] === '--target-dir' && args[i + 1]) {
      targetDir = args[++i];
    } else if (args[i] === '--test-dir' && args[i + 1]) {
      testDir = args[++i];
    } else if (args[i] === '--app-name' && args[i + 1]) {
      appName = args[++i];
    }
  }

  const modelSnake = toSnakeCase(modelRaw || featureRaw);
  const modelPascal = toPascalCase(modelSnake);
  const modelCamel = toCamelCase(modelSnake);
  const featurePascal = toPascalCase(featureSnake);

  if (!appName) {
    appName = detectPackageName(process.cwd());
  }

  const featurePath = path.join(targetDir, featureSnake);
  const testFeaturePath = path.join(testDir, featureSnake);

  console.log(`\n🚀 \x1b[36mScaffolding Feature-First Clean Architecture\x1b[0m`);
  console.log(`   📦 Feature:     \x1b[33m${featureSnake}\x1b[0m (${featurePascal})`);
  console.log(`   🏷️  Model:       \x1b[33m${modelSnake}\x1b[0m (${modelPascal})`);
  console.log(`   🎛️  State Mgmt:  \x1b[32m${useCubit ? 'Cubit' : 'BLoC'}\x1b[0m`);
  console.log(`   📂 Target:      \x1b[34m${featurePath}\x1b[0m`);
  console.log(`   🧪 Tests:       \x1b[34m${testFeaturePath}\x1b[0m`);
  if (isDryRun) {
    console.log(`   🔎 Mode:        \x1b[35m[DRY RUN - No files will be written]\x1b[0m\n`);
  } else {
    console.log('');
  }

  // 1. Domain Entity
  const entityContent = `import 'package:equatable/equatable.dart';

class ${modelPascal} extends Equatable {
  final String id;
  final String title;
  final DateTime createdAt;

  const ${modelPascal}({
    required this.id,
    required this.title,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, title, createdAt];
}
`;

  // 2. Domain Repository Contract
  const repoContractContent = `import 'package:${appName}/core/error/failures.dart';
import 'package:${appName}/core/utils/result.dart';
import '../entities/${modelSnake}.dart';

abstract interface class ${modelPascal}Repository {
  Future<Result<List<${modelPascal}>, Failure>> get${modelPascal}List();
  Future<Result<${modelPascal}, Failure>> get${modelPascal}ById(String id);
  Future<Result<${modelPascal}, Failure>> create${modelPascal}({required String title});
}
`;

  // 3. Domain Use Case
  const useCaseContent = `import 'package:equatable/equatable.dart';

import 'package:${appName}/core/error/failures.dart';
import 'package:${appName}/core/utils/result.dart';
import '../entities/${modelSnake}.dart';
import '../repositories/${modelSnake}_repository.dart';

class Get${modelPascal}ByIdUseCase {
  final ${modelPascal}Repository _repository;

  const Get${modelPascal}ByIdUseCase(this._repository);

  Future<Result<${modelPascal}, Failure>> call(Get${modelPascal}Params params) async {
    return _repository.get${modelPascal}ById(params.id);
  }
}

class Get${modelPascal}Params extends Equatable {
  final String id;

  const Get${modelPascal}Params({required this.id});

  @override
  List<Object?> get props => [id];
}
`;

  // 4. Data Model
  const modelContent = `import '../../domain/entities/${modelSnake}.dart';

class ${modelPascal}Model extends ${modelPascal} {
  const ${modelPascalModel(modelPascal)}

  factory ${modelPascal}Model.fromJson(Map<String, dynamic> json) {
    return ${modelPascal}Model(
      id: json['id'] as String,
      title: json['title'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'created_at': createdAt.toIso8601String(),
    };
  }

  factory ${modelPascal}Model.fromEntity(${modelPascal} entity) {
    return ${modelPascal}Model(
      id: entity.id,
      title: entity.title,
      createdAt: entity.createdAt,
    );
  }
}
`;

  function modelPascalModel(name) {
    return `${name}Model({\n    required super.id,\n    required super.title,\n    required super.createdAt,\n  });`;
  }

  // 5. Data Remote DataSource
  const dataSourceContent = `import 'package:${appName}/core/error/exceptions.dart';
import '../models/${modelSnake}_model.dart';

abstract interface class ${modelPascal}RemoteDataSource {
  Future<List<${modelPascal}Model>> get${modelPascal}List();
  Future<${modelPascal}Model> get${modelPascal}ById(String id);
}

class ${modelPascal}RemoteDataSourceImpl implements ${modelPascal}RemoteDataSource {
  // Inyectar Dio o Http Client aquí

  @override
  Future<List<${modelPascal}Model>> get${modelPascal}List() async {
    try {
      // Simulación de llamada a red
      return [];
    } catch (e) {
      throw ServerException(message: 'Error al obtener lista de ${modelSnake}: $e');
    }
  }

  @override
  Future<${modelPascal}Model> get${modelPascal}ById(String id) async {
    try {
      // Simulación de llamada a red
      return ${modelPascal}Model(
        id: id,
        title: 'Ejemplo de ${modelPascal}',
        createdAt: DateTime.now(),
      );
    } catch (e) {
      throw ServerException(message: 'Error al obtener ${modelSnake} por id: $e');
    }
  }
}
`;

  // 6. Data Repository Implementation
  const repoImplContent = `import 'package:${appName}/core/error/exceptions.dart';
import 'package:${appName}/core/error/failures.dart';
import 'package:${appName}/core/utils/result.dart';
import '../../domain/entities/${modelSnake}.dart';
import '../../domain/repositories/${modelSnake}_repository.dart';
import '../datasources/${modelSnake}_remote_data_source.dart';

class ${modelPascal}RepositoryImpl implements ${modelPascal}Repository {
  final ${modelPascal}RemoteDataSource _remoteDataSource;

  const ${modelPascal}RepositoryImpl({
    required ${modelPascal}RemoteDataSource remoteDataSource,
  }) : _remoteDataSource = remoteDataSource;

  @override
  Future<Result<List<${modelPascal}>, Failure>> get${modelPascal}List() async {
    try {
      final models = await _remoteDataSource.get${modelPascal}List();
      return Success(models);
    } on ServerException catch (e) {
      return Failure(ServerFailure(message: e.message, statusCode: e.statusCode));
    } catch (e) {
      return Failure(ServerFailure(message: 'Error inesperado: $e'));
    }
  }

  @override
  Future<Result<${modelPascal}, Failure>> get${modelPascal}ById(String id) async {
    try {
      final model = await _remoteDataSource.get${modelPascal}ById(id);
      return Success(model);
    } on ServerException catch (e) {
      return Failure(ServerFailure(message: e.message, statusCode: e.statusCode));
    } catch (e) {
      return Failure(ServerFailure(message: 'Error inesperado: $e'));
    }
  }

  @override
  Future<Result<${modelPascal}, Failure>> create${modelPascal}({required String title}) async {
    // Implementar llamada a datasource
    throw UnimplementedError();
  }
}
`;

  // 7. Presentation State Management (BLoC or Cubit)
  let stateFiles = {};

  if (useCubit) {
    stateFiles[`presentation/cubit/${modelSnake}_state.dart`] = `import 'package:equatable/equatable.dart';
import '../../domain/entities/${modelSnake}.dart';

sealed class ${modelPascal}State extends Equatable {
  const ${modelPascal}State();

  @override
  List<Object?> get props => [];
}

final class ${modelPascal}Initial extends ${modelPascal}State {
  const ${modelPascal}Initial();
}

final class ${modelPascal}Loading extends ${modelPascal}State {
  const ${modelPascal}Loading();
}

final class ${modelPascal}Loaded extends ${modelPascal}State {
  final ${modelPascal} ${modelCamel};

  const ${modelPascal}Loaded(this.${modelCamel});

  @override
  List<Object?> get props => [${modelCamel}];
}

final class ${modelPascal}Error extends ${modelPascal}State {
  final String message;

  const ${modelPascal}Error(this.message);

  @override
  List<Object?> get props => [message];
}
`;

    stateFiles[`presentation/cubit/${modelSnake}_cubit.dart`] = `import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:${appName}/core/utils/result.dart';
import '../../domain/usecases/get_${modelSnake}.dart';
import '${modelSnake}_state.dart';

class ${modelPascal}Cubit extends Cubit<${modelPascal}State> {
  final Get${modelPascal}ByIdUseCase _get${modelPascal}ById;

  ${modelPascal}Cubit({required Get${modelPascal}ByIdUseCase get${modelPascal}ById})
      : _get${modelPascal}ById = get${modelPascal}ById,
        super(const ${modelPascal}Initial());

  Future<void> load${modelPascal}(String id) async {
    emit(const ${modelPascal}Loading());

    final result = await _get${modelPascal}ById(Get${modelPascal}Params(id: id));

    switch (result) {
      case Success(value: final data):
        emit(${modelPascal}Loaded(data));
      case Failure(value: final failure):
        emit(${modelPascal}Error(failure.message));
    }
  }
}
`;
  } else {
    // BLoC Event
    stateFiles[`presentation/bloc/${modelSnake}_event.dart`] = `import 'package:equatable/equatable.dart';

sealed class ${modelPascal}Event extends Equatable {
  const ${modelPascal}Event();

  @override
  List<Object?> get props => [];
}

final class Load${modelPascal}ByIdRequested extends ${modelPascal}Event {
  final String id;

  const Load${modelPascal}ByIdRequested(this.id);

  @override
  List<Object?> get props => [id];
}
`;

    // BLoC State
    stateFiles[`presentation/bloc/${modelSnake}_state.dart`] = `import 'package:equatable/equatable.dart';
import '../../domain/entities/${modelSnake}.dart';

sealed class ${modelPascal}State extends Equatable {
  const ${modelPascal}State();

  @override
  List<Object?> get props => [];
}

final class ${modelPascal}Initial extends ${modelPascal}State {
  const ${modelPascal}Initial();
}

final class ${modelPascal}Loading extends ${modelPascal}State {
  const ${modelPascal}Loading();
}

final class ${modelPascal}Loaded extends ${modelPascal}State {
  final ${modelPascal} ${modelCamel};

  const ${modelPascal}Loaded(this.${modelCamel});

  @override
  List<Object?> get props => [${modelCamel}];
}

final class ${modelPascal}Error extends ${modelPascal}State {
  final String message;

  const ${modelPascal}Error(this.message);

  @override
  List<Object?> get props => [message];
}
`;

    // BLoC
    stateFiles[`presentation/bloc/${modelSnake}_bloc.dart`] = `import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:${appName}/core/utils/result.dart';
import '../../domain/usecases/get_${modelSnake}.dart';
import '${modelSnake}_event.dart';
import '${modelSnake}_state.dart';

class ${modelPascal}Bloc extends Bloc<${modelPascal}Event, ${modelPascal}State> {
  final Get${modelPascal}ByIdUseCase _get${modelPascal}ById;

  ${modelPascal}Bloc({required Get${modelPascal}ByIdUseCase get${modelPascal}ById})
      : _get${modelPascal}ById = get${modelPascal}ById,
        super(const ${modelPascal}Initial()) {
    on<Load${modelPascal}ByIdRequested>(_onLoadByIdRequested);
  }

  Future<void> _onLoadByIdRequested(
    Load${modelPascal}ByIdRequested event,
    Emitter<${modelPascal}State> emit,
  ) async {
    emit(const ${modelPascal}Loading());

    final result = await _get${modelPascal}ById(Get${modelPascal}Params(id: event.id));

    switch (result) {
      case Success(value: final data):
        emit(${modelPascal}Loaded(data));
      case Failure(value: final failure):
        emit(${modelPascal}Error(failure.message));
    }
  }
}
`;
  }

  function getModelPascalById(name) {
    return `get${name}ById`;
  }

  // 8. Presentation Screen
  const stateControllerName = useCubit ? `${modelPascal}Cubit` : `${modelPascal}Bloc`;
  const stateFolder = useCubit ? 'cubit' : 'bloc';

  const screenContent = `import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:${appName}/core/di/injection_container.dart';
import '../${stateFolder}/${modelSnake}_${stateFolder}.dart';
${useCubit ? '' : `import '../${stateFolder}/${modelSnake}_event.dart';\n`}import '../${stateFolder}/${modelSnake}_state.dart';
import '../widgets/${modelSnake}_item_widget.dart';

class ${modelPascal}Screen extends StatelessWidget {
  final String ${modelCamel}Id;

  const ${modelPascal}Screen({
    super.key,
    required this.${modelCamel}Id,
  });

  @override
  Widget build(BuildContext context) {
    return BlocProvider<${stateControllerName}>(
      create: (_) => sl<${stateControllerName}>()${useCubit ? `..load${modelPascal}(${modelCamel}Id)` : `..add(Load${modelPascal}ByIdRequested(${modelCamel}Id))`},
      child: Scaffold(
        appBar: AppBar(
          title: const Text('${modelPascal} Details'),
        ),
        body: SafeArea(
          child: BlocBuilder<${stateControllerName}, ${modelPascal}State>(
            builder: (context, state) {
              return switch (state) {
                ${modelPascal}Initial() => const Center(child: Text('Inicializando...')),
                ${modelPascal}Loading() => const Center(child: CircularProgressIndicator()),
                ${modelPascal}Loaded(:final ${modelCamel}) => ${modelPascal}ItemWidget(${modelCamel}: ${modelCamel}),
                ${modelPascal}Error(:final message) => Center(
                    child: Text('Error: \$message', style: const TextStyle(color: Colors.red)),
                  ),
              };
            },
          ),
        ),
      ),
    );
  }
}
`;

  // 9. Presentation Widget
  const widgetContent = `import 'package:flutter/material.dart';
import '../../domain/entities/${modelSnake}.dart';

class ${modelPascal}ItemWidget extends StatelessWidget {
  final ${modelPascal} ${modelCamel};

  const ${modelPascal}ItemWidget({
    super.key,
    required this.${modelCamel},
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(16.0),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              ${modelCamel}.title,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'ID: \${${modelCamel}.id}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}
`;

  // 10. Unit Test: Use Case
  const useCaseTestContent = `import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:${appName}/core/error/failures.dart';
import 'package:${appName}/core/utils/result.dart';
import 'package:${appName}/features/${featureSnake}/domain/entities/${modelSnake}.dart';
import 'package:${appName}/features/${featureSnake}/domain/repositories/${modelSnake}_repository.dart';
import 'package:${appName}/features/${featureSnake}/domain/usecases/get_${modelSnake}.dart';

class Mock${modelPascal}Repository extends Mock implements ${modelPascal}Repository {}

void main() {
  late Mock${modelPascal}Repository mockRepository;
  late Get${modelPascal}ByIdUseCase useCase;

  final t${modelPascal} = ${modelPascal}(
    id: 'test-123',
    title: 'Test Title',
    createdAt: DateTime(2026, 1, 1),
  );

  setUp(() {
    mockRepository = Mock${modelPascal}Repository();
    useCase = Get${modelPascal}ByIdUseCase(mockRepository);
  });

  group('Get${modelPascal}ByIdUseCase', () {
    test('should return ${modelPascal} from repository when call is successful', () async {
      when(() => mockRepository.get${modelPascal}ById('test-123'))
          .thenAnswer((_) async => Success(t${modelPascal}));

      final result = await useCase(const Get${modelPascal}Params(id: 'test-123'));

      expect(result, Success(t${modelPascal}));
      verify(() => mockRepository.get${modelPascal}ById('test-123')).called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    test('should return Failure when repository fails', () async {
      const tFailure = ServerFailure(message: 'Error al consultar');
      when(() => mockRepository.get${modelPascal}ById('test-123'))
          .thenAnswer((_) async => const Failure(tFailure));

      final result = await useCase(const Get${modelPascal}Params(id: 'test-123'));

      expect(result, const Failure(tFailure));
      verify(() => mockRepository.get${modelPascal}ById('test-123')).called(1);
    });
  });
}
`;

  // 11. Unit Test: State Management
  let stateTestContent = '';
  if (useCubit) {
    stateTestContent = `import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:${appName}/core/error/failures.dart';
import 'package:${appName}/core/utils/result.dart';
import 'package:${appName}/features/${featureSnake}/domain/entities/${modelSnake}.dart';
import 'package:${appName}/features/${featureSnake}/domain/usecases/get_${modelSnake}.dart';
import 'package:${appName}/features/${featureSnake}/presentation/cubit/${modelSnake}_cubit.dart';
import 'package:${appName}/features/${featureSnake}/presentation/cubit/${modelSnake}_state.dart';

class MockGet${modelPascal}ByIdUseCase extends Mock implements Get${modelPascal}ByIdUseCase {}

void main() {
  late MockGet${modelPascal}ByIdUseCase mockUseCase;
  late ${modelPascal}Cubit cubit;

  final t${modelPascal} = ${modelPascal}(
    id: '1',
    title: 'Item Title',
    createdAt: DateTime(2026, 1, 1),
  );

  setUp(() {
    mockUseCase = MockGet${modelPascal}ByIdUseCase();
    cubit = ${modelPascal}Cubit(get${modelPascal}ById: mockUseCase);
  });

  tearDown(() {
    cubit.close();
  });

  group('${modelPascal}Cubit', () {
    test('initial state should be ${modelPascal}Initial', () {
      expect(cubit.state, const ${modelPascal}Initial());
    });

    blocTest<${modelPascal}Cubit, ${modelPascal}State>(
      'emits [${modelPascal}Loading, ${modelPascal}Loaded] when load${modelPascal} succeeds',
      build: () {
        when(() => mockUseCase(const Get${modelPascal}Params(id: '1')))
            .thenAnswer((_) async => Success(t${modelPascal}));
        return cubit;
      },
      act: (c) => c.load${modelPascal}('1'),
      expect: () => [
        const ${modelPascal}Loading(),
        ${modelPascal}Loaded(t${modelPascal}),
      ],
    );
  });
}
`;
  } else {
    stateTestContent = `import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:${appName}/core/error/failures.dart';
import 'package:${appName}/core/utils/result.dart';
import 'package:${appName}/features/${featureSnake}/domain/entities/${modelSnake}.dart';
import 'package:${appName}/features/${featureSnake}/domain/usecases/get_${modelSnake}.dart';
import 'package:${appName}/features/${featureSnake}/presentation/bloc/${modelSnake}_bloc.dart';
import 'package:${appName}/features/${featureSnake}/presentation/bloc/${modelSnake}_event.dart';
import 'package:${appName}/features/${featureSnake}/presentation/bloc/${modelSnake}_state.dart';

class MockGet${modelPascal}ByIdUseCase extends Mock implements Get${modelPascal}ByIdUseCase {}

void main() {
  late MockGet${modelPascal}ByIdUseCase mockUseCase;
  late ${modelPascal}Bloc bloc;

  final t${modelPascal} = ${modelPascal}(
    id: '1',
    title: 'Item Title',
    createdAt: DateTime(2026, 1, 1),
  );

  setUp(() {
    mockUseCase = MockGet${modelPascal}ByIdUseCase();
    bloc = ${modelPascal}Bloc(get${modelPascal}ById: mockUseCase);
  });

  tearDown(() {
    bloc.close();
  });

  group('${modelPascal}Bloc', () {
    test('initial state should be ${modelPascal}Initial', () {
      expect(bloc.state, const ${modelPascal}Initial());
    });

    blocTest<${modelPascal}Bloc, ${modelPascal}State>(
      'emits [${modelPascal}Loading, ${modelPascal}Loaded] when Load${modelPascal}ByIdRequested succeeds',
      build: () {
        when(() => mockUseCase(const Get${modelPascal}Params(id: '1')))
            .thenAnswer((_) async => Success(t${modelPascal}));
        return bloc;
      },
      act: (b) => b.add(const Load${modelPascal}ByIdRequested('1')),
      expect: () => [
        const ${modelPascal}Loading(),
        ${modelPascal}Loaded(t${modelPascal}),
      ],
    );
  });
}
`;
  }

  // File plan mapping
  const filesToCreate = {
    [path.join(featurePath, 'domain/entities', `${modelSnake}.dart`)]: entityContent,
    [path.join(featurePath, 'domain/repositories', `${modelSnake}_repository.dart`)]: repoContractContent,
    [path.join(featurePath, 'domain/usecases', `get_${modelSnake}.dart`)]: useCaseContent,
    [path.join(featurePath, 'data/models', `${modelSnake}_model.dart`)]: modelContent,
    [path.join(featurePath, 'data/datasources', `${modelSnake}_remote_data_source.dart`)]: dataSourceContent,
    [path.join(featurePath, 'data/repositories', `${modelSnake}_repository_impl.dart`)]: repoImplContent,
    ...Object.fromEntries(
      Object.entries(stateFiles).map(([rel, content]) => [path.join(featurePath, rel), content])
    ),
    [path.join(featurePath, 'presentation/screens', `${modelSnake}_screen.dart`)]: screenContent,
    [path.join(featurePath, 'presentation/widgets', `${modelSnake}_item_widget.dart`)]: widgetContent,
    [path.join(testFeaturePath, 'domain/usecases', `get_${modelSnake}_test.dart`)]: useCaseTestContent,
    [path.join(testFeaturePath, `presentation/${stateFolder}`, `${modelSnake}_${stateFolder}_test.dart`)]: stateTestContent,
  };

  let count = 0;
  for (const [targetFilePath, content] of Object.entries(filesToCreate)) {
    count++;
    const displayPath = path.relative(process.cwd(), targetFilePath);
    if (isDryRun) {
      console.log(`   [DRY-RUN] Would create: ${displayPath}`);
    } else {
      const dir = path.dirname(targetFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(targetFilePath, content, 'utf8');
      console.log(`   ✔ Created (${count}): ${displayPath}`);
    }
  }

  console.log(`\n✨ Successfully scaffolded ${count} files for feature '${featureSnake}'!`);
  console.log(`\n📌 Next steps:`);
  console.log(`   1. Register '${modelPascal}' dependencies in 'lib/core/di/injection_container.dart'`);
  console.log(`   2. Run 'flutter test ${testFeaturePath}' to verify tests pass.`);
}

main();
