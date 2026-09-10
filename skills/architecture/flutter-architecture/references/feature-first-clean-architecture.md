# Feature-First Clean Architecture en Flutter

Esta guía documenta los principios de diseño, límites arquitectónicos y la estructura modular de **Feature-First Clean Architecture** para aplicaciones Flutter empresariales.

---

## 🏛️ Filosofía del Patrón

A diferencia de una arquitectura por capas tradicional (*Layer-First*) donde todas las pantallas están en `presentation/` y todos los repositorios en `data/`, **Feature-First** agrupa el código alrededor de las características o capacidades del negocio (*Screaming Architecture*).

### Beneficios Principales
1. **Alta Cohesión**: Todo el código necesario para modificar una funcionalidad (pantalla, estado, use case, modelo) reside en la misma carpeta (`lib/features/<feature>/`).
2. **Bajo Acoplamiento**: Las features no dependen directamente de las implementaciones internas de otras features.
3. **Escalabilidad de Equipos**: Múltiples desarrolladores o células de trabajo pueden iterar en features aisladas sin generar conflictos de fusión (*merge conflicts*).
4. **Desmantelamiento o Migración Rápida**: Si una funcionalidad se vuelve obsoleta o se reescribe, basta con eliminar o reemplazar su carpeta correspondiente.

---

## 📐 Anatomía de una Feature

Cada carpeta dentro de `lib/features/<feature_name>/` contiene 3 capas concéntricas:

```
lib/features/<feature_name>/
├── domain/                  # 1. Capa Central (Reglas puras de negocio)
│   ├── entities/            # Modelos puros e inmutables del dominio
│   ├── repositories/        # Interfaces/contratos abstractos de repositorio
│   └── usecases/            # Acciones atómicas de negocio (Get, Create, Update)
├── data/                    # 2. Capa de Infraestructura (Fuentes externas)
│   ├── datasources/         # Clientes remotos (HTTP/Dio, Firebase) y locales (Cache/Drift)
│   ├── models/              # DTOs que extienden de Entities + fromJson / toJson
│   └── repositories/        # Implementación concreta del contrato del dominio
└── presentation/            # 3. Capa Visual (Flutter & UI)
    ├── bloc/                # BLoC / Cubit, Events y States inmutables
    ├── screens/             # Páginas/vistas completas (Scaffold, AppBar)
    └── widgets/             # Componentes visuales encapsulados de la feature
```

---

## 🚦 Reglas de Dependencia y Restricciones de Importación

| Capa | Puede Importar de | PROHIBIDO Importar de |
| :--- | :--- | :--- |
| **Domain** | `core/error/`, `core/utils/` (Dart puro) | `data/`, `presentation/`, `package:flutter/*`, librerías de base de datos o red |
| **Data** | `domain/`, `core/` | `presentation/` |
| **Presentation** | `domain/usecases/`, `domain/entities/`, `core/` | `data/datasources/`, `data/repositories/` (Nunca interactuar con infraestructura directamente) |

---

## 🔄 Flujo Unidireccional de Datos

```
[ Usuario interactúa con la UI ]
              │
              ▼
    [ Widget dispara Evento ]
              │
              ▼
   [ BLoC recibe Evento ]
              │
              ▼
 [ BLoC ejecuta UseCase(Params) ]
              │
              ▼
[ UseCase invoca Repository Interface ]
              │
              ▼
[ RepositoryImpl llama DataSource ]
              │
              ▼
  [ DataSource consulta API/DB ]
              │
              ▼
[ Retorna Model / Lanza Exception ]
              │
              ▼
[ RepositoryImpl mapea a Entity & Result ]
              │
              ▼
  [ UseCase retorna Result<T, Failure> ]
              │
              ▼
 [ BLoC evalúa Result y emite State ]
              │
              ▼
[ BlocBuilder actualiza la Interfaz ]
```

---

## 🌐 Comunicación Inter-Feature

Cuando la feature `checkout` necesita consultar datos del usuario de `auth`:
- **Correcto**: Inyectar el caso de uso del dominio de `auth` (`GetUserUseCase`) o consumir un repositorio mediante su interfaz del dominio (`UserRepository`).
- **Incorrecto**: Importar `AuthRemoteDataSource` o acceder al BLoC interno `AuthBloc` desde los widgets de `checkout`.
